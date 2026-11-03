/**
 * DRAVEN | Plataforma Comercial — servidor no Google Apps Script.
 *
 * Roda na conta Google da gestão e guarda tudo no Google Drive dela:
 *   - dados do sistema: arquivo "draven-dados.json" na pasta "DRAVEN | Plataforma Comercial";
 *   - contas (usuário e senha de cada funcionário): Propriedades do script, nunca enviadas ao site;
 *   - planilhas exportadas: mesma pasta.
 * A equipe entra no site com usuário e senha criados pela gestão. Ninguém da equipe precisa de conta Google.
 *
 * Instalação: veja o README do repositório (seção "Colocar no ar").
 */

// >>> Troque por uma frase só sua antes de publicar. Ela é pedida uma única vez, para criar a conta da gestão.
const CODIGO_INSTALACAO = 'TROQUE-ESTE-CODIGO';

const PASTA = 'DRAVEN | Plataforma Comercial';
const NOME_ARQ = 'draven-dados.json';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const SHEET = 'application/vnd.google-apps.spreadsheet';
const SESSAO_DIAS = 30;
const TOMBA_DIAS = 60;
const PROPS = PropertiesService.getScriptProperties();

// ---------------- entrada ----------------
function doGet() {
  return saida({ ok: true, servico: 'DRAVEN Plataforma Comercial', configurado: !!PROPS.getProperty('dono') });
}
function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents || '{}') } catch (x) { return saida({ erro: 'pedido inválido' }) }
  try {
    const f = ACOES[req.acao];
    if (!f) throw falha('ação desconhecida');
    return saida({ ok: true, ...(f(req) || {}) });
  } catch (x) {
    return saida({ erro: x && x.publico ? x.message : 'erro no servidor: ' + (x && x.message || x), codigo: x && x.codigo || '' });
  }
}
function saida(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON) }
function falha(msg, codigo) { const e = new Error(msg); e.publico = true; e.codigo = codigo || ''; return e }

// ---------------- contas e sessões ----------------
const chaveConta = id => 'conta:' + id;
const chaveLogin = login => 'login:' + normal(login);
const normal = s => String(s || '').trim().toLowerCase();
function lerJSON(k) { const v = PROPS.getProperty(k); return v ? JSON.parse(v) : null }
function gravarJSON(k, o) { o == null ? PROPS.deleteProperty(k) : PROPS.setProperty(k, JSON.stringify(o)) }
function hash(senha, sal) {
  let h = sal + '|' + senha;
  for (let i = 0; i < 300; i++) h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h, Utilities.Charset.UTF_8));
  return h;
}
function novoId(p) { return (p || '') + Utilities.getUuid().replace(/-/g, '').slice(0, 16) }
function senhaAleatoria() {
  const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = ''; const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid());
  for (let i = 0; i < 10; i++) s += c[(b[i] + 256) % c.length];
  return s;
}
function validarSenha(s) { if (String(s || '').length < 8) throw falha('A senha precisa ter pelo menos 8 caracteres.') }
function criarContaInterna(d, dono) {
  const login = normal(d.email || d.login);
  if (!login || login.length < 3) throw falha('Informe um usuário (login) com pelo menos 3 letras.');
  if (/\s/.test(login)) throw falha('O usuário (login) não pode ter espaços.');
  if (PROPS.getProperty(chaveLogin(login))) throw falha('Já existe uma conta com o usuário ' + login + '.');
  const senha = d.password ? String(d.password) : senhaAleatoria(); validarSenha(senha);
  const id = novoId('u'), sal = novoId();
  const c = { id, login, name: String(d.name || login).slice(0, 80), sal, hash: hash(senha, sal), gen: 1, dono: !!dono, criadoEm: Date.now() };
  gravarJSON(chaveConta(id), c); PROPS.setProperty(chaveLogin(login), id);
  return { conta: c, senha };
}
function novaSessao(c) {
  const t = novoId('s') + novoId();
  gravarJSON('sessao:' + t, { id: c.id, gen: c.gen, exp: Date.now() + SESSAO_DIAS * 864e5 });
  limparSessoes();
  return t;
}
function limparSessoes() {
  const agora = Date.now(), todas = PROPS.getProperties();
  for (const k in todas) if (k.indexOf('sessao:') === 0) { try { if (JSON.parse(todas[k]).exp < agora) PROPS.deleteProperty(k) } catch (e) { PROPS.deleteProperty(k) } }
}
// devolve {conta, papel} de quem fez o pedido, ou lança erro
function quem(req) {
  const s = req.token && lerJSON('sessao:' + req.token);
  if (!s || s.exp < Date.now()) throw falha('Sua sessão terminou. Entre de novo.', 'sessao');
  const c = lerJSON(chaveConta(s.id));
  if (!c || c.gen !== s.gen || c.inativo) { gravarJSON('sessao:' + req.token, null); throw falha('Sua sessão terminou. Entre de novo.', 'sessao') }
  return { conta: c, papel: c.dono ? 'gestao' : papelDe(c.id) };
}
function papelDe(id) {
  const cc = CacheService.getScriptCache(), v = cc.get('papel:' + id);
  if (v !== null) return v || null;
  const d = carregarDados(), e = (d.cols.equipe || {})[id], p = e && !e._del ? e.papel || '' : '';
  cc.put('papel:' + id, p, 120);
  return p || null;
}
function listaPerfis() {
  const perfis = {}, todas = PROPS.getProperties();
  for (const k in todas) if (k.indexOf('conta:') === 0) { const c = JSON.parse(todas[k]); perfis[c.id] = { name: c.name, login: c.login } }
  return perfis;
}
const ehGestao = q => q.papel === 'gestao';
function exigirGestao(q) { if (!ehGestao(q)) throw falha('Só a gestão pode fazer isso.') }
const publicoDe = c => ({ id: c.id, name: c.name, email: c.login, login: c.login, dono: !!c.dono, avatarUrl: '' });

