# DRAVEN | Plataforma Comercial

CRM comercial da DRAVEN Sports: funil de vendas, tarefas e pedidos em quadros Kanban de arrastar, clientes 360°, produção e lotes, estoque e custos, campanhas, NPS, relatórios e controle da equipe.

**Endereço público:** https://thatianep.github.io/DravenSports/

## Como funciona

| O quê | Onde |
|---|---|
| Sistema (site) | GitHub Pages, a partir deste repositório |
| Login | **Usuário e senha criados pela gestão** na aba Equipe. A equipe não precisa de conta Google |
| Servidor | Google Apps Script na conta Google da gestão (`servidor/Codigo.gs`) |
| Dados | Arquivo `draven-dados.json` na pasta **DRAVEN \| Plataforma Comercial** do Google Drive da gestão |
| Planilhas exportadas | Mesma pasta do Drive (aba **Planilhas no Drive**) |

A conta Google da gestão serve só como nuvem de dados. O repositório é público, mas os dados e as senhas não ficam nele.
As senhas ficam guardadas de forma cifrada no servidor, nunca no arquivo de dados.

## Colocar no ar (uma vez só)

### 1. Ligar o GitHub Pages
No GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.**

### 2. Publicar o servidor (Google Apps Script), com a conta Google da gestão
1. Abra https://script.google.com e clique em **Novo projeto**. Dê o nome `DRAVEN servidor`.
2. Apague o que estiver no editor e cole todo o conteúdo de [`servidor/Codigo.gs`](servidor/Codigo.gs).
3. Na linha `const CODIGO_INSTALACAO = 'TROQUE-ESTE-CODIGO';` troque o texto por uma frase só sua (ex.: `draven-2026-minha-frase`). Salve (ícone de disquete).
4. No topo, escolha a função **autorizar** e clique em **Executar**. Permita o acesso ao Google Drive (se aparecer "app não verificado": **Avançado → Acessar DRAVEN servidor**).
5. Clique em **Implantar → Nova implantação →** ícone de engrenagem **→ App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
   - Clique em **Implantar** e copie o **URL do app da Web** (termina em `/exec`).

### 3. Colar o endereço no sistema
Edite o [`config.js`](config.js) aqui no GitHub (ícone de lápis), troque `COLE_AQUI_O_ENDERECO_DO_SERVIDOR` pelo URL copiado e salve (Commit changes).

### 4. Primeiro acesso da gestão
Abra https://thatianep.github.io/DravenSports/ — aparece **Primeiro acesso**. Digite o código de instalação (a frase do passo 2.3), seu nome, um usuário e uma senha. Essa é a conta dona do sistema.

### 5. Cadastrar a equipe
Na aba **Equipe e permissões → Cadastrar funcionário**: nome, usuário, perfil (Gestão, Vendas ou Estoque) e senha (ou deixe vazio para gerar uma). Copie ou envie pelo WhatsApp os dados de acesso que aparecem.
- **Nova senha:** gera outra senha e desconecta a pessoa de todos os aparelhos.
- **Remover:** desativa o login da pessoa. O que ela registrou continua no sistema.
- Cada pessoa troca a própria senha no menu com o nome dela, no canto superior direito.

**Instalar como app:** no computador (Chrome/Edge) use o ícone de instalar na barra de endereço; no Android, menu ⋮ → **Instalar app**; no iPhone, Safari → Compartilhar → **Adicionar à Tela de Início**.

## Atualizar o servidor
Se o `servidor/Codigo.gs` mudar: cole o novo conteúdo no Apps Script (mantendo a sua frase em `CODIGO_INSTALACAO`), salve e vá em **Implantar → Gerenciar implantações →** lápis **→ Versão: Nova versão → Implantar**. O endereço continua o mesmo.

## Trazer os dados do claude.ai
Na versão do claude.ai, aba **Planilhas no Drive**, clique em **Salvar tudo em planilha agora**. Se o Google Drive ligado ao claude.ai for o mesmo da gestão, a planilha já cai na pasta certa; se não for, baixe a planilha e coloque-a na pasta **DRAVEN | Plataforma Comercial** do Drive da gestão.
No site, aba **Planilhas no Drive → Atualizar lista → Restaurar** nessa planilha.

## Bom saber
- O login fica salvo no aparelho por 30 dias. Depois disso, ou ao clicar em **Sair**, a pessoa entra de novo.
- As alterações de várias pessoas se juntam a cada 8 segundos. Se duas pessoas mudarem **o mesmo registro**, vale a última gravação.
- O servidor também confere os perfis: só a Gestão exclui registros, mexe em perfis, cria contas e usa as planilhas do Drive; quem não tem perfil não vê nenhum dado.
- Os links "Abrir" das planilhas só abrem para a conta Google da gestão (os arquivos ficam no Drive dela).
- A IA (textos de campanha e análise de NPS) só existe na versão do claude.ai.
- WhatsApp por QR Code e discador Callix precisam de um servidor ligado 24 horas e não fazem parte deste sistema.

## Arquivos
| Arquivo | Para quê |
|---|---|
| `index.html` | O sistema publicado. **Gerado**, não edite à mão |
| `servidor-db.js` | Tela de login e conversa com o servidor (banco, contas, planilhas) |
| `servidor/Codigo.gs` | O servidor: cole no Google Apps Script da gestão |
| `config.js` | Endereço do servidor |
| `versao-claude-ai/sistema-draven.html` | Fonte do sistema (a mesma versão publicada no claude.ai) |
| `ferramentas/montar.py` | Gera o `index.html` a partir da fonte: `python3 ferramentas/montar.py` |
| `manifest.webmanifest`, `*.png` | Nome e ícones do app instalado |
