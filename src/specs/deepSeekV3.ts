import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

export const deepSeekV3Spec = {
  schemaVersion: 1,
  id: 'deepseek-v3',
  title: 'DeepSeek-V3 (671B)',
  description: 'DeepSeek-V3 architecture with multi-head latent attention, a 61-times repeated residual block, SwiGLU feed-forward experts, and 256 routed experts with one shared expert and eight active experts per token.',
  canvas: { width: 2786, height: 2725 },
  theme: {
    accent: '#FF644E',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  groups: [
    { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset', 'moe-inset'] },
    { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 61 }, children: ['attention', 'ffn', 'moe'], style: { fill: { kind: 'solid', color: '#FF968D' } } },
    { id: 'ffn-inset', kind: 'inset', parent: 'model', title: text('Feed forward (SwiGLU) module'), children: ['ffn'] },
    { id: 'moe-inset', kind: 'inset', parent: 'model', title: text('MoE layer'), children: ['moe'] },
  ],
  nodes: [
    { id: 'attention', kind: 'composite', data: { family: 'mla', heads: 128, kvRank: 512 } },
    { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 2048, activation: 'SiLU' } },
    { id: 'moe', kind: 'composite', data: { family: 'moe', experts: 256, activeExperts: 8, sharedExperts: 1 } },
  ],
  edges: [
    { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
    { id: 'residual-moe', kind: 'residual', from: { node: 'moe' }, to: { node: 'moe', side: 'top' }, junction: 'plus' },
    { id: 'ffn-zoom', kind: 'zoom', from: { node: 'ffn' }, to: { node: 'ffn-inset' } },
    { id: 'moe-zoom', kind: 'zoom', from: { node: 'moe' }, to: { node: 'moe-inset' }, style: { stroke: '#FF644E' } },
  ],
  annotations: [
    { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size of ', '129k') },
    { id: 'context', target: 'backbone', placement: 'left', content: { bullets: [text('YaRN context'), emphasized('', '128k', ' tokens'), emphasized('', '4k', ' RoPE base')] } },
    { id: 'heads', target: 'attention', placement: 'right', content: emphasized('', '128', ' heads') },
    { id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [text('Embedding'), emphasized('dimension of ', '7,168')] } },
    { id: 'expert-dimensions', target: 'ffn', placement: 'right', content: { bullets: [emphasized('Intermediate hidden', ''), emphasized('layer dimension of ', '2,048')] } },
    { id: 'dense-first', target: 'backbone', placement: 'left', content: { bullets: [text('First 3 blocks use'), text('dense FFN with'), emphasized('hidden size ', '18,432'), text('instead of MoE')] } },
    { id: 'resource-savings-title', target: 'moe', placement: 'bottom', content: emphasized('', 'Resource savings:') },
    {
      id: 'resource-savings', target: 'moe', placement: 'bottom', content: { bullets: [
        emphasized('Model size is ', '671B'),
        emphasized('but only ', '1 (shared) + 8 experts'),
        { spans: [{ text: '' }, { text: 'active per token' }] },
        emphasized('only ', '37B', ' parameters are active'),
        { spans: [{ text: '' }, { text: 'per inference step' }] },
      ] },
    },
  ],
  layout: { mode: 'template', template: 'moe', slots: { block: 'backbone', ffn: 'ffn-inset', moe: 'moe-inset' } },
} satisfies FigureSpec;
