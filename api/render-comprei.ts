import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const WIDTH = 1280;
const HEIGHT = 720;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'imagens';
const RENDER_API_TOKEN = process.env.RENDER_API_TOKEN || '';

function s(v: unknown, f = ''): string { return String(v ?? f).replace(/\s+/g, ' ').trim(); }
function esc(v: unknown): string {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function cut(v: string, n: number): string { return v.length > n ? v.slice(0, n - 1) + '…' : v; }
function brl(v: unknown): string {
  const n = Number(v || 0);
  return n ? n.toLocaleString('pt-BR', {style:'currency', currency:'BRL'}) : 'Consulte';
}
function wrap(v: string, max = 32, lines = 2): string[] {
  const words = v.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (next.length <= max) cur = next;
    else { if (cur) out.push(cur); cur = w; }
    if (out.length >= lines) break;
  }
  if (cur && out.length < lines) out.push(cur);
  return out;
}
function titleLines(t: string) {
  return wrap(t, 32, 2).map((l, i) =>
    `<text x="86" y="${226 + i*62}" font-size="54" font-family="Arial, Helvetica, sans-serif" font-weight="900" fill="#fff">${esc(l)}</text>`
  ).join('');
}
function bullets(items: string[]) {
  return items.slice(0,5).map((b, i) => {
    const y = 445 + i*58;
    return `<circle cx="123" cy="${y-9}" r="9" fill="#facc15"/><text x="149" y="${y}" font-size="29" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#fff">${esc(cut(b,48))}</text>`;
  }).join('');
}
function cardSvg({title, subtitle, badge, bulletList, footer, variant}: any): string {
  const accent = variant === 1 ? '#facc15' : variant === 2 ? '#38bdf8' : '#34d399';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#061a40"/><stop offset="50%" stop-color="#0b2b63"/><stop offset="100%" stop-color="#123d7a"/></linearGradient>
    <radialGradient id="glow" cx="82%" cy="18%" r="58%"><stop offset="0%" stop-color="${accent}" stop-opacity=".32"/><stop offset="100%" stop-color="${accent}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  <rect x="54" y="44" width="1172" height="632" rx="34" fill="none" stroke="#fff" stroke-width="4" opacity=".72"/>
  <circle cx="114" cy="101" r="32" fill="#fff"/><text x="114" y="113" text-anchor="middle" font-size="37" font-family="Arial" font-weight="900" fill="#071B3E">V</text>
  <text x="164" y="98" font-size="29" font-family="Arial" font-weight="900" fill="#fff" letter-spacing="1">VERAS NEGÓCIOS IMOBILIÁRIOS</text>
  <text x="164" y="127" font-size="18" font-family="Arial" fill="#cfe3ff">Especialista em imóveis PGFN / Comprei</text>
  <rect x="900" y="74" width="258" height="52" rx="26" fill="${accent}"/><text x="1029" y="108" text-anchor="middle" font-size="23" font-family="Arial" font-weight="900" fill="#071B3E">${esc(cut(badge,24))}</text>
  ${titleLines(cut(title,74))}
  <text x="86" y="350" font-size="31" font-family="Arial" fill="#dbeafe">${esc(cut(subtitle,62))}</text>
  <rect x="86" y="386" width="785" height="224" rx="25" fill="#fff" opacity=".10"/>${bullets(bulletList)}
  <text x="86" y="646" font-size="24" font-family="Arial" font-weight="700" fill="#fef3c7">${esc(cut(footer,82))}</text>
  <text x="1060" y="646" text-anchor="end" font-size="24" font-family="Arial" font-weight="900" fill="#fff">verasni.com</text>
</svg>`;
}
async function toJpg(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).flatten({background:'#fff'}).resize(WIDTH, HEIGHT).toColorspace('srgb').jpeg({
    quality: 86, progressive: false, mozjpeg: false, chromaSubsampling: '4:2:0'
  }).toBuffer();
}
function assertJpg(buf: Buffer, name: string) {
  if (!(buf.length > 10000 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) {
    throw new Error(`JPEG inválido ${name}: bytes=${buf.length} magic=${buf.subarray(0,4).toString('hex')}`);
  }
}
async function upload(path: string, buf: Buffer) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, buf, {
    contentType: 'image/jpeg', upsert: true, cacheControl: '31536000'
  });
  if (error) throw new Error(`Falha upload ${path}: ${error.message}`);
  return supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path).data.publicUrl;
}
function build(input: any) {
  const titulo = s(input.titulo, 'Imóvel PGFN / Comprei');
  const cidadeUf = `${s(input.cidade, 'Ceará')}${input.estado ? ' - ' + s(input.estado) : ''}`;
  const area = s(input.area_util || input.area_total || '1');
  const bairro = s(input.bairro, 'CENTRO');
  const codigo = s(input.origem_id || input.imovel_id);
  const valor = brl(input.valor_venda);
  return [
    { filename:'card1.jpg', svg: cardSvg({variant:1,title:titulo,subtitle:cidadeUf,badge:'OPORTUNIDADE PGFN',bulletList:[`Valor: ${valor}`,`Área: ${area} m²`,`Bairro: ${bairro}`,`Código: ${codigo}`],footer:'Assessoria VERAS para análise e proposta'}) },
    { filename:'card2.jpg', svg: cardSvg({variant:2,title:'Pode parcelar',subtitle:'Condições conforme regras da plataforma',badge:'PAGAMENTO',bulletList:['Possibilidade de parcelamento','Proposta pela plataforma Comprei','Análise conforme edital e fase do bem','Suporte VERAS no processo'],footer:'Condições sujeitas à aprovação e regras da PGFN'}) },
    { filename:'card3.jpg', svg: cardSvg({variant:3,title:'Como funciona',subtitle:'Plataforma oficial Comprei / PGFN',badge:'COMPRA SEGURA',bulletList:['Proposta no link oficial','Verifique documentos e matrícula','A VERAS orienta sua análise','Use o link correto para atendimento'],footer:'A proposta deve ser feita no link oficial do anúncio'}) },
  ];
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return res.status(200).json({ok:true,service:'render-comprei-v1-sharp'});
  if (req.method !== 'POST') return res.status(405).json({ok:false,error:'Use POST'});
  try {
    if (RENDER_API_TOKEN) {
      const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i,'').trim();
      if (token !== RENDER_API_TOKEN) return res.status(401).json({ok:false,error:'Token inválido'});
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Variáveis Supabase ausentes');
    const input = req.body;
    if (!input?.imovel_id) return res.status(400).json({ok:false,error:'Informe imovel_id'});
    const out: any[] = [];
    for (const c of build(input)) {
      const buf = await toJpg(c.svg);
      assertJpg(buf, c.filename);
      const path = `comprei/${input.imovel_id}/${c.filename}`;
      const url = await upload(path, buf);
      out.push({filename:c.filename, path, url, mime_type:'image/jpeg', width:WIDTH, height:HEIGHT, bytes:buf.length, magic_hex:buf.subarray(0,3).toString('hex'), data_uri:`data:image/jpeg;base64,${buf.toString('base64')}`});
    }
    return res.status(200).json({ok:true, imovel_id: input.imovel_id, cards_urls: out.map(x=>x.url), cards_data_uri: out.map(x=>x.data_uri), cards: out.map(({data_uri, ...r})=>r)});
  } catch(e:any) {
    return res.status(500).json({ok:false,error:e?.message || 'Erro desconhecido'});
  }
}
