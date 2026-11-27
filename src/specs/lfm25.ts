import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const lfm25Spec = {
  schemaVersion: 1,
  id: 'lfm2-5-8b-a1b',
  title: 'LFM2.5 (8B-A1B)',
  description: 'LFM2.5 architecture with 24 layers organized as 2x, 4x, and 1x layer groups, a 32-expert MoE inset, and a GQA head-grid inset.',
  canvas: { width: 2454, height: 2732 },
  theme: {
    accent: '#5E5E5E',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#777777',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'moe-inset', 'gqa-inset'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 24 }, children: ['group-2x', 'group-4x', 'group-1x'] },
    { id: 'group-2x', kind: 'layer-group', parent: 'backbone', repeat: { count: 2 }, children: ['gqa', 'moe'] },
    { id: 'group-4x', kind: 'layer-group', parent: 'backbone', repeat: { count: 4 }, children: ['gqa', 'moe'] },
    { id: 'group-1x', kind: 'layer-group', parent: 'backbone', repeat: { count: 1 }, children: ['ffn'] },
    { id: 'moe-inset', kind: 'inset', parent: 'model', title: text('MoE layer'), children: ['moe'] },
    { id: 'gqa-inset', kind: 'inset', parent: 'model', title: text('GQA head grid'), children: ['gqa'] },
  ],
  nodes: [
    { id: 'gqa', kind: 'composite', data: { family: 'gqa', heads: 32, kvHeads: 8 } },
    { id: 'moe', kind: 'composite', data: { family: 'moe', experts: 32, activeExperts: 4, sharedExperts: 0 } },
    { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 2048, activation: 'SiLU' } },
  ],
  edges: [
    { id: 'group-flow', kind: 'flow', from: { node: 'group-1x' }, to: { node: 'group-4x' } },
    { id: 'moe-zoom', kind: 'zoom', from: { node: 'group-2x' }, to: { node: 'moe-inset' } },
    { id: 'gqa-zoom', kind: 'zoom', from: { node: 'group-4x' }, to: { node: 'gqa-inset' } },
  ],
  annotations: [
    { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size of ', '128k') },
    {
      id: 'context', target: 'model', placement: 'left', content: { bullets: [
        text('Native context'),
        emphasized('', '128,000', ' tokens'),
      ] },
    },
    {
      id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [
        text('Embedding'),
        emphasized('dimension of ', '2048'),
      ] },
    },
    {
      id: 'moe-note', target: 'moe', placement: 'right', content: { bullets: [
        emphasized('', '4 experts'),
        text('active per token'),
      ] },
    },
    {
      id: 'gqa-note', target: 'gqa', placement: 'top', content: { bullets: [
        text('GQA + QK-Norm'),
        text('RMSNorm before RoPE'),
        text('32 Q / 8 K/V heads'),
      ] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'layer-schedule',
    slots: { block: 'backbone', moe: 'moe-inset', gqa: 'gqa-inset' },
    variant: 'layer-group',
  },
} satisfies FigureSpec;
