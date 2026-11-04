"""Gera o index.html do GitHub Pages a partir da versão do claude.ai.

Uso (na raiz do repositório):  python3 ferramentas/montar.py
Lê versao-claude-ai/sistema-draven.html, troca o que só existe no claude.ai e grava index.html.
"""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
app = (RAIZ / 'versao-claude-ai' / 'sistema-draven.html').read_text(encoding='utf-8')

TROCAS = [
    # sair / trocar de conta: no GitHub é a conta Google
    ("case'sair':case'trocar-usuario':try{await window.DRAVEN.api('/api/auth/logout',{method:'POST',body:{}})}catch(err){}location.href='/login.html?'+(a==='sair'?'saiu=1':'trocar=1');break;",
     "case'sair':case'trocar-usuario':window.DRAVEN_GH.sair();break;", 1),
    ("'Entre na sua conta para usar o sistema','Abra este link conectado à sua conta do claude.ai. Se já estiver conectado, recarregue a página.'",
     "'Entre na sua conta para usar o sistema','Recarregue a página e entre com a sua conta Google.'", 1),
    ("Você não tem permissão para gravar. Peça nível Contribuidor ou Editor nesta página.",
     "Você não tem permissão para gravar. Peça para a gestão compartilhar a pasta do Google Drive com você como Editor.", 1),
    ("Em claude.ai > Configurações > Conectores, desconecte e conecte o Google Drive de novo, permitindo criar arquivos.",
     "Confira se a pasta DRAVEN | Plataforma Comercial está compartilhada com você como Editor.", 1),
    ("Reconecte o Google Drive em claude.ai > Configurações > Conectores.",
     "Clique em Continuar, na faixa amarela do canto da tela, para entrar de novo com o Google.", 1),
    ("Esta tela não tem acesso ao Google Drive. Abra a página pelo claude.ai.",
     "Entre com a sua conta Google para usar o Drive.", 2),
    ("A lista aparece depois que o Google Drive for liberado para esta página.",
     "Clique em Atualizar lista.", 1),
    # ---- Equipe: e-mails com acesso (compartilha a pasta da base no Drive) ----
    ('<p class="sub">Funcionários, logins e o que cada perfil pode fazer</p></div></div>',
     """<p class="sub">Funcionários, logins e o que cada perfil pode fazer</p></div>${adm&&papel()==='gestao'?'<div class="tools"><button class="btn pri" data-a="lib-email"><i class="fa-solid fa-envelope-circle-check"></i> Adicionar e-mail</button></div>':''}</div>""", 1),
    ('<section class="panel"><div class="panel-h"><h2>Membros</h2>', '${painelEmails()}${window.DRAVEN_WAB?DRAVEN_WAB.painel():\'\'}<section class="panel"><div class="panel-h"><h2>Membros</h2>', 1),
    ('Ninguém aguardando. Compartilhe o link desta página com a pessoa (botão Compartilhar do claude.ai, com permissão de Contribuidor ou Editor). Assim que ela abrir, aparece aqui para você escolher o perfil.',
     'Ninguém aguardando. Para dar acesso a alguém, clique em Adicionar e-mail.', 1),
    ("case'nova-senha':trocarSenha(id);break;", "case'nova-senha':trocarSenha(id);break;case'lib-email':formLiberarEmail();break;case'lib-remover':removerEmail(id);break;", 1),
    ("function vEquipe(){", """let LIB_EM=0;
function carregarLiberados(forcar){
  if(!window.DRAVEN_GH||!DRAVEN_GH.equipe||papel()!=='gestao'||(!forcar&&Date.now()-LIB_EM<30000))return;LIB_EM=Date.now();
  DRAVEN_GH.equipe.listar().then(l=>{S.liberados=l;S.liberadosErro='';if(S.view==='equipe')render()})
    .catch(e=>{S.liberados=S.liberados||[];S.liberadosErro='Não foi possível ler quem tem acesso à pasta do Drive: '+(e.message||'erro');if(S.view==='equipe')render()});
}
function painelEmails(){
  if(papel()!=='gestao'||!window.DRAVEN_GH||!DRAVEN_GH.equipe)return'';
  carregarLiberados();const l=S.liberados,adm=!S.ro;
  return`<section class="panel"><div class="panel-h"><h2>E-mails com acesso</h2>${adm?'<button class="btn sm" data-a="lib-email"><i class="fa-solid fa-plus"></i> Adicionar e-mail</button>':''}</div>
   <p class="ro" style="margin:0">Quem está nesta lista entra no sistema com a própria conta Google. Ao adicionar, o sistema compartilha a pasta de dados do Google Drive com o e-mail e já define o perfil.</p>
   ${S.liberadosErro?`<div class="notice warn">${esc(S.liberadosErro)}</div>`:''}
   ${!l?'<p class="ro">Carregando…</p>':l.length?`<div class="list">${l.map(p=>{const eq=S.equipe[p.email];return`<div class="li"><div class="grow"><div class="t">${esc(p.nome||p.email)}</div><div class="d">${esc(p.email)} · ${p.dono?'Dono da pasta · sempre Gestão':(eq?esc(PAPEIS[eq.papel]||'Sem perfil'):'Perfil ainda não definido')}</div></div>${p.dono?'<span class="pill acc">Dono</span>':(adm?`<button class="btn sm danger" data-a="lib-remover" data-id="${esc(p.email)}">Remover</button>`:'')}</div>`}).join('')}</div>`:'<p class="ro">Nenhum e-mail com acesso ainda.</p>'}
  </section>`;
}
function formLiberarEmail(){
  abrir('Adicionar e-mail com acesso',`
  <p class="sub" style="margin:0">A pessoa recebe um aviso do Google Drive e entra no sistema com essa conta Google.</p>
  <div class="fg">
   <label class="f full">E-mail da conta Google *<input class="inp" id="le-email" name="email" type="email" required autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="nome@gmail.com"></label>
   <label class="f">Perfil de acesso *<select class="inp" id="le-papel" name="papel">${Object.entries(PAPEIS).map(([k,v])=>`<option value="${k}" ${k==='vendedor'?'selected':''}>${v}</option>`).join('')}</select></label>
   <label class="f">Cargo / função<input class="inp" id="le-cargo" name="cargo" placeholder="Vendedor externo, Expedição…"></label>
   <label class="f full">Telefone / WhatsApp<input class="inp" id="le-tel" name="telefone" inputmode="tel"></label>
  </div>
  <p class="ro" style="margin:0">Enquanto o login do Google estiver em modo de teste, este e-mail também precisa estar em Usuários de teste no Google Cloud.</p>
  <p class="err" id="v-err" hidden></p>`,
  async fd=>{
    const email=String(fd.get('email')||'').trim().toLowerCase();
    if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)){erro('#v-err','Digite um e-mail válido.');return false}
    try{
      await DRAVEN_GH.equipe.liberar(email);
      await S.db.doc('equipe/'+email).set({...(S.equipe[email]||{}),papel:fd.get('papel'),cargo:fd.get('cargo')||'',telefone:fd.get('telefone')||'',em:S.equipe[email]?.em||Date.now()});
      carregarLiberados(true);setTimeout(()=>mostrarLinkAcesso(email,fd.get('telefone')),50);return true;
    }catch(e){erro('#v-err',e.message||'Não foi possível liberar o acesso.');return false}
  },{submitLabel:'Liberar acesso'});
}
function mostrarLinkAcesso(email,tel){
  const link=location.origin+location.pathname;
  const txt=`Olá! Seu acesso ao sistema da Draven Sports está liberado.\\nEndereço: ${link}\\nEntre com a conta Google ${email}.`;
  abrir('Acesso liberado',`<p class="sub" style="margin:0">O Google Drive já mandou um aviso para ${esc(email)}. Se quiser, envie também o endereço do sistema:</p>
  <div class="mini"><div><small>Endereço</small><b class="sm">${esc(link)}</b></div><div><small>Conta Google</small><b class="sm">${esc(email)}</b></div></div>
  <div class="tools"><button type="button" class="btn" data-a="copiar" data-txt="${esc(txt)}"><i class="fa-regular fa-copy"></i> Copiar mensagem</button>${waBtn(tel,txt,'Enviar no WhatsApp')}</div>`,null,{});
}
async function removerEmail(email){
  if(!await confirmar(`Remover o acesso de ${email}? A pasta de dados deixa de ser compartilhada com esse e-mail e a pessoa não consegue mais abrir o sistema. O que ela registrou continua.`,'Remover'))return;
  try{await DRAVEN_GH.equipe.remover(email);try{await S.db.doc('equipe/'+email).delete()}catch(e){}carregarLiberados(true);toast('Acesso removido')}
  catch(e){toast(e.message||'Não foi possível remover o acesso.')}
}
function vEquipe(){""", 1),
    # linha do tempo: envios de WhatsApp aparecem como tal
    ("(c.historico||[]).forEach(h=>ev.push({em:h.em,t:'Anotação',d:h.txt,por:h.por}));",
     "(c.historico||[]).forEach(h=>ev.push({em:h.em,t:h.tipo==='whatsapp'?'WhatsApp enviado':'Anotação',d:h.txt,por:h.por}));", 1),
    # ---- WhatsApp Web ao lado do sistema ----
    # no computador as conversas abrem no WhatsApp Web; no celular, no aplicativo
    ("return`https://wa.me/${d}${msg?'?text='+encodeURIComponent(msg):''}`}",
     "return window.DRAVEN_WA&&DRAVEN_WA.computador()?`https://web.whatsapp.com/send?phone=${d}${msg?'&text='+encodeURIComponent(msg):''}`:`https://wa.me/${d}${msg?'?text='+encodeURIComponent(msg):''}`}", 1),
    # ---- botão de WhatsApp em cada cliente do CRM ----
    ("""function waBtn(tel,msg,label){const u=waLink(tel,msg);return u?`<a class="btn sm wa" href="${esc(u)}" target="_blank" rel="noopener">${label||'WhatsApp'}</a>`:''}""",
     """function waBtn(tel,msg,label){const u=waLink(tel,msg);return u?`<a class="btn sm wa" href="${esc(u)}" target="_blank" rel="noopener">${label||'WhatsApp'}</a>`:''}
function waSaudacao(c){const n=String(c.contato||'').trim().split(' ')[0];return`Olá${n?' '+n:''}, tudo bem? Aqui é da Draven Sports.`}
function telLink(tel){let d=String(tel||'').replace(/\\D/g,'');if(!d)return'';if(d.length<=11)d='55'+d;return'tel:+'+d}
function ligarBtn(c,label){const u=telLink(c.telefone);return u?`<a class="btn sm ligar wa-cli" href="${esc(u)}" aria-label="Ligar para ${esc(c.nome)}" title="Ligar: ${esc(c.telefone)}"><i class="fa-solid fa-phone"></i> ${label||'Ligar'}</a>`:''}
function waCli(c,label){if(c.semWhats)return ligarBtn(c,label&&'Ligar para o cliente');const u=waLink(c.telefone,waSaudacao(c));return u?`<a class="btn sm wa wa-cli" data-wacli="${esc(c.id)}" href="${esc(u)}" target="_blank" rel="noopener" aria-label="WhatsApp de ${esc(c.nome)}" title="Conversar no WhatsApp: ${esc(c.telefone)}"><i class="fa-brands fa-whatsapp"></i> ${label||'WhatsApp'}</a>`:''}""", 1),
    # funil: botão no card
    ('''<div class="row"><span class="ro">${c.valorEstimado?money(c.valorEstimado):''}</span>${pode('crm')?`<select aria-label="Mover etapa"''',
     '''<div class="row"><span class="ro">${c.valorEstimado?money(c.valorEstimado):''}</span>${waCli(c)}${pode('crm')?`<select aria-label="Mover etapa"''', 1),
    # funil em lista: coluna WhatsApp
    ('<th>Responsável</th></tr></thead>', '<th>Responsável</th><th>WhatsApp / Ligar</th></tr></thead>', 1),
    ('<td>${esc(pessoa(c.responsavel))}</td></tr>', """<td>${esc(pessoa(c.responsavel))}</td><td>${waCli(c)||'<span class="ro">Sem telefone</span>'}</td></tr>""", 1),
    ('<tr><td colspan="7" class="ro">Nenhum contato encontrado com esse filtro.</td></tr>', '<tr><td colspan="8" class="ro">Nenhum contato encontrado com esse filtro.</td></tr>', 1),
    # Clientes 360°: coluna WhatsApp
    ('<th>Consentimento</th></tr>', '<th>Consentimento</th><th>WhatsApp / Ligar</th></tr>', 1),
    ("""'<span class="ro">Sem registro</span>':''}</td></tr>""", """'<span class="ro">Sem registro</span>':''}</td><td>${waCli(c)||'<span class="ro">Sem telefone</span>'}</td></tr>""", 1),
    ('<tr><td colspan="8" class="ro">Nenhum cliente neste filtro.</td></tr>', '<tr><td colspan="9" class="ro">Nenhum cliente neste filtro.</td></tr>', 1),
    # ficha do cliente: já abre com a saudação
    ("(c.id?waBtn(c.telefone,'','Abrir WhatsApp'):'')", "(c.id?waCli(c,'Abrir WhatsApp'):'')", 1),
    # ficha: marcar quem não tem WhatsApp (mostra o botão Ligar)
    ('<label class="chk"><input type="checkbox" id="c-cw" name="consentWhats"',
     '<label class="chk"><input type="checkbox" id="c-sw" name="semWhats" ${c.semWhats?\'checked\':\'\'} ${d}> Este número não tem WhatsApp (mostrar o botão Ligar)</label>\n   <label class="chk"><input type="checkbox" id="c-cw" name="consentWhats"', 1),
    ("consentWhats:cw,consentEmail:ce,atualizadoEm:Date.now()};", "consentWhats:cw,consentEmail:ce,semWhats:!!fd.get('semWhats'),atualizadoEm:Date.now()};", 1),
    # botão WhatsApp no topo
    ('<div class="hact"><button class="btn" id="topLead"',
     '<div class="hact"><button class="btn wa" type="button" data-whatsapp-web title="Abrir o WhatsApp Web ao lado do sistema"><i class="fa-brands fa-whatsapp"></i><span class="lbl">WhatsApp</span></button><button class="btn" id="topLead"', 1),
]

