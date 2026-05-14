# RENDER_COMPREI_V1_SHARP

Renderizador HTTP para gerar 3 cards JPG 1280x720 para imóveis COMPREI/PGFN.

## Deploy na Vercel

Configure as variáveis:

SUPABASE_URL=https://lxllourtsmaxahljokfz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BUCKET=imagens
RENDER_API_TOKEN=crie_um_token_forte

Endpoint:
POST /api/render-comprei

Retorna:
- cards_urls
- cards_data_uri
- valida magic bytes JPEG FF D8 FF
