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
    # ficha: campo Telefone 2
    ('<label class="f">WhatsApp / telefone<input class="inp" id="c-tel" name="telefone" value="${esc(c.telefone||\'\')}" placeholder="(11) 90000-0000" ${d}></label>',
     '<label class="f">WhatsApp / telefone<input class="inp" id="c-tel" name="telefone" value="${esc(c.telefone||\'\')}" placeholder="(11) 90000-0000" ${d}></label>\n   <label class="f">Telefone 2<input class="inp" id="c-tel2" name="telefone2" value="${esc(c.telefone2||\'\')}" placeholder="opcional" ${d}></label>', 1),
    # ---- funil: etapa "Visita agendada" entre Primeiro contato e Proposta enviada ----
    ("{id:'contato',nome:'Primeiro contato'},{id:'proposta'", "{id:'contato',nome:'Primeiro contato'},{id:'visita',nome:'Visita agendada'},{id:'proposta'", 1),
    ("--st-proposta:#A855F7;", "--st-visita:#0891B2; --st-proposta:#A855F7;", 1),
    ("grid-template-columns:repeat(6,minmax(280px,1fr));gap:14px;min-width:1760px", "grid-template-columns:repeat(7,minmax(270px,1fr));gap:14px;min-width:1990px", 1),
    ("{ganho:'ok',perdido:'',negociacao:'warn',proposta:'info'}", "{ganho:'ok',perdido:'',negociacao:'warn',proposta:'info',visita:'info'}", 1),
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
function waCli(c,label,n){const t=n===2?c.telefone2:c.telefone,sem=n===2?c.semWhats2:c.semWhats;if(!t)return'';if(sem){const u=telLink(t);return u?`<a class="btn sm ligar wa-cli" href="${esc(u)}" aria-label="Ligar para ${esc(c.nome)}" title="Ligar: ${esc(t)}"><i class="fa-solid fa-phone"></i> ${label||(n===2?'Ligar 2':'Ligar')}</a>`:''}const u=waLink(t,waSaudacao(c));return u?`<a class="btn sm wa wa-cli" data-wacli="${esc(c.id)}" data-wafone="${n===2?2:1}" href="${esc(u)}" target="_blank" rel="noopener" aria-label="WhatsApp de ${esc(c.nome)}" title="Conversar no WhatsApp: ${esc(t)}"><i class="fa-brands fa-whatsapp"></i> ${label||(n===2?'WhatsApp 2':'WhatsApp')}</a>`:''}""", 1),
    # funil: botão no card
    ('''<div class="row"><span class="ro">${c.valorEstimado?money(c.valorEstimado):''}</span>${pode('crm')?`<select aria-label="Mover etapa"''',
     '''<div class="row"><span class="ro">${c.valorEstimado?money(c.valorEstimado):''}</span>${waCli(c)}${c.telefone2?waCli(c,'',2):''}${pode('crm')?`<select aria-label="Mover etapa"''', 1),
    # funil em lista: coluna WhatsApp
    ('<th>Responsável</th></tr></thead>', '<th>Responsável</th><th>WhatsApp / Ligar</th></tr></thead>', 1),
    ('<td>${esc(pessoa(c.responsavel))}</td></tr>', """<td>${esc(pessoa(c.responsavel))}</td><td>${(waCli(c)+(c.telefone2?' '+waCli(c,'',2):''))||'<span class="ro">Sem telefone</span>'}</td></tr>""", 1),
    ('<tr><td colspan="7" class="ro">Nenhum contato encontrado com esse filtro.</td></tr>', '<tr><td colspan="8" class="ro">Nenhum contato encontrado com esse filtro.</td></tr>', 1),
    # Clientes 360°: coluna WhatsApp
    ('<th>Consentimento</th></tr>', '<th>Consentimento</th><th>WhatsApp / Ligar</th></tr>', 1),
    ("""'<span class="ro">Sem registro</span>':''}</td></tr>""", """'<span class="ro">Sem registro</span>':''}</td><td>${(waCli(c)+(c.telefone2?' '+waCli(c,'',2):''))||'<span class="ro">Sem telefone</span>'}</td></tr>""", 1),
    ('<tr><td colspan="8" class="ro">Nenhum cliente neste filtro.</td></tr>', '<tr><td colspan="9" class="ro">Nenhum cliente neste filtro.</td></tr>', 1),
    # ficha do cliente: já abre com a saudação
    ("(c.id?waBtn(c.telefone,'','Abrir WhatsApp'):'')", "(c.id?waCli(c,c.semWhats?'Ligar para o cliente':'Abrir WhatsApp')+(c.telefone2?waCli(c,c.semWhats2?'Ligar (telefone 2)':'WhatsApp (telefone 2)',2):''):'')", 1),
    # ficha: marcar quem não tem WhatsApp (mostra o botão Ligar)
    ('<label class="chk"><input type="checkbox" id="c-cw" name="consentWhats"',
     '<label class="chk"><input type="checkbox" id="c-sw" name="semWhats" ${c.semWhats?\'checked\':\'\'} ${d}> Este número não tem WhatsApp (mostrar o botão Ligar)</label>\n   <label class="chk"><input type="checkbox" id="c-sw2" name="semWhats2" ${c.semWhats2?\'checked\':\'\'} ${d}> O telefone 2 não tem WhatsApp</label>\n   <label class="chk"><input type="checkbox" id="c-cw" name="consentWhats"', 1),
    ("consentWhats:cw,consentEmail:ce,atualizadoEm:Date.now()};", "consentWhats:cw,consentEmail:ce,semWhats:!!fd.get('semWhats'),telefone2:fd.get('telefone2')||'',semWhats2:!!fd.get('semWhats2'),atualizadoEm:Date.now()};", 1),
    # botão WhatsApp no topo
    ('<div class="hact"><button class="btn" id="topLead"',
     '<div class="hact"><button class="btn wa" type="button" data-whatsapp-web title="Abrir o WhatsApp Web ao lado do sistema"><i class="fa-brands fa-whatsapp"></i><span class="lbl">WhatsApp</span></button><button class="btn" id="topLead"', 1),
    # ---- visita agendada (local, endereço, dia e hora) e última ação ----
    ("""<label class="f">Cidade / UF<input class="inp" id="c-cid" name="cidade" value="${esc(c.cidade||'')}" placeholder="São Paulo/SP" ${d}></label>""",
     """<label class="f">Cidade / UF<input class="inp" id="c-cid" name="cidade" value="${esc(c.cidade||'')}" placeholder="São Paulo/SP" ${d}></label>${window.DRAVEN_VIS?DRAVEN_VIS.camposFicha(c,d):''}""", 1),
    ("semWhats2:!!fd.get('semWhats2'),atualizadoEm:Date.now()};", "semWhats2:!!fd.get('semWhats2'),...(window.DRAVEN_VIS?DRAVEN_VIS.lerFicha(fd,c):{}),atualizadoEm:Date.now()};", 1),
    ("if(nota||!c.id)dados.historico=[...(c.historico||[]),", "if(nota||!c.id)dados.historico=[...(dados.historico||c.historico||[]),", 1),
    ("""tabindex="0"${pode('crm')?` data-drag="lead" data-from="${c.etapa||'lead'}"`:''}><div class="t">${esc(c.nome)}</div>""",
     """tabindex="0"${pode('crm')?` data-drag="lead" data-from="${c.etapa||'lead'}"`:''}><div class="t">${esc(c.nome)}</div>${window.DRAVEN_VIS?DRAVEN_VIS.visCard(c)+DRAVEN_VIS.uaCard(c):''}""", 1),
    ('<th>Próxima ação</th>', '<th>Próxima ação</th><th>Última ação</th>', 1),
    ("""<td>${esc(c.proximaAcao||'')} ${due(c.dataProxima,ini,fim)}</td>""", """<td>${esc(c.proximaAcao||'')} ${due(c.dataProxima,ini,fim)}</td><td>${window.DRAVEN_VIS?DRAVEN_VIS.uaCol(c):''}</td>""", 1),
    ('<tr><td colspan="8" class="ro">Nenhum contato encontrado com esse filtro.</td></tr>', '<tr><td colspan="9" class="ro">Nenhum contato encontrado com esse filtro.</td></tr>', 1),
    ("""if(sem){const u=telLink(t);return u?`<a class="btn sm ligar wa-cli" href""", """if(sem){const u=telLink(t);return u?`<a class="btn sm ligar wa-cli" data-ligcli="${esc(c.id)}" data-tel="${esc(t)}" href""", 1),
    # ---- funil: filtro por forma de contato (WhatsApp, só ligação, sem telefone) ----
    ('<select class="inp" id="o-crm" data-f="ocrm">',
     """<select class="inp" id="w-crm" data-f="wcrm" aria-label="Filtrar por forma de contato"><option value="">Todos os contatos</option><option value="whats" ${f.wcrm==='whats'?'selected':''}>Com WhatsApp</option><option value="ligar" ${f.wcrm==='ligar'?'selected':''}>Só ligação (fixo)</option><option value="sem" ${f.wcrm==='sem'?'selected':''}>Sem telefone</option></select><select class="inp" id="o-crm" data-f="ocrm">""", 1),
    ("function crmFiltrados(){const q=norm(S.f.qcrm);return S.clientes.filter(c=>(!S.f.tcrm||c.tipo===S.f.tcrm)&&",
     """function filtroContato(c,f){if(!f)return true;const dig=t=>String(t||'').replace(/\\D/g,'');const whats=n=>!!dig(n===2?c.telefone2:c.telefone)&&!(n===2?c.semWhats2:c.semWhats);const tel=!!dig(c.telefone)||!!dig(c.telefone2);
  if(f==='whats')return whats(1)||whats(2);if(f==='ligar')return tel&&!whats(1)&&!whats(2);if(f==='sem')return!tel;return true}
function crmFiltrados(){const q=norm(S.f.qcrm);return S.clientes.filter(c=>filtroContato(c,S.f.wcrm)&&(!S.f.tcrm||c.tipo===S.f.tcrm)&&""", 1),
    # ---- produtos: categorias do catálogo, preço de atacado e importação ----
    ("const CATS=['Luvas de luta','Luvas de goleiro','Kimonos e faixas','Protetores','Vestuário','Acessórios','Outro']",
     "const CATS=['Luvas de luta','Luvas de goleiro','Kimonos e faixas','Protetores','Equipamentos de treino','Vestuário','Bolsas','Acessórios','Outro']", 1),
    ("""<label class="f">Preço de venda (R$)<input class="inp" id="p-preco" name="preco" inputmode="decimal" value="${p.preco??''}" ${d}></label>""",
     """<label class="f">Preço atacado (R$)<input class="inp" id="p-patac" name="precoAtacado" inputmode="decimal" value="${p.precoAtacado??''}" ${d}></label>
   <label class="f">Preço varejo (R$)<input class="inp" id="p-preco" name="preco" inputmode="decimal" value="${p.preco??''}" ${d}></label>""", 1),
    ("preco:num(fd.get('preco')),minimo:num(fd.get('minimo'))", "preco:num(fd.get('preco')),precoAtacado:num(fd.get('precoAtacado')),minimo:num(fd.get('minimo'))", 1),
    ('<th class="num">Preço</th>', '<th class="num">Atacado</th><th class="num">Varejo</th>', 1),
    ("""<td class="num">${p.preco?money(p.preco):'—'}</td>""", """<td class="num">${p.precoAtacado?money(p.precoAtacado):'—'}</td><td class="num">${p.preco?money(p.preco):'—'}</td>""", 1),
    ("""${pode('produtos')?'<button class="btn pri" data-a="novo-produto">Novo produto</button>'""",
     """${pode('produtos')?'<button class="btn" data-a="importar-produtos"><i class="fa-solid fa-file-import"></i> Importar produtos</button><button class="btn pri" data-a="novo-produto">Novo produto</button>'""", 1),
    ('<tr><td colspan="9" class="ro">Nenhum produto com esse filtro.</td></tr>', '<tr><td colspan="10" class="ro">Nenhum produto com esse filtro.</td></tr>', 1),
    # ---- Pedidos no mesmo padrão da aba Tarefas (o Funil fica no layout original) ----
    ('style="grid-template-columns:repeat(5,minmax(270px,1fr));min-width:1420px"', 'style="grid-template-columns:repeat(5,minmax(0,1fr));min-width:0"', 1),
    ('style="grid-template-columns:repeat(4,minmax(260px,1fr));min-width:1100px"', 'style="grid-template-columns:repeat(4,minmax(0,1fr));min-width:0"', 1),
    ("${pode('produtos')?'<button class=\"btn\" data-a=\"importar-produtos\">", "${pode('excluir')&&S.produtos.length?'<button class=\"btn danger\" data-a=\"excluir-estoque\"><i class=\"fa-solid fa-trash\"></i> Excluir todo o estoque</button>':''}${pode('produtos')?'<button class=\"btn\" data-a=\"importar-produtos\">", 1),
]

# Abre o WhatsApp Web numa janela ao lado e manda para ela as conversas abertas pelo sistema.
# O WhatsApp Web não pode ficar dentro da página: ele bloqueia ser aberto dentro de outro site.
WHATSAPP = r"""<style>.btn.ligar{color:#1E3A8A;border-color:#BFDBFE;text-decoration:none}.btn.ligar:hover{border-color:#1E3A8A}.btn.wa{text-decoration:none}</style>
<script>
window.DRAVEN_WA=(function(){
  const NOME='draven-whatsapp';
  const computador=()=>!/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)&&!(navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent));
  // O WhatsApp Web se isola quando é aberto por outro site: depois de carregar, o sistema não consegue mais
  // reaproveitar aquela aba. Por isso, no computador, o padrão é o app do WhatsApp (whatsapp://), que abre
  // cada conversa na mesma janela do app. A escolha fica guardada em cada computador.
  const lerModo=()=>{try{return localStorage.getItem('dv-wa-modo2')||''}catch(e){return''}};
  const gravarModo=m=>{try{m?localStorage.setItem('dv-wa-modo2',m):localStorage.removeItem('dv-wa-modo2')}catch(e){}};
  function paraApp(url){
    if(!url)return'whatsapp://';
    try{const u=new URL(url),fone=u.searchParams.get('phone')||(u.hostname==='wa.me'?u.pathname.slice(1):''),txt=u.searchParams.get('text');
      return'whatsapp://send?phone='+encodeURIComponent(fone)+(txt?'&text='+encodeURIComponent(txt):'')}catch(e){return'whatsapp://'}
  }
  let jan=null;
  // WhatsApp Web como segunda tela, UMA aba só. O WhatsApp pode cortar a ligação com o site que o abriu
  // (aí o sistema não consegue mais mandar conversas para aquela aba). O sistema percebe isso e, em vez de
  // abrir outra aba, copia a mensagem e mostra o número para colar na aba que já está aberta.
  const sess=(k,v)=>{try{if(v===undefined)return sessionStorage.getItem(k);v===null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)}catch(e){}};
  let separada=sess('dv-wa-separada')==='1';
  function vigiar(w){
    const t0=Date.now();
    const iv=setInterval(()=>{
      if(w!==jan){clearInterval(iv);return}
      if(w.closed){clearInterval(iv);
        // fechou sozinha em poucos segundos: foi o WhatsApp que cortou a ligação (a aba continua aberta para a pessoa)
        if(Date.now()-t0<15000){separada=true;sess('dv-wa-separada','1')}else{sess('dv-wa-aberto',null)}
        jan=null}
    },500);
  }
  function abrirNova(url){
    const w=Math.max(480,Math.round(screen.availWidth*0.42)),h=screen.availHeight;
    jan=window.open(url||'https://web.whatsapp.com/',NOME,`width=${w},height=${h},left=${screen.availWidth-w},top=0`)||window.open(url||'https://web.whatsapp.com/',NOME);
    if(jan){sess('dv-wa-aberto','1');vigiar(jan)}
  }
  function copiarParaAba(url){
    let fone='',txt='';try{const u=new URL(url);fone=u.searchParams.get('phone')||'';txt=u.searchParams.get('text')||''}catch(e){}
    if(txt&&navigator.clipboard)navigator.clipboard.writeText(txt).catch(()=>{});
    const fmt=(()=>{let d=fone.replace(/\D/g,'');if(d.startsWith('55')&&d.length>=12)d=d.slice(2);return d.length===11?`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`:d.length===10?`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`:fone})();
    let d=document.getElementById('wacopia');
    if(!d){d=document.createElement('dialog');d.id='wacopia';document.body.appendChild(d)}
    d.style.cssText='border:1px solid var(--line);border-radius:16px;padding:0;max-width:min(480px,calc(100vw - 24px));background:var(--surface);color:var(--fg)';
    d.innerHTML=`<form method="dialog" style="display:flex;flex-direction:column;gap:12px;padding:20px">
      <h2 style="margin:0;font-size:18px">Continue na aba do WhatsApp</h2>
      <p class="sub" style="margin:0">Para não abrir outra aba, ${txt?'<b>a mensagem já foi copiada</b>. ':''}Na aba do WhatsApp que já está aberta:</p>
      <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px;font-size:14px">
        <li>Clique em <b>Nova conversa</b> (ícone de lápis) e digite o número:</li>
      </ol>
      <div style="display:flex;gap:8px;align-items:center"><b style="font-size:20px;font-variant-numeric:tabular-nums">${fmt}</b><button type="button" class="btn sm" data-wc="num">Copiar número</button></div>
      <ol start="2" style="margin:0;padding-left:20px;font-size:14px"><li>Abra a conversa e cole a mensagem com <b>Ctrl+V</b>${txt?'':' (sem mensagem pronta)'}.</li></ol>
      ${txt?`<button type="button" class="btn sm" data-wc="msg" style="align-self:flex-start">Copiar a mensagem de novo</button>`:''}
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:12px">
        <button type="button" class="btn" data-wc="nova">Abrir em nova aba mesmo assim</button><button type="button" class="btn pri" data-wc="ok">Entendi</button></div></form>`;
    d.querySelector('[data-wc="ok"]').onclick=()=>d.close();
    d.querySelector('[data-wc="num"]').onclick=e=>{navigator.clipboard&&navigator.clipboard.writeText(fmt.replace(/\D/g,''));e.target.textContent='Número copiado'};
    const m=d.querySelector('[data-wc="msg"]');if(m)m.onclick=e=>{navigator.clipboard&&navigator.clipboard.writeText(txt);e.target.textContent='Mensagem copiada'};
    d.querySelector('[data-wc="nova"]').onclick=()=>{d.close();separada=false;sess('dv-wa-separada',null);abrirNova(url)};
    d.showModal();
  }
  function abrirWeb(url){
    if(jan&&!jan.closed){try{if(url)jan.location.href=url;jan.focus();return}catch(e){}}
    // a aba do WhatsApp já foi aberta e o WhatsApp cortou a ligação: não abre outra
    if(separada&&sess('dv-wa-aberto')){
      if(!url){if(confirm('A aba do WhatsApp já está aberta: volte para ela na barra de abas do navegador.\n\nSe você fechou essa aba, clique em OK para abrir uma nova.')){separada=false;sess('dv-wa-separada',null);abrirNova()}return}
      copiarParaAba(url);return}
    abrirNova(url);
  }
  function abrirApp(url){
    // link whatsapp:// abre a conversa no app do computador; a página do sistema continua onde está
    window.__dvSaidaExterna=Date.now();
    const l=document.createElement('a');l.href=paraApp(url);l.rel='noopener';l.style.display='none';document.body.appendChild(l);l.click();setTimeout(()=>l.remove(),1000);
  }
  function perguntar(url){
    let d=document.getElementById('wamodo');
    if(!d){d=document.createElement('dialog');d.id='wamodo';document.body.appendChild(d)}
    d.style.cssText='border:1px solid var(--line);border-radius:16px;padding:0;max-width:min(520px,calc(100vw - 24px));background:var(--surface);color:var(--fg)';
    d.innerHTML=`<form method="dialog" style="display:flex;flex-direction:column;gap:12px;padding:20px">
      <h2 style="margin:0;font-size:18px">Onde abrir as conversas do WhatsApp?</h2>
      <p class="sub" style="margin:0">Fica guardado neste computador. Dá para trocar depois na janela de mensagem.</p>
      <button type="button" class="btn pri" data-modo="web" style="justify-content:flex-start;text-align:left;white-space:normal;text-transform:none;letter-spacing:0;font-size:14px;padding:14px"><span><b>WhatsApp Web como segunda tela</b> (padrão)<br><span style="font-weight:500">Abre numa janela ao lado do sistema. Se o navegador não deixar reaproveitar, a conversa abre numa janela nova no mesmo lugar.</span></span></button>
      <button type="button" class="btn" data-modo="app" style="justify-content:flex-start;text-align:left;white-space:normal;padding:14px"><span><b>App do WhatsApp no computador</b><br><span style="font-weight:500">Abre cada conversa sempre na mesma janela do app, sem abrir abas. Precisa do WhatsApp Desktop instalado e conectado ao número da empresa.</span></span></button>
      <a href="https://www.whatsapp.com/download" target="_blank" rel="noopener" style="font-size:13px">Baixar o WhatsApp para computador</a>
      <div style="display:flex;justify-content:flex-end"><button type="button" class="btn" data-modo="">Cancelar</button></div></form>`;
    d.querySelectorAll('[data-modo]').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.modo;d.close();if(!m)return;gravarModo(m);if(url!==null)abrir(url)}));
    d.showModal();
  }
  function abrir(url){
    if(!computador()){window.open(url&&!/web\.whatsapp\.com/.test(url)?url:'https://wa.me/',NOME);return}
    if(lerModo()==='app')abrirApp(url);else abrirWeb(url);
  }
  const modoAtual=()=>lerModo()||'web';
  const trocarModo=()=>{gravarModo('');perguntar(null)};
  const noBotao=e=>e.target.closest&&e.target.closest('.wa-cli');
  ['pointerdown','mousedown','touchstart'].forEach(t=>document.addEventListener(t,e=>{if(noBotao(e))e.stopPropagation()},{capture:true,passive:true}));
  document.addEventListener('click',e=>{
    const ext=e.target.closest&&e.target.closest('a[href^="tel:"],a[href^="whatsapp:"],a[href^="mailto:"]');if(ext)window.__dvSaidaExterna=Date.now();
    if(noBotao(e))e.stopPropagation();
    const b=e.target.closest&&e.target.closest('[data-whatsapp-web]');
    if(b){e.preventDefault();abrir();return}
    const cl=e.target.closest&&e.target.closest('a[data-wacli]');
    if(cl&&window.DRAVEN_WAB&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();e.stopPropagation();DRAVEN_WAB.escolher(cl.dataset.wacli,Number(cl.dataset.wafone)||1);return}
    const a=e.target.closest&&e.target.closest('a[href^="https://web.whatsapp.com/"]');
    if(a&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();abrir(a.href)}
  },true);
  return{computador,abrir,modoAtual,trocarModo};
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
IMPORTAR = (RAIZ / 'ferramentas' / 'importar.html').read_text(encoding='utf-8')
VISITA = (RAIZ / 'ferramentas' / 'visita.html').read_text(encoding='utf-8')
QUADROS = (RAIZ / 'ferramentas' / 'quadros.html').read_text(encoding='utf-8')
PRODUTOS = (RAIZ / 'ferramentas' / 'produtos.html').read_text(encoding='utf-8')
FINANCEIRO = (RAIZ / 'ferramentas' / 'financeiro.html').read_text(encoding='utf-8')
import time
VERSAO = time.strftime('%Y%m%d%H%M')
CABECA = CABECA.replace('src="config.js"', f'src="config.js?v={VERSAO}"').replace('src="drive-db.js"', f'src="drive-db.js?v={VERSAO}"')
(RAIZ / 'index.html').write_text(CABECA + WHATSAPP + app.strip() + '\n' + IMPORTAR + VISITA + WAB + QUADROS + PRODUTOS + FINANCEIRO + CELULAR + '</body>\n</html>\n', encoding='utf-8')
print('index.html gerado')
