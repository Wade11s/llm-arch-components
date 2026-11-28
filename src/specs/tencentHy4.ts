import type { FigureSpec, MaskData, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const accent = (value: string): TextSpec => ({
  spans: [{ text: value, color: 'accent', emphasis: 'bold' }],
});
const accented = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent', emphasis: 'bold' }, { text: suffix }],
});

/**
 * Current-token window from the reference figure. Rows are query tokens and
 * columns are key tokens. A 1 means the query may attend to that key under
 * gated DeepSeek Sparse Attention (DSA).
 */
export const HY4_MASK_TOKENS = ['The', 'model', 'attends', 'to', 'past', 'tokens'];

export const HY4_MASK_VALUES: Array<0 | 1> = [
  1, 0, 0, 0, 0, 0,
  1, 1, 0, 0, 0, 0,
  1, 1, 1, 0, 0, 0,
  1, 0, 1, 1, 0, 0,
  1, 0, 0, 1, 1, 0,
  1, 0, 0, 1, 1, 1,
];

const hy4Mask: MaskData = {
  rows: HY4_MASK_TOKENS,
  columns: HY4_MASK_TOKENS,
  values: HY4_MASK_VALUES,
};

export const tencentHy4Spec: FigureSpec = {
  schemaVersion: 1,
  id: 'tencent-hy4',
  title: 'Tencent Hy4 (770B-A49B)',
  description:
    'Tencent Hy4 770B-A49B architecture: 78 decoder layers with gated DeepSeek Sparse Attention, four iHC residual branches, a 256-expert MoE layer with one shared and eight routed experts, a dense SwiGLU FFN in the first layer, and a 5-layer DFly2 drafter.',
  canvas: { width: 3834, height: 2949 },
  theme: {
    accent: '#0094E8',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'mask-inset', 'ihc-inset'] },
    {
      id: 'backbone',
      kind: 'repeat-block',
      parent: 'model',
      repeat: { count: 78, label: 'decoder layers' },
      children: ['attention', 'moe', 'ffn', 'ihc-read', 'ihc-write'],
      style: { fill: { kind: 'solid', color: '#0094E8' } },
    },
    {
      id: 'mask-inset',
      kind: 'inset',
      parent: 'model',
      title: text('Gated DeepSeek Sparse Attention (DSA)'),
      children: ['mask'],
      style: { fill: { kind: 'solid', color: '#FFFFFF' }, stroke: '#000000', strokeStyle: 'dotted' },
    },
    {
      id: 'ihc-inset',
      kind: 'inset',
      parent: 'model',
      title: {
        spans: [
          { text: 'iHC\u00A0', color: 'accent', emphasis: 'bold' },
          { text: '(identity Hyper-Connections)', emphasis: 'bold' },
        ],
      },
      children: ['ihc-read', 'ihc-write'],
      style: { fill: { kind: 'solid', color: '#FFFFFF' }, stroke: '#000000', strokeStyle: 'dotted' },
    },
  ],
  nodes: [
    {
      id: 'attention',
      kind: 'composite',
      parent: 'backbone',
      label: text('Gated multi-head latent attention (MLA) with DeepSeek Sparse Attention (DSA)'),
      data: { family: 'mla', heads: 64 },
    },
    {
      id: 'moe',
      kind: 'composite',
      parent: 'backbone',
      label: text('MoE'),
      data: { family: 'moe', experts: 256, activeExperts: 8, sharedExperts: 1 },
    },
    {
      id: 'ffn',
      kind: 'composite',
      parent: 'backbone',
      label: text('Dense FFN (SwiGLU)'),
      data: { family: 'ffn', hidden: 18_432, activation: 'SwiGLU' },
    },
    {
      id: 'ihc-read',
      kind: 'composite',
      parent: 'backbone',
      label: text('iHC Read'),
      data: { family: 'gated-residual', streams: 4, operation: 'read' },
    },
    {
      id: 'ihc-write',
      kind: 'composite',
      parent: 'backbone',
      label: text('iHC Write'),
      data: { family: 'gated-residual', streams: 4, operation: 'write' },
    },
    { id: 'mask', kind: 'mask', parent: 'mask-inset', data: hy4Mask },
    { id: 'output-layer', kind: 'text', parent: 'model', label: text('Linear output layer'), data: text('Linear output layer') },
    { id: 'final-rmsnorm', kind: 'text', parent: 'model', label: text('Final RMSNorm'), data: text('Final RMSNorm') },
    { id: 'final-ihc-head', kind: 'text', parent: 'model', label: text('Final iHC Head'), data: text('Final iHC Head') },
    { id: 'rmsnorm-2', kind: 'text', parent: 'backbone', label: text('RMSNorm 2'), data: text('RMSNorm 2') },
    { id: 'rmsnorm-1', kind: 'text', parent: 'backbone', label: text('RMSNorm 1'), data: text('RMSNorm 1') },
    { id: 'embedding-layer', kind: 'text', parent: 'model', label: text('Token embedding layer'), data: text('Token embedding layer') },
    { id: 'tokenized-text', kind: 'text', parent: 'model', label: text('Tokenized text'), data: text('Tokenized text') },
    { id: 'sample-input', kind: 'text', parent: 'model', label: text('Sample input text'), data: text('Sample input text') },
  ],
  edges: [
    { id: 'flow-sample-tokenized', kind: 'flow', from: { node: 'sample-input' }, to: { node: 'tokenized-text' } },
    { id: 'flow-tokenized-embedding', kind: 'flow', from: { node: 'tokenized-text' }, to: { node: 'embedding-layer' } },
    { id: 'flow-embedding-read', kind: 'flow', from: { node: 'embedding-layer' }, to: { node: 'ihc-read' } },
    { id: 'flow-read-norm1', kind: 'flow', from: { node: 'ihc-read' }, to: { node: 'rmsnorm-1' } },
    { id: 'flow-norm1-attention', kind: 'flow', from: { node: 'rmsnorm-1' }, to: { node: 'attention' } },
    { id: 'flow-attention-write', kind: 'flow', from: { node: 'attention' }, to: { node: 'ihc-write' } },
    { id: 'flow-write-read', kind: 'flow', from: { node: 'ihc-write' }, to: { node: 'ihc-read' } },
    { id: 'flow-read-norm2', kind: 'flow', from: { node: 'ihc-read' }, to: { node: 'rmsnorm-2' } },
    { id: 'flow-norm2-moe', kind: 'flow', from: { node: 'rmsnorm-2' }, to: { node: 'moe' } },
    { id: 'flow-moe-write', kind: 'flow', from: { node: 'moe' }, to: { node: 'ihc-write' } },
    { id: 'flow-write-head', kind: 'flow', from: { node: 'ihc-write' }, to: { node: 'final-ihc-head' } },
    { id: 'flow-head-norm', kind: 'flow', from: { node: 'final-ihc-head' }, to: { node: 'final-rmsnorm' } },
    { id: 'flow-norm-output', kind: 'flow', from: { node: 'final-rmsnorm' }, to: { node: 'output-layer' } },
    { id: 'attention-mask', kind: 'zoom', from: { node: 'moe', side: 'right' }, to: { node: 'mask-inset', side: 'left', offset: -247 } },
    { id: 'ihc-zoom', kind: 'zoom', from: { node: 'ihc-read', side: 'right' }, to: { node: 'ihc-inset', side: 'left', offset: -291 } },
    { id: 'output-to-drafter', kind: 'flow', from: { node: 'output-layer', side: 'top' }, to: { node: 'model' } },
  ],
  annotations: [
    {
      id: 'drafter',
      target: 'model',
      placement: 'top',
      content: text('5-layer DFly2 drafter (3.3B) for speculative decoding'),
    },
    {
      id: 'vocabulary',
      target: 'model',
      placement: 'left',
      style: 'leader',
      content: { bullets: [text('Vocabulary size of'), accent('121k')] },
    },
    {
      id: 'context',
      target: 'attention',
      placement: 'left',
      style: 'leader',
      content: { bullets: [text('Native context'), accent('1M tokens')] },
    },
    {
      id: 'embedding',
      target: 'embedding-layer',
      placement: 'bottom',
      style: 'leader',
      content: { bullets: [text('Embedding'), accented('dimension of\u00A0', '6,144')] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'attention-mask',
    slots: {
      block: 'backbone',
      mask: 'mask-inset',
      residual: 'ihc-inset',
      attention: 'attention',
      moe: 'moe',
      ffn: 'ffn',
      read: 'ihc-read',
      write: 'ihc-write',
      maskNode: 'mask',
    },
    variant: 'ihc-pipeline',
    options: {
      indexerHeads: 32,
      dsaTopK: 2048,
    },
  },
};
