import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const WIDTH = 1280;
const HEIGHT = 720;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'imagens';
const RENDER_API_TOKEN = process.env.RENDER_API_TOKEN || '';

function s(v: unknown, f = ''): string {
  return String(v ?? f)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function cut(v: string, n: number): string { return v.length > n ? v.slice(0, Math.max(0, n - 1)) + '…' : v; }
function brl(v: unknown, fallback = 'Consulte'): string {
  const n = Number(v || 0);
  return Number.isFinite(n) && n > 0 ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : fallback;
}
function pctLabel(v: unknown): string {
  const n = Number(v ?? '');
  return Number.isFinite(n) ? `${n}%` : '';
}
function dateBr(v: unknown): string {
  const t = s(v);
  if (!t) return '';
  const m = t.match(/\d{2}\/\d{2}\/\d{4}/);
  if (m) return m[0];
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : t.slice(0, 10);
}
function wrap(v: string, max = 30, lines = 2): string[] {
  const words = s(v).split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= max) cur = next;
    else {
      if (cur) out.push(cur);
      cur = w.length > max ? cut(w, max) : w;
    }
    if (out.length >= lines) break;
  }
  if (cur && out.length < lines) out.push(cur);
  return out.length ? out : ['Imóvel PGFN'];
}

let fontCssCache: string | null = null;

function readPdfMakeRobotoBase64(name: string): string | null {
  try {
    const mod = require('pdfmake/build/vfs_fonts.js');
    const vfs = mod?.pdfMake?.vfs || mod?.vfs || mod?.default?.pdfMake?.vfs || mod?.default?.vfs;
    return vfs?.[name] || null;
  } catch (_err) {
    return null;
  }
}

function fontCss(): string {
  if (fontCssCache !== null) return fontCssCache;

  const regular = readPdfMakeRobotoBase64('Roboto-Regular.ttf');
  const bold = readPdfMakeRobotoBase64('Roboto-Medium.ttf') || readPdfMakeRobotoBase64('Roboto-Bold.ttf');

  if (regular) {
    fontCssCache = `
      @font-face { font-family: 'VerasSans'; src: url(data:font/truetype;charset=utf-8;base64,${regular}) format('truetype'); font-weight: 400; font-style: normal; }
      ${bold ? `@font-face { font-family: 'VerasSans'; src: url(data:font/truetype;charset=utf-8;base64,${bold}) format('truetype'); font-weight: 700; font-style: normal; }` : ''}
      text { font-family: 'VerasSans'; }
      .regular { font-family: 'VerasSans'; font-weight: 400; }
      .bold { font-family: 'VerasSans'; font-weight: 700; }
    `;
  } else {
    fontCssCache = `text { font-family: Arial, Helvetica, sans-serif; }`;
  }
  return fontCssCache;
}

