// api/render-comprei.js
// VERAS — Renderizador COMPREI/PGFN V1.5.3 — PATCH PARA REPO render-comprei-v1-sharp
// Stack recomendada pelas respostas anexadas: Satori + Resvg + Sharp + TTF local.
// Sem Puppeteer. Sem WOFF2. Sem depender de fonte do sistema da Vercel.

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { card1, card2, card3, BG1, BG2, BG3, normalizedDebug } from '../lib/templates.js';

const SERVICE = 'render-comprei-v1-sharp-current-v1-5-3-satori-resvg-sharp-ttf';
const WIDTH = 1280;
const HEIGHT = 720;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'imagens';
const RENDER_API_TOKEN = process.env.RENDER_API_TOKEN || process.env.RENDER_TOKEN || '';

// Aceita tanto os nomes simplificados quanto os nomes baixados do Google Fonts,
// que geralmente vêm com o eixo ótico no nome: Inter_18pt-Regular.ttf, etc.
const FONT_CANDIDATES = {
  regular: [
    'Inter-Regular.ttf',
    'Inter_18pt-Regular.ttf',
    'Inter_24pt-Regular.ttf',
    'Inter_28pt-Regular.ttf',
  ],
  bold: [
    'Inter-Bold.ttf',
    'Inter_18pt-Bold.ttf',
    'Inter_24pt-Bold.ttf',
    'Inter_28pt-Bold.ttf',
    'Inter_18pt-SemiBold.ttf',
    'Inter_24pt-SemiBold.ttf',
    'Inter_28pt-SemiBold.ttf',
  ],
  black: [
    'Inter-Black.ttf',
    'Inter_18pt-Black.ttf',
    'Inter_24pt-Black.ttf',
    'Inter_28pt-Black.ttf',
    'Inter_18pt-ExtraBold.ttf',
    'Inter_24pt-ExtraBold.ttf',
    'Inter_28pt-ExtraBold.ttf',
  ],
};

let fontsCache = null;
let supabaseCache = null;

function fontsDir() {
  return path.join(process.cwd(), 'fonts');
}

function fontPath(filename) {
  return path.join(fontsDir(), filename);
}

function listFontFiles() {
  try {
    return fs.readdirSync(fontsDir()).filter(f => /\.ttf$/i.test(f)).sort();
  } catch {
    return [];
  }
}

function resolveFont(role) {
  const candidates = FONT_CANDIDATES[role] || [];
  for (const filename of candidates) {
    if (fs.existsSync(fontPath(filename))) return filename;
  }
  return null;
}

function resolvedFontMap() {
  return {
    regular: resolveFont('regular'),
    bold: resolveFont('bold'),
    black: resolveFont('black'),
  };
}

function fontStatus() {
  const resolved = resolvedFontMap();
  return {
    resolved,
    available_ttf_files: listFontFiles(),
    candidates: FONT_CANDIDATES,
    ok: Boolean(resolved.regular && resolved.bold && resolved.black),
  };
}

function loadFonts() {
  if (fontsCache) return fontsCache;

  const resolved = resolvedFontMap();
  const missingRoles = Object.entries(resolved).filter(([, f]) => !f).map(([role]) => role);
  if (missingRoles.length) {
    throw new Error(
      `Fontes TTF ausentes para os pesos: ${missingRoles.join(', ')}. ` +
      `Arquivos encontrados em /fonts: ${listFontFiles().join(', ') || 'nenhum'}. ` +
      `Use TTF, não WOFF2. O vercel.json deve ter includeFiles: fonts/**.`
    );
  }

  const regular = fs.readFileSync(fontPath(resolved.regular));
  const bold = fs.readFileSync(fontPath(resolved.bold));
  const black = fs.readFileSync(fontPath(resolved.black));

  fontsCache = [
    { name: 'Inter', data: regular, weight: 400, style: 'normal' },
    { name: 'Inter', data: bold, weight: 700, style: 'normal' },
    { name: 'Inter', data: black, weight: 900, style: 'normal' },
  ];
  return fontsCache;
}

function getSupabase() {
  if (supabaseCache) return supabaseCache;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes nas variáveis da Vercel.');
  }
  supabaseCache = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseCache;
}

function authOk(req) {
  if (!RENDER_API_TOKEN) return true;
  const header = String(req.headers.authorization || '');
  return header === `Bearer ${RENDER_API_TOKEN}`;
}