// ---------------- dados ----------------
let CACHE_DADOS = null;
function arquivoDados() {
  let id = PROPS.getProperty('arquivo');
  if (id) { try { const f = DriveApp.getFileById(id); if (!f.isTrashed()) return f } catch (e) {} }
  const p = pasta();
  const it = p.getFilesByName(NOME_ARQ);
  const f = it.hasNext() ? it.next() : p.createFile(NOME_ARQ, JSON.stringify({ v: 2, seq: 0, podadoAte: 0, cols: {} }), 'application/json');
  f.setDescription('Banco de dados da DRAVEN Plataforma Comercial. Não apague nem edite à mão.');
  PROPS.setProperty('arquivo', f.getId());
  return f;
}
function pasta() {
  let id = PROPS.getProperty('pasta');
  if (id) { try { const p = DriveApp.getFolderById(id); if (!p.isTrashed()) return p } catch (e) {} }
  const it = DriveApp.getFoldersByName(PASTA);
  const p = it.hasNext() ? it.next() : DriveApp.createFolder(PASTA);
  PROPS.setProperty('pasta', p.getId());
  return p;
}
function carregarDados() {
  if (CACHE_DADOS) return CACHE_DADOS;
  let d = null;
  try { d = JSON.parse(arquivoDados().getBlob().getDataAsString('UTF-8')) } catch (e) {}
  if (!d || !d.cols) d = { v: 2, seq: 0, podadoAte: 0, cols: {} };
  if (!d.seq) d.seq = 0;
  CACHE_DADOS = d; return d;
}
function salvarDados(d) {
  arquivoDados().setContent(JSON.stringify(d));
  CacheService.getScriptCache().put('seq', String(d.seq), 21600);
}
const vivo = x => !!x && !x._del;
const limpo = x => { const o = {}; for (const k in x) if (k !== '_s' && k !== '_del') o[k] = x[k]; return o };
function colsParaEnvio(d) {
  const o = {};
  for (const n in d.cols) { o[n] = {}; for (const id in d.cols[n]) { const x = d.cols[n][id]; if (vivo(x)) o[n][id] = limpo(x) } }
  return o;
}
// quem pode gravar o quê. As telas já escondem o que cada perfil não usa; aqui fica a trava final.
function podeGravar(q, col, id, antes, depois) {
  if (col.charAt(0) === '_') return false;
  if (ehGestao(q)) return true;
  if (col === 'acessos' || col === 'usuarios') return id === q.conta.id;
  if (!q.papel) return false;
  if (col === 'equipe' || col === 'config') return false;
  if (depois === null) return col === 'tarefas' && !!antes && antes.criadoPor === q.conta.id;
  return true;
}

