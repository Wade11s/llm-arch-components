import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const gemma3Spec = {
  schemaVersion: 1,
  id: 'gemma-3-27b',
  title: 'Gemma 3 (27B)',
  description: 'Gemma 3 architecture with 62 repeated residual blocks, grouped-query attention, pre- and post-RMSNorm pairs, and a GELU feed-forward inset.',
  canvas: { width: 2593, height: 2686 },
  theme: {
    accent: '#F27200',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 62 }, children: ['attention', 'ffn'], style: { fill: { kind: 'solid', color: '#DECBA3' } } },
    { id: 'ffn-inset', kind: 'inset', parent: 'model', title: text('Feed forward (GELU) module'), children: ['ffn'] },
  ],
  nodes: [
    { id: 'attention', kind: 'composite', data: { family: 'gqa', heads: 32, kvHeads: 16, ratio: '5:1' } },
    { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 21504, activation: 'GELU' } },
  ],
  edges: [
    { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
    { id: 'residual-ffn', kind: 'residual', from: { node: 'ffn' }, to: { node: 'ffn', side: 'top' }, junction: 'plus' },
  ],
  annotations: [
    { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size of ', '262k') },
    {
      id: 'context', target: 'backbone', placement: 'left', content: { bullets: [
        text('Context length'),
        emphasized('', '32k', ' pretraining'),
        emphasized('', '128k', ' linear RoPE'),
      ] },
    },
    {
      id: 'heads', target: 'attention', placement: 'right', content: { bullets: [
        emphasized('', '32', ' attention heads'),
        emphasized('', '16', ' key & value heads'),
      ] },
    },
    {
      id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [
        text('Embedding'),
        emphasized('dimension of ', '5,376'),
      ] },
    },
    {
      id: 'hidden-dimension', target: 'ffn', placement: 'right', content: { bullets: [
        text('Hidden layer'),
        emphasized('dimension of ', '21,504'),
      ] },
    },
  ],
  layout: { mode: 'template', template: 'backbone', slots: { block: 'backbone', inset: 'ffn-inset' } },
} satisfies FigureSpec;
