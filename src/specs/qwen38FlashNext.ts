import type { FigureSpec, MaskData, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const accented = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent', emphasis: 'bold' }, { text: suffix }],
});

/**
 * Micro-block token sequence used by the Qwen sparse attention (QSA) mask.
 * Rows and columns share the same twelve-token window so the leading
 * triangular block pattern and the two selected-block windows stay visible.
 */
const MASK_TOKENS = [
  'The', 'model', 'learns', 'to',
  'attend', 'selectively', 'to', 'blocks',
  'of', 'past', 'context', 'tokens',
];

/**
 * 0/1 attention mask for a 12-token window split into three 4-token
 * micro-blocks. Selected complete blocks are fully visible; the current
 * incomplete block exposes only the causal prefix.
 */
const MASK_VALUES: Array<0 | 1> = [
  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
  1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
  1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
  1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0,
  0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0,
  1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0,
  0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1,
];

const qwenMask: MaskData = {
  rows: MASK_TOKENS,
  columns: MASK_TOKENS,
  values: MASK_VALUES,
};

export const qwen38FlashNextSpec: FigureSpec = {
  schemaVersion: 1,
  id: 'qwen3-8-flash-next',
  title: 'Qwen3.8-Flash-Next (125B-A6B)',
  description: 'Qwen3.8-Flash-Next 125B-A6B architecture: a 48-times repeated residual block with hybrid attention (a 3:1 mix of Gated DeltaNet and Qwen Sparse Attention), a 512-expert mixture-of-experts layer with 10 routed plus 1 shared expert, and four parallel residual branches joined by GR Read and GR Write gates.',
  canvas: { width: 4078, height: 3391 },
  theme: {
    accent: '#1D9BF0',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'mask-inset', 'gr-inset'] },
    {
      id: 'backbone',
      kind: 'repeat-block',
      parent: 'model',
      repeat: { count: 48, label: 'residual blocks' },
      children: ['attention', 'delta-net', 'moe', 'gr-read', 'gr-write'],
      style: { fill: { kind: 'solid', color: '#71A3D4' } },
    },
    {
      id: 'mask-inset',
      kind: 'inset',
      parent: 'model',
      title: text('Qwen Sparse Attention (QSA)'),
      children: ['mask'],
    },
    {
      id: 'gr-inset',
      kind: 'inset',
      parent: 'model',
      title: text('GR (Gated Residual)'),
      children: ['gr-read', 'gr-write'],
    },
  ],
  nodes: [
    { id: 'attention', kind: 'composite', parent: 'backbone', data: { family: 'qsa', heads: 24, kvHeads: 2, blockSize: 4 } },
    { id: 'delta-net', kind: 'composite', parent: 'backbone', data: { family: 'gated-delta-net', qkHeads: 16, vHeads: 48 } },
    { id: 'moe', kind: 'composite', parent: 'backbone', data: { family: 'moe', experts: 512, activeExperts: 10, sharedExperts: 1 } },
    { id: 'mask', kind: 'mask', parent: 'mask-inset', data: qwenMask },
    { id: 'gr-read', kind: 'composite', parent: 'gr-inset', data: { family: 'gated-residual', streams: 4, operation: 'read' } },
    { id: 'gr-write', kind: 'composite', parent: 'gr-inset', data: { family: 'gated-residual', streams: 4, operation: 'write' } },
  ],
  edges: [
    { id: 'attention-mask', kind: 'zoom', from: { node: 'attention' }, to: { node: 'mask' } },
    { id: 'gr-zoom', kind: 'zoom', from: { node: 'gr-read' }, to: { node: 'gr-inset' } },
    { id: 'gr-flow', kind: 'flow', from: { node: 'gr-read' }, to: { node: 'gr-write' } },
    { id: 'gr-residual', kind: 'residual', from: { node: 'gr-write' }, to: { node: 'attention' }, junction: 'plus' },
    { id: 'attention-moe', kind: 'flow', from: { node: 'attention' }, to: { node: 'moe' } },
    { id: 'delta-attention', kind: 'route', from: { node: 'delta-net' }, to: { node: 'attention' } },
  ],
  annotations: [
    {
      id: 'vocabulary',
      target: 'model',
      placement: 'left',
      content: { bullets: [text('Vocabulary size of'), accented('', '248k')] },
    },
    {
      id: 'moe-spec',
      target: 'moe',
      placement: 'left',
      content: { bullets: [text('512 experts:'), text('10 routed'), text('+ 1 shared active')] },
    },
    {
      id: 'qsa',
      target: 'attention',
      placement: 'left',
      content: { bullets: [text('QSA:'), accented('', '24', ' Q heads'), accented('', '2', ' KV heads')] },
    },
    {
      id: 'gated-delta',
      target: 'delta-net',
      placement: 'left',
      content: { bullets: [text('Gated DeltaNet:'), accented('', '16', ' QK heads'), accented('', '48', ' V heads')] },
    },
    {
      id: 'context',
      target: 'backbone',
      placement: 'left',
      content: { bullets: [text('Context length'), accented('', '256k', ' native'), accented('', '1M', ' with YaRN')] },
    },
    {
      id: 'ngram',
      target: 'model',
      placement: 'bottom',
      content: { bullets: [text('N-gram embedding'), text('(bigrams/trigrams) at layer 2')] },
    },
    {
      id: 'embedding',
      target: 'model',
      placement: 'bottom',
      content: { bullets: [text('Embedding'), accented('dimension of ', '2,560')] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'attention-mask',
    slots: {
      block: 'backbone',
      mask: 'mask-inset',
      residual: 'gr-inset',
      attention: 'attention',
      delta: 'delta-net',
      moe: 'moe',
      maskNode: 'mask',
      read: 'gr-read',
      write: 'gr-write',
    },
  },
};
