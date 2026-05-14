import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
const WIDTH = 1280;
const HEIGHT = 720;

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'imagens';
const RENDER_API_TOKEN = process.env.RENDER_API_TOKEN || '';

const e = React.createElement;

function clean(v: unknown, fallback = ''): string {
  return String(v ?? fallback)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cut(v: unknown, n: number): string {
  const t = clean(v);
  return t.length > n ? `${t.slice(0, Math.max(0, n - 1))}…` : t;
}

function money(v: unknown, fallback = 'Consulte'): string {
  const n = Number(String(v ?? '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : fallback;
}

function pct(v: unknown): string {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? `${n}%` : '';
}

function dateBR(v: unknown): string {
  const t = clean(v);
  if (!t) return '';
  const br = t.match(/\d{2}\/\d{2}\/\d{4}/);
  if (br) return br[0];
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : t.slice(0, 10);
}

function firstNonEmpty(...vals: unknown[]): string {
  for (const v of vals) {
    const t = clean(v);
    if (t) return t;
  }
  return '';
}

function numFirst(...vals: unknown[]): unknown {
  for (const v of vals) {
    const t = clean(v);
    if (t && Number(t) > 0) return v;
  }
  return undefined;
}

let fontsCache: any[] | null = null;

function findFontFile(weight: 400 | 700): string {
  // @fontsource v5 normalmente instala WOFF2, não WOFF.
  // Não usamos require.resolve do subpath porque alguns pacotes bloqueiam subpaths por exports.
  const filesDir = path.join(process.cwd(), 'node_modules', '@fontsource', 'noto-sans', 'files');
  if (!fs.existsSync(filesDir)) {
    throw new Error(`Diretório de fontes não encontrado: ${filesDir}`);
  }

  const files = fs.readdirSync(filesDir);
  const preferred = [
    `noto-sans-latin-${weight}-normal.woff2`,
    `noto-sans-latin-${weight}-normal.woff`,
    `noto-sans-latin-ext-${weight}-normal.woff2`,
    `noto-sans-latin-ext-${weight}-normal.woff`
  ];

  for (const name of preferred) {
    const full = path.join(filesDir, name);
    if (fs.existsSync(full)) return full;
  }

  const re = new RegExp(`noto-sans.*latin.*${weight}.*normal.*\\.woff2?$`, 'i');
  const found = files.find(f => re.test(f));
  if (found) return path.join(filesDir, found);

  throw new Error(`Fonte Noto Sans ${weight} não encontrada. Arquivos disponíveis: ${files.slice(0, 25).join(', ')}`);
}

function loadFonts() {
  if (fontsCache) return fontsCache;

  const regularPath = findFontFile(400);
  const boldPath = findFontFile(700);

  fontsCache = [
    { name: 'Noto Sans', data: fs.readFileSync(regularPath), weight: 400, style: 'normal' },
    { name: 'Noto Sans', data: fs.readFileSync(boldPath), weight: 700, style: 'normal' }
  ];
  return fontsCache;
}

const styles: Record<string, any> = {
  page: {
    width: WIDTH,
    height: HEIGHT,
    display: 'flex',
    position: 'relative',
    background: 'linear-gradient(135deg, #061a40 0%, #0b2b63 56%, #123d7a 100%)',
    color: '#ffffff',
    fontFamily: 'Noto Sans',
    overflow: 'hidden'
  },
  glow: {
    position: 'absolute',
    right: -160,
    top: -200,
    width: 660,
    height: 660,
    borderRadius: 660,
    opacity: 0.20
  },
  border: {
    position: 'absolute',
    left: 48,
    top: 40,
    width: 1184,
    height: 640,
    border: '3px solid rgba(255,255,255,0.72)',
    borderRadius: 34
  },
  logoCircle: {
    position: 'absolute', left: 82, top: 68, width: 62, height: 62, borderRadius: 62,
    background: '#ffffff', color: '#071B3E', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 34, fontWeight: 700
  },
  brand: { position: 'absolute', left: 162, top: 78, fontSize: 27, fontWeight: 700, letterSpacing: 0.2 },
  brandSub: { position: 'absolute', left: 162, top: 112, fontSize: 18, fontWeight: 400, color: '#cfe3ff' },
  ribbon: {
    position: 'absolute', left: 914, top: 72, width: 248, height: 54, borderRadius: 27,
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#071B3E',
    fontSize: 21, fontWeight: 700, letterSpacing: 0.3
  },
  title: { position: 'absolute', left: 84, top: 196, width: 760, fontSize: 54, fontWeight: 700, lineHeight: 1.12 },
  subtitle: { position: 'absolute', left: 84, top: 330, width: 760, fontSize: 29, fontWeight: 400, color: '#dbeafe' },
  box: { position: 'absolute', left: 84, top: 386, width: 760, height: 226, borderRadius: 24, background: 'rgba(255,255,255,0.11)', display: 'flex', flexDirection: 'column', padding: '28px 30px', gap: 12 },
  bulletRow: { display: 'flex', alignItems: 'center', fontSize: 25, fontWeight: 700, color: '#ffffff' },
  bulletDot: { width: 15, height: 15, borderRadius: 15, marginRight: 22, flexShrink: 0 },
  side: { position: 'absolute', left: 882, top: 396, width: 280, height: 164, borderRadius: 26, background: 'rgba(255,255,255,0.14)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  sideTitle: { fontSize: 25, color: '#dbeafe', fontWeight: 700, marginBottom: 16 },
  sideValue: { fontSize: 33, fontWeight: 700, textAlign: 'center', padding: '0 12px' },
  footer: { position: 'absolute', left: 84, bottom: 62, width: 850, fontSize: 22, color: '#fef3c7', fontWeight: 700 },
  site: { position: 'absolute', right: 84, bottom: 62, fontSize: 24, color: '#ffffff', fontWeight: 700 }
};

function bullet(item: string, accent: string) {
  return e('div', { style: styles.bulletRow },
    e('div', { style: { ...styles.bulletDot, background: accent } }),
    e('div', { style: { display: 'flex' } }, cut(item, 56))
  );
}

function Card(props: any) {
  const accent = props.accent || '#facc15';
  return e('div', { style: styles.page },
    e('div', { style: { ...styles.glow, background: accent } }),
    e('div', { style: styles.border }),
    e('div', { style: styles.logoCircle }, 'V'),
    e('div', { style: styles.brand }, 'VERAS NEGÓCIOS IMOBILIÁRIOS'),
    e('div', { style: styles.brandSub }, 'Especialista em imóveis PGFN / Comprei'),
    e('div', { style: { ...styles.ribbon, background: accent } }, props.badge),
    e('div', { style: styles.title }, props.title),
    e('div', { style: styles.subtitle }, props.subtitle),
    e('div', { style: styles.box }, ...(props.bullets || []).slice(0, 5).map((x: string) => bullet(x, accent))),
    e('div', { style: styles.side },
      e('div', { style: styles.sideTitle }, props.sideTitle || 'PGFN'),
      e('div', { style: styles.sideValue }, props.sideValue || 'Comprei')
    ),
    e('div', { style: styles.footer }, props.footer),
    e('div', { style: styles.site }, 'verasni.com')
  );
}

function buildCards(input: any) {
  const imovelId = clean(input.imovel_id);
  const codigo = firstNonEmpty(input.origem_id, input.codigo_bem, imovelId);
  const titulo = firstNonEmpty(input.titulo, input.titulo_anuncio, input.descricao_curta, 'Imóvel PGFN / Comprei');
  const bairro = firstNonEmpty(input.bairro, 'Bairro a conferir');
  const cidade = firstNonEmpty(input.cidade, 'Cidade');
  const estado = firstNonEmpty(input.estado, 'CE');
  const local = `${bairro} • ${cidade}/${estado}`;

  const valorVenda = money(numFirst(input.valor_venda, input.preco_atual, input.valor_minimo_venda, input.valor_minimo));
  const valorAvaliacao = money(numFirst(input.valor_avaliacao, input.avaliacao, input.valor_venda));
  const area = firstNonEmpty(input.area_util, input.area_total, input.area_terreno, input.area_registral_m2);
  const fase = firstNonEmpty(input.fase_atual, input.etapa_comprei, input.status_anuncio, 'PGFN / Comprei');
  const matricula = firstNonEmpty(input.matricula, input.matricula_oficial, input.matricula_numero);
  const cartorio = firstNonEmpty(input.cartorio, input.cartorio_nome);
  const entrada = pct(firstNonEmpty(input.percentual_minimo_valor_entrada, input.entrada_minima));
  const avista = pct(firstNonEmpty(input.percentual_minimo_valor_avista, input.minimo_avista));
  const parcelado = pct(firstNonEmpty(input.percentual_minimo_valor_parcelado, input.minimo_parcelado));
  const maxParcelas = firstNonEmpty(input.quantidade_maxima_parcelas, input.max_parcelas);
  const primeiraFase = dateBR(firstNonEmpty(input.data_primeira_fase, input.data_final_primeira_fase_propostas));
  const fimNegociacao = dateBR(firstNonEmpty(input.data_fim_negociacao, input.data_fim_negociacao_com_devedor));
  const temDocs = !!firstNonEmpty(input.documentos_drive_url, input.link_documentos, input.documentosBem);

  return [
    {
      filename: 'card1.jpg', accent: '#facc15', badge: 'OPORTUNIDADE',
      title: 'Imóvel PGFN / Comprei', subtitle: local,
      bullets: [
        `Compra imediata: ${valorVenda}`,
        `Avaliação informada: ${valorAvaliacao}`,
        area ? `Área informada: ${area} m²` : 'Área a conferir nos documentos',
        `Código do bem: ${codigo || imovelId}`,
        cut(titulo, 54)
      ],
      footer: 'Assessoria VERAS para análise, documentação e proposta', sideTitle: 'VALOR', sideValue: valorVenda
    },
    {
      filename: 'card2.jpg', accent: '#38bdf8', badge: 'PAGAMENTO',
      title: 'Condições de proposta', subtitle: fase,
      bullets: [
        entrada ? `Entrada mínima: ${entrada}` : 'Entrada conforme regra oficial',
        maxParcelas ? `Parcelamento em até ${maxParcelas}x` : 'Parcelamento conforme plataforma',
        avista ? `À vista mínimo: ${avista}` : 'Proposta pela plataforma oficial',
        parcelado ? `Parcelado mínimo: ${parcelado}` : 'Condições sujeitas à análise',
        primeiraFase ? `1ª fase até ${primeiraFase}` : (fimNegociacao ? `Negociação até ${fimNegociacao}` : 'Prazos sujeitos à PGFN')
      ],
      footer: 'Condições podem mudar e dependem das regras oficiais da PGFN', sideTitle: 'PROPOSTA', sideValue: 'OFICIAL'
    },
    {
      filename: 'card3.jpg', accent: '#34d399', badge: 'DILIGÊNCIA',
      title: 'Análise documental', subtitle: 'Matrícula, cartório e documentos do bem',
      bullets: [
        matricula ? `Matrícula: ${matricula}` : 'Conferir matrícula do imóvel',
        cartorio ? `Cartório: ${cut(cartorio, 38)}` : 'Cartório a conferir',
        temDocs ? 'Documentos disponíveis para análise' : 'Solicite conferência documental',
        'Verificar ônus, medidas e confrontações',
        'Análise antes de enviar proposta'
      ],
      footer: 'A VERAS orienta a conferência documental antes da proposta', sideTitle: 'ANÁLISE', sideValue: 'VERAS'
    }
  ];
}

async function renderToJpg(card: any): Promise<Buffer> {
  const svg = await satori(e(Card, card), {
    width: WIDTH,
    height: HEIGHT,
    fonts: loadFonts()
  });

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    background: '#ffffff'
  }).render().asPng();

  return sharp(Buffer.from(png))
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 90, progressive: false, mozjpeg: false, chromaSubsampling: '4:2:0' })
    .toBuffer();
}

