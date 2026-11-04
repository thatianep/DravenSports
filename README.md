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
- Cada cliente com telefone tem o botão **WhatsApp** (cards do Funil CRM, lista do CRM, Clientes 360° e ficha do cliente). Ele abre a mensagem pronta da **etapa do funil** do cliente (novo lead, primeiro contato com catálogo, visita agendada, proposta, negociação, cliente ativo, reativar perdido) ou uma saudação; dá para trocar a mensagem e editar o texto antes de abrir.
- **Abrir no WhatsApp** leva a conversa, com o texto, para a janela do WhatsApp Web ao lado (no celular, para o app). É só conferir e apertar Enviar.
- O envio fica na **linha do tempo do cliente** como "WhatsApp enviado", com o nome de quem mandou e a data. A ficha mostra o último WhatsApp registrado.
- Cliente cujo número **não tem WhatsApp**: na ficha, aba Dados, marque **Este número não tem WhatsApp**. No lugar aparece o botão **Ligar**.
- Botões de WhatsApp de pedidos e campanhas continuam mandando o texto do pedido ou da campanha direto.
- **Mensagens do Novo lead:** 1. Falar com o responsável pelas compras ("Olá, tudo bem? 🥰 Sou a {vendedor}, da Draven Sports. Gostaria de falar com a pessoa responsável pelas compras…") — é a sugerida para leads em Novo lead; 2. Apresentação e catálogo. {vendedor} vira o primeiro nome de quem envia.
- **Mensagens da Visita agendada** (5 modelos, com dia, hora e endereço preenchidos sozinhos a partir da visita):
  1. Pós-agendamento: abre sozinho logo depois de agendar a visita;
  2. Confirmação de agendamento;
  3. Confirmação de material para apresentação;
  4. Visita à sede: com o endereço da loja (Av. Álvaro Ramos, 2401 - Quarta Parada, São Paulo - SP, ou o que estiver salvo);
  5. Visita externa: com o nome da academia.
  Para leads em Visita agendada, o sistema sugere o modelo certo (sede ou externa, conforme o local). Sem nome do contato na ficha, a saudação fica sem nome ("Oi, tudo bem?").
- **WhatsApp como segunda tela:** as conversas abrem no **WhatsApp Web numa janela ao lado do sistema**, reaproveitada sempre que o navegador deixar. Se preferir o **app do WhatsApp no computador** (WhatsApp Desktop, abre cada conversa na mesma janela do app), use **trocar** no rodapé da janela de mensagem; a escolha fica guardada em cada computador. No celular, abre no app do WhatsApp.
- O WhatsApp Web não pode ficar dentro da página do sistema: o próprio WhatsApp bloqueia ser aberto dentro de outro site. Por isso ele fica numa janela ao lado.

## Filtro por forma de contato
No **Funil CRM**, a caixa **Todos os contatos** filtra os leads (no quadro e na lista):
- **Com WhatsApp:** só quem tem o botão WhatsApp (no telefone 1 ou no telefone 2);
- **Só ligação (fixo):** quem tem telefone, mas só o botão Ligar;
- **Sem telefone:** quem ainda não tem número.
Combina com a busca e com os filtros de tipo e canal.

## Visitas e última ação
- **Visitas:** cada lead guarda **todas** as visitas (agendadas, realizadas e canceladas). Agendar uma nova não apaga as anteriores.
- Ao levar um lead para a etapa **Visita agendada** (arrastando ou pela caixa do card), abre a janela **Agendar visita**: escolha **Na nossa loja** ou **Na academia do lead**, o endereço, o dia e a hora. O endereço da loja fica salvo (padrão: Av. Álvaro Ramos, 2401 - Quarta Parada); o da academia vai para a ficha do lead.
- No card aparecem todas as visitas do lead (as agendadas primeiro), com local e link **rota** (Google Maps), e o botão **nova visita**. Em **alterar**, dá para mudar dia, hora e local ou marcar a visita como **Realizada** ou **Cancelada** (a tarefa da visita é concluída junto). Visita que já passou e não foi marcada fica em vermelho.
- Cada visita nova cria uma **tarefa de visita** (aba Tarefas e Painel). A próxima visita agendada vira a **próxima ação** do lead e é a usada nas mensagens de WhatsApp.
- Na ficha do lead (aba Dados) ficam o **Endereço** da academia, a lista de **Visitas** e o botão **Agendar nova visita**.
- **Última ação:** cada card do funil e a lista do CRM mostram a ação mais recente com o lead, quando foi e quem fez: WhatsApp enviado, ligação, visita, troca de etapa, tarefa concluída, orçamento ou pedido. Atualiza sozinho. Clicar em **Ligar** também fica registrado.

## Funil no layout original
O **Funil CRM** está no layout original do sistema: colunas largas, rolagem para os lados com a barra dourada embaixo do quadro e o card original (com os botões WhatsApp/Ligar, as visitas e a última ação). O quadro de **Tarefas** e o de **Pedidos** cabem na largura da tela.

