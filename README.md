# Render Comprei — repo render-comprei-v1-sharp — versão atual V1.5.2

Esta versão substitui o renderizador antigo no repositório inicial `render-comprei-v1-sharp`, mantendo o mesmo endpoint:

```txt
/api/render-comprei
```

## Estrutura obrigatória

```txt
api/render-comprei.js
lib/templates.js
fonts/Inter_18pt-Regular.ttf
fonts/Inter_18pt-Bold.ttf
fonts/Inter_18pt-Black.ttf
package.json
vercel.json
```

## Fontes

Coloque manualmente na pasta `fonts/` apenas:

```txt
Inter_18pt-Regular.ttf
Inter_18pt-Bold.ttf
Inter_18pt-Black.ttf
```

Não use WOFF2. Não precisa subir 24pt, 28pt, Italic, Light, Medium etc.

## Variáveis da Vercel

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_BUCKET=imagens
RENDER_API_TOKEN
```

O `RENDER_API_TOKEN` precisa ser igual ao token configurado no n8n.

## Teste

Após o deploy, abra:

```txt
https://render-comprei-v1-sharp.vercel.app/api/render-comprei
```

O retorno precisa mostrar:

```json
"font_status": { "ok": true }
```

Se `font_status.ok` vier `false`, a Vercel não encontrou as fontes TTF.
