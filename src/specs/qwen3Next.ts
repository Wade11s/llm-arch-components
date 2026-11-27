import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const qwen3NextSpec = {
  schemaVersion: 1,
  id: 'qwen3-next-80b-a3b',
  title: 'Qwen3-Next (80B-A3B)',
  description: 'Qwen3-Next architecture alternating three Gated DeltaNet layers with one Gated GQA layer, each followed by MoE.',
  canvas: { width: 2946, height: 2771 },
  theme: {
    accent: '#00A9C8',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    monospaceFamily: "'Courier New', monospace",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'attention-inset', 'delta-inset'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 48 }, children: ['attention', 'delta', 'moe'], style: { fill: { kind: 'solid', color: '#7BC0D8' } } },
    { id: 'attention-inset', kind: 'inset', parent: 'model', title: text('Gated grouped-query attention'), children: ['attention'] },
    { id: 'delta-inset', kind: 'inset', parent: 'model', title: text('Gated DeltaNet'), children: ['delta'] },
  ],
  nodes: [
    {
      id: 'attention',
      kind: 'composite',
      label: { spans: [{ text: 'Gated DeltaNet or' }, { text: 'Gated GQA' }] },
      data: { family: 'gqa', heads: 16, kvHeads: 16 },
    },
    { id: 'delta', kind: 'composite', label: text('Gated DeltaNet'), data: { family: 'gated-delta-net', qkHeads: 16, vHeads: 32 } },
    { id: 'moe', kind: 'composite', data: { family: 'moe', experts: 512, activeExperts: 10, sharedExperts: 1 } },
  ],
  edges: [
    { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
    { id: 'residual-moe', kind: 'residual', from: { node: 'moe' }, to: { node: 'moe', side: 'top' }, junction: 'plus' },
  ],
  annotations: [
    {
      id: 'side-note', target: 'attention', placement: 'left', content: { bullets: [
        text('Partial RoPE'),
        text('(only in attention layers)'),
      ] },
    },
    {
      id: 'context', target: 'backbone', placement: 'left', content: { bullets: [
        text('Context length'),
        emphasized('', '256k', ' native'),
        emphasized('', '1M', ' with YaRN'),
      ] },
    },
    {
      id: 'schedule', target: 'delta-inset', placement: 'bottom', content: { bullets: [
        text('3:1 Ratio'),
        text('Layer 1  : Linear attention → MoE'),
        text('Layer 2  : Linear attention → MoE'),
        text('Layer 3  : Linear attention → MoE'),
        text('Layer 4  : Full attention    → MoE'),
        text('...'),
      ] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'moe',
    slots: { block: 'backbone', attention: 'attention-inset', delta: 'delta-inset' },
    options: { variant: 'mixing-detail', titleLines: 2 },
  },
} satisfies FigureSpec;