async function renderJpg(tree, bgColor) {
  const svg = await satori(tree, {
    width: WIDTH,
    height: HEIGHT,
    fonts: loadFonts(),
  });

  const png = new Resvg(svg, {
    background: bgColor,
    fitTo: { mode: 'width', value: WIDTH },
    font: { loadSystemFonts: false },
  }).render().asPng();

  const jpg = await sharp(png)
    .flatten({ background: bgColor })
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .toColorspace('srgb')
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:2:0', progressive: false })
    .toBuffer();

  if (jpg[0] !== 0xff || jpg[1] !== 0xd8 || jpg[2] !== 0xff) {
    throw new Error('JPEG inválido: magic bytes diferentes de FF D8 FF.');
  }
  return jpg;
}

async function upload(buffer, key) {
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(key, buffer, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw new Error(`Supabase upload ${key}: ${error.message}`);
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

function safeId(v) {
  return String(v || 'imovel').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

function buildStorageBase(input) {
  const id = safeId(input.imovel_id || input.codigo || input.origem_id || input.idBem);
  const hash = crypto.createHash('sha1').update(JSON.stringify(input)).digest('hex').slice(0, 10);
  return `comprei/${id}/v153-${hash}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: SERVICE,
      engine: 'satori-resvg-sharp',
      expected_endpoint: '/api/render-comprei',
      bucket: SUPABASE_BUCKET,
      font_status: fontStatus(),
      notes: [
        'POST exige TTF local em /fonts.',
        'Não usar WOFF2.',
        'Aceita nomes simplificados Inter-Regular.ttf ou nomes do Google Fonts como Inter_18pt-Regular.ttf.',
      ],
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Use GET ou POST.' });
  if (!authOk(req)) return res.status(401).json({ ok: false, error: 'Authorization Bearer inválido.' });

  const started = Date.now();
  try {
    const input = req.body || {};
    if (!input.imovel_id && !input.origem_id && !input.codigo) {
      return res.status(400).json({ ok: false, error: 'Informe imovel_id, origem_id ou codigo.' });
    }
    if (!input.titulo) {
      return res.status(400).json({ ok: false, error: 'Informe titulo.' });
    }

    const [jpg1, jpg2, jpg3] = await Promise.all([
      renderJpg(card1(input), BG1),
      renderJpg(card2(input), BG2),
      renderJpg(card3(input), BG3),
    ]);

    const base = buildStorageBase(input);
    const keys = [`${base}/card1.jpg`, `${base}/card2.jpg`, `${base}/card3.jpg`];
    const [url1, url2, url3] = await Promise.all([
      upload(jpg1, keys[0]),
      upload(jpg2, keys[1]),
      upload(jpg3, keys[2]),
    ]);

    const cards = [
      { filename: 'card1.jpg', path: keys[0], url: url1, mime_type: 'image/jpeg', width: WIDTH, height: HEIGHT, bytes: jpg1.length, magic_hex: jpg1.subarray(0, 3).toString('hex') },
      { filename: 'card2.jpg', path: keys[1], url: url2, mime_type: 'image/jpeg', width: WIDTH, height: HEIGHT, bytes: jpg2.length, magic_hex: jpg2.subarray(0, 3).toString('hex') },
      { filename: 'card3.jpg', path: keys[2], url: url3, mime_type: 'image/jpeg', width: WIDTH, height: HEIGHT, bytes: jpg3.length, magic_hex: jpg3.subarray(0, 3).toString('hex') },
    ];

    return res.status(200).json({
      ok: true,
      service: SERVICE,
      imovel_id: input.imovel_id || null,
      origem_id: input.origem_id || input.codigo || null,
      cards_urls: [url1, url2, url3],
      cards_data_uri: [
        `data:image/jpeg;base64,${jpg1.toString('base64')}`,
        `data:image/jpeg;base64,${jpg2.toString('base64')}`,
        `data:image/jpeg;base64,${jpg3.toString('base64')}`,
      ],
      cards,
      debug_received: normalizedDebug(input),
      meta: { elapsed_ms: Date.now() - started, generated_at: new Date().toISOString(), storage_base: base },
    });
  } catch (err) {
    console.error(`[${SERVICE}]`, err);
    return res.status(500).json({
      ok: false,
      service: SERVICE,
      error: err.message,
      font_status: fontStatus(),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '12mb' }, externalResolver: true },
  maxDuration: 30,
};