// ---------------- Drive (planilhas) ----------------
function dentroDaPasta(fileId) {
  const f = DriveApp.getFileById(fileId), ps = f.getParents(), alvo = pasta().getId();
  while (ps.hasNext()) if (ps.next().getId() === alvo) return f;
  throw falha('Este arquivo não está na pasta da DRAVEN.');
}
const infoArq = f => ({ id: f.getId(), title: f.getName(), createdTime: f.getDateCreated().toISOString(), viewUrl: f.getUrl(), mimeType: f.getMimeType() });

// ---------------- ações ----------------
const ACOES = {
  estado() { return { configurado: !!PROPS.getProperty('dono') } },

  instalar(r) {
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      if (PROPS.getProperty('dono')) throw falha('O sistema já foi instalado. Entre com o usuário da gestão.');
      if (CODIGO_INSTALACAO === 'TROQUE-ESTE-CODIGO') throw falha('Antes de instalar, troque o CODIGO_INSTALACAO no Apps Script e publique de novo.');
      if (String(r.codigo || '') !== CODIGO_INSTALACAO) throw falha('Código de instalação errado.');
      const { conta } = criarContaInterna({ name: r.nome, login: r.login, password: r.senha }, true);
      PROPS.setProperty('dono', conta.id);
      arquivoDados(); // cria pasta e arquivo no Drive
      return { token: novaSessao(conta) };
    } finally { lock.releaseLock() }
  },

  entrar(r) {
    const id = PROPS.getProperty(chaveLogin(r.login));
    const c = id && lerJSON(chaveConta(id));
    Utilities.sleep(300);
    if (!c || c.inativo || hash(String(r.senha || ''), c.sal) !== c.hash) throw falha('Usuário ou senha incorretos.');
    return { token: novaSessao(c) };
  },

  sair(r) { if (r.token) gravarJSON('sessao:' + r.token, null); return {} },

  carregar(r) {
    const q = quem(r), d = carregarDados();
    return { eu: { ...publicoDe(q.conta), papel: q.papel }, seq: d.seq, cols: q.papel ? colsParaEnvio(d) : { equipe: {}, acessos: {} }, perfis: listaPerfis() };
  },

  perfis(r) { quem(r); return { perfis: listaPerfis() } },

  mudancas(r) {
    const q = quem(r);
    const desde = Number(r.desde) || 0;
    const s = CacheService.getScriptCache().get('seq');
    if (s !== null && Number(s) === desde) return { seq: desde, docs: [], papel: q.papel };
    const d = carregarDados();
    if (!q.papel) return { seq: d.seq, docs: [], papel: null };
    if (desde < (d.podadoAte || 0)) return { seq: d.seq, completo: colsParaEnvio(d), papel: q.papel };
    const docs = [];
    for (const n in d.cols) for (const id in d.cols[n]) { const x = d.cols[n][id]; if ((x._s || 0) > desde) docs.push([n, id, vivo(x) ? limpo(x) : null]) }
    return { seq: d.seq, docs, papel: q.papel };
  },

  gravar(r) {
    const q = quem(r);
    const lock = LockService.getScriptLock(); lock.waitLock(25000);
    try {
      CACHE_DADOS = null;
      const d = carregarDados(), rejeitados = [];
      for (const [n, id, doc] of (r.ops || [])) {
        if (!n || !id || String(n).length > 40 || String(id).length > 120) continue;
        const c = d.cols[n] || (d.cols[n] = {});
        const antes = vivo(c[id]) ? limpo(c[id]) : null;
        if (!podeGravar(q, n, id, antes, doc)) { rejeitados.push([n, id, antes]); continue }
        d.seq++;
        c[id] = doc === null ? { _del: true, _s: d.seq } : { ...doc, _s: d.seq };
        if (n === 'equipe') CacheService.getScriptCache().remove('papel:' + id);
      }
      // tira de vez o que foi excluído há muito tempo
      const lim = d.seq - 50000;
      if (lim > (d.podadoAte || 0)) {
        for (const n in d.cols) for (const id in d.cols[n]) { const x = d.cols[n][id]; if (x._del && x._s < lim) delete d.cols[n][id] }
        d.podadoAte = lim;
      }
      salvarDados(d);
      return { seq: d.seq, rejeitados };
    } finally { lock.releaseLock() }
  },

  // ----- contas (gestão) -----
  contas(r) {
    exigirGestao(quem(r));
    const l = [], todas = PROPS.getProperties();
    for (const k in todas) if (k.indexOf('conta:') === 0) { const c = JSON.parse(todas[k]); if (!c.inativo) l.push(publicoDe(c)) }
    return { lista: l };
  },
  criarConta(r) {
    const q = quem(r); exigirGestao(q);
    const lock = LockService.getScriptLock(); lock.waitLock(25000);
    try {
      const { conta, senha } = criarContaInterna(r.dados || {}, false);
      CACHE_DADOS = null;
      const d = carregarDados(), p = r.dados && r.dados.papel;
      if (['gestao', 'vendedor', 'estoque'].indexOf(p) >= 0) {
        d.seq++;
        (d.cols.equipe || (d.cols.equipe = {}))[conta.id] = { papel: p, cargo: r.dados.cargo || '', telefone: r.dados.telefone || '', em: Date.now(), _s: d.seq };
        salvarDados(d);
      }
      return { id: conta.id, email: conta.login, senha };
    } finally { lock.releaseLock() }
  },
  novaSenha(r) {
    exigirGestao(quem(r));
    const c = lerJSON(chaveConta(r.id)); if (!c) throw falha('Conta não encontrada.');
    if (c.dono && r.id !== quem(r).conta.id) throw falha('A senha do dono só pode ser trocada por ele mesmo.');
    const senha = senhaAleatoria(); c.sal = novoId(); c.hash = hash(senha, c.sal); c.gen++;
    gravarJSON(chaveConta(c.id), c);
    return { email: c.login, senha };
  },
  desativarConta(r) {
    const q = quem(r); exigirGestao(q);
    const c = lerJSON(chaveConta(r.id)); if (!c) throw falha('Conta não encontrada.');
    if (c.dono) throw falha('A conta do dono não pode ser desativada.');
    c.inativo = true; c.gen++; gravarJSON(chaveConta(c.id), c); PROPS.deleteProperty(chaveLogin(c.login));
    return {};
  },
  meuNome(r) {
    const q = quem(r); const n = String(r.name || '').trim().slice(0, 80); if (!n) throw falha('Informe o nome.');
    q.conta.name = n; gravarJSON(chaveConta(q.conta.id), q.conta); return {};
  },
  minhaSenha(r) {
    const q = quem(r), c = q.conta;
    if (hash(String(r.atual || ''), c.sal) !== c.hash) throw falha('A senha atual não confere.');
    validarSenha(r.nova);
    c.sal = novoId(); c.hash = hash(String(r.nova), c.sal); c.gen++;
    gravarJSON(chaveConta(c.id), c);
    return { token: novaSessao(c) };
  },

  // ----- planilhas no Drive (gestão) -----
  drivePasta(r) { exigirGestao(quem(r)); return { id: pasta().getId() } },
  driveListar(r) {
    exigirGestao(quem(r));
    const l = [], it = pasta().getFiles();
    while (it.hasNext()) { const f = it.next(); const m = f.getMimeType(); if (m === XLSX || m === SHEET) l.push(infoArq(f)) }
    return { files: l };
  },
  driveCriar(r) {
    exigirGestao(quem(r));
    const blob = Utilities.newBlob(Utilities.base64Decode(r.base64), r.mime || XLSX, String(r.title || 'planilha') + '.xlsx');
    return infoArq(pasta().createFile(blob));
  },
  driveBaixar(r) {
    exigirGestao(quem(r));
    const f = dentroDaPasta(r.fileId);
    let bytes;
    if (f.getMimeType() === SHEET) {
      bytes = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + f.getId() + '/export?mimeType=' + encodeURIComponent(XLSX),
        { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getContent();
    } else bytes = f.getBlob().getBytes();
    return { content: Utilities.base64Encode(bytes) };
  }
};

// Rode esta função uma vez no editor (botão Executar) para o Google pedir as autorizações do Drive.
function autorizar() { pasta(); UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/about?fields=user', { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true }); Logger.log('Autorizado. Pasta: ' + pasta().getUrl()) }