## Barras de rolagem
O sistema esconde as barras de rolagem (página, menu, tabelas e janelas); rolar continua funcionando com a roda do mouse, o touchpad ou o dedo. As exceções são o **Funil CRM**, que mostra a barra para os lados embaixo do quadro, e o **menu de abas**, que fica numa linha com a barra de rolagem embaixo. No celular, os quadros deslizam com o dedo, uma coluna por vez.

## Produtos e catálogo
- Em **Estoque e custos → Importar produtos → Usar o catálogo Draven 2026**, o sistema cadastra os **60 itens** do catálogo de preços 2026 (`catalogo-2026.csv`): Angry, The Mist preta e vermelha, protetor de canela branco, Shark, The Eagle, pera de velocidade, raquete de foco, bastão de treino, saco de pancada, mochila, bolsa duffle e luvas de goleiro Astro, Lotus, Alpha I e Alpha II, cada cor com o seu **SKU (Art. DE-…)**, **preço de atacado** e **preço de varejo**.
- Itens marcados como **Indisponível** no catálogo (pera de velocidade preta e saco de pancada) entram inativos; a pera de velocidade está com preço **sob consulta** (R$ 0).
- O estoque começa em zero: dê entrada com **Ajustar** em cada produto (ou importe uma planilha com a coluna Estoque). Custo de produção e estoque mínimo também ficam para preencher.
- Também dá para importar uma planilha CSV própria (Nome, Variação, SKU, Categoria, Unidade, Preço atacado, Preço varejo, Custo, Estoque, Mínimo, Ativo). Produto com o mesmo SKU **não duplica**: só atualiza preços e dados, sem mexer no estoque. Serve para atualizar a tabela de preços quando sair um catálogo novo.
- **Atualizar o estoque por planilha:** exporte o estoque (**Exportar CSV**), preencha a coluna **Estoque** com a contagem e importe em **Importar produtos**. Com a opção **Atualizar o estoque com as quantidades da planilha** marcada, cada produto fica com a quantidade da planilha: o sistema lança um ajuste com a diferença (aparece em **Movimentações** como "Importação de planilha"). Colunas que não estão na planilha (ex.: preço de atacado, ativo) não mudam nada.
- **Excluir todo o estoque** (só a gestão): apaga todos os produtos e o histórico de movimentações. Pede para digitar **EXCLUIR** e, antes, baixa uma cópia em planilha (produtos e movimentações). A cópia de produtos pode ser importada de volta em **Importar produtos**.
- Cada produto tem agora **Preço atacado** e **Preço varejo**; a tabela do estoque mostra as duas colunas. Novas categorias: **Equipamentos de treino** e **Bolsas**.

## Importar listas de leads
No **Funil CRM** (ou em Clientes 360°), clique em **Importar** e escolha o arquivo exportado:
- **Planilha CSV** (Excel, Google Planilhas): basta ter as colunas **Nome** e **Telefone** (aceita "Telefone 1", "Telefone 2", "Celular", "WhatsApp"…). Também são reconhecidas Contato, E-mail, Cidade, Tipo, Canal, Instagram, Interesse e Observação.
- **Contatos .vcf** (Google Contatos, celular): nome e telefones de cada contato.

O que o sistema faz sozinho:
- limpa os números (tira o 55, ignora "55" sem número e números de mentira como 11999999999);
- **celular** (com 9 na frente) entra com o botão **WhatsApp**; **fixo** entra com o botão **Ligar**;
- junta a mesma empresa em um lead só, com **Telefone** e **Telefone 2** (no .vcf, "NOME 2" é o segundo número de NOME);
- não duplica quem já está no CRM: só acrescenta o telefone que faltava;
- mostra uma prévia (novos, com WhatsApp, só fixo, sem telefone, já existentes) antes de importar.

Pode importar a mesma lista de novo sempre que exportar: só entra o que é novo.

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
| `ferramentas/visita.html` | Visita agendada (local, endereço, dia e hora) e última ação de cada lead |
| `ferramentas/produtos.html` | Importação de produtos (catálogo 2026 ou CSV) e preço de atacado |
| `catalogo-2026.csv` | Catálogo de preços Draven 2026 (60 itens, atacado e varejo) |
| `ferramentas/quadros.html` | Barras de rolagem escondidas (menos a do Funil) e quadros de Tarefas/Pedidos na largura da tela |
| `ferramentas/importar.html` | Importação de leads (CSV e .vcf), limpeza dos telefones e Telefone 2 |
| `ferramentas/celular.html` | Ajustes de celular e tablet (barra de menu embaixo, tabelas em cartões) |
| `ferramentas/montar.py` | Gera o `index.html` a partir da fonte: `python3 ferramentas/montar.py` |
| `manifest.webmanifest`, `*.png` | Nome e ícones do app instalado |
