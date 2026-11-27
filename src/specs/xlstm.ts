import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const xlstmSpec = {
  schemaVersion: 1,
  id: 'xlstm-7b',
  title: 'xLSTM (7B)',
  description: 'xLSTM 7B architecture with 32 residual blocks, an xLSTM cell using matrix memory, SiLU feed-forward, and a detailed mLSTM layer inset.',
  canvas: { width: 2874, height: 2635 },
  theme: {
    accent: '#A58F00',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    monospaceFamily: "'Courier New', monospace",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset', 'mlstm-inset'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 32 }, children: ['xlstm', 'ffn'], style: { fill: { kind: 'solid', color: '#F4C84B' } } },
    { id: 'ffn-inset', kind: 'inset', parent: 'model', children: ['ffn'] },
    { id: 'mlstm-inset', kind: 'inset', parent: 'model', title: text('mLSTM layer'), children: ['xlstm'] },
  ],
  nodes: [
    {
      id: 'xlstm',
      kind: 'composite',
      label: { spans: [{ text: 'xLSTM with matrix' }, { text: 'memory' }] },
      data: { family: 'xlstm', matrixMemory: true },
    },
    { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 10944, activation: 'SiLU' } },
  ],
  edges: [
    { id: 'residual-attention', kind: 'residual', from: { node: 'xlstm' }, to: { node: 'xlstm', side: 'top' }, junction: 'plus' },
    { id: 'residual-ffn', kind: 'residual', from: { node: 'ffn' }, to: { node: 'ffn', side: 'top' }, junction: 'plus' },
  ],
  annotations: [
    {
      id: 'credit', target: 'mlstm-inset', placement: 'top', content: { bullets: [
        text('Adapted and modified'),
        text('from @maxmbeck'),
      ] },
    },
    { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size of ', '50k') },
    {
      id: 'context', target: 'backbone', placement: 'left', content: { bullets: [
        text('Context length'),
        emphasized('', '8k', ' training'),
        text('No fixed limit'),
      ] },
    },
    {
      id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [
        text('Embedding'),
        emphasized('dimension of ', '4,096'),
      ] },
    },
    {
      id: 'ffn-dimensions', target: 'ffn', placement: 'right', content: { bullets: [
        emphasized('Input dim.: ', '4,096'),
        emphasized('Intermediate dim.: ', '10,944'),
      ] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'backbone',
    slots: { block: 'backbone', ffn: 'ffn-inset', mlstm: 'mlstm-inset' },
    options: { variant: 'recurrent-detail' },
  },
} satisfies FigureSpec;
