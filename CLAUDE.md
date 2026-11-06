# DRAVEN | Plataforma Comercial — regras para alterações

## Regra principal: processo contínuo, sem perder o que já existe
Toda alteração continua de onde o sistema parou. **Nada que já existe pode ser apagado ou desfeito** sem pedido explícito da dona do sistema:
- **Dados:** nunca apagar, renomear ou mudar o formato de campos já gravados no `draven-dados.json` (clientes, produtos, pedidos, tarefas, visitas, histórico, config). Campos novos entram ao lado dos antigos; dados antigos continuam sendo lidos (ex.: `visita` única continua aparecendo depois de existir `visitas`).
- **Recursos:** não remover botões, telas, filtros, importações, mensagens de WhatsApp ou textos já pedidos. Mudança de layout preserva os recursos dentro dele.
- **Configurações:** não sobrescrever o que a gestão configurou (número do WhatsApp Business, mensagens editadas, endereço da loja, perfis da equipe, `config.js`).
- **Importações:** coluna ausente ou vazia numa planilha não muda nada no registro; estoque só muda por ajuste registrado em Movimentações.
- **Pedido de "voltar ao original":** volta só o que foi pedido e mantém os recursos acrescentados depois (ex.: Funil original mantém WhatsApp/Ligar, visitas e última ação).
- Na dúvida sobre o que o pedido quer apagar, perguntar antes.

## Como o sistema é montado
- `index.html` é **gerado**: não editar à mão. Rodar `python3 ferramentas/montar.py` depois de qualquer mudança.
- Fonte: `versao-claude-ai/sistema-draven.html` (sistema original) + trocas pontuais em `ferramentas/montar.py` (lista `TROCAS`, cada troca confere que o trecho existe) + módulos em `ferramentas/*.html` (WhatsApp Business, visitas, importação de leads e produtos, financeiro, seleção de leads, descrição, imagens e unificação de produtos, quadros, celular).
- `drive-db.js`: login Google e banco no Google Drive (arquivo `draven-dados.json`), no formato que o sistema espera do claude.ai.
- `config.js`: ID do cliente OAuth do Google (preenchido pela dona).

## Antes de publicar
1. `python3 ferramentas/montar.py`.
2. Testar no navegador (Playwright) com Google/Drive simulado: o fluxo alterado e os fluxos já existentes que ele toca (WhatsApp/Ligar, visitas, filtros, importações, estoque), no computador e no celular.
3. Commit e push para `main` (GitHub Pages publica).
