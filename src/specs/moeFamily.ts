import type { FigureSpec, TextSpec } from '../core/types';

const text = (value: string): TextSpec => ({ spans: [{ text: value }] });
const emphasized = (prefix: string, value: string, suffix = ''): TextSpec => ({
  spans: [{ text: prefix }, { text: value, color: 'accent' }, { text: suffix }],
});

type MoeFamilyInput = {
  id: string;
  title: string;
  canvas: { width: number; height: number };
  accent: string;
  blockFill: string;
  layers: number;
  embedding: string;
  vocabulary: string;
  context: TextSpec[];
  attention: { family: 'gqa'; heads: number; kvHeads: number } | { family: 'mla'; heads: number; kvRank: number };
  hidden: number;
  experts: number;
  activeExperts: number;
  sharedExperts: number;
  expertDimensions: TextSpec[];
  modelSize: string;
  activeParams: string;
  activeParamsLine?: TextSpec;
  denseFirst?: TextSpec[];
  ropeLabel?: string;
  showQKNorm?: boolean;
  showHeadsAnnotation?: boolean;
  firstBadgeFill?: string;
  lastBadgeFill?: string;
  titleColor?: string;
  activeExpertLabel?: string;
  denseFirstLeader?: boolean;
  attentionLabelStyle?: 'mla-dsa';
  attentionBoxY?: number;
  attentionBoxHeight?: number;
  expertAnnotationY?: number;
  resourceMaxWidth?: number;
  wideInsets?: boolean;
};

