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
    # ---- contas criadas pela gestão (usuário e senha) ----
    # menu do usuário: trocar a própria senha e sair
    ("""${p==='gestao'?'<button type="button" role="menuitem" data-go="equipe"><i class="fa-solid fa-user-shield"></i> Equipe e permissões</button>':''}</div>`;""",
     """${p==='gestao'?'<button type="button" role="menuitem" data-go="equipe"><i class="fa-solid fa-user-shield"></i> Equipe e permissões</button>':''}<button type="button" role="menuitem" data-a="trocar-senha"><i class="fa-solid fa-key"></i> Trocar minha senha</button><hr><button type="button" role="menuitem" class="sair" data-a="sair"><i class="fa-solid fa-right-from-bracket"></i> Sair</button></div>`;""", 1),
    # aba Equipe: botão para cadastrar funcionário
    ('<p class="sub">Funcionários, logins e o que cada perfil pode fazer</p></div></div>',
     '<p class="sub">Funcionários, logins e o que cada perfil pode fazer</p></div>${adm?\'<div class="tools"><button class="btn pri" data-a="funcionario"><i class="fa-solid fa-user-plus"></i> Cadastrar funcionário</button></div>\':\'\'}</div>', 1),
    ('Ninguém aguardando. Compartilhe o link desta página com a pessoa (botão Compartilhar do claude.ai, com permissão de Contribuidor ou Editor). Assim que ela abrir, aparece aqui para você escolher o perfil.',
     'Ninguém aguardando. Para dar acesso a alguém, clique em Cadastrar funcionário e envie o usuário e a senha para a pessoa.', 1),
    ("case'nova-senha':trocarSenha(id);break;",
     "case'nova-senha':trocarSenha(id);break;case'funcionario':formFuncionario();break;case'desativar-conta':desativarConta(id);break;", 1),
    # membros: Remover também desativa o login da pessoa
    ("case'rem-membro':if(await confirmar(`Remover o acesso de ${pessoa(id)}?`,'Remover'))definirPapel(id,'');break;",
     "case'rem-membro':if(S.contas?.[id])desativarConta(id);else if(await confirmar(`Remover o acesso de ${pessoa(id)}?`,'Remover'))definirPapel(id,'');break;", 1),
    ("async function trocarSenha(id){",
     "async function desativarConta(id){const c=S.contas?.[id];if(!await confirmar(`Remover o acesso de ${c?.name||pessoa(id)}? O login dela é desativado: a pessoa sai do sistema em todos os aparelhos e não consegue mais entrar. Os registros feitos por ela continuam.`,'Remover'))return;try{await waApi('/api/contas/desativar',{id});try{await S.db.doc('equipe/'+id).delete()}catch(e){}carregarContas(true);toast('Acesso removido')}catch(e){toast(e.message||'Não foi possível remover o acesso.')}}\nasync function trocarSenha(id){", 1),
    # login é um usuário, não precisa ser e-mail
    ('E-mail (será o login) *<input class="inp" id="fu-email" name="email" type="email" required>',
     'Usuário (login) *<input class="inp" id="fu-email" name="email" required autocapitalize="none" spellcheck="false" placeholder="ex.: joao.vendas">', 1),
    ('A gestão cria a conta com e-mail e senha.', 'A gestão cria a conta com usuário e senha.', 1),
    ("const link=location.origin+'/';", "const link=location.origin+location.pathname;", 1),
    ('E-mail: ${email}', 'Usuário: ${email}', 1),
    ('<small>E-mail</small>', '<small>Usuário</small>', 1),
]
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
<script src="servidor-db.js"></script>
</head>
<body>
"""
(RAIZ / 'index.html').write_text(CABECA + app.strip() + '\n</body>\n</html>\n', encoding='utf-8')
print('index.html gerado')