function cardSvg({ variant, title, subtitle, badge, bullets, footer, sideTitle, sideValue }: any): string {
  const accent = variant === 1 ? '#facc15' : variant === 2 ? '#38bdf8' : '#34d399';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    ${baseSvg(accent)}
    ${ribbon(badge, accent)}
    ${titleBlock(title, 84, 238, 49, 34, 2)}
    ${text(84, 354, cut(subtitle, 68), 29, '#dbeafe', 400)}
    <rect x="84" y="386" width="760" height="226" rx="24" fill="#ffffff" opacity=".11"/>
    ${bulletList(bullets, 116, 434)}
    <rect x="882" y="396" width="280" height="164" rx="26" fill="#ffffff" opacity=".14"/>
    ${text(1022, 454, cut(sideTitle || 'PGFN', 20), 25, '#dbeafe', 700, 'text-anchor="middle"')}
    ${text(1022, 510, cut(sideValue || 'Comprei', 20), 34, '#ffffff', 900, 'text-anchor="middle"')}
    ${text(84, 648, cut(footer, 88), 22, '#fef3c7', 700)}
    ${text(1148, 648, 'verasni.com', 24, '#ffffff', 900, 'text-anchor="end"')}
  </svg>`;
}

async function toJpg(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg, 'utf8'))
    .flatten({ background: '#ffffff' })
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .toColorspace('srgb')
    .jpeg({ quality: 88, progressive: false, mozjpeg: false, chromaSubsampling: '4:2:0' })
    .toBuffer();
}
function assertJpg(buf: Buffer, name: string) {
  if (!(buf.length > 10000 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) {
    throw new Error(`JPEG inválido ${name}: bytes=${buf.length} magic=${buf.subarray(0, 4).toString('hex')}`);
  }
}
async function upload(path: string, buf: Buffer) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, buf, {
    contentType: 'image/jpeg', upsert: true, cacheControl: '3600'
  });
  if (error) throw new Error(`Falha upload ${path}: ${error.message}`);
  return supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function build(input: any) {
  const titulo = s(input.titulo, 'Imóvel PGFN / Comprei');
  const cidadeUf = `${s(input.bairro, 'Bairro')} • ${s(input.cidade, 'Cidade')}${input.estado ? '/' + s(input.estado) : ''}`;
  const codigo = s(input.origem_id || input.imovel_id);
  const valorVenda = brl(input.valor_venda);
  const valorAvaliacao = brl(input.valor_avaliacao || input.valor_venda);
  const area = s(input.area_util || input.area_total || '');
  const fase = s(input.fase_atual || input.etapa_comprei || 'PGFN / Comprei');
  const matricula = s(input.matricula);
  const cartorio = s(input.cartorio);
  const primeiraFase = dateBr(input.data_primeira_fase);
  const fimNegociacao = dateBr(input.data_fim_negociacao);
  const entrada = pctLabel(input.percentual_minimo_valor_entrada);
  const avista = pctLabel(input.percentual_minimo_valor_avista);
  const parcelado = pctLabel(input.percentual_minimo_valor_parcelado);
  const maxParcelas = s(input.quantidade_maxima_parcelas);
  const temDocs = Boolean(s(input.documentos_drive_url));

  return [
    {
      filename: 'card1.jpg',
      svg: cardSvg({
        variant: 1,
        title: 'Imóvel PGFN / Comprei',
        subtitle: cidadeUf,
        badge: 'OPORTUNIDADE',
        bullets: [
          `Compra imediata: ${valorVenda}`,
          `Avaliação informada: ${valorAvaliacao}`,
          area ? `Área informada: ${area} m²` : 'Área a conferir nos documentos',
          `Código do bem: ${codigo}`,
          cut(titulo, 52)
        ],
        footer: 'Assessoria VERAS para análise, documentação e proposta',
        sideTitle: 'VALOR',
        sideValue: valorVenda
      })
    },
    {
      filename: 'card2.jpg',
      svg: cardSvg({
        variant: 2,
        title: 'Condições de proposta',
        subtitle: fase,
        badge: 'PAGAMENTO',
        bullets: [
          entrada ? `Entrada mínima: ${entrada}` : 'Entrada conforme regra oficial',
          maxParcelas ? `Parcelamento em até ${maxParcelas}x` : 'Parcelamento conforme plataforma',
          avista ? `À vista mínimo: ${avista}` : 'Proposta pela plataforma oficial',
          parcelado ? `Parcelado mínimo: ${parcelado}` : 'Condições sujeitas à análise',
          primeiraFase ? `1ª fase até ${primeiraFase}` : (fimNegociacao ? `Negociação até ${fimNegociacao}` : 'Prazos sujeitos à PGFN')
        ],
        footer: 'Condições podem mudar e dependem das regras oficiais da PGFN',
        sideTitle: 'PROPOSTA',
        sideValue: 'OFICIAL'
      })
    },
    {
      filename: 'card3.jpg',
      svg: cardSvg({
        variant: 3,
        title: 'Análise documental',
        subtitle: 'Matrícula, cartório e documentos do bem',
        badge: 'DILIGÊNCIA',
        bullets: [
          matricula ? `Matrícula: ${matricula}` : 'Conferir matrícula do imóvel',
          cartorio ? `Cartório: ${cut(cartorio, 38)}` : 'Cartório a conferir',
          temDocs ? 'Documentos disponíveis para análise' : 'Solicite conferência documental',
          'Verificar ônus, medidas e confrontações',
          'Análise antes de enviar proposta'
        ],
        footer: 'A VERAS orienta a conferência documental antes da proposta',
        sideTitle: 'ANÁLISE',
        sideValue: 'VERAS'
      })
    }
  ];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'render-comprei-v1-3-sharp', cards: 'pgfn-font-fix-v1-2' });
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Use POST' });
  try {
    if (RENDER_API_TOKEN) {
      const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
      if (token !== RENDER_API_TOKEN) return res.status(401).json({ ok: false, error: 'Token inválido' });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Variáveis Supabase ausentes');
    const input = req.body;
    if (!input?.imovel_id) return res.status(400).json({ ok: false, error: 'Informe imovel_id' });

    const versionPath = `v13-${Date.now()}`;
    const out: any[] = [];
    for (const c of build(input)) {
      const buf = await toJpg(c.svg);
      assertJpg(buf, c.filename);
      const path = `comprei/${input.imovel_id}/${versionPath}/${c.filename}`;
      const url = await upload(path, buf);
      out.push({
        filename: c.filename,
        path,
        url,
        mime_type: 'image/jpeg',
        width: WIDTH,
        height: HEIGHT,
        bytes: buf.length,
        magic_hex: buf.subarray(0, 3).toString('hex'),
        data_uri: `data:image/jpeg;base64,${buf.toString('base64')}`
      });
    }
    return res.status(200).json({
      ok: true,
      service: 'render-comprei-v1-3-sharp',
      imovel_id: input.imovel_id,
      cards_urls: out.map(x => x.url),
      cards_data_uri: out.map(x => x.data_uri),
      cards: out.map(({ data_uri, ...r }) => r)
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Erro desconhecido' });
  }
}