function moeFamilySpec(input: MoeFamilyInput): FigureSpec {
  const showHeadsAnnotation = input.showHeadsAnnotation !== false;
  return {
    schemaVersion: 1,
    id: input.id,
    title: input.title,
    description: `${input.title} architecture with ${input.layers} residual blocks, grouped-query or latent attention, SwiGLU experts, and ${input.experts} experts with ${input.activeExperts} active experts per token.`,
    canvas: input.canvas,
    theme: {
      accent: input.accent,
      surface: '#D5D5D5',
      ink: '#000000',
      muted: '#666666',
      background: '#FFFFFF',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    },
    groups: [
      { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset', 'moe-inset'] },
      { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: input.layers }, children: ['attention', 'ffn', 'moe'], style: { fill: { kind: 'solid', color: input.blockFill } } },
      { id: 'ffn-inset', kind: 'inset', parent: 'model', title: text('Feed forward (SwiGLU) module'), children: ['ffn'] },
      { id: 'moe-inset', kind: 'inset', parent: 'model', title: text('MoE layer'), children: ['moe'] },
    ],
    nodes: [
      { id: 'attention', kind: 'composite', data: input.attention.family === 'gqa'
        ? { family: 'gqa', heads: input.attention.heads, kvHeads: input.attention.kvHeads }
        : { family: 'mla', heads: input.attention.heads, kvRank: input.attention.kvRank } },
      { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: input.hidden, activation: 'SiLU' } },
      { id: 'moe', kind: 'composite', data: { family: 'moe', experts: input.experts, activeExperts: input.activeExperts, sharedExperts: input.sharedExperts } },
    ],
    edges: [
      { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
      { id: 'residual-moe', kind: 'residual', from: { node: 'moe' }, to: { node: 'moe', side: 'top' }, junction: 'plus' },
      { id: 'ffn-zoom', kind: 'zoom', from: { node: 'ffn' }, to: { node: 'ffn-inset' } },
      { id: 'moe-zoom', kind: 'zoom', from: { node: 'moe' }, to: { node: 'moe-inset' }, style: { stroke: input.accent } },
    ],
    annotations: [
      { id: 'vocabulary', target: 'model', placement: 'top', content: emphasized('Vocabulary size of ', input.vocabulary) },
      { id: 'context', target: 'backbone', placement: 'left', content: { bullets: input.context } },
      ...(showHeadsAnnotation ? [{ id: 'heads', target: 'attention', placement: 'right' as const, content: emphasized('', String(input.attention.heads), ' heads') }] : []),
      { id: 'embedding-dimension', target: 'model', placement: 'bottom', content: { bullets: [text('Embedding'), emphasized('dimension of ', input.embedding)] } },
      { id: 'expert-dimensions', target: 'ffn', placement: 'right', content: { bullets: input.expertDimensions } },
      ...(input.denseFirst ? [{ id: 'dense-first', target: 'backbone', placement: 'left' as const, content: { bullets: input.denseFirst } }] : []),
      { id: 'resource-savings-title', target: 'moe', placement: 'bottom', content: emphasized('', 'Resource savings:') },
      {
        id: 'resource-savings', target: 'moe', placement: 'bottom', content: { bullets: [
          emphasized('Model size is ', input.modelSize),
          emphasized('but only ', `${input.activeExperts} experts`, ' active per token'),
          emphasized('only ', input.activeParams, ' parameters are active'),
          input.activeParamsLine ?? { spans: [{ text: '' }, { text: 'per inference step' }] },
        ] },
      },
    ],
    layout: {
      mode: 'template',
      template: 'moe',
      slots: { block: 'backbone', ffn: 'ffn-inset', moe: 'moe-inset' },
      options: {
        ...(input.ropeLabel ? { ropeLabel: input.ropeLabel } : {}),
        ...(input.showQKNorm ? { showQKNorm: true } : {}),
        ...(showHeadsAnnotation ? {} : { showHeadsAnnotation: false }),
        ...(input.firstBadgeFill ? { firstBadgeFill: input.firstBadgeFill } : {}),
        ...(input.lastBadgeFill ? { lastBadgeFill: input.lastBadgeFill } : {}),
        ...(input.titleColor ? { titleColor: input.titleColor } : {}),
        ...(input.activeExpertLabel ? { activeExpertLabel: input.activeExpertLabel } : {}),
        ...(input.denseFirstLeader ? { denseFirstLeader: true } : {}),
        ...(input.attentionLabelStyle ? { attentionLabelStyle: input.attentionLabelStyle } : {}),
        ...(input.attentionBoxY !== undefined ? { attentionBoxY: input.attentionBoxY } : {}),
        ...(input.attentionBoxHeight !== undefined ? { attentionBoxHeight: input.attentionBoxHeight } : {}),
        ...(input.expertAnnotationY !== undefined ? { expertAnnotationY: input.expertAnnotationY } : {}),
        ...(input.resourceMaxWidth !== undefined ? { resourceMaxWidth: input.resourceMaxWidth } : {}),
        ...(input.wideInsets ? {
          ffnInsetWidth: 856,
          ffnInsetHeight: 700,
          ffnInsetTitleX: 2305,
          moeInsetWidth: 1168,
          moeInsetTitleX: 2820,
          lastBadgeX: 2790,
          dimensionLeaderEndY: 1031,
        } : {}),
      },
    },
  } satisfies FigureSpec;
}

export const gptOss20bSpec = moeFamilySpec({
  id: 'gpt-oss-20b', title: 'gpt-oss (20B)', canvas: { width: 2873, height: 2699 },
  accent: '#4B7AE6', blockFill: '#8AA4DE', layers: 24, embedding: '2,880', vocabulary: '200k',
  context: [text('YaRN context'), emphasized('', '128k', ' tokens'), emphasized('', '4k', ' RoPE base')],
  attention: { family: 'gqa', heads: 64, kvHeads: 8 }, hidden: 2880,
  experts: 32, activeExperts: 4, sharedExperts: 0,
  expertDimensions: [emphasized('Input expert size: ', '2,880'), emphasized('Intermediate projection size: ', '2,880')],
  modelSize: '20B', activeParams: '3.6B', expertAnnotationY: 1070, wideInsets: true,
});

export const qwen3235bSpec = moeFamilySpec({
  id: 'qwen3-235b-a22b', title: 'Qwen3 (235B-A22B)', canvas: { width: 2766, height: 2715 },
  accent: '#00A2FF', blockFill: '#8FC4E2', layers: 94, embedding: '4,096', vocabulary: '151k',
  context: [text('Context length'), emphasized('', '32k', ' native'), emphasized('', '128k', ' with YaRN')],
  attention: { family: 'gqa', heads: 64, kvHeads: 4 }, hidden: 1536,
  experts: 128, activeExperts: 8, sharedExperts: 0,
  expertDimensions: [text('Intermediate hidden'), text('layer dimension of'), emphasized('', '1,536')],
  modelSize: '235B', activeParams: '22B', showQKNorm: true, showHeadsAnnotation: false, expertAnnotationY: 1070, wideInsets: true,
});

