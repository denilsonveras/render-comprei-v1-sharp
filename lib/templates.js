// VERAS COMPREI/PGFN — Templates Satori V1.5.3
// Objetivo: cards mais limpos, sem vazamento de texto, sem ícones unicode e com fallbacks seguros.
// Usar apenas flexbox compatível com Satori.

export const COLORS = {
  navy: '#0B1E3A',
  navy2: '#112B50',
  cream: '#F6EFE5',
  ink: '#122033',
  inkSoft: '#4C5B6D',
  gold: '#D6A84F',
  goldDark: '#A8782A',
  green: '#176B4D',
  green2: '#10523A',
  white: '#FFFFFF',
  muted: '#D9E2EC',
  line: '#D8C6A4',
  danger: '#C84E3A',
};

export const BG1 = COLORS.navy;
export const BG2 = COLORS.cream;
export const BG3 = COLORS.green;

const el = (style, children = []) => ({ type: 'div', props: { style, children } });
const tx = (style, children = '') => ({ type: 'div', props: { style: { display: 'flex', ...style }, children: String(children ?? '') } });

function clean(v, fallback = '—') {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  return s || fallback;
}

function numberBR(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/R\$|\s|\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function money(v, fallback = 'Consultar') {
  const n = numberBR(v);
  if (n == null || n <= 0) return fallback;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function percent(v, fallback = 'Consultar') {
  const n = numberBR(v);
  if (n == null || n <= 0) return fallback;
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

function area(v) {
  const n = numberBR(v);
  if (n == null || n <= 0) return 'Consultar';
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`;
}

function intOrConsultar(v) {
  const n = numberBR(v);
  if (n == null || n <= 0) return 'Consultar';
  return String(Math.round(n));
}

function dateBR(v) {
  if (!v) return 'Consultar';
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return clean(v, 'Consultar');
  return d.toLocaleDateString('pt-BR');
}

function limit(s, max = 60) {
  const t = clean(s, '');
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

function inferTipo(input) {
  const txt = `${input.tipo || ''} ${input.subtipo || ''} ${input.titulo || ''}`.toLowerCase();
  if (txt.includes('apart')) return 'Apartamento';
  if (txt.includes('casa')) return 'Casa';
  if (txt.includes('terreno') || txt.includes('lote')) return 'Terreno';
  if (txt.includes('sala')) return 'Sala comercial';
  if (txt.includes('loja')) return 'Loja';
  if (txt.includes('galp')) return 'Galpão';
  return clean(input.tipo ?? input.subtipo ?? input.subtipo_imovel, 'Imóvel');
}

function inferBairro(input) {
  const provided = clean(input.bairro, '');
  const title = clean(input.titulo, '');
  const bairros = ['Aldeota', 'Meireles', 'Cocó', 'Mucuripe', 'Varjota', 'Dionísio Torres', 'Papicu', 'Centro', 'Fátima', 'Benfica', 'Cambeba', 'Messejana', 'Passaré', 'Parangaba', 'Maraponga'];
  const found = bairros.find(b => new RegExp(`\\b${b}\\b`, 'i').test(title));
  if (found && (!provided || /^centro$/i.test(provided))) return found;
  return provided || found || 'Região';
}

function compactTitle(input) {
  const tipo = inferTipo(input);
  const bairro = inferBairro(input);
  const title = clean(input.titulo, '');
  const num = title.match(/(?:n[ºo.]?|número)\s*(\d{1,5})/i)?.[1];

  if (/apart/i.test(tipo)) {
    return num ? `Apartamento nº ${num} em ${bairro}` : `Apartamento em ${bairro}`;
  }
  if (/terreno|lote/i.test(tipo)) return `${tipo} em ${clean(input.cidade, 'Fortaleza')}/${clean(input.estado ?? input.uf, 'CE')}`;
  if (/casa/i.test(tipo)) return `${tipo} em ${bairro}`;
  return limit(title, 86);
}

function hasDoc(v) { return !!String(v || '').trim(); }

function valueFontSize(value) {
  const s = String(value || '');
  if (s.length > 44) return 20;
  if (s.length > 30) return 23;
  if (s.length > 20) return 27;
  return 32;
}

function miniLabel(label, value, dark = false, opts = {}) {
  const v = clean(value, 'Consultar');
  const fs = opts.fontSize || valueFontSize(v);
  const lines = opts.lines || (v.length > 28 ? 3 : 2);
  return el({
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: dark ? 'rgba(255,255,255,0.10)' : COLORS.white,
    padding: '18px 20px',
    width: opts.width || 255,
    height: opts.height || 130,
    borderTop: `4px solid ${COLORS.gold}`,
    overflow: 'hidden',
  }, [
    tx({ fontSize: 15, fontWeight: 700, letterSpacing: 2, color: dark ? COLORS.gold : COLORS.goldDark }, label),
    tx({ fontSize: fs, fontWeight: 900, lineHeight: 1.05, marginTop: 11, color: dark ? COLORS.white : COLORS.ink, lineClamp: lines }, v),
  ]);
}

function pill(text, dark = true) {
  return el({ display: 'flex', padding: '10px 22px', backgroundColor: dark ? COLORS.gold : COLORS.navy }, [
    tx({ fontSize: 21, fontWeight: 900, letterSpacing: 2, color: dark ? COLORS.navy : COLORS.white }, text),
  ]);
}

function brand(dark = true) {
  return el({ display: 'flex', alignItems: 'center', gap: 16 }, [
    el({ display: 'flex', width: 8, height: 42, backgroundColor: COLORS.gold }, []),
    tx({ fontSize: 35, fontWeight: 900, letterSpacing: 4, color: dark ? COLORS.white : COLORS.ink }, 'VERAS'),
  ]);
}

function normalizeImovel(input) {
  const valorVenda = input.valor_atual ?? input.preco_atual ?? input.valor_venda ?? input.valor ?? input.preco ?? input.valor_minimo;
  const valorAvaliacao = input.valor_avaliacao ?? input.avaliacao;
  const uf = input.uf ?? input.estado ?? 'CE';
  const codigo = input.codigo ?? input.origem_id ?? input.idBem ?? input.imovel_id ?? 'PGFN';
  const tipo = inferTipo(input);
  const bairro = inferBairro(input);

  return {
    imovel_id: clean(input.imovel_id ?? codigo, String(codigo)),
    codigo: clean(codigo, 'PGFN'),
    origem: clean(input.origem ?? 'COMPREI/PGFN', 'COMPREI/PGFN'),
    titulo: clean(input.titulo, 'Imóvel PGFN'),
    tituloCurto: compactTitle(input),
    tipo,
    cidade: clean(input.cidade ?? input.municipioNome, 'Cidade'),
    uf: clean(uf, 'CE'),
    bairro,
    area: area(input.area_util ?? input.area_total ?? input.area),
    valorVenda: money(valorVenda),
    valorAvaliacao: money(valorAvaliacao),
    valorMinimo: money(input.valor_minimo ?? input.valorMinimoVenda ?? input.valor_minimo_venda),
    entrada: percent(input.percentual_minimo_valor_entrada ?? input.percentualMinimoValorEntrada),
    avista: percent(input.percentual_minimo_valor_avista ?? input.percentualMinimoValorAVista),
    parcelado: percent(input.percentual_minimo_valor_parcelado ?? input.percentualMinimoValorParcelado),
    parcelas: intOrConsultar(input.quantidade_maxima_parcelas ?? input.quantidadeMaximaDeParcelas),
    parcelaMinima: money(input.valor_minimo_parcela ?? input.valorMinimoParcela),
    dataPrimeiraFase: dateBR(input.data_final_primeira_fase ?? input.dataFinalPrimeiraFaseDePropostas),
    dataFimNegociacao: dateBR(input.data_fim_negociacao ?? input.dataFimNegociacaoComDevedor),
    matricula: clean(input.matricula ?? input.matricula_oficial ?? input.matriculaOficial, 'A consultar'),
    cartorio: clean(input.cartorio ?? input.cartorio_nome ?? input.nomeCartorio, 'A consultar'),
    gravame: clean(input.gravames_resumo ?? input.constricaoNome ?? input.situacao_matricula, 'Conferir matrícula'),
    docs: hasDoc(input.documentos_drive_url ?? input.link_documentos ?? input.documentosBem) ? 'Disponível para análise' : 'A confirmar',
    contato: clean(input.contato ?? '@veras_imoveiscaixa', '@veras_imoveiscaixa'),
  };
}

export function card1(input) {
  const i = normalizeImovel(input);
  return el({ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '1280px', height: '720px', padding: '54px 70px', backgroundColor: COLORS.navy, backgroundImage: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navy2} 100%)`, color: COLORS.white, fontFamily: 'Inter' }, [
    el({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
      brand(true),
      pill('COMPREI PGFN'),
    ]),
    el({ display: 'flex', flexDirection: 'column' }, [
      tx({ fontSize: 62, fontWeight: 900, lineHeight: 1.02, color: COLORS.white, lineClamp: 2 }, i.tituloCurto),
      tx({ fontSize: 28, marginTop: 20, color: COLORS.muted }, `${i.bairro} · ${i.cidade}/${i.uf}`),
      tx({ fontSize: 22, marginTop: 12, color: COLORS.muted, opacity: 0.78, lineClamp: 1 }, 'Imóvel PGFN — proposta condicionada às regras e documentos da plataforma.'),
    ]),
    el({ display: 'flex', justifyContent: 'space-between', gap: 18 }, [
      miniLabel('VALOR ATUAL', i.valorVenda, true),
      miniLabel('AVALIAÇÃO', i.valorAvaliacao, true),
      miniLabel('ÁREA', i.area, true),
      miniLabel('CÓDIGO', i.codigo, true),
    ]),
  ]);
}

export function card2(input) {
  const i = normalizeImovel(input);
  return el({ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '1280px', height: '720px', padding: '54px 70px', backgroundColor: COLORS.cream, color: COLORS.ink, fontFamily: 'Inter' }, [
    el({ display: 'flex', flexDirection: 'column' }, [
      tx({ fontSize: 22, fontWeight: 900, letterSpacing: 4, color: COLORS.goldDark }, 'CONDIÇÕES DE PROPOSTA'),
      tx({ fontSize: 56, fontWeight: 900, lineHeight: 1.04, color: COLORS.ink, marginTop: 16, lineClamp: 2 }, `${i.tipo} em ${i.cidade}/${i.uf}`),
      tx({ fontSize: 25, color: COLORS.inkSoft, marginTop: 12 }, 'Antes de ofertar, confira regras, prazos, matrícula e condições de pagamento.'),
    ]),
    el({ display: 'flex', flexWrap: 'wrap', gap: 20 }, [
      miniLabel('ENTRADA MÍN.', i.entrada),
      miniLabel('À VISTA MÍN.', i.avista),
      miniLabel('PARCELADO MÍN.', i.parcelado),
      miniLabel('MÁX. PARCELAS', i.parcelas),
    ]),
    el({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${COLORS.line}`, paddingTop: 22 }, [
      tx({ fontSize: 22, color: COLORS.inkSoft, lineClamp: 1 }, `1ª fase: ${i.dataPrimeiraFase} · Negociação com devedor: ${i.dataFimNegociacao}`),
      tx({ fontSize: 18, fontWeight: 700, color: COLORS.inkSoft, letterSpacing: 1 }, `CÓD. ${i.codigo}`),
    ]),
  ]);
}

export function card3(input) {
  const i = normalizeImovel(input);
  return el({ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '1280px', height: '720px', padding: '54px 70px', backgroundColor: COLORS.green, backgroundImage: `linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.green2} 100%)`, color: COLORS.white, fontFamily: 'Inter' }, [
    el({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
      brand(true),
      tx({ fontSize: 18, color: COLORS.white, opacity: 0.82, letterSpacing: 2 }, 'ANÁLISE COM CORRETOR'),
    ]),
    el({ display: 'flex', flexDirection: 'column' }, [
      tx({ fontSize: 27, fontWeight: 900, letterSpacing: 4, color: COLORS.gold }, 'DOCUMENTAÇÃO DO IMÓVEL'),
      tx({ fontSize: 68, fontWeight: 900, lineHeight: 0.98, color: COLORS.white, marginTop: 18 }, 'ANTES DA PROPOSTA'),
      tx({ fontSize: 29, color: COLORS.white, opacity: 0.92, marginTop: 20, lineClamp: 2 }, 'Dados registrais, prazos e condições devem ser conferidos antes da compra.'),
    ]),
    el({ display: 'flex', gap: 16 }, [
      miniLabel('MATRÍCULA', i.matricula, true, { width: 245 }),
      miniLabel('CARTÓRIO', i.cartorio, true, { width: 300, fontSize: 23, lines: 3 }),
      miniLabel('SITUAÇÃO', i.gravame, true, { width: 285, fontSize: 24, lines: 3 }),
      miniLabel('DOCUMENTOS', i.docs, true, { width: 245, fontSize: 25, lines: 3 }),
    ]),
  ]);
}

export function normalizedDebug(input) { return normalizeImovel(input); }
