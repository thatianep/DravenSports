# DRAVEN | Plataforma Comercial

CRM comercial da DRAVEN Sports. Reúne:
- funil de vendas, tarefas e pedidos em **quadros Kanban de arrastar**;
- clientes 360°, produção e lotes, estoque e custos;
- campanhas, NPS, relatórios e controle da equipe.

Versão de 03/11/2026.

## O que tem neste pacote

```
site/                  o app para colocar no ar (Netlify): computador e celular, com a logo da DRAVEN no ícone
  index.html           tela de entrada, configuração da nuvem e o sistema completo
  manifest.webmanifest nome e ícones do app instalado
  icon-*.png, apple-touch-icon.png, favicon.png   ícones com a logo
firestore.rules        regras de segurança do banco (cole no Firebase)
versao-claude-ai/      cópia da versão publicada no claude.ai (funciona só aberta pelo claude.ai)
```

## Novidades desta versão

1. **Tarefas (aba nova)**
   - Quadro A fazer → Em andamento → Aguardando cliente → Concluído.
   - Cada tarefa tem tipo (ligação, visita, envio de catálogo, proposta, follow-up, amostra), cliente ligado, responsável, prazo e prioridade.
   - Concluir uma tarefa ligada a um cliente registra o fato na linha do tempo dele.
   - Tarefas vencidas ou do dia aparecem no Painel.
2. **Pedidos em quadro**, em Vendas e pedidos
   - Colunas Orçamento → Confirmado → Em produção → Entregue → Cancelado.
   - Arrastar segue as regras dos botões do pedido: confirmar dá baixa no estoque, produção abre o lote, entrega e cancelamento pedem confirmação.
3. **Funil CRM com arraste**
   - Os leads podem ser arrastados entre as etapas.
   - Toda troca de etapa fica registrada na linha do tempo do cliente.

**Como arrastar:** no computador, clique e arraste. No celular, toque e segure o card por meio segundo e depois arraste.

## Colocar o app no ar (site do Netlify)

1. **Ligar à nuvem (uma vez só)**
   1. Abra `site/index.html` no navegador do computador. Aparece a tela **Ligar o app à nuvem**.
   2. Siga os passos dela no Firebase (https://console.firebase.google.com):
      - ative o login por **E-mail/senha**;
      - crie o usuário `dravenadmin@draven.app` com a senha da gestão;
      - crie o **Firestore Database** em São Paulo (southamerica-east1);
      - na aba Regras, cole o conteúdo de `firestore.rules` e publique.
   3. Cole o bloco `firebaseConfig` na tela e clique em **Baixar arquivo configurado**.
   4. Coloque o `index.html` baixado dentro da pasta `site`, no lugar do original.
2. **Publicar**
   1. No Netlify, abra o projeto **crmdravensports** e vá em **Deploys**.
   2. Arraste a pasta `site` inteira.
3. **Autorizar o endereço:** no Firebase, vá em Authentication > Configurações > Domínios autorizados e adicione `crmdravensports.netlify.app`.
4. **Instalar:** abra https://crmdravensports.netlify.app em cada aparelho, entre com **DravenAdmin** e instale:
   - **Computador** (Chrome ou Edge): ícone de instalar na barra de endereço.
   - **Android**, inclusive Realme, Samsung e Xiaomi: no Chrome, menu ⋮ e depois **Instalar app**.
   - **iPhone**: no Safari, Compartilhar e depois **Adicionar à Tela de Início**.

**Já tinha publicado antes?**
- Publique as regras novas do `firestore.rules`. Sem elas, a aba Tarefas não consegue salvar.
- Depois, gere o arquivo configurado de novo com este `index.html` e publique a pasta `site`.

## As duas versões

| | Site (Netlify + Firebase) | claude.ai |
|---|---|---|
| Login | DravenAdmin e contas da equipe | Conta do claude.ai de cada pessoa |
| Ícone no celular | Logo da DRAVEN | Ícone do Claude |
| Planilhas no Google Drive | Não tem | Tem (aba Planilhas no Drive) |
| Onde ficam os dados | Firebase (Google) | Banco do claude.ai |

Os dados de uma versão **não aparecem** na outra. Escolha uma para a equipe usar no dia a dia.

O WhatsApp por QR Code, a IA e a integração com o discador Callix precisam de um servidor ligado 24 horas e não estão em nenhuma das duas versões.
