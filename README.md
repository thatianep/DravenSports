# DRAVEN | Plataforma Comercial

CRM comercial da DRAVEN Sports (funil, tarefas, pedidos, clientes, produção, estoque, campanhas, NPS e relatórios).

## Onde o sistema roda e onde ficam os dados

| | Endereço | Dados |
|---|---|---|
| **claude.ai (em uso)** | https://claude.ai/artifact/RyFZXgtX155XdP5UCsvHaD | Banco do claude.ai (nuvem) + planilhas exportadas para o Google Drive, pasta `DRAVEN \| Plataforma Comercial` |
| Site (opcional) | pasta `site/` → Netlify | Firebase (veja `LEIA-ME.md`) |

- `versao-claude-ai/sistema-draven.html` é a cópia exata da versão publicada no claude.ai.
- `site/` é a versão para Netlify + Firebase; `firestore.rules` são as regras do banco.
- Os dados de uma versão não aparecem na outra.

Instruções completas: [LEIA-ME.md](LEIA-ME.md).
