import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

type AnnotationContent = { bullets: TextSpec[] };

function edgeBackboneSpec(input: {
  id: string;
  title: string;
  layers: number;
  hidden: number;
  activation: string;
  hiddenAnnotation: AnnotationContent;
  embedding: string;
  embeddingAnnotation?: AnnotationContent;
  contextAnnotation: AnnotationContent;
  headsAnnotation?: AnnotationContent;
  attention: { heads: number; kvHeads: number; label?: TextSpec };
  vocabulary: string;
  canvas: FigureSpec['canvas'];
  accent: string;
  blockFill: string;
  normLabels?: 'rmsnorm' | 'pre' | 'layernorm';
  showQKNorm: boolean;
  showRoPE?: boolean;
  ropeLabels?: { primary: string; secondary: string };
  hiddenAnnotationX?: number;
  headsAnnotationX?: number;
  headsLeaderEndX?: number;
  sampleInputY?: number;
  positionalEmbedding?: boolean;
  dropout?: boolean;
  titleColor?: string;
  sampleInputText?: string;
}): FigureSpec {
  const positional = input.positionalEmbedding ? [{ id: 'positional-embedding', kind: 'text' as const, data: text('Positional embedding layer') }] : [];
  const dropout = input.dropout ? [{ id: 'dropout', kind: 'text' as const, data: text('Dropout') }] : [];
  return {
    schemaVersion: 1,
    id: input.id,
    title: input.title,
    description: `${input.title} architecture with ${input.layers} repeated residual blocks, ${input.normLabels === 'layernorm' ? 'LayerNorm and dropout' : 'RMSNorm pairs'}, and a feed-forward inset.`,
    canvas: input.canvas,
    theme: {
      accent: input.accent,
      surface: '#D9D9D9',
      ink: '#000000',
      muted: '#666666',
      background: '#FFFFFF',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    },
    groups: [
      { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset'] },
      { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: input.layers }, children: ['attention', 'ffn'], style: { fill: { kind: 'solid', color: input.blockFill } } },
      { id: 'ffn-inset', kind: 'inset', parent: 'model', children: ['ffn'] },
    ],
    nodes: [
      { id: 'attention', kind: 'composite', label: input.attention.label ?? { spans: [{ text: 'Grouped-query' }, { text: 'attention' }] }, data: { family: 'gqa', heads: input.attention.heads, kvHeads: input.attention.kvHeads } },
      { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: input.hidden, activation: input.activation } },
      ...positional,
      ...dropout,
    ],
    edges: [
      { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
      { id: 'residual-ffn', kind: 'residual', from: { node: 'ffn' }, to: { node: 'ffn', side: 'top' }, junction: 'plus' },
    ],
    annotations: [
      { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size of ', input.vocabulary) },
      { id: 'context', target: 'backbone', placement: 'left', content: input.contextAnnotation },
      ...(input.headsAnnotation ? [{ id: 'heads', target: 'attention', placement: 'right' as const, content: input.headsAnnotation }] : []),
      { id: 'embedding-dimension', target: 'model', placement: 'bottom', content: input.embeddingAnnotation ?? { bullets: [text('Embedding'), emphasized('dimension of ', input.embedding)] } },
      { id: 'hidden-dimension', target: 'ffn', placement: 'right', content: input.hiddenAnnotation },
    ],
    layout: {
      mode: 'template',
      template: 'backbone',
      slots: {
        block: 'backbone',
        inset: 'ffn-inset',
        ...(input.positionalEmbedding ? { positional: 'positional-embedding' } : {}),
        ...(input.dropout ? { dropout: 'dropout' } : {}),
      },
      options: {
        ...(input.normLabels ? { normLabels: input.normLabels } : {}),
        showQKNorm: input.showQKNorm,
        showRoPE: input.showRoPE ?? true,
        normStroke: 'ink',
        ...(input.ropeLabels ? { ropeLabel: input.ropeLabels.primary, ropeSecondaryLabel: input.ropeLabels.secondary } : {}),
        ...(input.hiddenAnnotationX !== undefined ? { hiddenAnnotationX: input.hiddenAnnotationX } : {}),
        ...(input.headsAnnotationX !== undefined ? { headsAnnotationX: input.headsAnnotationX } : {}),
        ...(input.headsLeaderEndX !== undefined ? { headsLeaderEndX: input.headsLeaderEndX } : {}),
        ...(input.sampleInputY !== undefined ? { sampleInputY: input.sampleInputY } : {}),
        ...(input.titleColor !== undefined ? { titleColor: input.titleColor } : {}),
        ...(input.sampleInputText !== undefined ? { sampleInputText: input.sampleInputText } : {}),
      },
    },
  };
}

export const domynEdgeSpec = edgeBackboneSpec({
  id: 'domyn-edge-3-93b',
  title: 'Domyn Edge (3.93B)',
  layers: 36,
  hidden: 9728,
  activation: 'SiLU',
  hiddenAnnotation: { bullets: [text('FFN width'), emphasized('', '9,728')] },
  embedding: '2,560',
  embeddingAnnotation: { bullets: [emphasized('Embedding width ', '2,560'), text('Tied input/output weights')] },
  contextAnnotation: { bullets: [text('Context length'), emphasized('', '256k', ' working'), emphasized('', '1M', ' in training')] },
  attention: { heads: 8, kvHeads: 4 },
  vocabulary: '115,272',
  canvas: { width: 2494, height: 2663 },
  accent: '#008F00',
  blockFill: '#8FAE7E',
  showQKNorm: true,
  ropeLabels: { primary: 'Local RoPE', secondary: 'Global NoPE' },
});

export const granite41Spec = edgeBackboneSpec({
  id: 'granite-4-1-30b',
  title: 'Granite 4.1 (30B)',
  layers: 64,
  hidden: 32768,
  activation: 'SiLU',
  hiddenAnnotation: { bullets: [
    emphasized('Input size: ', '4,096'),
    text('Intermediate projection'),
    { spans: [{ text: 'size 8×4,096 = ' }, { text: '32,768', color: 'accent' }] },
  ] },
  embedding: '4,096',
  contextAnnotation: { bullets: [text('Native context'), emphasized('', '131,072', ' tokens')] },
  headsAnnotation: { bullets: [emphasized('', '32', ' attention heads'), emphasized('', '8', ' key & value heads')] },
  attention: { heads: 32, kvHeads: 8 },
  vocabulary: '100k',
  canvas: { width: 2530, height: 2634 },
  accent: '#0076BA',
  blockFill: '#5B8CE0',
  normLabels: 'pre',
  showQKNorm: true,
  hiddenAnnotationX: 1820,
  sampleInputY: 2626,
});

export const gpt2xlSpec = edgeBackboneSpec({
  id: 'gpt-2-xl-1-5b',
  title: 'GPT-2 XL (1.5B)',
  layers: 48,
  hidden: 6400,
  activation: 'GELU',
  hiddenAnnotation: { bullets: [text('Hidden layer'), emphasized('dimension of ', '6,400')] },
  embedding: '1,600',
  contextAnnotation: { bullets: [text('Native context'), emphasized('', '1,024', ' tokens')] },
  headsAnnotation: { bullets: [emphasized('', '25', ' heads'), text('Learned absolute positions for'), emphasized('', '1,024', ' tokens')] },
  attention: { heads: 25, kvHeads: 25, label: { spans: [{ text: 'Masked multi-head' }, { text: 'attention' }] } },
  vocabulary: '50k',
  canvas: { width: 2488, height: 2698 },
  accent: '#0076BA',
  blockFill: '#9CB5C9',
  normLabels: 'layernorm',
  showQKNorm: false,
  showRoPE: false,
  positionalEmbedding: true,
  dropout: true,
  titleColor: '#000000',
  sampleInputText: 'Every effort moves you',
  headsAnnotationX: 1600,
  headsLeaderEndX: 1580,
});
