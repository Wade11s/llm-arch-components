import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const inkling2MiniSpec = {
  schemaVersion: 1,
  id: 'inkling-2-mini',
  title: 'Inkling 2 Mini (26.4B)',
  description: 'Inkling 2 Mini decoder with 24 distinct layers and 48 applications: 6 layers before the loop, 12 middle layers run for three passes, and 6 layers after the loop.',
  canvas: { width: 3687, height: 3426 },
  theme: {
    accent: '#F26C21',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    monospaceFamily: "'Courier New', monospace",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset', 'moe-inset'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 12 }, children: ['gqa', 'moe'] },
    { id: 'before-loop', kind: 'layer-group', parent: 'model', repeat: { count: 6 }, children: ['gqa', 'moe'] },
    { id: 'after-loop', kind: 'layer-group', parent: 'model', repeat: { count: 6 }, children: ['gqa', 'moe'] },
    { id: 'ffn-inset', kind: 'inset', parent: 'model', title: text('Feed forward (SwiGLU) module'), children: ['ffn'] },
    { id: 'moe-inset', kind: 'inset', parent: 'model', title: text('MoE layer'), children: ['moe'] },
  ],
  nodes: [
    {
      id: 'gqa',
      kind: 'composite',
      label: { spans: [{ text: 'Gated grouped-query attention (GQA)' }, { text: '5 local layers, then' }, { text: '1 global layer' }] },
      data: { family: 'gqa', heads: 24, kvHeads: 8 },
    },
    { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 1152, activation: 'Softcapped SiLU' } },
    { id: 'moe', kind: 'composite', data: { family: 'moe', experts: 128, activeExperts: 8, sharedExperts: 0 } },
  ],
  edges: [
    { id: 'residual-attention', kind: 'residual', from: { node: 'gqa' }, to: { node: 'gqa', side: 'top' }, junction: 'plus' },
    { id: 'residual-moe', kind: 'residual', from: { node: 'moe' }, to: { node: 'moe', side: 'top' }, junction: 'plus' },
    { id: 'recurrent-feedback', kind: 'feedback', from: { node: 'after-loop' }, to: { node: 'backbone' } },
  ],
  annotations: [
    { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size ', '200,058') },
    {
      id: 'pass-note', target: 'backbone', placement: 'left', content: { bullets: [
        text('The decoder layers before, inside, and after the loop all'),
        text('use attention and a feed-forward network. Each layer has'),
        text('its own weights. Each middle layer uses its weights on'),
        text('both passes.'),
      ] },
    },
    {
      id: 'context', target: 'model', placement: 'left', content: { bullets: [
        text('Native context'),
        emphasized('', '1M', ' tokens'),
      ] },
    },
    {
      id: 'middle-note', target: 'backbone', placement: 'left', content: { bullets: [
        emphasized('Middle layers ', '7–18'),
        text('On later passes, each layer'),
        text('gates the previous pass’s'),
        text('block outputs.'),
      ] },
    },
    {
      id: 'attnres-note', target: 'backbone', placement: 'left', content: { bullets: [
        emphasized('', '4 AttnRes blocks'),
        emphasized('', '6 layers per block'),
        text('Global layers mix Q, K,'),
        text('and V inputs separately'),
      ] },
    },
    {
      id: 'heads', target: 'gqa', placement: 'right', content: { bullets: [
        emphasized('', '24 query heads'),
        emphasized('', '8 KV heads'),
        text('Local window'),
        text('1,024 tokens'),
      ] },
    },
    { id: 'embedding-width', target: 'model', placement: 'bottom', content: emphasized('Embedding width ', '2,304') },
    {
      id: 'ffn-width', target: 'ffn', placement: 'right', content: { bullets: [
        text('Expert FFN width'),
        emphasized('', '1,152'),
      ] },
    },
    {
      id: 'moe-note', target: 'moe', placement: 'bottom', content: { bullets: [
        emphasized('', 'Parameters and routing'),
        emphasized('• ', '26.4B', ' total parameters'),
        emphasized('• ', '8 of 128', ' experts per token, '),
        text('0 shared'),
        emphasized('• ', '3.4B', ' unique active parameters'),
        emphasized('• ', '5.4B', ' weight activations per token'),
      ] },
    },
  ],
  layout: {
    mode: 'template',
    template: 'layer-schedule',
    slots: { model: 'model', block: 'backbone', ffn: 'ffn-inset', moe: 'moe-inset' },
    options: { variant: 'recurrent-pass' },
  },
} satisfies FigureSpec;
