import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const motif3BetaSpec = {
  schemaVersion: 1,
  id: 'motif-3-beta',
  title: 'Motif-3-Beta (314B-A13B)',
  description: 'Motif-3-Beta architecture with 53 residual blocks, GDLA attention, four mHC-mixed residual streams, PolyNorm feed-forward, and 384 MoE experts.',
  canvas: { width: 3683, height: 3062 },
  theme: {
    accent: '#2F9BE8',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset', 'moe-inset', 'mhc-detail'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 53 }, children: ['attention', 'moe', 'mhc'] },
    { id: 'ffn-inset', kind: 'inset', parent: 'model', title: text('Feed forward (PolyNorm) module'), children: ['ffn'] },
    { id: 'moe-inset', kind: 'inset', parent: 'model', title: text('MoE layer'), children: ['moe'] },
    { id: 'mhc-detail', kind: 'inset', parent: 'model', title: text('mHC (manifold-constrained hyper-connections)'), children: ['mhc'] },
  ],
  nodes: [
    {
      id: 'attention',
      kind: 'composite',
      label: { spans: [{ text: 'Grouped Differential Latent Attention' }, { text: '(GDLA); 39 sliding-window + 14 full-attention layers' }] },
      data: { family: 'gqa', heads: 80, kvHeads: 16 },
    },
    { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 1280, activation: 'Grouped PolyNorm' } },
    { id: 'moe', kind: 'composite', data: { family: 'moe', experts: 384, activeExperts: 8, sharedExperts: 1 } },
    { id: 'mhc', kind: 'composite', data: { family: 'gated-residual', streams: 4, operation: 'read' } },
  ],
  edges: [
    { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
    { id: 'residual-moe', kind: 'residual', from: { node: 'moe' }, to: { node: 'moe', side: 'top' }, junction: 'plus' },
    { id: 'mhc-read', kind: 'route', from: { node: 'mhc' }, to: { node: 'attention' } },
    { id: 'mhc-write', kind: 'route', from: { node: 'moe' }, to: { node: 'mhc' } },
  ],
  annotations: [
    {
      id: 'vocabulary', target: 'model', placement: 'left', content: { bullets: [
        text('Vocabulary size of'),
        emphasized('', '220k'),
      ] },
    },
    {
      id: 'heads', target: 'attention', placement: 'left', content: { bullets: [
        emphasized('', '80 Q heads'),
        emphasized('', '16 KV heads'),
        emphasized('', '16 noise heads'),
      ] },
    },
    {
      id: 'context', target: 'backbone', placement: 'left', content: { bullets: [
        text('YaRN context'),
        emphasized('', '256k', ' tokens'),
        emphasized('', '4k', ' RoPE base'),
      ] },
    },
    {
      id: 'dense-first', target: 'backbone', placement: 'left', content: { bullets: [
        text('First 2 blocks use'),
        emphasized('', 'dense FFNs'),
      ] },
    },
    {
      id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [
        text('Embedding'),
        emphasized('dimension of ', '4,096'),
      ] },
    },
    {
      id: 'ffn-dimension', target: 'ffn', placement: 'right', content: { bullets: [
        text('Intermediate hidden'),
        text('layer dimension of'),
        emphasized('', '1,280'),
      ] },
    },
    {
      id: 'resource', target: 'moe', placement: 'right', content: { bullets: [
        text('Resource savings:'),
        emphasized('• Model size is ', '314B'),
        emphasized('• but only ', '1 (shared) + 8 routed'),
        text('experts active per token'),
        emphasized('• only ', '13B', ' parameters are active'),
        text('per inference step'),
      ] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'moe',
    slots: { block: 'backbone', ffn: 'ffn-inset', moe: 'moe-inset', mhc: 'mhc-detail' },
    options: { variant: 'multi-stream-residual' },
  },
} satisfies FigureSpec;
