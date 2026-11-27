import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const qwen3Spec = {
  schemaVersion: 1,
  id: 'qwen3-8b',
  title: 'Qwen3 (8B)',
  description: 'Qwen3 dense architecture with 36 repeated residual blocks, QK-Norm and RoPE, grouped-query attention, YaRN context, and a SiLU feed-forward inset.',
  canvas: { width: 2533, height: 2642 },
  theme: {
    accent: '#01A2FF',
    surface: '#D9D9D9',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 36 }, children: ['attention', 'ffn'], style: { fill: { kind: 'solid', color: '#57C3FF' } } },
    { id: 'ffn-inset', kind: 'inset', parent: 'model', children: ['ffn'] },
  ],
  nodes: [
    {
      id: 'attention',
      kind: 'composite',
      label: { spans: [{ text: 'Grouped-query' }, { text: 'attention' }] },
      data: { family: 'gqa', heads: 32, kvHeads: 8 },
    },
    { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 12288, activation: 'SiLU' } },
  ],
  edges: [
    { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
    { id: 'residual-ffn', kind: 'residual', from: { node: 'ffn' }, to: { node: 'ffn', side: 'top' }, junction: 'plus' },
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
    {
      id: 'heads', target: 'attention', placement: 'right', content: { bullets: [
        emphasized('', '32', ' attention heads'),
        emphasized('', '8', ' key & value heads'),
      ] },
    },
    {
      id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [
        text('Embedding'),
        emphasized('dimension of ', '4,096'),
      ] },
    },
    {
      id: 'hidden-dimension', target: 'ffn', placement: 'right', content: { bullets: [
        emphasized('Input size: ', '4,096'),
        { spans: [{ text: 'Intermediate projection' }] },
        { spans: [{ text: 'size 3×4,096 = ' }, { text: '12,288', color: 'accent' }] },
      ] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'backbone',
    slots: { block: 'backbone', inset: 'ffn-inset' },
    options: { normLabels: 'pre', showQKNorm: true },
  },
} satisfies FigureSpec;