export const intellect3Spec = moeFamilySpec({
  id: 'intellect-3', title: 'INTELLECT-3 (106B)', canvas: { width: 2778, height: 2709 },
  accent: '#5E5E5E', blockFill: '#6E6E6E', layers: 46, embedding: '4,096', vocabulary: '151k',
  context: [text('Context length'), emphasized('', '131,072', ' tokens'), text('in config')],
  attention: { family: 'gqa', heads: 96, kvHeads: 8 }, hidden: 1408,
  experts: 128, activeExperts: 8, sharedExperts: 1,
  expertDimensions: [emphasized('Input expert size: ', '4,096'), text('Intermediate projection size:'), emphasized('', '1,408')],
  modelSize: '106B', activeParams: '12B', ropeLabel: 'Partial RoPE', showHeadsAnnotation: false,
  denseFirst: [text('First block uses'), text('dense FFN with'), emphasized('hidden size ', '10,944'), text('instead of MoE')],
  firstBadgeFill: '#5E5E5E', lastBadgeFill: '#000000', titleColor: '#000000',
  activeExpertLabel: '8 experts + 1 shared expert', denseFirstLeader: true, expertAnnotationY: 1070, resourceMaxWidth: 900, wideInsets: true,
});

export const glm45AirSpec = moeFamilySpec({
  id: 'glm-4-5-air', title: 'GLM-4.5-Air (106B)', canvas: { width: 2778, height: 2709 },
  accent: '#00AB8E', blockFill: '#79C3B6', layers: 46, embedding: '4,096', vocabulary: '151k',
  context: [text('Native context'), emphasized('', '128k', ' tokens'), emphasized('', '4k', ' pretraining')],
  attention: { family: 'gqa', heads: 96, kvHeads: 8 }, hidden: 1408,
  experts: 128, activeExperts: 8, sharedExperts: 1,
  expertDimensions: [emphasized('Input expert size: ', '4,096'), text('Intermediate projection size:'), emphasized('', '1,408')],
  modelSize: '106B', activeParams: '12B', ropeLabel: 'Partial RoPE', showHeadsAnnotation: false,
  denseFirst: [text('First block uses'), text('dense FFN with'), emphasized('hidden size ', '10,944'), text('instead of MoE')],
  firstBadgeFill: '#5E5E5E', activeExpertLabel: '8 experts + 1 shared expert', denseFirstLeader: true, expertAnnotationY: 1070, resourceMaxWidth: 900, wideInsets: true,
});

export const glm45355bSpec = moeFamilySpec({
  id: 'glm-4-5-355b', title: 'GLM-4.5 (355B)', canvas: { width: 2778, height: 2709 },
  accent: '#00AB8E', blockFill: '#79C3B6', layers: 92, embedding: '5,120', vocabulary: '151k',
  context: [text('Native context'), emphasized('', '128k', ' tokens'), emphasized('', '4k', ' pretraining')],
  attention: { family: 'gqa', heads: 96, kvHeads: 8 }, hidden: 1536,
  experts: 160, activeExperts: 8, sharedExperts: 1,
  expertDimensions: [emphasized('Input expert size: ', '5,120'), text('Intermediate projection size:'), emphasized('', '1,536')],
  modelSize: '355B', activeParams: '32B', ropeLabel: 'Partial RoPE', showQKNorm: true, showHeadsAnnotation: false,
  denseFirst: [emphasized('First ', '3', ' blocks use'), text('dense FFN with'), emphasized('hidden size ', '12,288'), text('instead of MoE')],
  firstBadgeFill: '#5E5E5E', activeExpertLabel: '8 experts + 1 shared expert', denseFirstLeader: true, expertAnnotationY: 1070, resourceMaxWidth: 900, wideInsets: true,
});

