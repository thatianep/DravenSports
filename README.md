# DRAVEN | Plataforma Comercial

CRM comercial da DRAVEN Sports: funil de vendas, tarefas e pedidos em quadros Kanban de arrastar, clientes 360°, produção e lotes, estoque e custos, campanhas, NPS, relatórios e controle da equipe.

Versão de 03/11/2026.

## Como está organizado

| O quê | Onde |
|---|---|
| Código do sistema | Este repositório no GitHub (`versao-claude-ai/sistema-draven.html`) |
| Sistema em uso | https://claude.ai/artifact/RyFZXgtX155XdP5UCsvHaD |
| Dados (clientes, pedidos, tarefas…) | Banco do claude.ai, ligado ao sistema acima |
| Planilhas exportadas | Google Drive, pasta `DRAVEN \| Plataforma Comercial` (aba **Planilhas no Drive**) |

Não usa Firebase nem Netlify.

> O repositório é público. Nunca coloque aqui dados de clientes, senhas ou planilhas exportadas: eles ficam no claude.ai e no Google Drive.

## Acesso da equipe

- Cada pessoa entra com a própria conta do claude.ai pelo link acima.
- A gestão define o perfil de cada pessoa (Gestão, Vendas ou Estoque) dentro do sistema.
- Na primeira vez que usar a aba **Planilhas no Drive**, cada pessoa autoriza o acesso ao Google Drive.

## Novidades desta versão

1. **Tarefas (aba nova):** quadro A fazer → Em andamento → Aguardando cliente → Concluído, com tipo, cliente, responsável, prazo e prioridade. Concluir uma tarefa ligada a um cliente registra o fato na linha do tempo dele; tarefas vencidas ou do dia aparecem no Painel.
2. **Pedidos em quadro**, em Vendas e pedidos: Orçamento → Confirmado → Em produção → Entregue → Cancelado. Arrastar segue as regras dos botões do pedido (confirmar dá baixa no estoque, produção abre o lote, entrega e cancelamento pedem confirmação).
3. **Funil CRM com arraste:** toda troca de etapa fica registrada na linha do tempo do cliente.

**Como arrastar:** no computador, clique e arraste. No celular, toque e segure o card por meio segundo e depois arraste.

## Atualizar o sistema

1. Altere `versao-claude-ai/sistema-draven.html` aqui no GitHub.
2. Republique o mesmo arquivo no artefato do claude.ai (o link acima). Os dados continuam no lugar.

O WhatsApp por QR Code, a IA e a integração com o discador Callix precisam de um servidor ligado 24 horas e não fazem parte deste sistema.
