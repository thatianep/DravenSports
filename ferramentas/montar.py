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
    # ---- WhatsApp Web ao lado do sistema ----
    # no computador as conversas abrem no WhatsApp Web; no celular, no aplicativo
    ("return`https://wa.me/${d}${msg?'?text='+encodeURIComponent(msg):''}`}",
     "return window.DRAVEN_WA&&DRAVEN_WA.computador()?`https://web.whatsapp.com/send?phone=${d}${msg?'&text='+encodeURIComponent(msg):''}`:`https://wa.me/${d}${msg?'?text='+encodeURIComponent(msg):''}`}", 1),
    # botão WhatsApp no topo
    ('<div class="hact"><button class="btn" id="topLead"',
     '<div class="hact"><button class="btn wa" type="button" data-whatsapp-web title="Abrir o WhatsApp Web ao lado do sistema"><i class="fa-brands fa-whatsapp"></i><span class="lbl">WhatsApp</span></button><button class="btn" id="topLead"', 1),
]

# Abre o WhatsApp Web numa janela ao lado e manda para ela as conversas abertas pelo sistema.
# O WhatsApp Web não pode ficar dentro da página: ele bloqueia ser aberto dentro de outro site.
WHATSAPP = r"""<script>
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
  document.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('[data-whatsapp-web]');
    if(b){e.preventDefault();abrir();return}
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
(RAIZ / 'index.html').write_text(CABECA + WHATSAPP + app.strip() + '\n</body>\n</html>\n', encoding='utf-8')
print('index.html gerado')
