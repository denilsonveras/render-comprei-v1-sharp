// VERAS COMPREI/PGFN — Templates Satori V1.5.5
// Cards comerciais fase-aware para imóveis PGFN/Comprei: imóvel, proposta e documentação.
// Regras: sem dados sensíveis; sem ícones unicode; sem área falsa; foco em aprovação e clareza.

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
  softBox: 'rgba(255,255,255,0.10)',
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

function norm(s) {
  return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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

function areaText(v) {
  const n = numberBR(v);
  if (n == null || n <= 1) return 'Consultar matrícula';
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`;
}

function intOrConsultar(v) {
  const n = numberBR(v);
  if (n == null || n <= 0) return 'Consultar';
  return String(Math.round(n));
}

function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date && Number.isFinite(v.getTime())) return v;
  const raw = String(v).trim();
  const br = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*(?:às|as)?\s*(\d{1,2})[:h](\d{2})?)?/i);
  if (br) {
    const [, dd, mm, yyyy, hh = '0', mi = '0'] = br;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi));
    return Number.isFinite(d.getTime()) ? d : null;
  }
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d : null;
}

function dateBR(v) {
  const d = parseDate(v);
  if (!d) return clean(v, 'Consultar');
  return d.toLocaleDateString('pt-BR');
}

function dateTimeBR(v) {
  const d = parseDate(v);
  if (!d) return clean(v, 'Consultar');
  const hasTime = d.getHours() || d.getMinutes();
  const date = d.toLocaleDateString('pt-BR');
  if (!hasTime) return date;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${date} às ${hh}h${mm === '00' ? '' : mm}`;
}

function limit(s, max = 60) {
  const t = clean(s, '');
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

function inferTipo(input) {
  const txt = norm(`${input.tipo || ''} ${input.subtipo || ''} ${input.titulo || ''} ${input.descricao || ''}`);
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
  const txt = `${input.titulo || ''} ${input.descricao || ''} ${input.logradouro || ''} ${input.endereco || ''}`;
  const bairros = ['Aldeota', 'Meireles', 'Cocó', 'Mucuripe', 'Varjota', 'Dionísio Torres', 'Papicu', 'Centro', 'Fátima', 'Benfica', 'Cambeba', 'Messejana', 'Passaré', 'Parangaba', 'Maraponga'];
  const found = bairros.find(b => new RegExp(`\\b${b}\\b`, 'i').test(txt));
  if (found && (!provided || /^centro$/i.test(provided))) return found;
  return provided || found || 'Região';
}

function titleMain(input) {
  const tipo = inferTipo(input).toUpperCase();
  const bairro = inferBairro(input).toUpperCase();
  const cidade = clean(input.cidade ?? input.municipioNome, 'Cidade').toUpperCase();
  const uf = clean(input.uf ?? input.estado, 'CE').toUpperCase();
  return `${tipo} NA ${bairro} - ${cidade}/${uf}`;
}

function titleShort(input) {
  const tipo = inferTipo(input);
  const bairro = inferBairro(input);
  const title = clean(input.titulo, '');
  const apt = title.match(/(?:apartamento|apto|ap\.?|n[ºo.]?)\s*(?:de\s*)?(?:n[ºo.]?\s*)?(\d{1,5})/i)?.[1]
    || clean(input.complemento, '').match(/(?:ap|apto|apartamento)\.?\s*(\d{1,5})/i)?.[1];
  if (/apart/i.test(tipo)) return apt ? `Apartamento nº ${apt} em ${bairro}` : `Apartamento em ${bairro}`;
  return `${tipo} em ${bairro}`;
}

function addressLine(input) {
  const title = clean(input.titulo, '');
  const raw = clean(input.endereco || input.logradouro || '', '');
  let rua = '';
  let numero = clean(input.numero ?? input.numeroEndereco, '');
  let ap = '';

  const ruaMatch = title.match(/Rua\s+([^,]+)(?:,|\s+n[ºo.]?)/i) || raw.match(/Rua\s+([^,]+)/i);
  if (ruaMatch) rua = `Rua ${ruaMatch[1].trim()}`;
  else rua = raw ? limit(raw, 44) : 'Endereço a conferir';

  const numMatch = title.match(/(?:n[ºo.]?|número)\s*(\d{1,5})/i) || raw.match(/(?:n[ºo.]?|número)?\s*(\d{1,5})/i);
  if (numMatch) numero = numMatch[1];

  const aptMatch = title.match(/(?:apartamento|apto|ap\.?|n[ºo.]?)\s*(?:de\s*)?(?:n[ºo.]?\s*)?(\d{1,5})/i) || clean(input.complemento, '').match(/(?:ap|apto|apartamento)\.?\s*(\d{1,5})/i);
  if (aptMatch) ap = `ap. ${aptMatch[1]}`;

  const parts = [rua];
  if (numero && !/^s\/?n$/i.test(numero)) parts.push(numero);
  if (ap) parts.push(ap);
  return limit(parts.join(', '), 72);
}

function hasDoc(v) { return !!String(v || '').trim(); }

function valueFontSize(value) {
  const s = String(value || '');
  if (s.length > 36) return 20;
  if (s.length > 26) return 24;
  if (s.length > 18) return 28;
  return 32;
}

function miniLabel(label, value, dark = false, opts = {}) {
  const v = clean(value, 'Consultar');
  const fs = opts.fontSize || valueFontSize(v);
  const lines = opts.lines || (v.length > 26 ? 2 : 1);
  return el({
    display: 'flex', flexDirection: 'column', backgroundColor: dark ? COLORS.softBox : COLORS.white,
    padding: '18px 20px', width: opts.width || 255, height: opts.height || 130,
    borderTop: `4px solid ${COLORS.gold}`, overflow: 'hidden',
  }, [
    tx({ fontSize: 15, fontWeight: 700, letterSpacing: 2, color: dark ? COLORS.gold : COLORS.goldDark }, label),
    tx({ fontSize: fs, fontWeight: 900, lineHeight: 1.05, marginTop: 11, color: dark ? COLORS.white : COLORS.ink, lineClamp: lines }, v),
  ]);
}

function brand(dark = true) {
  return el({ display: 'flex', alignItems: 'center', gap: 18 }, [
    el({ display: 'flex', width: 8, height: 50, backgroundColor: COLORS.gold }, []),
    el({ display: 'flex', flexDirection: 'column' }, [
      tx({ fontSize: 42, fontWeight: 900, letterSpacing: 6, color: dark ? COLORS.white : COLORS.ink }, 'VERAS'),
      tx({ fontSize: 15, fontWeight: 600, letterSpacing: 1.2, marginTop: 2, color: dark ? COLORS.muted : COLORS.inkSoft }, 'Negócios Imobiliários'),
    ]),
  ]);
}

function tag(text, dark = true) {
  return el({ display: 'flex', padding: '10px 22px', backgroundColor: dark ? COLORS.gold : COLORS.navy }, [
    tx({ fontSize: 20, fontWeight: 900, letterSpacing: 2, color: dark ? COLORS.navy : COLORS.white }, text),
  ]);
}

function currentPhase(input, dataPrimeiraFase, dataFimNegociacao) {
  const raw = norm(`${input.fase_atual || ''} ${input.etapa_comprei || ''} ${input.status || ''} ${input.anuncio_comprei_status || ''}`);
  if (raw.includes('compra em andamento')) return { idx: 4, label: 'Compra em andamento', removeFromList: true };
  if (raw.includes('finalizado') || raw.includes('vendido')) return { idx: 5, label: 'Bem finalizado', removeFromList: true };
  if (raw.includes('proposta') && raw.includes('2')) return { idx: 3, label: 'Em fase de proposta (2)' };
  if (raw.includes('proposta')) return { idx: 2, label: 'Em fase de proposta (1)' };

  const now = new Date();
  const dNeg = parseDate(dataFimNegociacao);
  const dProp = parseDate(dataPrimeiraFase);
  if (dNeg && now <= dNeg) return { idx: 1, label: 'Negociação' };
  if (dProp && now <= dProp) return { idx: 2, label: 'Em fase de proposta (1)' };
  if (dProp && now > dProp) return { idx: 3, label: 'Em fase de proposta (2)' };
  return { idx: 2, label: 'Em fase de proposta (1)' };
}

function paymentLine(i) {
  const parts = [];
  if (i.avista !== 'Consultar') parts.push(`à vista mín. ${i.avista}`);
  if (i.entrada !== 'Consultar' && i.parcelas !== 'Consultar') parts.push(`${i.entrada} de entrada + até ${i.parcelas} parcelas`);
  else if (i.parcelas !== 'Consultar') parts.push(`parcelamento até ${i.parcelas} parcelas`);
  if (parts.length) return parts.join(' ou ');
  return 'À vista ou parcelado conforme regras do anúncio e aprovação da PGFN.';
}

function docItems(input, i) {
  const docs = [];
  const push = (name) => { const n = limit(clean(name, ''), 34); if (n && !docs.includes(n)) docs.push(n); };
  if (i.matricula && i.matricula !== 'A consultar') push('Matrícula do imóvel');
  const arr = Array.isArray(input.documentos_json) ? input.documentos_json : Array.isArray(input.documentos) ? input.documentos : [];
  for (const d of arr) push(d.nome_publico || d.nome || d.tipo_documento || d.filename || d.nome_arquivo || d.title);
  if (hasDoc(input.documentos_drive_url ?? input.link_documentos ?? input.documentosBem)) push('Pasta documental');
  push('Avaliação');
  push('Dados do processo');
  push('Regras do anúncio');
  return docs.slice(0, 6);
}

function normalizeImovel(input) {
  const valorMinimo = input.valor_minimo_venda ?? input.valorMinimoVenda ?? input.valor_minimo ?? input.valorMinimo ?? input.valor_minimo_proposta ?? input.valorInicial ?? input.valor_inicial;
  const valorCompraImediata = input.valor_compra_imediata ?? input.valorCompraImediata ?? input.preco_integral ?? input.precoIntegral ?? input.valor_avaliacao ?? input.avaliacao ?? input.valor_venda ?? input.valor;
  const valorAvaliacao = input.valor_avaliacao ?? input.avaliacao ?? input.valorCompraImediata ?? input.valor_compra_imediata;
  const uf = input.uf ?? input.estado ?? 'CE';
  const codigo = input.codigo ?? input.origem_id ?? input.idBem ?? input.imovel_id ?? 'PGFN';
  const tipo = inferTipo(input);
  const bairro = inferBairro(input);
  const dataPrimeiraRaw = input.data_final_primeira_fase ?? input.dataFinalPrimeiraFaseDePropostas;
  const dataNegRaw = input.data_fim_negociacao ?? input.dataFimNegociacaoComDevedor;
  const phase = currentPhase(input, dataPrimeiraRaw, dataNegRaw);

  const i = {
    imovel_id: clean(input.imovel_id ?? codigo, String(codigo)), codigo: clean(codigo, 'PGFN'),
    origem: clean(input.origem ?? 'COMPREI/PGFN', 'COMPREI/PGFN'), titulo: clean(input.titulo, 'Imóvel PGFN'),
    tituloVenda: titleMain(input), tituloCurto: titleShort(input), enderecoCurto: addressLine(input), tipo,
    cidade: clean(input.cidade ?? input.municipioNome, 'Cidade'), uf: clean(uf, 'CE'), bairro,
    area: areaText(input.area_registral_m2 ?? input.area_privativa ?? input.area_util ?? input.area_total ?? input.area),
    valorMinimo: money(valorMinimo), valorCompraImediata: money(valorCompraImediata), valorAvaliacao: money(valorAvaliacao),
    entrada: percent(input.percentual_minimo_valor_entrada ?? input.percentualMinimoValorEntrada),
    avista: percent(input.percentual_minimo_valor_avista ?? input.percentualMinimoValorAVista),
    parcelado: percent(input.percentual_minimo_valor_parcelado ?? input.percentualMinimoValorParcelado),
    parcelas: intOrConsultar(input.quantidade_maxima_parcelas ?? input.quantidadeMaximaDeParcelas),
    dataPrimeiraFase: dateTimeBR(dataPrimeiraRaw), dataFimNegociacao: dateTimeBR(dataNegRaw), phase,
    matricula: clean(input.matricula ?? input.matricula_oficial ?? input.matriculaOficial, 'A consultar'),
    cartorio: clean(input.cartorio ?? input.cartorio_nome ?? input.nomeCartorio, 'A consultar'),
    gravame: clean(input.gravames_resumo ?? input.constricaoNome ?? input.situacao_matricula, 'Conferir matrícula'),
    docs: hasDoc(input.documentos_drive_url ?? input.link_documentos ?? input.documentosBem) ? 'Disponível para análise' : 'A confirmar',
    contato: clean(input.contato ?? input.telefone_contato ?? '85 99131-3501', '85 99131-3501'),
  };
  i.pagamentoResumo = paymentLine(i);
  return i;
}

export function card1(input) {
  const i = normalizeImovel(input);
  return el({ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '1280px', height: '720px', padding: '54px 70px', backgroundColor: COLORS.navy, backgroundImage: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navy2} 100%)`, color: COLORS.white, fontFamily: 'Inter' }, [
    el({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [ brand(true), tag(i.phase.idx === 1 ? 'EM BREVE - COMPREI/PGFN' : 'LEILÃO DE IMÓVEIS - COMPREI/PGFN') ]),
    el({ display: 'flex', flexDirection: 'column', marginTop: 10 }, [
      tx({ fontSize: 55, fontWeight: 900, lineHeight: 1.03, color: COLORS.white, lineClamp: 2 }, i.tituloVenda),
      tx({ fontSize: 30, marginTop: 18, color: COLORS.muted, lineClamp: 1 }, i.enderecoCurto),
      tx({ fontSize: 22, marginTop: 12, color: COLORS.muted, opacity: 0.82, lineClamp: 1 }, i.phase.idx === 1 ? 'Pré-oportunidade: prepare-se para a abertura da fase de propostas' : 'Imóvel de leilão judicial da Procuradoria-Geral da Fazenda Nacional'),
    ]),
    el({ display: 'flex', justifyContent: 'space-between', gap: 18 }, [
      miniLabel('VALOR MÍNIMO', i.valorMinimo, true), miniLabel('COMPRA IMEDIATA', i.valorCompraImediata, true),
      miniLabel('ÁREA', i.area, true, { fontSize: i.area.includes('Consultar') ? 22 : 32, lines: 2 }), miniLabel('CÓDIGO', i.codigo, true),
    ]),
  ]);
}


function phaseExplanation(i) {
  const idx = i.phase.idx;
  if (idx === 1) {
    return 'Ainda não está aberta a fase de propostas. Use este período para analisar documentos, matrícula, valores e preparar a oferta.';
  }
  if (idx === 2) {
    return 'Na Proposta (1), oferta pela avaliação gera compra imediata. Oferta abaixo da avaliação pode ficar registrada e ser superada.';
  }
  if (idx === 3) {
    return 'Na Proposta (2), propostas a partir do valor mínimo podem efetivar a compra, conforme regras da Comprei/PGFN.';
  }
  if (idx === 4) return 'Compra em andamento: retirar da vitrine ativa e acompanhar apenas internamente.';
  if (idx === 5) return 'Bem finalizado: oportunidade encerrada.';
  return 'Confira regras, prazos, matrícula e condições de pagamento antes de ofertar.';
}

function paymentPractical(i) {
  const parts = [];
  if (i.entrada !== 'Consultar') parts.push(`Entrada mín. ${i.entrada}`);
  if (i.parcelas !== 'Consultar') parts.push(`até ${i.parcelas} parcelas`);
  if (parts.length) return `Parcelamento quando permitido: ${parts.join(' + ')}.`;
  return 'À vista ou parcelado quando permitido no anúncio. Confira regra específica da Comprei/PGFN.';
}

function phaseNode(n, label, active, detail = '') {
  return el({ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 210 }, [
    el({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 26, backgroundColor: active ? COLORS.navy : COLORS.white, border: `3px solid ${COLORS.navy}` }, [
      tx({ fontSize: 26, fontWeight: 900, color: active ? COLORS.white : COLORS.navy }, String(n)),
    ]),
    tx({ fontSize: 18, fontWeight: active ? 900 : 700, color: COLORS.navy, marginTop: 10, textAlign: 'center', lineClamp: 2 }, label),
    detail ? tx({ fontSize: 16, fontWeight: active ? 800 : 500, color: COLORS.inkSoft, marginTop: 5, textAlign: 'center', lineClamp: 2 }, detail) : null,
  ].filter(Boolean));
}

export function card2(input) {
  const i = normalizeImovel(input);
  const phase = i.phase;
  const nextLabel = phase.idx === 1 ? `Proposta (1) após ${i.dataFimNegociacao}` : phase.idx === 2 ? `Proposta (2) após ${i.dataPrimeiraFase}` : phase.idx === 3 ? 'Acompanhar proposta vencedora' : 'Retirar da lista ativa';
  return el({ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '1280px', height: '720px', padding: '50px 70px', backgroundColor: COLORS.cream, color: COLORS.ink, fontFamily: 'Inter' }, [
    el({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, [
      el({ display: 'flex', flexDirection: 'column', width: 850 }, [
        tx({ fontSize: 22, fontWeight: 900, letterSpacing: 4, color: COLORS.goldDark }, 'CONDIÇÕES DA PROPOSTA'),
        tx({ fontSize: 42, fontWeight: 900, lineHeight: 1.05, color: COLORS.ink, marginTop: 14, lineClamp: 2 }, i.tituloVenda),
        tx({ fontSize: 21, color: COLORS.inkSoft, marginTop: 10, lineClamp: 1 }, phase.idx === 1 ? 'Prepare-se com antecedência: confira regras, prazos, matrícula e documentos.' : 'Antes de ofertar, confira regras, prazos, matrícula e condições de pagamento.'),
      ]),
      tx({ fontSize: 18, fontWeight: 900, color: COLORS.inkSoft, letterSpacing: 2 }, `CÓD. ${i.codigo}`),
    ]),
    el({ display: 'flex', flexDirection: 'column', marginTop: 4 }, [
      tx({ fontSize: 18, fontWeight: 900, letterSpacing: 3, color: COLORS.goldDark, marginBottom: 12 }, 'CRONOLOGIA DAS ETAPAS'),
      el({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: `3px solid ${COLORS.navy}`, paddingTop: 20 }, [
        phaseNode(1, 'Negociação', phase.idx === 1, i.dataFimNegociacao !== 'Consultar' ? `até ${i.dataFimNegociacao}` : ''),
        phaseNode(2, 'Proposta (1)', phase.idx === 2, i.dataPrimeiraFase !== 'Consultar' ? `até ${i.dataPrimeiraFase}` : ''),
        phaseNode(3, 'Proposta (2)', phase.idx === 3),
        phaseNode(4, 'Compra em andamento', phase.idx === 4),
        phaseNode(5, 'Bem finalizado', phase.idx === 5),
      ]),
    ]),
    el({ display: 'flex', gap: 18, alignItems: 'stretch' }, [
      el({ display: 'flex', flexDirection: 'column', backgroundColor: COLORS.white, borderTop: `4px solid ${COLORS.gold}`, padding: '18px 22px', width: 355, height: 126 }, [
        tx({ fontSize: 14, fontWeight: 900, letterSpacing: 2, color: COLORS.goldDark }, 'FASE ATUAL'),
        tx({ fontSize: 23, fontWeight: 900, color: COLORS.ink, marginTop: 10, lineClamp: 2 }, phase.label),
      ]),
      el({ display: 'flex', flexDirection: 'column', backgroundColor: COLORS.white, borderTop: `4px solid ${COLORS.gold}`, padding: '18px 22px', width: 355, height: 126 }, [
        tx({ fontSize: 14, fontWeight: 900, letterSpacing: 2, color: COLORS.goldDark }, 'COMO FUNCIONA'),
        tx({ fontSize: 17, fontWeight: 800, color: COLORS.ink, marginTop: 8, lineClamp: 4 }, phaseExplanation(i)),
      ]),
      el({ display: 'flex', flexDirection: 'column', backgroundColor: COLORS.white, borderTop: `4px solid ${COLORS.gold}`, padding: '18px 22px', width: 355, height: 126 }, [
        tx({ fontSize: 14, fontWeight: 900, letterSpacing: 2, color: COLORS.goldDark }, 'PAGAMENTO'),
        tx({ fontSize: 18, fontWeight: 800, color: COLORS.ink, marginTop: 10, lineClamp: 3 }, paymentPractical(i)),
      ]),
    ]),
  ]);
}

function docRow(name) {
  return el({ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }, [
    el({ display: 'flex', width: 9, height: 9, backgroundColor: COLORS.gold }, []),
    tx({ fontSize: 24, fontWeight: 800, color: COLORS.white, lineClamp: 1 }, name),
  ]);
}

export function card3(input) {
  const i = normalizeImovel(input);
  const docs = docItems(input, i);
  const left = docs.slice(0, 3);
  const right = docs.slice(3, 6);
  return el({ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '1280px', height: '720px', padding: '54px 70px', backgroundColor: COLORS.green, backgroundImage: `linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.green2} 100%)`, color: COLORS.white, fontFamily: 'Inter' }, [
    el({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, [ brand(true), tx({ fontSize: 20, fontWeight: 900, color: COLORS.white, opacity: 0.9, letterSpacing: 2 }, `CÓD. ${i.codigo}`) ]),
    el({ display: 'flex', flexDirection: 'column' }, [
      tx({ fontSize: 25, fontWeight: 900, letterSpacing: 4, color: COLORS.gold }, 'DOCUMENTAÇÃO DISPONÍVEL PARA ANÁLISE'),
      tx({ fontSize: 43, fontWeight: 900, lineHeight: 1.05, color: COLORS.white, marginTop: 14, lineClamp: 2 }, i.tituloVenda),
      tx({ fontSize: 24, color: COLORS.white, opacity: 0.88, marginTop: 12, lineClamp: 1 }, i.enderecoCurto),
    ]),
    el({ display: 'flex', gap: 50, backgroundColor: 'rgba(255,255,255,0.09)', padding: '30px 34px', borderTop: `4px solid ${COLORS.gold}` }, [
      el({ display: 'flex', flexDirection: 'column', width: 520 }, left.map(docRow)),
      el({ display: 'flex', flexDirection: 'column', width: 520 }, right.map(docRow)),
    ]),
    el({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 18 }, [
      tx({ fontSize: 22, color: COLORS.white, opacity: 0.86 }, 'Documentos, regras e prazos devem ser conferidos antes da proposta.'),
      tx({ fontSize: 26, fontWeight: 900, color: COLORS.white }, `CONTATO: ${i.contato}`),
    ]),
  ]);
}

export function normalizedDebug(input) { return normalizeImovel(input); }
