/* DRAVEN | Plataforma Comercial — versão GitHub Pages.
 *
 * O sistema foi escrito para o claude.ai, onde pede banco de dados, usuário e Google Drive com claude.use(...).
 * Este arquivo entrega essas mesmas peças fora do claude.ai, falando com o servidor da DRAVEN
 * (um Google Apps Script na conta Google da gestão, ver servidor/Codigo.gs):
 *   - login com usuário e senha criados pela gestão;
 *   - dados no arquivo "draven-dados.json" do Google Drive da gestão;
 *   - planilhas na pasta "DRAVEN | Plataforma Comercial" do mesmo Drive.
 */
(function () {
  'use strict';
  const CFG = window.DRAVEN_CONFIG || {};
  const URL_SERVIDOR = String(CFG.servidor || '').trim();
  const SINCRONIA_MS = 8000;
  const FOLDER = 'application/vnd.google-apps.folder';

  const ler = k => { try { return localStorage.getItem(k) || '' } catch (e) { return '' } };
  const gravar = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k) } catch (e) {} };
  const json = o => o === undefined ? undefined : JSON.parse(JSON.stringify(o));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let token = ler('dv-sessao');
  let eu = null;              // {id,name,email,login,dono,papel}
  let perfis = {};            // id -> {name,login}
  let dados = {};             // col -> id -> doc
  let seq = 0;
  const pend = new Map();     // 'col\u0001id' -> doc|null (ainda não enviado)
  const voo = new Map();      // enviado, aguardando resposta
  const ouvintes = new Set();
  let timerEnvio = null, enviando = false, sincronizando = false, erroEnvio = false;
  let liberar; const pronto = new Promise(ok => { liberar = ok });

  // ---------------- conversa com o servidor ----------------
  async function chamar(acao, corpo) {
    let r;
    try {
      r = await fetch(URL_SERVIDOR, { method: 'POST', body: JSON.stringify({ acao, token, ...(corpo || {}) }), redirect: 'follow' });
    } catch (e) { const x = new Error('Sem conexão com o servidor. Confira a internet.'); x.code = 'rede'; throw x }
    let o = null; try { o = await r.json() } catch (e) {}
    if (!o) { const x = new Error('O servidor não respondeu direito (' + r.status + '). Confira o endereço do servidor no config.js.'); x.code = 'servidor'; throw x }
    if (o.erro) {
      const x = new Error(o.erro); x.code = o.codigo || 'tool_error';
      if (o.codigo === 'sessao' && acao !== 'entrar') sessaoTerminou();
      throw x;
    }
    return o;
  }

  // ---------------- telas de entrada ----------------
  const css = `
  #dvgh{position:fixed;inset:0;z-index:5000;background:#F6F5F1;color:#18181B;font:15px/1.5 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;display:grid;place-items:center;padding:24px;overflow:auto}
  #dvgh form,#dvgh .bx{background:#fff;border:1px solid #E5E3DD;border-radius:18px;max-width:440px;width:100%;padding:32px 28px;display:flex;flex-direction:column;gap:14px;box-shadow:0 10px 30px rgba(0,0,0,.08);margin:0}
  #dvgh img{width:72px;height:72px;border-radius:16px;align-self:center}
  #dvgh h1{font:700 26px/1.15 Oswald,"Arial Narrow",Arial,sans-serif;text-transform:uppercase;margin:0;text-align:center;letter-spacing:.01em}
  #dvgh p{margin:0;color:#52525B}
  #dvgh ol{margin:0;padding-left:20px;color:#3F3F46;display:flex;flex-direction:column;gap:6px}
  #dvgh code{background:#F4F4F5;border-radius:5px;padding:1px 5px;font-size:13px;overflow-wrap:anywhere}
  #dvgh label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600;color:#71717A}
  #dvgh input{border:1px solid #E5E3DD;border-radius:12px;padding:11px 12px;font:15px Inter,system-ui,sans-serif;color:#18181B;background:#fff}
  #dvgh input:focus{outline:none;border-color:#D4AF37;box-shadow:0 0 0 3px #FBF3D9}
  #dvgh button,#dvgh a.bt{cursor:pointer;border:1px solid #E5E3DD;background:#fff;border-radius:12px;padding:12px 16px;font:600 14px Inter,system-ui,sans-serif;color:#18181B;text-align:center;text-decoration:none}
  #dvgh button.pri{background:linear-gradient(90deg,#D4AF37,#CA8A04);border:0;color:#000;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
  #dvgh button:disabled{opacity:.55;cursor:wait}
  #dvgh .err{color:#B91C1C;font-size:14px}
  #dvgh .ro{font-size:13px;color:#71717A;text-align:center}
  #dvsync{position:fixed;left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:4000;font:600 12px Inter,system-ui,sans-serif;background:#fff;border:1px solid #E5E3DD;border-radius:999px;padding:5px 12px;color:#52525B;box-shadow:0 2px 8px rgba(0,0,0,.08);max-width:calc(100vw - 24px)}
  #dvsync.erro{color:#B91C1C;border-color:#FECACA}
  @media print{#dvsync{display:none}}`;

  function caixa(html, aoEnviar) {
    let o = document.getElementById('dvgh');
    if (!o) {
      const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      o = document.createElement('div'); o.id = 'dvgh'; document.body.appendChild(o);
    }
    const tag = aoEnviar ? 'form' : 'div';
    o.innerHTML = `<${tag} class="bx" ${aoEnviar ? 'novalidate' : 'role="dialog"'} aria-labelledby="dvgh-t"><img src="icon-192.png" alt="DRAVEN">${html}</${tag}>`;
    if (aoEnviar) {
      const f = o.querySelector('form');
      f.onsubmit = async e => {
        e.preventDefault();
        const b = f.querySelector('button[type=submit]'), er = f.querySelector('.err');
        b.disabled = true; er.hidden = true;
        try { await aoEnviar(new FormData(f)) } catch (x) { er.textContent = x.message || String(x); er.hidden = false; b.disabled = false }
      };
      const p = f.querySelector('input'); if (p) setTimeout(() => p.focus(), 50);
    }
    return o;
  }
  const fecharCaixa = () => { const o = document.getElementById('dvgh'); if (o) o.remove() };
  const telaCarregando = msg => caixa(`<h1 id="dvgh-t">DRAVEN</h1><p style="text-align:center">${esc(msg || 'Carregando…')}</p>`);

  function telaConfig() {
    caixa(`<h1 id="dvgh-t">Falta ligar o servidor</h1>
      <p>O site já está no ar, mas ainda não sabe onde ficam os dados. A gestão faz isto uma vez só:</p>
      <ol>
        <li>Publique o servidor no Google Apps Script, como explica o README do repositório.</li>
        <li>Copie o endereço do app da Web (termina em <code>/exec</code>).</li>
        <li>Cole no arquivo <code>config.js</code>, em <code>servidor</code>.</li>
      </ol>
      <a class="bt" href="https://github.com/thatianep/DravenSports#colocar-no-ar-uma-vez-s%C3%B3" target="_blank" rel="noopener">Ver o passo a passo</a>`);
  }
  function telaEntrar(aviso) {
    const ult = ler('dv-usuario');
    caixa(`<h1 id="dvgh-t">Plataforma Comercial</h1>
      <p style="text-align:center">Entre com o usuário e a senha que a gestão criou para você.</p>
      ${aviso ? `<p class="err" role="alert">${esc(aviso)}</p>` : ''}
      <label>Usuário<input name="login" autocomplete="username" autocapitalize="none" spellcheck="false" required value="${esc(ult)}"></label>
      <label>Senha<input name="senha" type="password" autocomplete="current-password" required></label>
      <p class="err" role="alert" hidden></p>
      <button type="submit" class="pri">Entrar</button>
      <p class="ro">Esqueceu a senha? Peça para a gestão gerar uma nova.</p>`,
      async fd => {
        const login = String(fd.get('login') || '').trim(), senha = String(fd.get('senha') || '');
        if (!login || !senha) throw new Error('Preencha usuário e senha.');
        const r = await chamar('entrar', { login, senha });
        token = r.token; gravar('dv-sessao', token); gravar('dv-usuario', login);
        await abrir();
      });
    if (ult) setTimeout(() => { const s = document.querySelector('#dvgh input[name=senha]'); if (s) s.focus() }, 60);
  }
  function telaInstalar() {
    caixa(`<h1 id="dvgh-t">Primeiro acesso</h1>
      <p>Crie a conta da gestão. Ela é a dona do sistema e cadastra os funcionários depois, na aba <b>Equipe</b>.</p>
      <label>Código de instalação<input name="codigo" required autocomplete="off"></label>
      <label>Seu nome<input name="nome" required autocomplete="name"></label>
      <label>Usuário (login)<input name="login" required autocapitalize="none" spellcheck="false" autocomplete="username"></label>
      <label>Senha (mínimo 8 caracteres)<input name="senha" type="password" required minlength="8" autocomplete="new-password"></label>
      <label>Repita a senha<input name="repete" type="password" required autocomplete="new-password"></label>
      <p class="err" role="alert" hidden></p>
      <button type="submit" class="pri">Criar conta da gestão</button>
      <p class="ro">O código de instalação é a frase colocada em CODIGO_INSTALACAO no Apps Script.</p>`,
      async fd => {
        if (fd.get('senha') !== fd.get('repete')) throw new Error('As duas senhas não são iguais.');
        const r = await chamar('instalar', { codigo: fd.get('codigo'), nome: fd.get('nome'), login: fd.get('login'), senha: fd.get('senha') });
        token = r.token; gravar('dv-sessao', token); gravar('dv-usuario', String(fd.get('login')).trim());
        await abrir();
      });
  }
  function sessaoTerminou() {
    token = ''; gravar('dv-sessao', '');
    if (eu) { if (pend.size) alert('Sua sessão terminou. As últimas alterações que ainda não tinham sido salvas foram perdidas.'); location.reload() }
  }

  // ---------------- faixa de sincronização ----------------
  let syncEl = null;
  function sync(estado, txt) {
    if (!syncEl) { syncEl = document.createElement('div'); syncEl.id = 'dvsync'; syncEl.setAttribute('role', 'status'); document.body.appendChild(syncEl) }
    syncEl.className = estado; syncEl.textContent = txt;
  }
  const statusSalvo = () => sync('', 'Salvo na nuvem');

  // ---------------- abrir a base ----------------
  async function abrir() {
    telaCarregando('Abrindo os dados da DRAVEN…');
    const r = await chamar('carregar');
    eu = r.eu; perfis = r.perfis || {}; seq = r.seq || 0; dados = r.cols || {};
    fecharCaixa(); statusSalvo();
    setInterval(sincronizar, SINCRONIA_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizar() });
    liberar();
  }
  const chave = (n, id) => n + '\u0001' + id;
  function aplicarRemoto(docs) {
    let mudou = false;
    for (const [n, id, d] of docs) {
      const k = chave(n, id); if (pend.has(k) || voo.has(k)) continue;
      const c = dados[n] || (dados[n] = {});
      if (d === null) { if (id in c) { delete c[id]; mudou = true } }
      else { c[id] = d; mudou = true }
    }
    if (mudou) avisar();
  }
  async function sincronizar() {
    if (!eu || sincronizando || document.hidden) return;
    sincronizando = true;
    try {
      const r = await chamar('mudancas', { desde: seq });
      if (r.completo) {
        dados = r.completo;
        for (const [k, d] of [...voo, ...pend]) { const [n, id] = k.split('\u0001'); const c = dados[n] || (dados[n] = {}); if (d === null) delete c[id]; else c[id] = d }
        avisar();
      } else aplicarRemoto(r.docs || []);
      seq = r.seq;
      if ((r.papel || null) !== (eu.papel || null)) location.reload();
      if (!pend.size && !voo.size && !erroEnvio) statusSalvo();
    } catch (e) { if (e.code === 'rede') sync('erro', 'Sem conexão. Tentando de novo…') }
    finally { sincronizando = false }
  }
  function agendar() { sync('', 'Salvando…'); clearTimeout(timerEnvio); timerEnvio = setTimeout(enviar, 700) }
  async function enviar() {
    if (enviando || !pend.size) return; enviando = true;
    for (const [k, d] of pend) voo.set(k, d); pend.clear();
    const ops = [...voo].map(([k, d]) => { const [n, id] = k.split('\u0001'); return [n, id, d] });
    try {
      const r = await chamar('gravar', { ops });
      voo.clear(); erroEnvio = false;
      if (r.rejeitados && r.rejeitados.length) {
        for (const [n, id, antes] of r.rejeitados) { const c = dados[n] || (dados[n] = {}); if (antes) c[id] = antes; else delete c[id] }
        avisar(); sync('erro', 'Seu perfil não pode fazer uma das alterações. Ela foi desfeita.');
        setTimeout(() => { if (!pend.size) statusSalvo() }, 6000);
      } else if (!pend.size) statusSalvo();
      sincronizar();
    } catch (e) {
      for (const [k, d] of voo) if (!pend.has(k)) pend.set(k, d); voo.clear();
      erroEnvio = true;
      if (e.code !== 'sessao') { sync('erro', 'Não salvou ainda. Tentando de novo em 10 s…'); setTimeout(enviar, 10000) }
    } finally { enviando = false; if (pend.size && !erroEnvio) agendar() }
  }
  window.addEventListener('beforeunload', e => { if (pend.size || voo.size) { e.preventDefault(); e.returnValue = '' } });

  // ---------------- banco no formato que o sistema usa ----------------
  let avisoMarcado = false;
  function avisar() { if (avisoMarcado) return; avisoMarcado = true; setTimeout(() => { avisoMarcado = false; ouvintes.forEach(f => f()) }, 0) }
  const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  const papelAtual = () => eu.dono ? 'gestao' : (((dados.equipe || {})[eu.id] || {}).papel || null);
  function podeGravar(n, id, antes, depois) {   // mesma regra do servidor, para avisar na hora
    if (n.charAt(0) === '_') return false;
    const p = papelAtual();
    if (p === 'gestao') return true;
    if (n === 'acessos' || n === 'usuarios') return id === eu.id;
    if (!p || n === 'equipe' || n === 'config') return false;
    if (depois === null) return n === 'tarefas' && !!antes && antes.criadoPor === eu.id;
    return true;
  }
  function escrever(n, id, d) {
    const c = dados[n] || (dados[n] = {});
    if (!podeGravar(n, id, c[id] || null, d)) { const e = new Error('Seu perfil não pode fazer esta alteração.'); e.code = 'not_granted'; throw e }
    if (d === null) delete c[id]; else c[id] = json(d);
    pend.set(chave(n, id), d === null ? null : json(d));
    avisar(); agendar();
  }
  function comPontos(base, patch) {
    const o = json(base) || {};
    for (const k in patch) {
      if (!k.includes('.')) { o[k] = patch[k]; continue }
      const ps = k.split('.'); let x = o;
      for (let i = 0; i < ps.length - 1; i++) { if (typeof x[ps[i]] !== 'object' || x[ps[i]] === null) x[ps[i]] = {}; x = x[ps[i]] }
      x[ps[ps.length - 1]] = patch[k];
    }
    return o;
  }
  function snapDoc(n, id) {
    const d = (dados[n] || {})[id];
    return { id, exists: !!d, ref: docRef(n, id), data: () => json(d), get: f => d ? json(d[f]) : undefined };
  }
  function docRef(n, id) {
    return {
      id, path: n + '/' + id,
      get: async () => snapDoc(n, id),
      set: async (d, opt) => { const a = (dados[n] || {})[id]; escrever(n, id, opt && opt.merge && a ? comPontos(a, d) : d) },
      update: async d => { const a = (dados[n] || {})[id]; if (!a) { const e = new Error('registro excluído'); e.code = 'invalid_argument'; throw e } escrever(n, id, comPontos(a, d)) },
      delete: async () => { if ((dados[n] || {})[id]) escrever(n, id, null) },
      acquire: async () => ({ acquired: true }), release: async () => {},
      onSnapshot: (fn, err) => { const l = () => { try { fn(snapDoc(n, id)) } catch (e) { err && err(e) } }; ouvintes.add(l); setTimeout(l, 0); return () => ouvintes.delete(l) }
    };
  }
  const cmp = (a, b) => a === b ? 0 : a === undefined || a === null ? 1 : b === undefined || b === null ? -1 : a < b ? -1 : 1;
  const OPS = { '==': (a, b) => a === b, '!=': (a, b) => a !== b, '<': (a, b) => a < b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '>=': (a, b) => a >= b, 'in': (a, b) => (b || []).includes(a), 'not-in': (a, b) => !(b || []).includes(a), 'array-contains': (a, b) => Array.isArray(a) && a.includes(b) };
  function rodarConsulta(n, ops) {
    let l = Object.entries(dados[n] || {}).map(([id, d]) => ({ id, d }));
    const ord = [];
    for (const o of ops) {
      if (o[0] === 'w') l = l.filter(x => (OPS[o[2]] || (() => true))(x.d[o[1]], o[3]));
      else if (o[0] === 'o') ord.push([o[1], o[2] === 'desc' ? -1 : 1]);
    }
    if (ord.length) l.sort((a, b) => { for (const [f, s] of ord) { const c = cmp(a.d[f], b.d[f]); if (c) return (a.d[f] == null || b.d[f] == null) ? c : c * s } return 0 });
    const lim = ops.filter(o => o[0] === 'l').pop(); if (lim) l = l.slice(0, lim[1]);
    return l.map(x => snapDoc(n, x.id));
  }
  function consulta(n, ops) {
    const snap = () => { const docs = rodarConsulta(n, ops); return { docs, size: docs.length, empty: !docs.length, forEach: f => docs.forEach(f) } };
    return {
      where: (f, op, v) => consulta(n, [...ops, ['w', f, op, v]]),
      orderBy: (f, dir) => consulta(n, [...ops, ['o', f, dir]]),
      limit: k => consulta(n, [...ops, ['l', k]]),
      doc: id => docRef(n, id || novoId()),
      get: async () => snap(),
      onSnapshot: (fn, err) => { const l = () => { try { fn(snap()) } catch (e) { err && err(e) } }; ouvintes.add(l); setTimeout(l, 0); return () => ouvintes.delete(l) }
    };
  }
  const db = {
    collection: n => consulta(n, []),
    doc: p => { const i = p.indexOf('/'); return docRef(p.slice(0, i), p.slice(i + 1)) }
  };

  // ---------------- usuário ----------------
  function avatar(nome) {
    const l = (String(nome || '').trim()[0] || 'D').toUpperCase();
    return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="9" fill="#D4AF37"/><text x="20" y="27" font-family="Arial" font-size="19" font-weight="700" text-anchor="middle" fill="#000">${esc(l)}</text></svg>`);
  }
  let buscandoPerfis = null;
  const user = {
    id: async () => eu.id,
    me: async () => ({ id: eu.id, name: eu.name, email: eu.login, avatarUrl: avatar(eu.name), isOwner: !!eu.dono, canEdit: papelAtual() === 'gestao' }),
    isOwner: () => !!eu.dono, canEdit: () => papelAtual() === 'gestao',
    can: async k => k === 'data.write' ? true : null,
    profiles: async ids => {
      if (ids.some(id => !perfis[id])) {
        if (!buscandoPerfis) buscandoPerfis = chamar('perfis').then(r => { perfis = r.perfis || perfis }).catch(() => {}).finally(() => { setTimeout(() => { buscandoPerfis = null }, 20000) });
        await buscandoPerfis;
      }
      const o = {};
      for (const id of ids) { const p = perfis[id]; o[id] = p ? { id, name: p.name || p.login || '', email: p.login, avatarUrl: avatar(p.name || p.login) } : { id, name: '', avatarUrl: avatar('?') } }
      return o;
    },
    search: async () => Object.entries(perfis).map(([id, p]) => ({ id, name: p.name, avatarUrl: avatar(p.name) }))
  };

  // ---------------- contas (as telas de Equipe e Minha conta do sistema usam window.DRAVEN.api) ----------------
  const ROTAS = {
    '/api/contas': async () => (await chamar('contas')).lista,
    '/api/contas/criar': async b => chamar('criarConta', { dados: b }),
    '/api/contas/senha': async b => chamar('novaSenha', { id: b.id }),
    '/api/contas/desativar': async b => chamar('desativarConta', { id: b.id }),
    '/api/conta/nome': async b => { await chamar('meuNome', { name: b.name }); return {} },
    '/api/conta/senha': async b => { const r = await chamar('minhaSenha', { atual: b.atual, nova: b.nova }); token = r.token; gravar('dv-sessao', token); return {} },
    '/api/auth/logout': async () => { try { await chamar('sair') } catch (e) {} return {} }
  };
  window.DRAVEN = {
    api: async (url, opt) => {
      const f = ROTAS[String(url).split('?')[0]];
      if (!f) throw new Error('Este recurso precisa do servidor de WhatsApp, que não faz parte desta versão.');
      return f((opt && opt.body) || {});
    }
  };

  // ---------------- baixar arquivo ----------------
  const downloads = {
    save: async ({ filename, data }) => {
      const b = data instanceof Blob ? data : new Blob([data]);
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = filename || 'arquivo';
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1500);
      return { saved: true };
    }
  };

  // ---------------- Google Drive da gestão (planilhas), pelo servidor ----------------
  function b64De(c) {
    if (c && c.$file) { const u = new Uint8Array(c.$file.data); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s) }
    return String(c || '');
  }
  const ferramentas = {
    async search_files({ query }) {
      const q = String(query || '');
      if (q.includes(FOLDER)) return { files: [{ id: (await chamar('drivePasta')).id }] };
      return { files: (await chamar('driveListar')).files || [] };
    },
    async create_file({ title, contentMimeType, base64Content }) {
      if (contentMimeType === FOLDER) return { id: (await chamar('drivePasta')).id, title };
      return chamar('driveCriar', { title, mime: contentMimeType, base64: b64De(base64Content) });
    },
    async download_file_content({ fileId }) { return { content: (await chamar('driveBaixar', { fileId })).content } }
  };
  const mcp = {
    listTools: async () => ({ fileArgs: true }),
    callTool: async (server, tool, input) => {
      if (!ferramentas[tool]) { const e = new Error('ferramenta indisponível'); e.code = 'tool_error'; throw e }
      try { return { payload: await ferramentas[tool](input || {}) } }
      catch (e) { const x = new Error(e.message); x.code = 'tool_error'; throw x }
    }
  };
  const permissions = { state: async () => 'granted', request: async () => ({}), manage: async () => {} };

  // ---------------- sair ----------------
  async function sair() {
    try { await chamar('sair') } catch (e) {}
    token = ''; gravar('dv-sessao', ''); location.reload();
  }
  window.DRAVEN_GH = { sair, sincronizar };

  // o sistema pede as peças por aqui, como no claude.ai
  const PECAS = { db, user, downloads, mcp, permissions, sample: null };
  window.claude = Object.freeze({ use: async n => { await pronto; return PECAS[n] || null } });

  // ---------------- início ----------------
  async function iniciar() {
    if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(URL_SERVIDOR)) return telaConfig();
    if (token) { try { return await abrir() } catch (e) { if (e.code !== 'sessao') return telaEntrar(e.message) } }
    telaCarregando('Conectando ao servidor…');
    try { const r = await chamar('estado'); return r.configurado ? telaEntrar() : telaInstalar() }
    catch (e) { telaEntrar(e.message) }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
