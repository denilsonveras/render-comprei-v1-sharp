# Render Comprei/PGFN — V1.5.6

Renderizador VERAS para cards JPG 1280x720 da plataforma Comprei/PGFN.

Stack:
- Vercel Function Node.js
- Satori + Resvg + Sharp
- Supabase Storage
- Fonte Inter TTF local

## Endpoint

`/api/render-comprei`

GET retorna diagnóstico do serviço e das fontes.
POST recebe os dados do imóvel e retorna:
- `cards_urls`
- `cards_data_uri`
- metadados dos cards

## Fontes necessárias

Coloque somente estes arquivos em `/fonts`:

- `Inter_18pt-Regular.ttf`
- `Inter_18pt-Bold.ttf`
- `Inter_18pt-Black.ttf`

Não usar WOFF2.

## V1.5.6

- Card 1: venda principal do imóvel, endereço, valor, avaliação, área segura e código.
- Card 2: condições de proposta, cronologia das etapas, fase atual e próxima etapa prevista.
- Card 3: documentação disponível para análise e contato.
- Se o imóvel estiver em `Compra em andamento` ou `Bem finalizado`, o debug marca `phase.removeFromList = true` para o n8n remover/suspender da lista comercial.


## V1.5.6
- Corrige extração do endereço: separa número do apartamento do número do prédio.
- Prioriza endereço público/comercial enviado pelo n8n.
- Mantém cards estáticos com valor mínimo/compra imediata, sem preço atual.
