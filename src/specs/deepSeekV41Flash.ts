import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const deepSeekV41FlashSpec = {
  schemaVersion: 1,
  id: 'deepseek-v4-1-flash',
  title: 'DeepSeek-V4.1-Flash (552B)',
  description: 'DeepSeek-V4.1-Flash text backbone with a 20-layer causal encoder, a 20-layer decoder, CSA2 sparse attention modes, Engram, a hierarchical sparse indexer, MoE, and Single-Pass mHC residual streams.',
  canvas: { width: 5000, height: 3556 },
  theme: {
    accent: '#1E88E5',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['encoder', 'decoder', 'ffn-inset', 'moe-inset', 'mhc-inset'] },
    { id: 'encoder', kind: 'tower', parent: 'model', repeat: { count: 20 }, children: ['gqa', 'moe'] },
    { id: 'decoder', kind: 'tower', parent: 'model', repeat: { count: 20 }, children: ['gqa', 'moe'] },
    { id: 'ffn-inset', kind: 'inset', parent: 'model', title: text('Feed forward (SwiGLU) module'), children: ['ffn'] },
    { id: 'moe-inset', kind: 'inset', parent: 'model', title: text('MoE layer'), children: ['moe'] },
    { id: 'mhc-inset', kind: 'inset', parent: 'model', title: text('Single-Pass mHC'), children: ['mhc'] },
  ],
  nodes: [
    { id: 'gqa', kind: 'composite', label: text('CSA2 / Sliding window attention'), data: { family: 'gqa', heads: 64, kvHeads: 8 } },
    { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 2304, activation: 'SiLU' } },
    { id: 'moe', kind: 'composite', data: { family: 'moe', experts: 384, activeExperts: 6, sharedExperts: 1 } },
    { id: 'mhc', kind: 'composite', data: { family: 'gated-residual', streams: 4, operation: 'read' } },
  ],
  edges: [
    { id: 'ced-link', kind: 'route', from: { node: 'gqa' }, to: { node: 'gqa' } },
    { id: 'candidate-link', kind: 'route', from: { node: 'gqa' }, to: { node: 'gqa' } },
    { id: 'mhc-read', kind: 'route', from: { node: 'mhc' }, to: { node: 'gqa' } },
    { id: 'mhc-write', kind: 'route', from: { node: 'moe' }, to: { node: 'mhc' } },
  ],
  annotations: [
    {
      id: 'csa-legend', target: 'encoder', placement: 'left', content: { bullets: [
        { spans: [{ text: 'CSA2(ratio, mode)', color: 'accent' }] },
        text('• mode=Full mode builds'),
        text('  global KV and sparse'),
        text('  indices'),
        text('• mode=Reindex'),
        text('  recomputes sparse'),
        text('  indices'),
        text('• mode=Reuse shares KV'),
        text('  and sparse indices'),
        text('(Note 1: The first decoder'),
        text('Full layer builds a'),
        text('candidate pool for later'),
        text('Reindex layers using a'),
        text('hierarchical indexer)'),
        text('(Note 2: CSA2 includes'),
        text('SWA)'),
      ] },
    },
    {
      id: 'engram-note', target: 'model', placement: 'left', content: { bullets: [
        text('196B parameters'),
        text('in encoder blocks'),
        text('2 and 15'),
        text('(token n-gram lookup)'),
      ] },
    },
    {
      id: 'context', target: 'model', placement: 'left', content: { bullets: [
        text('YaRN context'),
        emphasized('', '1M tokens'),
        emphasized('', '64k pretraining'),
      ] },
    },
    {
      id: 'vocabulary', target: 'model', placement: 'top', content: { bullets: [
        text('Vocabulary size'),
        emphasized('of ', '129k'),
      ] },
    },
    {
      id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [
        text('Embedding'),
        emphasized('dimension of ', '5,120'),
      ] },
    },
    {
      id: 'ffn-dimensions', target: 'ffn', placement: 'right', content: { bullets: [
        text('Intermediate hidden'),
        text('layer dimension of'),
        emphasized('', '2,304'),
      ] },
    },
    {
      id: 'resource', target: 'moe', placement: 'right', content: { bullets: [
        text('Parameters and compute'),
        emphasized('', '552B backbone + 196B Engram'),
        text('1 shared + 6 routed experts'),
        emphasized('', '8B', ' active for prefill'),
        emphasized('', '16B', ' active for decoding'),
      ] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'multi-tower',
    slots: { encoder: 'encoder', decoder: 'decoder', ffn: 'ffn-inset', moe: 'moe-inset', mhc: 'mhc-inset' },
  },
} satisfies FigureSpec;