# Abre o WhatsApp Web numa janela ao lado e manda para ela as conversas abertas pelo sistema.
# O WhatsApp Web não pode ficar dentro da página: ele bloqueia ser aberto dentro de outro site.
WHATSAPP = r"""<style>.btn.ligar{color:#1E3A8A;border-color:#BFDBFE;text-decoration:none}.btn.ligar:hover{border-color:#1E3A8A}.btn.wa{text-decoration:none}</style>
<script>
window.DRAVEN_WA=(function(){
  const NOME='draven-whatsapp';
  const computador=()=>!/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)&&!(navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent));
  let jan=null;
  function abrir(url){
    if(!computador()){location.href=url&&!/web\.whatsapp\.com/.test(url)?url:'https://wa.me/';return}
    const w=Math.max(480,Math.round(screen.availWidth*0.42)),h=screen.availHeight;
    const pos=`width=${w},height=${h},left=${screen.availWidth-w},top=0`;
    if(jan&&!jan.closed){if(url)jan.location.href=url;jan.focus();return}
    jan=window.open(url||'https://web.whatsapp.com/',NOME,pos);
    if(!jan){window.open(url||'https://web.whatsapp.com/','_blank')}
  }
  const noBotao=e=>e.target.closest&&e.target.closest('.wa-cli');
  ['pointerdown','mousedown','touchstart'].forEach(t=>document.addEventListener(t,e=>{if(noBotao(e))e.stopPropagation()},{capture:true,passive:true}));
  document.addEventListener('click',e=>{
    if(noBotao(e))e.stopPropagation();
    const b=e.target.closest&&e.target.closest('[data-whatsapp-web]');
    if(b){e.preventDefault();abrir();return}
    const cl=e.target.closest&&e.target.closest('a[data-wacli]');
    if(cl&&window.DRAVEN_WAB&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();e.stopPropagation();DRAVEN_WAB.escolher(cl.dataset.wacli);return}
    const a=e.target.closest&&e.target.closest('a[href^="https://web.whatsapp.com/"]');
    if(a&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();abrir(a.href)}
  },true);
  return{computador,abrir};
})();
</script>
"""
for velho, novo, vezes in TROCAS:
    n = app.count(velho)
    if n != vezes:
        raise SystemExit(f'Trecho esperado {vezes}x e achado {n}x: {velho[:70]}…')
    app = app.replace(velho, novo)

CABECA = """<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#09090B">
<meta name="description" content="CRM, vendas, produção e estoque da Draven Sports">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="favicon.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="DRAVEN">
<!-- Gerado por ferramentas/montar.py a partir de versao-claude-ai/sistema-draven.html. Não edite à mão. -->
<script src="config.js"></script>
<script src="https://accounts.google.com/gsi/client" async defer></script>
<script src="drive-db.js"></script>
</head>
<body>
"""
CELULAR = (RAIZ / 'ferramentas' / 'celular.html').read_text(encoding='utf-8')
WAB = (RAIZ / 'ferramentas' / 'whatsapp-business.html').read_text(encoding='utf-8')
(RAIZ / 'index.html').write_text(CABECA + WHATSAPP + app.strip() + '\n' + WAB + CELULAR + '</body>\n</html>\n', encoding='utf-8')
print('index.html gerado')
