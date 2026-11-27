import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const qwen3MoeSpec = {
  schemaVersion: 1,
  id: 'qwen3-30b-a3b',
  title: 'Qwen3 (30B-A3B)',
  description: 'Qwen3 MoE architecture with 48 residual blocks, QK-Norm and RoPE, grouped-query attention, 128 experts, and 8 active experts per token.',
  canvas: { width: 2829, height: 2715 },
  theme: {
    accent: '#00A5DF',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset', 'moe-inset'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 48 }, children: ['attention', 'ffn', 'moe'], style: { fill: { kind: 'solid', color: '#9BC2DD' } } },
    { id: 'ffn-inset', kind: 'inset', parent: 'model', title: text('Feed forward (SwiGLU) module'), children: ['ffn'] },
    { id: 'moe-inset', kind: 'inset', parent: 'model', title: text('MoE layer'), children: ['moe'] },
  ],
  nodes: [
    { id: 'attention', kind: 'composite', data: { family: 'gqa', heads: 32, kvHeads: 4 } },
    { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 768, activation: 'SiLU' } },
    { id: 'moe', kind: 'composite', data: { family: 'moe', experts: 128, activeExperts: 8, sharedExperts: 0 } },
  ],
  edges: [
    { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
    { id: 'residual-moe', kind: 'residual', from: { node: 'moe' }, to: { node: 'moe', side: 'top' }, junction: 'plus' },
    { id: 'ffn-zoom', kind: 'zoom', from: { node: 'ffn' }, to: { node: 'ffn-inset' } },
    { id: 'moe-zoom', kind: 'zoom', from: { node: 'moe' }, to: { node: 'moe-inset' }, style: { stroke: '#00A5DF' } },
  ],
  annotations: [
    { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size of ', '151k') },
    {
      id: 'context', target: 'backbone', placement: 'left', content: { bullets: [
        text('Context length'),
        emphasized('', '32k', ' native'),
        emphasized('', '128k', ' with YaRN'),
      ] },
    },
    { id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [text('Embedding'), emphasized('dimension of ', '2,048')] } },
    {
      id: 'expert-dimensions', target: 'ffn', placement: 'right', content: { bullets: [
        text('Intermediate hidden'),
        emphasized('layer dimension of ', '768'),
      ] },
    },
    { id: 'resource-savings-title', target: 'moe', placement: 'bottom', content: emphasized('', 'Resource savings:') },
    {
      id: 'resource-savings', target: 'moe', placement: 'bottom', content: { bullets: [
        emphasized('Model size is ', '30B'),
        emphasized('but only ', '8 experts', ' active per token'),
        emphasized('only ', '3B', ' parameters are active'),
        { spans: [{ text: '' }, { text: 'per inference step' }] },
      ] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'moe',
    slots: { block: 'backbone', ffn: 'ffn-inset', moe: 'moe-inset' },
    options: { showQKNorm: true, ropeLabel: 'RoPE', firstBadgeFill: '#000000', expertAnnotationY: 1110 },
  },
} satisfies FigureSpec;
