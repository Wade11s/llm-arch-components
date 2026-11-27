import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const kimiLinearSpec = {
  schemaVersion: 1,
  id: 'kimi-linear-48b-a3b',
  title: 'Kimi Linear (48B-A3B)',
  description: 'Kimi Linear architecture alternating Kimi Delta Attention with multi-head latent attention and MoE, using 20 KDA layers and 7 MLA layers.',
  canvas: { width: 2935, height: 2754 },
  theme: {
    accent: '#00A5F0',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    monospaceFamily: "'Courier New', monospace",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'attention-inset', 'delta-inset'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 27 }, children: ['attention', 'delta', 'moe'], style: { fill: { kind: 'solid', color: '#64ADD8' } } },
    { id: 'attention-inset', kind: 'inset', parent: 'model', title: text('Multi-head latent attention'), children: ['attention'] },
    { id: 'delta-inset', kind: 'inset', parent: 'model', title: text('Kimi Delta Attention'), children: ['delta'] },
  ],
  nodes: [
    {
      id: 'attention',
      kind: 'composite',
      label: { spans: [{ text: 'Kimi Delta Attn or' }, { text: 'Multi-head latent attn' }] },
      data: { family: 'mla', heads: 64, kvRank: 512 },
    },
    { id: 'delta', kind: 'composite', label: text('Kimi Delta Attention'), data: { family: 'gated-delta-net', qkHeads: 16, vHeads: 32 } },
    { id: 'moe', kind: 'composite', data: { family: 'moe', experts: 384, activeExperts: 8, sharedExperts: 1 } },
  ],
  edges: [
    { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
    { id: 'residual-moe', kind: 'residual', from: { node: 'moe' }, to: { node: 'moe', side: 'top' }, junction: 'plus' },
  ],
  annotations: [
    {
      id: 'side-note', target: 'attention', placement: 'left', content: { bullets: [
        text('NoPE'),
        text('(in MLA layers)'),
      ] },
    },
    {
      id: 'context', target: 'backbone', placement: 'left', content: { bullets: [
        text('Native context'),
        emphasized('', '1M', ' tokens'),
      ] },
    },
    {
      id: 'schedule', target: 'delta-inset', placement: 'bottom', content: { bullets: [
        text('20 KDA layers and 7 MLA layers'),
        text('MLA layers 4, 8, 12, 16, 20, 24, 27'),
      ] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'moe',
    slots: { block: 'backbone', attention: 'attention-inset', delta: 'delta-inset' },
    options: { variant: 'mixing-detail' },
  },
} satisfies FigureSpec;
