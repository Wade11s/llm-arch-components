import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

type AnnotationContent = { bullets: TextSpec[] };

function denseBackboneSpec(input: {
  id: string;
  title: string;
  layers: number;
  hidden: number;
  hiddenAnnotation: AnnotationContent;
  embedding: string;
  contextAnnotation: AnnotationContent;
  headsAnnotation: AnnotationContent;
  attention: { heads: number; kvHeads: number; label?: TextSpec };
  vocabulary: string;
  canvas: FigureSpec['canvas'];
  accent: string;
  blockFill: string;
  normLabels: 'rmsnorm' | 'pre';
  showQKNorm: boolean;
  hiddenAnnotationX?: number;
  headsAnnotationX?: number;
  headsAnnotationY?: number;
  headsLeaderEndX?: number;
  headsLeaderEndY?: number;
  sampleInputY?: number;
}): FigureSpec {
  return {
    schemaVersion: 1,
    id: input.id,
    title: input.title,
    description: `${input.title} architecture with ${input.layers} repeated residual blocks, grouped-query attention, RMSNorm pairs, and a SiLU feed-forward inset.`,
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
      { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: input.hidden, activation: 'SiLU' } },
    ],
    edges: [
      { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
      { id: 'residual-ffn', kind: 'residual', from: { node: 'ffn' }, to: { node: 'ffn', side: 'top' }, junction: 'plus' },
    ],
    annotations: [
      { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size of ', input.vocabulary) },
      { id: 'context', target: 'backbone', placement: 'left', content: input.contextAnnotation },
      { id: 'heads', target: 'attention', placement: 'right', content: input.headsAnnotation },
      { id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [text('Embedding'), emphasized('dimension of ', input.embedding)] } },
      { id: 'hidden-dimension', target: 'ffn', placement: 'right', content: input.hiddenAnnotation },
    ],
    layout: {
      mode: 'template',
      template: 'backbone',
      slots: { block: 'backbone', inset: 'ffn-inset' },
      options: {
        normLabels: input.normLabels,
        showQKNorm: input.showQKNorm,
        normStroke: 'ink',
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

const maskedAttention: TextSpec = { spans: [{ text: 'Masked ' }, { text: 'grouped-query', color: 'accent' }, { text: 'attention' }] };

export const llama321bSpec = denseBackboneSpec({
  id: 'llama-3-2-1b',
  title: 'Llama 3.2 (1B)',
  layers: 16,
  hidden: 8192,
  hiddenAnnotation: { bullets: [text('Hidden layer'), emphasized('dimension of ', '8,192')] },
  embedding: '2,048',
  contextAnnotation: { bullets: [text('Native context'), emphasized('', '128k', ' tokens'), text('Llama 3 RoPE')] },
  headsAnnotation: { bullets: [emphasized('', '32', ' heads')] },
  attention: { heads: 32, kvHeads: 8, label: maskedAttention },
  vocabulary: '128k',
  canvas: { width: 2553, height: 2664 },
  accent: '#D6006D',
  blockFill: '#D6A6C1',
  normLabels: 'rmsnorm',
  showQKNorm: false,
  headsAnnotationY: 1280,
  headsAnnotationX: 1800,
  headsLeaderEndX: 1780,
  headsLeaderEndY: 1280,
});

export const llama323bSpec = denseBackboneSpec({
  id: 'llama-3-2-3b',
  title: 'Llama 3.2 (3B)',
  layers: 28,
  hidden: 8192,
  hiddenAnnotation: { bullets: [text('Hidden layer'), emphasized('dimension of ', '8,192')] },
  embedding: '3,072',
  contextAnnotation: { bullets: [text('Native context'), emphasized('', '128k', ' tokens'), text('Llama 3 RoPE')] },
  headsAnnotation: { bullets: [emphasized('', '24', ' heads')] },
  attention: { heads: 24, kvHeads: 8, label: maskedAttention },
  vocabulary: '128k',
  canvas: { width: 2553, height: 2664 },
  accent: '#D6006D',
  blockFill: '#D6A6C1',
  normLabels: 'rmsnorm',
  showQKNorm: false,
  headsAnnotationY: 1280,
  headsAnnotationX: 1800,
  headsLeaderEndX: 1780,
  headsLeaderEndY: 1280,
});

export const qwen306bSpec = denseBackboneSpec({
  id: 'qwen3-0-6b',
  title: 'Qwen3 (0.6B)',
  layers: 28,
  hidden: 3072,
  hiddenAnnotation: { bullets: [text('Hidden layer'), emphasized('dimension of ', '3,072')] },
  embedding: '1,024',
  contextAnnotation: { bullets: [text('Native context'), emphasized('', '32,768', ' tokens')] },
  headsAnnotation: { bullets: [emphasized('', '16', ' heads')] },
  attention: { heads: 16, kvHeads: 8, label: maskedAttention },
  vocabulary: '151k',
  canvas: { width: 2531, height: 2654 },
  accent: '#01A2FF',
  blockFill: '#57C3FF',
  normLabels: 'rmsnorm',
  showQKNorm: true,
  headsAnnotationY: 1280,
  headsAnnotationX: 1800,
  headsLeaderEndX: 1780,
  headsLeaderEndY: 1280,
  sampleInputY: 2638,
});

export const qwen34bSpec = denseBackboneSpec({
  id: 'qwen3-4b',
  title: 'Qwen3 (4B)',
  layers: 36,
  hidden: 9728,
  hiddenAnnotation: { bullets: [text('Hidden layer'), emphasized('dimension of ', '9,728')] },
  embedding: '2,560',
  contextAnnotation: { bullets: [text('Context length'), emphasized('', '32k', ' native'), emphasized('', '128k', ' with YaRN')] },
  headsAnnotation: { bullets: [emphasized('', '32', ' heads')] },
  attention: { heads: 32, kvHeads: 8, label: maskedAttention },
  vocabulary: '151k',
  canvas: { width: 2531, height: 2654 },
  accent: '#01A2FF',
  blockFill: '#57C3FF',
  normLabels: 'rmsnorm',
  showQKNorm: true,
  headsAnnotationY: 1280,
  headsAnnotationX: 1800,
  headsLeaderEndX: 1780,
  headsLeaderEndY: 1280,
  sampleInputY: 2638,
});

export const qwen332bSpec = denseBackboneSpec({
  id: 'qwen3-32b',
  title: 'Qwen3 (32B)',
  layers: 64,
  hidden: 25600,
  hiddenAnnotation: { bullets: [
    emphasized('Input size: ', '5,120'),
    text('Intermediate projection'),
    { spans: [{ text: 'size 5×5,120 = ' }, { text: '25,600', color: 'accent' }] },
  ] },
  embedding: '5,120',
  contextAnnotation: { bullets: [text('Context length'), emphasized('', '32k', ' native'), emphasized('', '128k', ' with YaRN')] },
  headsAnnotation: { bullets: [emphasized('', '64', ' attention heads'), emphasized('', '8', ' key & value heads')] },
  attention: { heads: 64, kvHeads: 8 },
  vocabulary: '151k',
  canvas: { width: 2531, height: 2634 },
  accent: '#01A2FF',
  blockFill: '#57C3FF',
  normLabels: 'pre',
  showQKNorm: true,
  hiddenAnnotationX: 1820,
  sampleInputY: 2626,
});

export const phi4Spec = denseBackboneSpec({
  id: 'phi-4',
  title: 'Phi-4 (14B)',
  layers: 40,
  hidden: 17920,
  hiddenAnnotation: { bullets: [
    emphasized('Input size: ', '5,120'),
    text('Intermediate projection'),
    emphasized('size: ', '17,920'),
  ] },
  embedding: '5,120',
  contextAnnotation: { bullets: [text('Native context'), emphasized('', '16,384', ' tokens')] },
  headsAnnotation: { bullets: [emphasized('', '40', ' attention heads'), emphasized('', '10', ' key & value heads')] },
  attention: { heads: 40, kvHeads: 10 },
  vocabulary: '100k',
  canvas: { width: 2563, height: 2671 },
  accent: '#0076BA',
  blockFill: '#5B8CE0',
  normLabels: 'rmsnorm',
  showQKNorm: false,
  hiddenAnnotationX: 1800,
});
