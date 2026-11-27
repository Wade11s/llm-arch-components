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
  showPostNorms?: boolean;
  showPreNorms?: boolean;
  attentionLabelStyle?: 'mha' | 'mha-sliding';
  attentionRatio?: string;
  attentionSuffix?: string;
  attentionFirstLineAccent?: boolean;
  normStroke?: string;
  insetOffsetX?: number;
  insetTitle?: string;
  ropeLabel?: string;
  ropeSecondaryLabel?: string;
  nopeLabel?: string;
  nopeAnnotation?: AnnotationContent;
  windowSizeAnnotation?: AnnotationContent;
  repeatOnceWithSameWeights?: boolean;
  repeatLoopLabel?: string;
  repeatNote?: AnnotationContent;
  hiddenAnnotationX?: number;
  headsAnnotationX?: number;
  headsAnnotationY?: number;
  headsLeaderEndX?: number;
  headsLeaderEndY?: number;
  sampleInputY?: number;
}): FigureSpec {
  const normDescription = input.showPostNorms ? 'Post-RMSNorm pairs' : input.normLabels === 'pre' ? 'Pre-RMSNorm pairs' : 'RMSNorm pairs';
  const attentionDescription = input.attentionLabelStyle === 'mha'
    ? input.showQKNorm ? 'QK-Norm multi-head attention' : 'multi-head attention'
    : input.showQKNorm ? 'QK-Norm grouped-query attention' : 'grouped-query attention';
  return {
    schemaVersion: 1,
    id: input.id,
    title: input.title,
    description: `${input.title} architecture with ${input.layers} repeated residual blocks, ${attentionDescription}, ${normDescription}, and a SiLU feed-forward inset.`,
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
      { id: 'ffn-inset', kind: 'inset', parent: 'model', title: input.insetTitle ? { spans: [{ text: input.insetTitle }] } : undefined, children: ['ffn'] },
    ],
    nodes: [
      { id: 'attention', kind: 'composite', label: input.attention.label ?? { spans: [{ text: 'Grouped-query' }, { text: 'attention' }] }, data: { family: 'gqa', heads: input.attention.heads, kvHeads: input.attention.kvHeads, ...(input.attentionRatio ? { ratio: input.attentionRatio } : {}) } },
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
      ...(input.nopeAnnotation ? [{ id: 'nope', target: 'attention', placement: 'left' as const, content: input.nopeAnnotation }] : []),
      ...(input.windowSizeAnnotation ? [{ id: 'window-size', target: 'attention', placement: 'right' as const, content: input.windowSizeAnnotation }] : []),
      ...(input.repeatNote ? [{ id: 'repeat-note', target: 'backbone', placement: 'left' as const, content: input.repeatNote }] : []),
    ],
    layout: {
      mode: 'template',
      template: 'backbone',
      slots: { block: 'backbone', inset: 'ffn-inset' },
      options: {
        normLabels: input.normLabels,
        showQKNorm: input.showQKNorm,
        normStroke: input.normStroke ?? 'ink',
        ...(input.showPostNorms !== undefined ? { showPostNorms: input.showPostNorms } : {}),
        ...(input.showPreNorms !== undefined ? { showPreNorms: input.showPreNorms } : {}),
        ...(input.attentionLabelStyle ? { attentionLabelStyle: input.attentionLabelStyle } : {}),
        ...(input.attentionSuffix ? { attentionSuffix: input.attentionSuffix } : {}),
        ...(input.attentionFirstLineAccent ? { attentionFirstLineAccent: true } : {}),
        ...(input.insetOffsetX !== undefined ? { insetOffsetX: input.insetOffsetX } : {}),
        ...(input.ropeLabel ? { ropeLabel: input.ropeLabel } : {}),
        ...(input.ropeSecondaryLabel ? { ropeSecondaryLabel: input.ropeSecondaryLabel } : {}),
        ...(input.nopeLabel ? { nopeLabel: input.nopeLabel } : {}),
        ...(input.repeatOnceWithSameWeights ? { repeatOnceWithSameWeights: true } : {}),
        ...(input.repeatLoopLabel ? { repeatLoopLabel: input.repeatLoopLabel } : {}),
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
  headsAnnotationX: 1760,
  headsLeaderEndX: 1740,
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
  headsAnnotationX: 1760,
  headsLeaderEndX: 1740,
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
  headsAnnotationX: 1760,
  headsLeaderEndX: 1740,
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
  headsAnnotationX: 1760,
  headsLeaderEndX: 1740,
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

export const antares1bSpec = denseBackboneSpec({
  id: 'antares-1b',
  title: 'Antares-1B',
  layers: 40,
  hidden: 4096,
  hiddenAnnotation: { bullets: [emphasized('Input size: ', '2,048'), text('Intermediate projection:'), emphasized('', '4,096')] },
  embedding: '2,048',
  contextAnnotation: { bullets: [text('Native context'), emphasized('', '131,072', ' tokens')] },
  headsAnnotation: { bullets: [emphasized('', '16', ' Q heads'), emphasized('', '4', ' KV heads')] },
  attention: { heads: 16, kvHeads: 4 },
  vocabulary: '100k',
  canvas: { width: 2530, height: 2632 },
  accent: '#105FF7',
  blockFill: '#6390E8',
  normLabels: 'pre',
  showQKNorm: false,
  headsAnnotationY: 1750,
  headsAnnotationX: 1760,
  headsLeaderEndX: 1740,
  headsLeaderEndY: 1750,
  hiddenAnnotationX: 1600,
  sampleInputY: 2620,
  insetOffsetX: -120,
  insetTitle: 'Feed forward (SwiGLU) module',
});

export const vibeThinker3bSpec = denseBackboneSpec({
  id: 'vibethinker-3b',
  title: 'VibeThinker-3B',
  layers: 36,
  hidden: 11008,
  hiddenAnnotation: { bullets: [emphasized('Input size: ', '2,048'), text('Intermediate projection'), emphasized('size: ', '11,008')] },
  embedding: '2,048',
  contextAnnotation: { bullets: [text('Context length'), emphasized('', '64k', ' training'), emphasized('', '128k', ' in config')] },
  headsAnnotation: { bullets: [emphasized('', '16', ' heads,'), emphasized('', '2', ' KV heads')] },
  attention: { heads: 16, kvHeads: 2 },
  vocabulary: '151k',
  canvas: { width: 2555, height: 2652 },
  accent: '#01A2FF',
  blockFill: '#56C1FF',
  normLabels: 'rmsnorm',
  showQKNorm: false,
  attentionSuffix: '(GQA)',
  headsAnnotationY: 1750,
  headsAnnotationX: 1760,
  headsLeaderEndX: 1740,
  headsLeaderEndY: 1750,
  hiddenAnnotationX: 1700,
  sampleInputY: 2636,
  insetOffsetX: -120,
});

export const nanbeige41Spec = denseBackboneSpec({
  id: 'nanbeige-4-1-3b',
  title: 'Nanbeige4.1 (3B)',
  layers: 32,
  hidden: 10496,
  hiddenAnnotation: { bullets: [text('Intermediate projection'), emphasized('size of ', '10,496')] },
  embedding: '2,560',
  contextAnnotation: { bullets: [text('Native context'), emphasized('', '262,144', ' tokens')] },
  headsAnnotation: { bullets: [
    { spans: [{ text: '20 Q heads, ', color: 'accent' }, { text: '4 KV heads (group size ' }, { text: '5', color: 'accent' }, { text: ')' }] },
    { spans: [{ text: 'head dim ' }, { text: '128', color: 'accent' }] },
  ] },
  attention: { heads: 20, kvHeads: 4 },
  vocabulary: '166k',
  canvas: { width: 2649, height: 2664 },
  accent: '#007F00',
  blockFill: '#A9D18E',
  normLabels: 'rmsnorm',
  showQKNorm: false,
  headsAnnotationY: 1750,
  headsLeaderEndY: 1750,
  headsAnnotationX: 1600,
  headsLeaderEndX: 1580,
});

export const nanbeige43Spec = denseBackboneSpec({
  id: 'nanbeige-4-3-33b',
  title: 'Nanbeige4.3 (33B)',
  layers: 52,
  hidden: 22016,
  hiddenAnnotation: { bullets: [text('Intermediate projection'), emphasized('size of ', '22,016')] },
  embedding: '7,168',
  contextAnnotation: { bullets: [text('Native context'), emphasized('', '524,288', ' tokens')] },
  headsAnnotation: { bullets: [
    { spans: [{ text: '56 Q heads, ', color: 'accent' }, { text: '8 KV heads' }] },
    { spans: [{ text: 'group size ' }, { text: '7', color: 'accent' }] },
    { spans: [{ text: 'head dim ' }, { text: '128', color: 'accent' }] },
  ] },
  attention: { heads: 56, kvHeads: 8 },
  vocabulary: '167k',
  canvas: { width: 2599, height: 2664 },
  accent: '#007F00',
  blockFill: '#86A872',
  normLabels: 'rmsnorm',
  showQKNorm: false,
  headsAnnotationY: 1750,
  headsLeaderEndY: 1750,
  headsAnnotationX: 1600,
  headsLeaderEndX: 1580,
  insetOffsetX: -40,
});

export const mistralSmall31Spec = denseBackboneSpec({
  id: 'mistral-small-3-1-24b',
  title: 'Mistral Small 3.1 (24B)',
  layers: 40,
  hidden: 32768,
  hiddenAnnotation: { bullets: [text('Hidden layer'), emphasized('dimension of ', '32,768')] },
  embedding: '5,120',
  contextAnnotation: { bullets: [text('Native context'), emphasized('', '131,072', ' tokens')] },
  headsAnnotation: { bullets: [emphasized('', '32', ' attention heads'), emphasized('', '8', ' key & value heads')] },
  attention: { heads: 32, kvHeads: 8 },
  vocabulary: '131,072',
  canvas: { width: 2554, height: 2686 },
  accent: '#FF644E',
  blockFill: '#EB978B',
  normLabels: 'pre',
  showQKNorm: false,
  attentionFirstLineAccent: true,
  normStroke: '#FF644E',
  headsAnnotationY: 1750,
  headsAnnotationX: 1760,
  headsLeaderEndX: 1740,
  headsLeaderEndY: 1750,
  insetOffsetX: -120,
});

export const smollm3Spec = denseBackboneSpec({
  id: 'smollm3-3b',
  title: 'SmolLM3 (3B)',
  layers: 36,
  hidden: 11008,
  hiddenAnnotation: { bullets: [text('Hidden layer'), emphasized('dimension of ', '11,008')] },
  embedding: '2,048',
  contextAnnotation: { bullets: [text('Context length'), emphasized('', '64k', ' native'), emphasized('', '128k', ' with YaRN')] },
  headsAnnotation: { bullets: [emphasized('', '16', ' heads')] },
  attention: { heads: 16, kvHeads: 4, label: maskedAttention },
  vocabulary: '128k',
  canvas: { width: 2571, height: 2642 },
  accent: '#FFAA00',
  blockFill: '#F2DA8B',
  normLabels: 'rmsnorm',
  showQKNorm: false,
  nopeLabel: 'NoPE',
  nopeAnnotation: { bullets: [text('NoPE every'), text('4th layer')] },
  headsAnnotationY: 1750,
  headsAnnotationX: 1760,
  headsLeaderEndX: 1740,
  headsLeaderEndY: 1750,
  hiddenAnnotationX: 1700,
  sampleInputY: 2636,
  insetOffsetX: -40,
});

export const olmo3Spec = denseBackboneSpec({
  id: 'olmo-3-7b',
  title: 'Olmo 3 (7B)',
  layers: 32,
  hidden: 11008,
  hiddenAnnotation: { bullets: [emphasized('Input size: ', '4,096'), text('Intermediate projection'), emphasized('size = ', '11,008')] },
  embedding: '4,096',
  contextAnnotation: { bullets: [text('YaRN context'), emphasized('', '64k', ' tokens'), emphasized('', '8k', ' RoPE base')] },
  headsAnnotation: { bullets: [emphasized('', '32', ' attention heads'), emphasized('', '32', ' key & value heads'), text('(regular multi-head attention)')] },
  attention: { heads: 32, kvHeads: 32 },
  vocabulary: '100k',
  canvas: { width: 2596, height: 2684 },
  accent: '#F1539D',
  blockFill: '#DDADC4',
  normLabels: 'rmsnorm',
  showQKNorm: true,
  showPostNorms: true,
  showPreNorms: false,
  normStroke: '#F1539D',
  attentionRatio: '3:1',
  attentionLabelStyle: 'mha-sliding',
  ropeLabel: 'RoPE + YaRN',
  windowSizeAnnotation: { bullets: [text('Sliding'), text('window size'), emphasized('', '4,096')] },
  headsAnnotationY: 1750,
  headsAnnotationX: 1700,
  headsLeaderEndX: 1680,
  headsLeaderEndY: 1750,
  hiddenAnnotationX: 1700,
  insetOffsetX: -40,
});

export const nanbeige42Spec = denseBackboneSpec({
  id: 'nanbeige-4-2-3b',
  title: 'Nanbeige4.2 (3B)',
  layers: 22,
  hidden: 10752,
  hiddenAnnotation: { bullets: [text('Intermediate projection'), emphasized('size of ', '10,752')] },
  embedding: '3,072',
  contextAnnotation: { bullets: [text('Native context'), emphasized('', '262,144', ' tokens')] },
  headsAnnotation: { bullets: [
    { spans: [{ text: '48 Q heads, ', color: 'accent' }, { text: '8 KV heads (group size ' }, { text: '6', color: 'accent' }, { text: ')' }] },
    { spans: [{ text: 'head dim ' }, { text: '128', color: 'accent' }] },
  ] },
  attention: { heads: 48, kvHeads: 8 },
  vocabulary: '166k',
  canvas: { width: 2683, height: 2664 },
  accent: '#007F00',
  blockFill: '#86A872',
  normLabels: 'rmsnorm',
  showQKNorm: false,
  repeatOnceWithSameWeights: true,
  repeatLoopLabel: 'Repeat once with same 22-layer weights',
  repeatNote: { bullets: [emphasized('22×', ' distinct layers;'), emphasized('44×', ' total layers')] },
  headsAnnotationY: 1750,
  headsAnnotationX: 1600,
  headsLeaderEndX: 1580,
  headsLeaderEndY: 1750,
});

export const olmo2Spec = denseBackboneSpec({
  id: 'olmo-2-7b',
  title: 'OLMo 2 (7B)',
  layers: 32,
  hidden: 11008,
  hiddenAnnotation: { bullets: [emphasized('Input size: ', '4,096'), text('Intermediate projection'), emphasized('size = ', '11,008')] },
  embedding: '4,096',
  contextAnnotation: { bullets: [text('Native context'), emphasized('', '4,096', ' tokens')] },
  headsAnnotation: { bullets: [emphasized('', '32', ' attention heads'), emphasized('', '32', ' key & value heads'), text('(regular multi-head attention)')] },
  attention: { heads: 32, kvHeads: 32 },
  vocabulary: '100k',
  canvas: { width: 2595, height: 2679 },
  accent: '#F1539D',
  blockFill: '#DDADC4',
  normLabels: 'rmsnorm',
  showQKNorm: true,
  showPostNorms: true,
  showPreNorms: false,
  attentionLabelStyle: 'mha',
  normStroke: '#F1539D',
  headsAnnotationY: 1750,
  headsAnnotationX: 1700,
  headsLeaderEndX: 1680,
  headsLeaderEndY: 1750,
  hiddenAnnotationX: 1700,
  insetOffsetX: -40,
});
