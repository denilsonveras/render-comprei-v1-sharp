# Render Comprei V1.5.3

Renderizador de cards VERAS para Comprei/PGFN.

## Stack

- Vercel Function Node.js
- Satori + Resvg + Sharp
- Fonte TTF local Inter
- Supabase Storage

## Fontes necessárias

Coloque em `fonts/` apenas:

- `Inter_18pt-Regular.ttf`
- `Inter_18pt-Bold.ttf`
- `Inter_18pt-Black.ttf`

Não use WOFF2.

## Endpoint

GET/POST `/api/render-comprei`

GET deve retornar `font_status.ok = true`.

## Melhorias V1.5.3

- títulos mais curtos e comerciais;
- inferência de tipo a partir do título, evitando apartamento sair como terreno;
- correção de overflow no cartório/documentação;
- fallbacks `Consultar` no lugar de `0` ou travessões excessivos;
- cards salvos em pasta `v153-{hash}`.
