# Render Comprei V1.3 Sharp — Font Fix definitivo

Versão atual para substituir as anteriores V1.1/V1.2.

Correção principal:
- Não depende de fonte do sistema da Vercel.
- Usa Roboto TTF embutida a partir do pacote `pdfmake/build/vfs_fonts.js`.
- Injeta a fonte em base64 dentro do próprio SVG via `@font-face`.
- Salva em caminho novo para evitar cache: `comprei/{imovel_id}/v13-{timestamp}/card1.jpg`.

Endpoints:
- GET `/api/render-comprei` retorna status.
- POST gera 3 JPGs 1280x720, salva no Supabase Storage e retorna `cards_urls` e `cards_data_uri`.

Variáveis de ambiente:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_BUCKET=imagens
- RENDER_API_TOKEN
