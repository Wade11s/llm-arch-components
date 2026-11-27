import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const llama3Spec = {
  schemaVersion: 1,
  id: 'llama-3-8b',
  title: 'Llama 3 (8B)',
  description: 'Llama 3 architecture with 32 repeated residual blocks, masked grouped-query attention, RMSNorm pairs, and a SiLU feed-forward inset.',
  canvas: { width: 2554, height: 2670 },
  theme: {
    accent: '#0076BA',
    surface: '#D9D9D9',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 32 }, children: ['attention', 'ffn'], style: { fill: { kind: 'solid', color: '#929292' } } },
    { id: 'ffn-inset', kind: 'inset', parent: 'model', children: ['ffn'] },
  ],
  nodes: [
    {
      id: 'attention',
      kind: 'composite',
      label: { spans: [{ text: 'Masked ' }, { text: 'grouped-query', color: 'accent' }, { text: 'attention' }] },
      data: { family: 'gqa', heads: 32, kvHeads: 8 },
    },
    { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 14336, activation: 'SiLU' } },
  ],
  edges: [
    { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
    { id: 'residual-ffn', kind: 'residual', from: { node: 'ffn' }, to: { node: 'ffn', side: 'top' }, junction: 'plus' },
  ],
  annotations: [
    { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size of ', '128k') },
    {
      id: 'context', target: 'backbone', placement: 'left', content: { bullets: [
        text('Native context'),
        emphasized('', '8,192', ' tokens'),
      ] },
    },
    {
      id: 'heads', target: 'attention', placement: 'right', content: { bullets: [
        emphasized('', '32', ' heads'),
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
        text('Hidden layer'),
        emphasized('dimension of ', '14,336'),
      ] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'backbone',
    slots: { block: 'backbone', inset: 'ffn-inset' },
    options: { normLabels: 'rmsnorm', showQKNorm: false, normStroke: 'ink' },
  },
} satisfies FigureSpec;
