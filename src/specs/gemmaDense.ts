import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

type AnnotationContent = { bullets: TextSpec[] };

function denseGemmaSpec(input: {
  id: string;
  title: string;
  layers: number;
  hidden: number;
  hiddenAnnotation: AnnotationContent;
  embedding: string;
  context: string;
  heads: { attention: number; kv: number; annotation: AnnotationContent };
  canvas?: FigureSpec['canvas'];
  theme?: Partial<FigureSpec['theme']>;
  blockFill?: string;
  ropeLabels?: { primary: string; secondary: string };
  normStroke?: string;
  qkNormStroke?: string;
  hiddenAnnotationX?: number;
  headsAnnotationX?: number;
  headsAnnotationY?: number;
  headsLeaderEndX?: number;
  headsLeaderEndY?: number;
  sampleInputY?: number;
  ratio?: string;
  perLayerEmbeddings?: boolean;
}): FigureSpec {
  return {
    schemaVersion: 1,
    id: input.id,
    title: input.title,
    description: `${input.title} architecture with ${input.layers} repeated residual blocks, grouped-query attention, pre- and post-RMSNorm pairs, and a GELU feed-forward inset.`,
    canvas: input.canvas ?? { width: 2582, height: 2686 },
    theme: {
      accent: '#2F80ED',
      surface: '#D5D5D5',
      ink: '#000000',
      muted: '#666666',
      background: '#FFFFFF',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      ...input.theme,
    },
    groups: [
      { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset'] },
      { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: input.layers }, children: ['attention', 'ffn'], style: { fill: { kind: 'solid', color: input.blockFill ?? '#3B82F6' } } },
      { id: 'ffn-inset', kind: 'inset', parent: 'model', title: text('Feed forward (GELU) module'), children: ['ffn'] },
    ],
    nodes: [
      { id: 'attention', kind: 'composite', data: { family: 'gqa', heads: input.heads.attention, kvHeads: input.heads.kv, ratio: input.ratio ?? '5:1' } },
      { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: input.hidden, activation: 'GELU' } },
      ...(input.perLayerEmbeddings ? [{ id: 'per-layer-embeddings', kind: 'text' as const, data: { spans: [{ text: 'Per-Layer Embeddings' }] } }] : []),
    ],
    edges: [
      { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
      { id: 'residual-ffn', kind: 'residual', from: { node: 'ffn' }, to: { node: 'ffn', side: 'top' }, junction: 'plus' },
    ],
    annotations: [
      { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size of ', '262k') },
      { id: 'context', target: 'backbone', placement: 'left', content: { bullets: [text('Native context'), emphasized('', input.context, ' tokens')] } },
      { id: 'heads', target: 'attention', placement: 'right', content: input.heads.annotation },
      { id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [text('Embedding'), emphasized('dimension of ', input.embedding)] } },
      { id: 'hidden-dimension', target: 'ffn', placement: 'right', content: input.hiddenAnnotation },
    ],
    layout: {
      mode: 'template',
      template: 'backbone',
      slots: { block: 'backbone', inset: 'ffn-inset', ...(input.perLayerEmbeddings ? { perLayerEmbeddings: 'per-layer-embeddings' } : {}) },
      options: {
        ...(input.ropeLabels ? { ropeLabel: input.ropeLabels.primary, ropeSecondaryLabel: input.ropeLabels.secondary } : {}),
        ...(input.normStroke ? { normStroke: input.normStroke } : {}),
        ...(input.qkNormStroke ? { qkNormStroke: input.qkNormStroke } : {}),
        ...(input.hiddenAnnotationX !== undefined ? { hiddenAnnotationX: input.hiddenAnnotationX } : {}),
        ...(input.headsAnnotationX !== undefined ? { headsAnnotationX: input.headsAnnotationX } : {}),
        ...(input.headsAnnotationY !== undefined ? { headsAnnotationY: input.headsAnnotationY } : {}),
        ...(input.headsLeaderEndX !== undefined ? { headsLeaderEndX: input.headsLeaderEndX } : {}),
        ...(input.headsLeaderEndY !== undefined ? { headsLeaderEndY: input.headsLeaderEndY } : {}),
        ...(input.sampleInputY !== undefined ? { sampleInputY: input.sampleInputY } : {}),
      },
    },
  };
}

export const gemma3SmallSpec = denseGemmaSpec({
  id: 'gemma-3-270m',
  title: 'Gemma 3 (270M)',
  layers: 18,
  hidden: 2048,
  hiddenAnnotation: { bullets: [
    emphasized('Input size: ', '640'),
    emphasized('Intermediate projection size = ', '2,048'),
  ] },
  embedding: '640',
  context: '32,768',
  heads: {
    attention: 4,
    kv: 1,
    annotation: { bullets: [
      emphasized('', '4', ' attention heads'),
      emphasized('', '1', ' key & value heads'),
      text('(technically'),
      text('multi-query attention)'),
    ] },
  },
  canvas: { width: 2678, height: 2652 },
  theme: { accent: '#F27200' },
  blockFill: '#DECBA3',
  hiddenAnnotationX: 1680,
  sampleInputY: 2638,
});

