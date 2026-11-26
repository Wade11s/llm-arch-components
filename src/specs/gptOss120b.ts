import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const gptOss120bSpec = {
  schemaVersion: 1,
  id: 'gpt-oss-120b',
  title: 'gpt-oss (120B)',
  description: 'gpt-oss 120B architecture with grouped-query attention, a 36-times repeated residual block, SwiGLU feed-forward experts, and a 128-expert mixture-of-experts layer with 4 active experts per token.',
  canvas: { width: 2904, height: 2699 },
  theme: {
    accent: '#8B42E2',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset', 'moe-inset'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 36 }, children: ['attention', 'ffn', 'moe'], style: { fill: { kind: 'solid', color: '#B393DA' } } },
    { id: 'ffn-inset', kind: 'inset', parent: 'model', title: text('Feed forward (SwiGLU) module'), children: ['ffn'] },
    { id: 'moe-inset', kind: 'inset', parent: 'model', title: text('MoE layer'), children: ['moe'] },
  ],
  nodes: [
    { id: 'attention', kind: 'composite', data: { family: 'gqa', heads: 64, kvHeads: 8 } },
    { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 2880, activation: 'SiLU' } },
    { id: 'moe', kind: 'composite', data: { family: 'moe', experts: 128, activeExperts: 4, sharedExperts: 0 } },
  ],
  edges: [
    { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
    { id: 'residual-moe', kind: 'residual', from: { node: 'moe' }, to: { node: 'moe', side: 'top' }, junction: 'plus' },
    { id: 'ffn-zoom', kind: 'zoom', from: { node: 'ffn' }, to: { node: 'ffn-inset' } },
    { id: 'moe-zoom', kind: 'zoom', from: { node: 'moe' }, to: { node: 'moe-inset' }, style: { stroke: '#8B42E2' } },
  ],
  annotations: [
    { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size of ', '200k') },
    { id: 'context', target: 'backbone', placement: 'left', content: { bullets: [text('YaRN context'), emphasized('', '128k', ' tokens'), emphasized('', '4k', ' RoPE base')] } },
    { id: 'heads', target: 'attention', placement: 'right', content: emphasized('', '64', ' heads') },
    { id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [text('Embedding'), emphasized('dimension of ', '2,880')] } },
    { id: 'expert-dimensions', target: 'ffn', placement: 'right', content: { bullets: [emphasized('Input expert size: ', '2,880'), emphasized('Intermediate projection size: ', '2,880')] } },
    { id: 'resource-savings-title', target: 'moe', placement: 'bottom', content: emphasized('', 'Resource savings:') },
    {
      id: 'resource-savings', target: 'moe', placement: 'bottom', content: { bullets: [
        emphasized('Model size is ', '120B'),
        emphasized('but only ', '4 experts', ' active per token'),
        emphasized('only ', '5.1B', ' parameters are active'),
        { spans: [{ text: '' }, { text: 'per inference step' }] },
      ] },
    },
  ],
  layout: { mode: 'template', template: 'moe', slots: { block: 'backbone', ffn: 'ffn-inset', moe: 'moe-inset' } },
} satisfies FigureSpec;
