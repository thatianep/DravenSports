/* DRAVEN | Plataforma Comercial — versão GitHub Pages.
 *
 * O sistema foi escrito para o claude.ai, onde pede banco de dados, usuário e Google Drive com claude.use(...).
 * Este arquivo entrega essas mesmas peças fora do claude.ai:
 *   - login com a conta Google (Google Identity Services);
 *   - banco de dados = um arquivo "draven-dados.json" na pasta "DRAVEN | Plataforma Comercial" do Google Drive;
 *   - planilhas no Drive = API do Google Drive, com a conta de quem está usando.
 * Quem pode ver e mexer nos dados é quem tem acesso a essa pasta no Drive (compartilhada pela gestão).
 */
(function () {
  'use strict';
  const CFG = window.DRAVEN_CONFIG || {};
  const SCOPE = 'https://www.googleapis.com/auth/drive';
  const NOME_ARQ = 'draven-dados.json';
  const PASTA = 'DRAVEN | Plataforma Comercial';
  const FOLDER = 'application/vnd.google-apps.folder';
  const SHEET = 'application/vnd.google-apps.spreadsheet';
  const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const API = 'https://www.googleapis.com/drive/v3';
  const UP = 'https://www.googleapis.com/upload/drive/v3';
  const ALL = '&supportsAllDrives=true';
  const SINCRONIA_MS = 15000;
  const TOMBA_MS = 60 * 864e5; // registros excluídos somem de vez depois de 60 dias

  const ler = k => { try { return localStorage.getItem(k) || '' } catch (e) { return '' } };
  const gravar = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k) } catch (e) {} };
  const enc = encodeURIComponent;
  const json = o => JSON.parse(JSON.stringify(o));

  let token = null, tokenExp = 0, tokenClient = null, cbTok = null;
  let eu = null;            // {id,email,name,avatarUrl}
  let arq = null;           // {id,version,canEdit,owner}
  let dados = { v: 1, cols: {} };
  let pend = false, salvando = false, timerSalvar = null, renovando = null;
  const ouvintes = new Set();
  let liberar; const pronto = new Promise(ok => { liberar = ok });

  // ---------------- tela de entrada ----------------
  const css = `
  #dvgh{position:fixed;inset:0;z-index:5000;background:#F6F5F1;color:#18181B;font:15px/1.5 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;display:grid;place-items:center;padding:24px;overflow:auto}
  #dvgh .bx{background:#fff;border:1px solid #E5E3DD;border-radius:18px;max-width:520px;width:100%;padding:32px 28px;display:flex;flex-direction:column;gap:14px;box-shadow:0 10px 30px rgba(0,0,0,.08)}
  #dvgh img{width:72px;height:72px;border-radius:16px;align-self:center}
  #dvgh h1{font:700 26px/1.15 Oswald,"Arial Narrow",Arial,sans-serif;text-transform:uppercase;margin:0;text-align:center;letter-spacing:.01em}
  #dvgh p{margin:0;color:#52525B}
  #dvgh ol{margin:0;padding-left:20px;color:#3F3F46;display:flex;flex-direction:column;gap:6px}
  #dvgh code{background:#F4F4F5;border-radius:5px;padding:1px 5px;font-size:13px;overflow-wrap:anywhere}
  #dvgh .acoes{display:flex;flex-direction:column;gap:8px}
  #dvgh button,#dvgh a.bt{cursor:pointer;border:1px solid #E5E3DD;background:#fff;border-radius:12px;padding:11px 16px;font:600 14px Inter,system-ui,sans-serif;color:#18181B;text-align:center;text-decoration:none}
  #dvgh button.pri{background:linear-gradient(90deg,#D4AF37,#CA8A04);border:0;color:#000;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
  #dvgh button:disabled{opacity:.5;cursor:wait}
  #dvgh .err{color:#B91C1C;font-size:14px}
  #dvgh .ro{font-size:13px;color:#71717A}
  #dvsync{position:fixed;left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:4000;font:600 12px Inter,system-ui,sans-serif;background:#fff;border:1px solid #E5E3DD;border-radius:999px;padding:5px 12px;color:#52525B;box-shadow:0 2px 8px rgba(0,0,0,.08);display:flex;gap:8px;align-items:center;max-width:calc(100vw - 24px)}
  #dvsync.erro{color:#B91C1C;border-color:#FECACA}
  #dvsync.renovar{background:#FEF3C7;color:#713F12;border-color:#FCD34D}
  #dvsync button{all:unset;cursor:pointer;background:#000;color:#fff;border-radius:999px;padding:2px 10px}
  @media print{#dvsync{display:none}}`;

  function caixa(html) {
    let o = document.getElementById('dvgh');
    if (!o) {
      const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      o = document.createElement('div'); o.id = 'dvgh'; document.body.appendChild(o);
    }
    o.innerHTML = `<div class="bx" role="dialog" aria-modal="true" aria-labelledby="dvgh-t"><img src="icon-192.png" alt="DRAVEN">${html}</div>`;
    return o;
  }
  const fecharCaixa = () => { const o = document.getElementById('dvgh'); if (o) o.remove() };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function telaCarregando(msg) {
    caixa(`<h1 id="dvgh-t">DRAVEN</h1><p style="text-align:center">${esc(msg || 'Carregando…')}</p>`);
  }
  function telaConfig() {
    const origem = location.origin;
    caixa(`<h1 id="dvgh-t">Falta ligar o login do Google</h1>
      <p>O sistema já está no ar, mas ainda não sabe qual login do Google usar. Isto é feito uma vez só pela gestão:</p>
      <ol>
        <li>Em <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">console.cloud.google.com</a>, crie um projeto e ative a <b>Google Drive API</b>.</li>
        <li>Em <b>Tela de consentimento OAuth</b>: tipo Externo, e em Usuários de teste adicione o Gmail de cada pessoa da equipe.</li>
        <li>Em <b>Credenciais</b> &gt; Criar &gt; ID do cliente OAuth &gt; Aplicativo da Web. Em Origens JavaScript autorizadas coloque <code>${esc(origem)}</code>.</li>
        <li>Copie o <b>ID do cliente</b> (termina em <code>.apps.googleusercontent.com</code>) e cole no arquivo <code>config.js</code> do GitHub.</li>
      </ol>
      <div class="acoes"><a class="bt" href="https://github.com/thatianep/DravenSports/edit/main/config.js" target="_blank" rel="noopener">Abrir o config.js no GitHub</a></div>`);
  }
  function telaEntrar(erro) {
    const hint = ler('dv-gh-hint');
    caixa(`<h1 id="dvgh-t">Plataforma Comercial</h1>
      <p style="text-align:center">Entre com a sua conta Google. Os dados ficam no Google Drive da DRAVEN.</p>
      ${erro ? `<p class="err" role="alert">${esc(erro)}</p>` : ''}
      <div class="acoes"><button type="button" class="pri" id="dvgh-in">Entrar com Google</button>
      ${hint ? `<button type="button" id="dvgh-outra">Entrar com outra conta</button>` : ''}</div>
      ${hint ? `<p class="ro" style="text-align:center">Última conta: ${esc(hint)}</p>` : ''}`);
    document.getElementById('dvgh-in').onclick = () => entrar(hint ? '' : 'select_account');
    const o = document.getElementById('dvgh-outra'); if (o) o.onclick = () => { gravar('dv-gh-hint', ''); entrar('select_account') };
  }
  function telaSemBase() {
    caixa(`<h1 id="dvgh-t">Base de dados não encontrada</h1>
      <p>Você entrou como <b>${esc(eu.email)}</b>, mas não há uma base da DRAVEN no seu Google Drive.</p>
      <p><b>Se você é da equipe:</b> peça para a gestão compartilhar a pasta <b>${esc(PASTA)}</b> do Google Drive com o seu e-mail, como <b>Editor</b>. Depois clique em Tentar de novo.</p>
      <p><b>Se você é a gestão e está começando:</b> crie a base. Ela fica no seu Drive e você compartilha a pasta com a equipe.</p>
      <div class="acoes"><button type="button" id="dvgh-de-novo">Tentar de novo</button>
      <button type="button" class="pri" id="dvgh-criar">Criar a base no meu Drive</button>
      <button type="button" id="dvgh-outra">Entrar com outra conta</button></div>`);
    document.getElementById('dvgh-de-novo').onclick = () => depoisLogin().catch(falhaEntrada);
    document.getElementById('dvgh-criar').onclick = async e => {
      e.target.disabled = true;
      try { await criarBase(); await abrirBase() } catch (x) { falhaEntrada(x) }
    };
    document.getElementById('dvgh-outra').onclick = () => sair(true);
  }
  function falhaEntrada(e) {
    console.error(e);
    const m = (e && (e.message || e.type || e.error)) || 'erro desconhecido';
    if (/popup/i.test(m)) return telaEntrar();
    telaEntrar('Não foi possível abrir: ' + m);
  }

  // ---------------- faixa de sincronização ----------------
  let syncEl = null;
  function sync(estado, txt, acao) {
    if (!syncEl) { syncEl = document.createElement('div'); syncEl.id = 'dvsync'; syncEl.setAttribute('role', 'status'); document.body.appendChild(syncEl) }
    syncEl.className = estado;
    syncEl.innerHTML = esc(txt) + (acao ? ' <button type="button">' + esc(acao.rotulo) + '</button>' : '');
    if (acao) syncEl.querySelector('button').onclick = acao.fn;
  }
  const statusSalvo = () => sync(arq && !arq.canEdit ? 'ro' : 'ok', arq && !arq.canEdit ? 'Somente leitura · Google Drive' : 'Salvo no Google Drive');

  // ---------------- login Google ----------------
  function esperarGIS() {
    return new Promise((ok, ko) => {
      let n = 0; const t = setInterval(() => {
        if (window.google && google.accounts && google.accounts.oauth2) { clearInterval(t); ok() }
        else if (++n > 150) { clearInterval(t); ko(new Error('o login do Google não carregou. Confira a internet e recarregue')) }
      }, 100);
    });
  }
  function pedirToken(prompt) {
    return new Promise((ok, ko) => {
      cbTok = { ok, ko };
      const o = { prompt: prompt || '' }; const h = ler('dv-gh-hint'); if (h) o.login_hint = h;
      tokenClient.requestAccessToken(o);
    });
  }
  async function entrar(prompt) {
    const b = document.getElementById('dvgh-in'); if (b) b.disabled = true;
    try { await pedirToken(prompt); await depoisLogin() } catch (e) { falhaEntrada(e) }
  }
  function garantirToken() {
    if (token && Date.now() < tokenExp) return Promise.resolve();
    if (!renovando) renovando = new Promise(ok => {
      const ir = () => pedirToken('').then(() => { renovando = null; statusSalvo(); ok() }).catch(() => sync('renovar', 'Não deu certo. Tente de novo:', { rotulo: 'Continuar', fn: ir }));
      sync('renovar', 'A sessão do Google expirou. Suas alterações estão guardadas aqui.', { rotulo: 'Continuar', fn: ir });
    });
    return renovando;
  }
  async function g(url, opt, tentou) {
    await garantirToken();
    opt = opt || {};
    const r = await fetch(url, { ...opt, headers: { ...(opt.headers || {}), Authorization: 'Bearer ' + token } });
    if (r.status === 401) {
      token = null; tokenExp = 0;
      if (tentou) { const e = new Error('a sessão do Google expirou'); e.code = 'needs_reauth'; throw e }
      return g(url, opt, true);
    }
    if (!r.ok) {
      let m = ''; try { const j = await r.json(); m = (j.error && j.error.message) || '' } catch (e) {}
      const e = new Error(m || ('o Google respondeu com erro ' + r.status)); e.code = r.status >= 500 ? 'server_unavailable' : 'tool_error'; e.status = r.status; throw e;
    }
    return r;
  }
  const gj = async (url, opt) => (await g(url, opt)).json();

  // ---------------- base de dados no Drive ----------------
  async function acharArquivo() {
    if (CFG.arquivoDados) return CFG.arquivoDados;
    const q = `name = '${NOME_ARQ}' and trashed = false`;
    const r = await gj(`${API}/files?q=${enc(q)}&fields=files(id,owners(emailAddress))&orderBy=modifiedTime desc&pageSize=20&includeItemsFromAllDrives=true${ALL}`);
    let fs = r.files || [];
    const dono = String(CFG.dono || '').toLowerCase();
    if (dono) fs = fs.filter(f => (f.owners || []).some(o => o.emailAddress.toLowerCase() === dono)).concat(fs);
    return fs[0] ? fs[0].id : null;
  }
  async function meta(id) {
    const m = await gj(`${API}/files/${id}?fields=id,version,parents,owners(emailAddress),capabilities(canEdit)${ALL}`);
    return { id: m.id, version: String(m.version), canEdit: !!(m.capabilities && m.capabilities.canEdit), owner: (((m.owners || [])[0] || {}).emailAddress || '').toLowerCase(), pasta: (m.parents || [])[0] || null };
  }
  async function baixar() {
    const t = await (await g(`${API}/files/${arq.id}?alt=media${ALL}`)).text();
    let o = null; try { o = JSON.parse(t) } catch (e) {}
    return o && o.cols ? o : { v: 1, cols: {} };
  }
  async function pastaMinha() {
    const q = `name = '${PASTA}' and mimeType = '${FOLDER}' and 'me' in owners and trashed = false`;
    const r = await gj(`${API}/files?q=${enc(q)}&fields=files(id)&pageSize=5`);
    if (r.files && r.files[0]) return r.files[0].id;
    const f = await gj(`${API}/files?fields=id`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: PASTA, mimeType: FOLDER }) });
    return f.id;
  }
  async function criarBase() {
    telaCarregando('Criando a base no seu Google Drive…');
    const pid = await pastaMinha();
    await upload({ name: NOME_ARQ, parents: [pid], mimeType: 'application/json', description: 'Banco de dados da DRAVEN Plataforma Comercial. Não apague nem edite à mão.' },
      new Blob([JSON.stringify({ v: 1, cols: {} })], { type: 'application/json' }), 'application/json');
  }
  async function upload(metaObj, blob, mime) {
    const b = 'dv' + Math.random().toString(36).slice(2);
    const body = new Blob([`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metaObj)}\r\n--${b}\r\nContent-Type: ${mime}\r\n\r\n`, blob, `\r\n--${b}--`]);
    return gj(`${UP}/files?uploadType=multipart&fields=id,name,webViewLink,createdTime${ALL}`, { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body });
  }

  async function depoisLogin() {
    telaCarregando('Abrindo a base da DRAVEN no seu Google Drive…');
    const a = await gj(`${API}/about?fields=user(displayName,emailAddress,photoLink)`);
    const email = String(a.user.emailAddress || '').toLowerCase();
    eu = { id: email, email, name: a.user.displayName || email.split('@')[0], avatarUrl: a.user.photoLink || avatar(a.user.displayName || email) };
    gravar('dv-gh-hint', email);
    if (!(await acharArquivo())) return telaSemBase();
    await abrirBase();
  }
  async function abrirBase() {
    arq = await meta(await acharArquivo());
    dados = await baixar();
    const p = (dados.cols._perfis || {})[eu.id];
    if (arq.canEdit && (!p || p.name !== eu.name || p.avatarUrl !== eu.avatarUrl)) escrever('_perfis', eu.id, { name: eu.name, avatarUrl: eu.avatarUrl, email: eu.email });
    fecharCaixa(); statusSalvo();
    setInterval(sincronizar, SINCRONIA_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizar() });
    liberar();
  }
  function avatar(nome) {
    const l = (String(nome).trim()[0] || 'D').toUpperCase();
    return 'data:image/svg+xml,' + enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="9" fill="#D4AF37"/><text x="20" y="27" font-family="Arial" font-size="19" font-weight="700" text-anchor="middle" fill="#000">${esc(l)}</text></svg>`);
  }

  // mescla o que veio do Drive com a memória: em cada registro vale a versão gravada por último.
  // devolve true se a memória tem algo mais novo que o Drive (precisa enviar).
  function mesclar(remoto) {
    let mudou = false, temNovo = false;
    const R0 = remoto.cols || {};
    for (const n of new Set([...Object.keys(dados.cols), ...Object.keys(R0)])) {
      const L = dados.cols[n] || (dados.cols[n] = {}), R = R0[n] || {};
      for (const id in R) { const l = L[id]; if (!l || (R[id]._t || 0) > (l._t || 0)) { L[id] = R[id]; mudou = true } }
      for (const id in L) { const r = R[id]; if (!r || (L[id]._t || 0) > (r._t || 0)) temNovo = true }
    }
    if (mudou) avisar();
    return temNovo;
  }
  function podar() {
    const lim = Date.now() - TOMBA_MS;
    for (const n in dados.cols) for (const id in dados.cols[n]) { const d = dados.cols[n][id]; if (d._del && (d._t || 0) < lim) delete dados.cols[n][id] }
  }
  let sincronizando = false;
  async function sincronizar() {
    if (!arq || salvando || sincronizando || document.hidden) return;
    sincronizando = true;
    try {
      const m = await meta(arq.id);
      arq.canEdit = m.canEdit;
      if (m.version !== arq.version) {
        const r = await baixar(); arq.version = m.version;
        if (mesclar(r) && arq.canEdit) agendar();
      }
      if (!pend) statusSalvo();
    } catch (e) { if (!pend) sync('erro', 'Sem conexão com o Google Drive. Tentando de novo…') }
    finally { sincronizando = false }
  }
  function agendar() { pend = true; sync('', 'Salvando…'); clearTimeout(timerSalvar); timerSalvar = setTimeout(rodar, 1200) }
  async function rodar() {
    if (salvando) return; salvando = true;
    try {
      while (pend) {
        pend = false;
        const m = await meta(arq.id);
        if (m.version !== arq.version) mesclar(await baixar());
        podar();
        const r = await gj(`${UP}/files/${arq.id}?uploadType=media&fields=version${ALL}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
        arq.version = String(r.version);
      }
      statusSalvo();
    } catch (e) {
      console.error(e); pend = true;
      sync('erro', 'Não salvou no Drive ainda. Tentando de novo em 10 s…');
      setTimeout(rodar, 10000);
    } finally { salvando = false }
  }
  // links de app (WhatsApp, telefone, e-mail) não saem da página: não mostram o aviso de "alterações não salvas"
  window.addEventListener('beforeunload', e => { if (Date.now() - (window.__dvSaidaExterna || 0) < 4000) return; if (pend || salvando) { e.preventDefault(); e.returnValue = '' } });

  // ---------------- banco no formato que o sistema usa ----------------
  let avisoMarcado = false;
  function avisar() { if (avisoMarcado) return; avisoMarcado = true; setTimeout(() => { avisoMarcado = false; ouvintes.forEach(f => f()) }, 0) }
  const limpo = d => { const o = {}; for (const k in d) if (k !== '_t' && k !== '_del') o[k] = d[k]; return o };
  const vivo = d => !!d && !d._del;
  const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  function semPermissao() { const e = new Error('sem permissão para gravar'); e.code = 'invalid_argument'; return e }
  function escrever(n, id, d) {
    if (!arq || !arq.canEdit) throw semPermissao();
    const c = dados.cols[n] || (dados.cols[n] = {});
    const t = Math.max(Date.now(), ((c[id] || {})._t || 0) + 1);
    c[id] = d ? { ...json(d), _t: t } : { _del: true, _t: t };
    avisar(); agendar();
  }
  function comPontos(base, patch) {
    const o = json(base);
    for (const k in patch) {
      if (!k.includes('.')) { o[k] = patch[k]; continue }
      const ps = k.split('.'); let x = o;
      for (let i = 0; i < ps.length - 1; i++) { if (typeof x[ps[i]] !== 'object' || x[ps[i]] === null) x[ps[i]] = {}; x = x[ps[i]] }
      x[ps[ps.length - 1]] = patch[k];
    }
    return o;
  }
  function snapDoc(n, id) {
    const d = (dados.cols[n] || {})[id];
    return { id, exists: vivo(d), ref: docRef(n, id), data: () => vivo(d) ? json(limpo(d)) : undefined, get: f => vivo(d) ? json(d[f]) : undefined };
  }
  function docRef(n, id) {
    return {
      id, path: n + '/' + id,
      get: async () => snapDoc(n, id),
      set: async (d, opt) => { const a = (dados.cols[n] || {})[id]; escrever(n, id, opt && opt.merge && vivo(a) ? comPontos(limpo(a), d) : d) },
      update: async d => { const a = (dados.cols[n] || {})[id]; if (!vivo(a)) { const e = new Error('registro excluído'); e.code = 'invalid_argument'; throw e } escrever(n, id, comPontos(limpo(a), d)) },
      delete: async () => { if ((dados.cols[n] || {})[id]) escrever(n, id, null) },
      acquire: async () => ({ acquired: true }), release: async () => {},
      onSnapshot: (fn, err) => { const l = () => { try { fn(snapDoc(n, id)) } catch (e) { err && err(e) } }; ouvintes.add(l); setTimeout(l, 0); return () => ouvintes.delete(l) }
    };
  }
  const cmp = (a, b) => a === b ? 0 : a === undefined || a === null ? 1 : b === undefined || b === null ? -1 : a < b ? -1 : 1;
  const OPS = { '==': (a, b) => a === b, '!=': (a, b) => a !== b, '<': (a, b) => a < b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '>=': (a, b) => a >= b, 'in': (a, b) => (b || []).includes(a), 'not-in': (a, b) => !(b || []).includes(a), 'array-contains': (a, b) => Array.isArray(a) && a.includes(b) };
  function rodarConsulta(n, ops) {
    let l = Object.entries(dados.cols[n] || {}).filter(([, d]) => vivo(d)).map(([id, d]) => ({ id, d }));
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
  const ehDono = () => !!eu && !!arq && eu.id === arq.owner;
  const user = {
    id: async () => eu.id,
    me: async () => ({ id: eu.id, name: eu.name, email: eu.email, avatarUrl: eu.avatarUrl, isOwner: ehDono(), canEdit: ehDono() }),
    isOwner: () => ehDono(), canEdit: () => ehDono(),
    can: async k => k === 'data.write' ? !!(arq && arq.canEdit) : null,
    profiles: async ids => {
      const P = dados.cols._perfis || {}, o = {};
      for (const id of ids) { const p = P[id]; o[id] = vivo(p) ? { id, name: p.name || '', avatarUrl: p.avatarUrl || avatar(p.name || id), email: p.email || id } : { id, name: '', avatarUrl: '' } }
      return o;
    },
    search: async () => Object.entries(dados.cols._perfis || {}).filter(([, p]) => vivo(p)).map(([id, p]) => ({ id, name: p.name, avatarUrl: p.avatarUrl }))
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

  // ---------------- Google Drive (planilhas) ----------------
  function b64(bytes) { let s = ''; const u = new Uint8Array(bytes); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s) }
  function bytesDe(c) {
    if (c && c.$file) return c.$file.data;
    const bin = atob(String(c || '')); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u;
  }
  const arquivo = f => ({ id: f.id, title: f.name, createdTime: f.createdTime, viewUrl: f.webViewLink, mimeType: f.mimeType });
  const ferramentas = {
    async search_files({ query, pageSize }) {
      const q = String(query || '').replace(/\btitle\s*=/g, 'name =').replace(/\bowner\s*=\s*'me'/g, "'me' in owners").replace(/\bparentId\s*=\s*'([^']+)'/g, "'$1' in parents") + ' and trashed = false';
      const r = await gj(`${API}/files?q=${enc(q)}&fields=files(id,name,createdTime,webViewLink,mimeType)&pageSize=${pageSize || 40}&includeItemsFromAllDrives=true${ALL}`);
      return { files: (r.files || []).map(arquivo) };
    },
    async create_file({ title, parentId, contentMimeType, base64Content }) {
      const m = { name: title }; if (parentId) m.parents = [parentId];
      if (contentMimeType === FOLDER) return arquivo(await gj(`${API}/files?fields=id,name,webViewLink,createdTime${ALL}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...m, mimeType: FOLDER }) }));
      m.mimeType = contentMimeType === XLSX_MIME ? SHEET : contentMimeType;
      return arquivo(await upload(m, new Blob([bytesDe(base64Content)], { type: contentMimeType }), contentMimeType));
    },
    async download_file_content({ fileId, exportMimeType }) {
      const r = await g(exportMimeType ? `${API}/files/${fileId}/export?mimeType=${enc(exportMimeType)}` : `${API}/files/${fileId}?alt=media${ALL}`);
      return { content: b64(await r.arrayBuffer()) };
    }
  };
  const mcp = {
    listTools: async () => ({ fileArgs: true }),
    callTool: async (server, tool, input) => {
      if (!ferramentas[tool]) { const e = new Error('ferramenta indisponível'); e.code = 'tool_error'; throw e }
      return { payload: await ferramentas[tool](input || {}) };
    }
  };
  const permissions = {
    state: async () => token ? 'granted' : 'denied',
    request: async () => ({}), manage: async () => {}
  };

  // ---------------- sair ----------------
  function sair(trocar) {
    try { if (token) google.accounts.oauth2.revoke(token, () => {}) } catch (e) {}
    if (trocar) gravar('dv-gh-hint', '');
    token = null; location.reload();
  }
  // ---------------- e-mails com acesso (pasta da base compartilhada no Drive) ----------------
  function pastaBase() { if (!arq || !arq.pasta) throw new Error('A pasta da base de dados não foi encontrada no Drive.'); return arq.pasta }
  const equipe = {
    async listar() {
      const r = await gj(`${API}/files/${pastaBase()}/permissions?fields=permissions(id,emailAddress,role,type,displayName)${ALL}`);
      return (r.permissions || []).filter(p => p.type === 'user' && p.emailAddress)
        .map(p => ({ id: p.id, email: p.emailAddress.toLowerCase(), nome: p.displayName || '', dono: p.role === 'owner', papelDrive: p.role }));
    },
    async liberar(email) {
      const msg = `Você recebeu acesso ao sistema DRAVEN | Plataforma Comercial. Entre em ${location.origin + location.pathname} com esta conta Google.`;
      await gj(`${API}/files/${pastaBase()}/permissions?sendNotificationEmail=true&emailMessage=${enc(msg)}&fields=id${ALL}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'user', role: 'writer', emailAddress: email }) });
    },
    async remover(email) {
      const p = (await equipe.listar()).find(x => x.email === email);
      if (!p) return;
      if (p.dono) throw new Error('O dono da pasta não pode ser removido.');
      await g(`${API}/files/${pastaBase()}/permissions/${p.id}?supportsAllDrives=true`, { method: 'DELETE' });
    }
  };
  window.DRAVEN_GH = { sair: () => sair(true), sincronizar, equipe };

  // o sistema pede as peças por aqui, como no claude.ai
  const PECAS = { db, user, downloads, mcp, permissions, sample: null };
  window.claude = Object.freeze({ use: async n => { await pronto; return PECAS[n] || null } });

  // ---------------- início ----------------
  async function iniciar() {
    if (!CFG.googleClientId || /COLE/i.test(CFG.googleClientId)) return telaConfig();
    telaCarregando('Carregando o login do Google…');
    try { await esperarGIS() } catch (e) { return telaEntrar(e.message) }
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CFG.googleClientId, scope: SCOPE,
      callback: r => {
        const c = cbTok; cbTok = null; if (!c) return;
        if (r.error) return c.ko(new Error(r.error_description || r.error));
        if (!google.accounts.oauth2.hasGrantedAllScopes(r, SCOPE)) return c.ko(new Error('é preciso permitir o acesso ao Google Drive na janela do Google'));
        token = r.access_token; tokenExp = Date.now() + (Number(r.expires_in || 3600) - 60) * 1000; c.ok();
      },
      error_callback: e => { const c = cbTok; cbTok = null; if (c) c.ko(e) }
    });
    telaEntrar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