export const gemma412bSpec = denseGemmaSpec({
  id: 'gemma-4-12b',
  title: 'Gemma 4 (12B)',
  layers: 48,
  hidden: 15360,
  hiddenAnnotation: { bullets: [
    emphasized('Input dim.: ', '3,840'),
    emphasized('Intermediate dim.: ', '15,360'),
  ] },
  embedding: '3,840',
  context: '262,144',
  heads: {
    attention: 16,
    kv: 8,
    annotation: { bullets: [
      text('5:1 Local (sliding) to'),
      text('global (full attention) ratio'),
      text('Local:'),
      emphasized('', '16', ' attention heads'),
      emphasized('', '8', ' key & value heads'),
      text('Global:'),
      emphasized('', '16', ' attention heads'),
      emphasized('', '1', ' key & value head'),
    ] },
  },
  blockFill: '#3B82F6',
  ropeLabels: { primary: 'Partial RoPE (global)', secondary: 'Full RoPE (local)' },
  normStroke: '#56C1FF',
  qkNormStroke: '#56C1FF',
  headsLeaderEndX: 1760,
  hiddenAnnotationX: 1876,
  headsAnnotationX: 1800,
  headsAnnotationY: 1700,
});

export const gemma431bSpec = denseGemmaSpec({
  id: 'gemma-4-31b',
  title: 'Gemma 4 (31B)',
  layers: 60,
  hidden: 21504,
  hiddenAnnotation: { bullets: [
    emphasized('Input dim.: ', '5,376'),
    emphasized('Intermediate dim.: ', '21,504'),
  ] },
  embedding: '5,376',
  context: '262,144',
  heads: {
    attention: 32,
    kv: 16,
    annotation: { bullets: [
      text('5:1 Local (sliding) to'),
      text('global (full attention) ratio'),
      text('Local:'),
      emphasized('', '32', ' attention heads'),
      emphasized('', '16', ' key & value heads'),
      text('Global:'),
      emphasized('', '32', ' attention heads'),
      emphasized('', '4', ' key & value heads'),
    ] },
  },
  blockFill: '#3B82F6',
  ropeLabels: { primary: 'Partial RoPE (global)', secondary: 'Full RoPE (local)' },
  normStroke: '#56C1FF',
  qkNormStroke: '#56C1FF',
  headsLeaderEndX: 1760,
  hiddenAnnotationX: 1876,
  headsAnnotationX: 1800,
  headsAnnotationY: 1700,
});

export const gemma4E2bSpec = denseGemmaSpec({
  id: 'gemma-4-e2b',
  title: 'Gemma 4 E2B',
  layers: 35,
  hidden: 12288,
  hiddenAnnotation: { bullets: [
    emphasized('Input width ', '1,536'),
    { spans: [{ text: 'Layers ' }, { text: '1–15', color: 'accent' }, { text: ' use FFN width ' }, { text: '6,144', color: 'accent' }] },
    { spans: [{ text: 'Layers ' }, { text: '16–35', color: 'accent' }, { text: ' use FFN width ' }, { text: '12,288', color: 'accent' }] },
  ] },
  embedding: '1,536',
  context: '131,072',
  heads: {
    attention: 8,
    kv: 1,
    annotation: { bullets: [
      text('4:1 Local (sliding) to'),
      text('global (full attention) ratio'),
      text('Local:'),
      emphasized('', '8', ' attention heads'),
      emphasized('', '1', ' key & value heads'),
      text('Global:'),
      emphasized('', '8', ' attention heads'),
      emphasized('', '1', ' key & value heads'),
    ] },
  },
  blockFill: '#3B82F6',
  ropeLabels: { primary: 'Partial RoPE (global)', secondary: 'Full RoPE (local)' },
  normStroke: '#56C1FF',
  qkNormStroke: '#56C1FF',
  ratio: '4:1',
  perLayerEmbeddings: true,
  headsLeaderEndX: 1760,
  hiddenAnnotationX: 1600,
  headsAnnotationX: 1800,
  headsAnnotationY: 1700,
});

export const gemma4E4bSpec = denseGemmaSpec({
  id: 'gemma-4-e4b',
  title: 'Gemma 4 E4B',
  layers: 42,
  hidden: 10240,
  hiddenAnnotation: { bullets: [
    emphasized('Input dim.: ', '2,560'),
    emphasized('Intermediate dim.: ', '10,240'),
  ] },
  embedding: '2,560',
  context: '131,072',
  heads: {
    attention: 8,
    kv: 2,
    annotation: { bullets: [
      text('5:1 Local (sliding) to'),
      text('global (full attention) ratio'),
      text('Local:'),
      emphasized('', '8', ' attention heads'),
      emphasized('', '2', ' key & value heads'),
      text('Global:'),
      emphasized('', '8', ' attention heads'),
      emphasized('', '2', ' key & value heads'),
    ] },
  },
  blockFill: '#3B82F6',
  ropeLabels: { primary: 'Partial RoPE (global)', secondary: 'Full RoPE (local)' },
  normStroke: '#56C1FF',
  qkNormStroke: '#56C1FF',
  ratio: '5:1',
  perLayerEmbeddings: true,
  headsLeaderEndX: 1760,
  hiddenAnnotationX: 1600,
  headsAnnotationX: 1800,
  headsAnnotationY: 1700,
});