function assertJpg(buf: Buffer, name: string) {
  if (!(buf.length > 10000 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) {
    throw new Error(`JPEG inválido ${name}: bytes=${buf.length} magic=${buf.subarray(0, 4).toString('hex')}`);
  }
}

async function upload(path: string, buf: Buffer): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, buf, {
    contentType: 'image/jpeg',
    upsert: true,
    cacheControl: '3600'
  });
  if (error) throw new Error(`Falha upload ${path}: ${error.message}`);
  return supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'render-comprei-v1-4-1-satori-resvg-font-path-fix',
      engine: 'satori-resvg-sharp',
      font: 'noto-sans-fontsource-woff2-path-fix'
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Use POST' });

  try {
    if (RENDER_API_TOKEN) {
      const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
      if (token !== RENDER_API_TOKEN) return res.status(401).json({ ok: false, error: 'Token inválido' });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Variáveis Supabase ausentes');

    const input = req.body || {};
    if (!input.imovel_id) return res.status(400).json({ ok: false, error: 'Informe imovel_id' });

    const versionPath = `v141-${Date.now()}`;
    const cards = buildCards(input);
    const out: any[] = [];

    for (const card of cards) {
      const buf = await renderToJpg(card);
      assertJpg(buf, card.filename);
      const path = `comprei/${clean(input.imovel_id)}/${versionPath}/${card.filename}`;
      const url = await upload(path, buf);
      out.push({
        filename: card.filename,
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
      service: 'render-comprei-v1-4-1-satori-resvg-font-path-fix',
      imovel_id: input.imovel_id,
      cards_urls: out.map(x => x.url),
      cards_data_uri: out.map(x => x.data_uri),
      cards: out.map(({ data_uri, ...r }) => r),
      debug_received: {
        origem_id: input.origem_id || null,
        titulo: input.titulo || null,
        cidade: input.cidade || null,
        bairro: input.bairro || null,
        valor_venda: input.valor_venda || null,
        valor_avaliacao: input.valor_avaliacao || null,
        matricula: input.matricula || input.matricula_oficial || null,
        cartorio: input.cartorio || input.cartorio_nome || null,
        documentos_drive_url: input.documentos_drive_url || input.link_documentos || null
      }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, service: 'render-comprei-v1-4-1-satori-resvg-font-path-fix', error: err?.message || 'Erro desconhecido' });
  }
}
