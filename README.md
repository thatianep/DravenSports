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
3. Na aba **Equipe e permissões**, clique em **Adicionar e-mail** para cada pessoa da equipe: digite o Gmail dela e escolha o perfil (Gestão, Vendas ou Estoque). O sistema compartilha a pasta com ela no Drive, já define o perfil e o Google manda um aviso por e-mail. Para tirar o acesso, use **Remover** na lista **E-mails com acesso**.

### 5. Equipe
Cada pessoa abre o site e entra com o Gmail que foi adicionado. Ela já cai no perfil escolhido.
Enquanto o login do Google estiver em modo de teste, o e-mail também precisa estar em **Usuários de teste** no Google Cloud.

**Computador e celular:** o mesmo endereço funciona nos dois. No celular, o menu fica numa barra embaixo (Painel, Funil, Tarefas, Vendas e **Mais** com todas as telas), as tabelas viram cartões, os quadros rolam uma coluna por vez e as fichas abrem em tela cheia.

**Instalar como app:** no computador (Chrome/Edge) use o ícone de instalar na barra de endereço; no Android, menu ⋮ → **Instalar app**; no iPhone, Safari → Compartilhar → **Adicionar à Tela de Início**.

## Trazer os dados do claude.ai
Na versão do claude.ai, aba **Planilhas no Drive**, clique em **Salvar tudo em planilha agora**. Ela vai para a mesma pasta do Drive.
No site do GitHub, aba **Planilhas no Drive → Atualizar lista → Restaurar** nessa planilha.

## WhatsApp Business
A equipe toda atende pelo **mesmo número do WhatsApp Business** da empresa, cada um no seu computador.

**Ligar o número (uma vez por computador)**
1. No celular da empresa, abra o **WhatsApp Business** → ⋮ (ou Configurações) → **Aparelhos conectados** → **Conectar um aparelho**.
2. No computador, clique no botão **WhatsApp**, no topo do sistema. O WhatsApp Web abre numa janela ao lado: leia o QR Code com o celular da empresa.
3. Repita em cada computador da equipe. O WhatsApp Business aceita até 4 aparelhos conectados além do celular (mais com o Meta Verified).

**Configurar (gestão):** em **Equipe e permissões → WhatsApp Business → Configurar**, cadastre o número da empresa, o link do catálogo (vazio = catálogo do próprio WhatsApp Business, `wa.me/c/número`) e, se quiser, mude as mensagens prontas. Variáveis: `{contato}` `{nome}` `{cidade}` `{catalogo}` `{vendedor}` `{prazo}`.

**No dia a dia**
- Cada cliente com telefone tem o botão **WhatsApp** (cards do Funil CRM, lista do CRM, Clientes 360° e ficha do cliente). Ele abre a mensagem pronta da **etapa do funil** do cliente (novo lead, primeiro contato com catálogo, proposta, negociação, cliente ativo, reativar perdido) ou uma saudação; dá para trocar a mensagem e editar o texto antes de abrir.
- **Abrir no WhatsApp** leva a conversa, com o texto, para a janela do WhatsApp Web ao lado (no celular, para o app). É só conferir e apertar Enviar.
- O envio fica na **linha do tempo do cliente** como "WhatsApp enviado", com o nome de quem mandou e a data. A ficha mostra o último WhatsApp registrado.
- Cliente cujo número **não tem WhatsApp**: na ficha, aba Dados, marque **Este número não tem WhatsApp**. No lugar aparece o botão **Ligar**.
- Botões de WhatsApp de pedidos e campanhas continuam mandando o texto do pedido ou da campanha direto.
- O WhatsApp Web não pode ficar dentro da página do sistema: o próprio WhatsApp bloqueia ser aberto dentro de outro site. Por isso ele fica numa janela ao lado.

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
| `ferramentas/whatsapp-business.html` | WhatsApp Business: número, mensagens prontas e registro dos envios |
| `ferramentas/celular.html` | Ajustes de celular e tablet (barra de menu embaixo, tabelas em cartões) |
| `ferramentas/montar.py` | Gera o `index.html` a partir da fonte: `python3 ferramentas/montar.py` |
| `manifest.webmanifest`, `*.png` | Nome e ícones do app instalado |