export const glm5744bSpec = moeFamilySpec({
  id: 'glm-5-744b', title: 'GLM-5 (744B)', canvas: { width: 2777, height: 2703 },
  accent: '#1A89FE', blockFill: '#5CA7F0', layers: 78, embedding: '6,144', vocabulary: '155k',
  context: [text('Context length'), emphasized('', '202,752', ' tokens'), text('in config')],
  attention: { family: 'mla', heads: 128, kvRank: 512 }, hidden: 2048,
  experts: 256, activeExperts: 8, sharedExperts: 1,
  expertDimensions: [emphasized('Input expert size: ', '6,144'), text('Intermediate projection size:'), emphasized('', '2,048')],
  modelSize: '744B', activeParams: '40B', ropeLabel: 'Partial RoPE', showHeadsAnnotation: false,
  denseFirst: [emphasized('First ', '3', ' blocks use'), text('dense FFN with'), emphasized('hidden size ', '12,288'), text('instead of MoE')],
  firstBadgeFill: '#5E5E5E', activeExpertLabel: '8 experts + 1 shared expert', denseFirstLeader: true,
  attentionLabelStyle: 'mla-dsa', attentionBoxY: 1370, attentionBoxHeight: 260, expertAnnotationY: 1070, resourceMaxWidth: 900, wideInsets: true,
});

export const qwen3CoderFlashSpec = moeFamilySpec({
  id: 'qwen3-coder-flash-30b-a3b', title: 'Qwen3-Coder-Flash (30B-A3B)', canvas: { width: 2830, height: 2739 },
  accent: '#01A2FF', blockFill: '#8FC4E2', layers: 48, embedding: '2,048', vocabulary: '151k',
  context: [text('Context length'), emphasized('', '256k', ' native'), emphasized('', '1M', ' with YaRN')],
  attention: { family: 'gqa', heads: 32, kvHeads: 4 }, hidden: 768,
  experts: 128, activeExperts: 8, sharedExperts: 0,
  expertDimensions: [text('Intermediate hidden'), text('layer dimension of'), emphasized('', '768')],
  modelSize: '30B', activeParams: '3.3B', showQKNorm: true, showHeadsAnnotation: false,
  expertAnnotationY: 1070, wideInsets: true,
});

export const minimaxM25Spec = moeFamilySpec({
  id: 'minimax-m2-5-230b', title: 'MiniMax-M2.5 (230B)', canvas: { width: 2747, height: 2727 },
  accent: '#EA4762', blockFill: '#DE939F', layers: 62, embedding: '3,072', vocabulary: '200k',
  context: [text('Context length'), emphasized('', '196,608', ' tokens'), text('in config')],
  attention: { family: 'gqa', heads: 64, kvHeads: 8 }, hidden: 1536,
  experts: 256, activeExperts: 8, sharedExperts: 0,
  expertDimensions: [emphasized('Input expert size: ', '3,072'), text('Intermediate projection size:'), emphasized('', '1,536')],
  modelSize: '230B', activeParams: '10B',
  activeParamsLine: { spans: [{ text: '' }, { text: 'per inference step (i.e., only ' }, { text: '4.37%', color: 'accent' }, { text: ' parameters active)' }] },
  ropeLabel: 'Partial RoPE', showQKNorm: true, showHeadsAnnotation: false, firstBadgeFill: '#5E5E5E',
  expertAnnotationY: 1070, resourceMaxWidth: 900, wideInsets: true,
});

export const glm47Spec = moeFamilySpec({
  id: 'glm-4-7-355b', title: 'GLM-4.7 (355B)', canvas: { width: 2799, height: 2701 },
  accent: '#00AB8E', blockFill: '#79C3B6', layers: 92, embedding: '5,120', vocabulary: '151k',
  context: [text('Context length'), emphasized('', '202,752', ' tokens'), text('in config')],
  attention: { family: 'gqa', heads: 96, kvHeads: 8 }, hidden: 1536,
  experts: 160, activeExperts: 8, sharedExperts: 1,
  expertDimensions: [emphasized('Input expert size: ', '5,120'), text('Intermediate projection size:'), emphasized('', '1,536')],
  modelSize: '355B', activeParams: '32B', ropeLabel: 'Partial RoPE', showQKNorm: true, showHeadsAnnotation: false,
  denseFirst: [emphasized('First ', '3', ' blocks use'), text('dense FFN with'), emphasized('hidden size ', '12,288'), text('instead of MoE')],
  firstBadgeFill: '#5E5E5E', activeExpertLabel: '8 experts + 1 shared expert', denseFirstLeader: true,
  expertAnnotationY: 1070, resourceMaxWidth: 900, wideInsets: true,
});

