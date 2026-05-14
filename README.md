# RENDER_COMPREI_V1_4_SATORI_RESVG_CURRENT

Versão atual para corrigir cards sem texto/quadradinhos.

Mudança principal:
- abandona texto SVG renderizado direto pelo Sharp;
- usa Satori + Resvg com Noto Sans carregada como bytes;
- converte para JPG via Sharp;
- salva em `comprei/{imovel_id}/v14-{timestamp}/card1.jpg` etc.

O workflow n8n V8.2-A pode continuar chamando o mesmo endpoint `/api/render-comprei`.
