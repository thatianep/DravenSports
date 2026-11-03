# DRAVEN | Plataforma Comercial

CRM comercial da DRAVEN Sports: funil de vendas, tarefas e pedidos em quadros Kanban de arrastar, clientes 360°, produção e lotes, estoque e custos, campanhas, NPS, relatórios e controle da equipe.

**Endereço público:** https://thatianep.github.io/DravenSports/

## Como funciona

| O quê | Onde |
|---|---|
| Sistema (site) | GitHub Pages, a partir deste repositório |
| Login | Conta Google de cada pessoa |
| Dados (clientes, pedidos, tarefas…) | Arquivo `draven-dados.json` na pasta **DRAVEN \| Plataforma Comercial** do Google Drive da gestão |
| Planilhas exportadas | Mesma pasta do Drive (aba **Planilhas no Drive**) |

Não usa Firebase nem Netlify. O repositório é público, mas os dados não ficam nele: só quem tem acesso à pasta do Drive vê os dados.

## Colocar no ar (uma vez só)

### 1. Ligar o GitHub Pages
No GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.**
Em um ou dois minutos o site abre em https://thatianep.github.io/DravenSports/

### 2. Criar o login do Google (Google Cloud)
1. Em https://console.cloud.google.com crie um projeto (ex.: `DRAVEN CRM`).
2. **APIs e serviços → Biblioteca →** ative a **Google Drive API**.
3. **Tela de consentimento OAuth:** tipo **Externo**, nome `DRAVEN Plataforma Comercial`, seu e-mail de suporte. Em **Usuários de teste**, adicione o Gmail de cada pessoa da equipe (até 100).
4. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web.**
   Em **Origens JavaScript autorizadas** coloque `https://thatianep.github.io`.
5. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`).

### 3. Colar o ID no sistema
Edite o [`config.js`](config.js) aqui no GitHub (ícone de lápis), troque `COLE_AQUI_O_ID_DO_CLIENTE` pelo ID copiado e salve (Commit changes).
No mesmo arquivo, em `dono`, coloque o Gmail da gestão.

### 4. Primeiro acesso da gestão
1. Abra o site e clique em **Entrar com Google**. Na janela do Google, permita o acesso ao Drive.
   Enquanto o app estiver em modo de teste, o Google mostra o aviso "app não verificado": clique em **Continuar**.
2. Clique em **Criar a base no meu Drive**. É criada a pasta **DRAVEN | Plataforma Comercial** com o arquivo `draven-dados.json`.
3. No Google Drive, compartilhe essa pasta com cada pessoa da equipe como **Editor**.

### 5. Equipe
1. Cada pessoa abre o site, entra com o Gmail que foi compartilhado e aparece em **Equipe e permissões**.
2. A gestão define o perfil: Gestão, Vendas ou Estoque.

**Instalar como app:** no computador (Chrome/Edge) use o ícone de instalar na barra de endereço; no Android, menu ⋮ → **Instalar app**; no iPhone, Safari → Compartilhar → **Adicionar à Tela de Início**.

## Trazer os dados do claude.ai
Na versão do claude.ai, aba **Planilhas no Drive**, clique em **Salvar tudo em planilha agora**. Ela vai para a mesma pasta do Drive.
No site do GitHub, aba **Planilhas no Drive → Atualizar lista → Restaurar** nessa planilha.

## WhatsApp
- O botão **WhatsApp**, no topo do sistema, abre o WhatsApp Web numa janela ao lado. Na primeira vez, leia o QR Code com o celular (WhatsApp → Aparelhos conectados → Conectar aparelho). Depois ele continua conectado nesse navegador.
- Cada cliente com telefone tem um botão **WhatsApp**: nos cards do Funil CRM, na lista do CRM, na tabela de Clientes 360° e na ficha do cliente. Ele abre a conversa já com a saudação "Olá {contato}, tudo bem? Aqui é da Draven Sports.". Clientes sem telefone mostram "Sem telefone".
- Cliente cujo número **não tem WhatsApp**: na ficha do cliente, aba Dados, marque **Este número não tem WhatsApp**. No lugar do WhatsApp aparece o botão **Ligar**, que liga direto para o número (no celular abre o discador; no computador, o programa de ligação configurado, como o app Telefone do Windows ou o iPhone pelo Mac).
- Os botões de WhatsApp de clientes, pedidos e campanhas abrem a conversa com a mensagem pronta **nessa mesma janela**, sem abrir abas novas. É só conferir e apertar Enviar.
- No celular, esses botões abrem o aplicativo do WhatsApp.
- O WhatsApp Web não pode ficar dentro da página do sistema: o próprio WhatsApp bloqueia ser aberto dentro de outro site.

## Bom saber
- A sessão do Google dura cerca de 1 hora. Quando expira, aparece uma faixa amarela no canto: clique em **Continuar**. O que foi feito nesse tempo fica guardado e é enviado ao continuar.
- Quando duas pessoas mexem ao mesmo tempo, as alterações se juntam a cada 15 segundos. Se as duas mudarem **o mesmo registro**, vale a última gravação.
- Os perfis (Gestão, Vendas, Estoque) organizam as telas, mas quem tem a pasta como Editor no Drive consegue, tecnicamente, alterar o arquivo de dados. Compartilhe a pasta só com quem é da equipe.
- A IA (textos de campanha e análise de NPS) só existe na versão do claude.ai.
- WhatsApp por QR Code e discador Callix precisam de um servidor ligado 24 horas e não fazem parte deste sistema.

## Arquivos
| Arquivo | Para quê |
|---|---|
| `index.html` | O sistema publicado. **Gerado**, não edite à mão |
| `drive-db.js` | Login Google e banco de dados no Drive |
| `config.js` | ID do login do Google e e-mail da gestão |
| `versao-claude-ai/sistema-draven.html` | Fonte do sistema (a mesma versão publicada no claude.ai) |
| `ferramentas/montar.py` | Gera o `index.html` a partir da fonte: `python3 ferramentas/montar.py` |
| `manifest.webmanifest`, `*.png` | Nome e ícones do app instalado |
