import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const minimaxM2Spec = {
  schemaVersion: 1,
  id: 'minimax-m2-230b',
  title: 'MiniMax-M2 (230B)',
  description: 'MiniMax-M2 architecture with 62 residual blocks, QK-Norm and Partial RoPE, grouped-query attention, 256 experts, and 8 active experts per token.',
  canvas: { width: 2751, height: 2709 },
  theme: {
    accent: '#E74C6C',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset', 'moe-inset'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 62 }, children: ['attention', 'ffn', 'moe'], style: { fill: { kind: 'solid', color: '#DF91A1' } } },
    { id: 'ffn-inset', kind: 'inset', parent: 'model', title: text('Feed forward (SwiGLU) module'), children: ['ffn'] },
    { id: 'moe-inset', kind: 'inset', parent: 'model', title: text('MoE layer'), children: ['moe'] },
  ],
  nodes: [
    { id: 'attention', kind: 'composite', data: { family: 'gqa', heads: 64, kvHeads: 8 } },
    { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 1536, activation: 'SiLU' } },
    { id: 'moe', kind: 'composite', data: { family: 'moe', experts: 256, activeExperts: 8, sharedExperts: 0 } },
  ],
  edges: [
    { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
    { id: 'residual-moe', kind: 'residual', from: { node: 'moe' }, to: { node: 'moe', side: 'top' }, junction: 'plus' },
    { id: 'ffn-zoom', kind: 'zoom', from: { node: 'ffn' }, to: { node: 'ffn-inset' } },
    { id: 'moe-zoom', kind: 'zoom', from: { node: 'moe' }, to: { node: 'moe-inset' }, style: { stroke: '#E74C6C' } },
  ],
  annotations: [
    { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size of ', '200,064') },
    {
      id: 'context', target: 'backbone', placement: 'left', content: { bullets: [
        text('Context length'),
        emphasized('', '196,608', ' tokens'),
        text('in config'),
      ] },
    },
    { id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [text('Embedding'), emphasized('dimension of ', '3,072')] } },
    {
      id: 'expert-dimensions', target: 'ffn', placement: 'right', content: { bullets: [
        emphasized('Input expert size: ', '3,072'),
        text('Intermediate projection size:'),
        emphasized('', '1,536'),
      ] },
    },
    { id: 'resource-savings-title', target: 'moe', placement: 'bottom', content: emphasized('', 'Resource savings:') },
    {
      id: 'resource-savings', target: 'moe', placement: 'bottom', content: { bullets: [
        emphasized('Model size is ', '229B'),
        emphasized('but only ', '8 experts', ' active per token'),
        emphasized('only ', '10B', ' parameters are active'),
        { spans: [{ text: '' }, { text: 'per inference step (i.e., only ' }, { text: '4.37%', color: 'accent' }, { text: ' parameters active)' }] },
      ] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'moe',
    slots: { block: 'backbone', ffn: 'ffn-inset', moe: 'moe-inset' },
    options: { showQKNorm: true, ropeLabel: 'Partial RoPE', firstBadgeFill: '#5E5E5E', expertAnnotationY: 1110, resourceMaxWidth: 900, resourceLineGap: 58 },
  },
} satisfies FigureSpec;
