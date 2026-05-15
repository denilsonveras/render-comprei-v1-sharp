// VERAS COMPREI/PGFN — Templates Satori, sem JSX, sem ícones unicode.
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

function money(v) {
  const n = numberBR(v);
  if (n == null || n <= 0) return 'Sob consulta';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function percent(v) {
  const n = numberBR(v);
  if (n == null || n <= 0) return '—';
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

function area(v) {
  const n = numberBR(v);
  if (n == null || n <= 0) return '—';
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`;
}

function dateBR(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return clean(v);
  return d.toLocaleDateString('pt-BR');
}

function hasDoc(v) { return !!String(v || '').trim(); }

function miniLabel(label, value, dark = false) {
  return el({ display: 'flex', flexDirection: 'column', backgroundColor: dark ? 'rgba(255,255,255,0.10)' : COLORS.white, padding: '20px 22px', width: 255, height: 130, borderTop: `4px solid ${COLORS.gold}` }, [
    tx({ fontSize: 15, fontWeight: 700, letterSpacing: 2, color: dark ? COLORS.gold : COLORS.goldDark }, label),
    tx({ fontSize: 32, fontWeight: 900, lineHeight: 1.05, marginTop: 12, color: dark ? COLORS.white : COLORS.ink, lineClamp: 2 }, value),
  ]);
}

function normalizeImovel(input) {
  const valorVenda = input.valor_venda ?? input.valor ?? input.preco ?? input.valor_minimo;
  const valorAvaliacao = input.valor_avaliacao ?? input.avaliacao;
  const uf = input.uf ?? input.estado ?? 'CE';
  const codigo = input.codigo ?? input.origem_id ?? input.idBem ?? input.imovel_id ?? 'PGFN';
  return {
    imovel_id: clean(input.imovel_id ?? codigo, String(codigo)),
    codigo: clean(codigo, 'PGFN'),
    origem: clean(input.origem ?? 'COMPREI/PGFN', 'COMPREI/PGFN'),
    titulo: clean(input.titulo, 'Imóvel PGFN'),
    tipo: clean(input.tipo ?? input.subtipo ?? input.subtipo_imovel, 'Imóvel'),
    cidade: clean(input.cidade ?? input.municipioNome, 'Cidade'),
    uf: clean(uf, 'CE'),
    bairro: clean(input.bairro, 'Região'),
    area: area(input.area_util ?? input.area_total ?? input.area),
    valorVenda: money(valorVenda),
    valorAvaliacao: money(valorAvaliacao),
    entrada: percent(input.percentual_minimo_valor_entrada ?? input.percentualMinimoValorEntrada),
    avista: percent(input.percentual_minimo_valor_avista ?? input.percentualMinimoValorAVista),
    parcelado: percent(input.percentual_minimo_valor_parcelado ?? input.percentualMinimoValorParcelado),
    parcelas: clean(input.quantidade_maxima_parcelas ?? input.quantidadeMaximaDeParcelas, '—'),
    parcelaMinima: money(input.valor_minimo_parcela ?? input.valorMinimoParcela),
    dataPrimeiraFase: dateBR(input.data_final_primeira_fase ?? input.dataFinalPrimeiraFaseDePropostas),
    dataFimNegociacao: dateBR(input.data_fim_negociacao ?? input.dataFimNegociacaoComDevedor),
    matricula: clean(input.matricula ?? input.matricula_oficial ?? input.matriculaOficial, 'A consultar'),
    cartorio: clean(input.cartorio ?? input.cartorio_nome ?? input.nomeCartorio, 'A consultar'),
    gravame: clean(input.gravames_resumo ?? input.constricaoNome ?? input.situacao_matricula, 'Análise documental recomendada'),
    docs: hasDoc(input.documentos_drive_url ?? input.link_documentos ?? input.documentosBem) ? 'Pasta documental disponível' : 'Documentos a confirmar',
    contato: clean(input.contato ?? '@veras_imoveiscaixa', '@veras_imoveiscaixa'),
  };
}

export function card1(input) {
  const i = normalizeImovel(input);
  return el({ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '1280px', height: '720px', padding: '58px 70px', backgroundColor: COLORS.navy, backgroundImage: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navy2} 100%)`, color: COLORS.white, fontFamily: 'Inter' }, [
    el({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
      el({ display: 'flex', alignItems: 'center', gap: 16 }, [
        el({ display: 'flex', width: 8, height: 42, backgroundColor: COLORS.gold }, []),
        tx({ fontSize: 35, fontWeight: 900, letterSpacing: 4, color: COLORS.white }, 'VERAS'),
      ]),
      el({ display: 'flex', backgroundColor: COLORS.gold, padding: '10px 22px' }, [tx({ fontSize: 21, fontWeight: 900, letterSpacing: 2, color: COLORS.navy }, 'COMPREI PGFN')]),
    ]),
    el({ display: 'flex', flexDirection: 'column' }, [
      tx({ fontSize: 56, fontWeight: 900, lineHeight: 1.05, color: COLORS.white, lineClamp: 2 }, i.titulo),
      tx({ fontSize: 28, marginTop: 18, color: COLORS.muted }, `${i.bairro} · ${i.cidade}/${i.uf}`),
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
  return el({ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '1280px', height: '720px', padding: '58px 70px', backgroundColor: COLORS.cream, color: COLORS.ink, fontFamily: 'Inter' }, [
    el({ display: 'flex', flexDirection: 'column' }, [
      tx({ fontSize: 22, fontWeight: 900, letterSpacing: 4, color: COLORS.goldDark }, 'CONDIÇÕES DE PROPOSTA'),
      tx({ fontSize: 50, fontWeight: 900, lineHeight: 1.08, color: COLORS.ink, marginTop: 14, lineClamp: 2 }, `${i.tipo} em ${i.cidade}/${i.uf}`),
      tx({ fontSize: 25, color: COLORS.inkSoft, marginTop: 10 }, 'Confira regras e prazos antes de apresentar proposta.'),
    ]),
    el({ display: 'flex', flexWrap: 'wrap', gap: 20 }, [
      miniLabel('ENTRADA MÍN.', i.entrada),
      miniLabel('À VISTA MÍN.', i.avista),
      miniLabel('PARCELADO MÍN.', i.parcelado),
      miniLabel('MÁX. PARCELAS', i.parcelas),
    ]),
    el({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${COLORS.line}`, paddingTop: 22 }, [
      tx({ fontSize: 23, color: COLORS.inkSoft }, `1ª fase: ${i.dataPrimeiraFase} · Negociação devedor: ${i.dataFimNegociacao}`),
      tx({ fontSize: 18, fontWeight: 700, color: COLORS.inkSoft, letterSpacing: 1 }, `CÓD. ${i.codigo}`),
    ]),
  ]);
}

export function card3(input) {
  const i = normalizeImovel(input);
  return el({ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '1280px', height: '720px', padding: '58px 70px', backgroundColor: COLORS.green, backgroundImage: `linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.green2} 100%)`, color: COLORS.white, fontFamily: 'Inter' }, [
    el({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
      el({ display: 'flex', alignItems: 'center', gap: 16 }, [
        el({ display: 'flex', width: 8, height: 42, backgroundColor: COLORS.gold }, []),
        tx({ fontSize: 35, fontWeight: 900, letterSpacing: 4, color: COLORS.white }, 'VERAS'),
      ]),
      tx({ fontSize: 18, color: COLORS.white, opacity: 0.82, letterSpacing: 2 }, 'ANÁLISE COM CORRETOR'),
    ]),
    el({ display: 'flex', flexDirection: 'column' }, [
      tx({ fontSize: 28, fontWeight: 900, letterSpacing: 4, color: COLORS.gold }, 'DOCUMENTAÇÃO DO IMÓVEL'),
      tx({ fontSize: 72, fontWeight: 900, lineHeight: 0.98, color: COLORS.white, marginTop: 18 }, 'ANTES DA PROPOSTA'),
      tx({ fontSize: 30, color: COLORS.white, opacity: 0.92, marginTop: 20, lineClamp: 2 }, 'Matrícula, prazos e condições precisam ser conferidos antes da compra.'),
    ]),
    el({ display: 'flex', gap: 18 }, [
      miniLabel('MATRÍCULA', i.matricula, true),
      miniLabel('CARTÓRIO', i.cartorio, true),
      miniLabel('SITUAÇÃO', i.gravame, true),
      miniLabel('DOCUMENTOS', i.docs, true),
    ]),
  ]);
}

export function normalizedDebug(input) { return normalizeImovel(input); }