export const deepSeekR1Spec = moeFamilySpec({
  id: 'deepseek-r1', title: 'DeepSeek-R1 (671B)', canvas: { width: 2786, height: 2725 },
  accent: '#FF644E', blockFill: '#FF968D', layers: 61, embedding: '7,168', vocabulary: '129k',
  context: [text('YaRN context'), emphasized('', '128k', ' tokens'), emphasized('', '4k', ' RoPE base')],
  attention: { family: 'mla', heads: 128, kvRank: 512 }, hidden: 2048,
  experts: 256, activeExperts: 8, sharedExperts: 1,
  expertDimensions: [text('Intermediate hidden'), text('layer dimension of'), emphasized('', '2,048')],
  modelSize: '671B', activeParams: '37B', ropeLabel: 'Partial RoPE',
  denseFirst: [emphasized('First ', '3', ' blocks use'), text('dense FFN with'), emphasized('hidden size ', '18,432'), text('instead of MoE')],
  firstBadgeFill: '#000000', lastBadgeFill: '#FF3B30', denseFirstLeader: true,
  expertAnnotationY: 1070, resourceMaxWidth: 900, wideInsets: true,
});

export const mistralLarge3Spec = moeFamilySpec({
  id: 'mistral-large-3', title: 'Mistral Large 3 (673B)', canvas: { width: 2786, height: 2735 },
  accent: '#F27200', blockFill: '#E4A166', layers: 61, embedding: '7,168', vocabulary: '131k',
  context: [text('YaRN context'), emphasized('', '256k', ' tokens'), emphasized('', '8k', ' RoPE base')],
  attention: { family: 'mla', heads: 128, kvRank: 512 }, hidden: 4096,
  experts: 128, activeExperts: 4, sharedExperts: 1,
  expertDimensions: [text('Intermediate hidden'), text('layer dimension of'), emphasized('', '4,096')],
  modelSize: '671B', activeParams: '41B', ropeLabel: 'Partial RoPE',
  denseFirst: [emphasized('First ', '3', ' blocks use'), text('dense FFN with'), emphasized('hidden size ', '16,384'), text('instead of MoE')],
  firstBadgeFill: '#000000', denseFirstLeader: true, expertAnnotationY: 1070, resourceMaxWidth: 900, wideInsets: true,
});

export const glm51Spec = moeFamilySpec({
  id: 'glm-5-1', title: 'GLM-5.1 (744B)', canvas: { width: 2777, height: 2703 },
  accent: '#1A89FE', blockFill: '#5CA7F0', layers: 78, embedding: '6,144', vocabulary: '155k',
  context: [text('Context length'), emphasized('', '202,752', ' tokens'), text('in config')],
  attention: { family: 'mla', heads: 128, kvRank: 512 }, hidden: 2048,
  experts: 256, activeExperts: 8, sharedExperts: 1,
  expertDimensions: [emphasized('Input expert size: ', '6,144'), text('Intermediate projection size:'), emphasized('', '2,048')],
  modelSize: '744B', activeParams: '40B', ropeLabel: 'Partial RoPE', showHeadsAnnotation: false,
  denseFirst: [emphasized('First ', '3', ' blocks use'), text('dense FFN with'), emphasized('hidden size ', '12,288'), text('instead of MoE')],
  firstBadgeFill: '#5E5E5E', activeExpertLabel: '8 experts + 1 shared expert', denseFirstLeader: true,
  attentionLabelStyle: 'mla-dsa', attentionBoxY: 1370, attentionBoxHeight: 260, expertAnnotationY: 1070, resourceMaxWidth: 900, wideInsets: true,
});
