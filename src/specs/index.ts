import type { FigureSpec } from '../core/types';
import { deepSeekV3Spec } from './deepSeekV3';
import { gemma3Spec } from './gemma3';
import { gemma3SmallSpec, gemma412bSpec, gemma431bSpec } from './gemmaDense';
import { gptOss120bSpec } from './gptOss120b';
import { qwen38FlashNextSpec } from './qwen38FlashNext';
import { glm54Spec } from './glm54';
import { llama3Spec } from './llama3';
import { qwen3Spec } from './qwen3';
import { qwen3MoeSpec } from './qwen3Moe';
import { minimaxM2Spec } from './minimaxM2';
import { qwen3NextSpec } from './qwen3Next';
import { kimiLinearSpec } from './kimiLinear';
import { xlstmSpec } from './xlstm';
import { lfm25Spec } from './lfm25';
import { inkling2MiniSpec } from './inkling2Mini';
import { motif3BetaSpec } from './motif3Beta';
import { deepSeekV41FlashSpec } from './deepSeekV41Flash';
import { tencentHy4Spec } from './tencentHy4';

export type FigureSpecEntry = {
  slug: string;
  name: string;
  reference: string;
  width: number;
  height: number;
  spec: FigureSpec;
};

export const figureSpecs: FigureSpecEntry[] = [
  { slug: 'deepseek-v3', name: 'DeepSeek-V3 (671B)', reference: '../images/deepseek-v3.webp', width: 2786, height: 2725, spec: deepSeekV3Spec },
  { slug: 'gemma-3-270m', name: 'Gemma 3 (270M)', reference: '../images/gemma-3-270m.webp', width: 2678, height: 2652, spec: gemma3SmallSpec },
  { slug: 'gemma-3-27b', name: 'Gemma 3 (27B)', reference: '../images/gemma-3-27b.webp', width: 2593, height: 2686, spec: gemma3Spec },
  { slug: 'gemma-4-12b', name: 'Gemma 4 (12B)', reference: '../images/gemma-4-12b.webp', width: 2582, height: 2686, spec: gemma412bSpec },
  { slug: 'gemma-4-31b', name: 'Gemma 4 (31B)', reference: '../images/gemma-4-31b.webp', width: 2582, height: 2686, spec: gemma431bSpec },
  { slug: 'gpt-oss-120b', name: 'gpt-oss (120B)', reference: '../images/gpt-oss-120b.webp', width: 2904, height: 2699, spec: gptOss120bSpec },
  { slug: 'qwen3-8-flash-next-125b-a6b', name: 'Qwen3.8-Flash-Next (125B-A6B)', reference: '../images/qwen3-8-flash-next-125b-a6b.webp', width: 4078, height: 3391, spec: qwen38FlashNextSpec },
  { slug: 'glm-5-4', name: 'GLM-5.4 (~750B)', reference: '../images/glm-5-4.webp', width: 3354, height: 2862, spec: glm54Spec },
  { slug: 'llama-3-8b', name: 'Llama 3 (8B)', reference: '../images/llama-3-8b.webp', width: 2554, height: 2670, spec: llama3Spec },
  { slug: 'qwen3-8b', name: 'Qwen3 (8B)', reference: '../images/qwen3-8b.webp', width: 2533, height: 2642, spec: qwen3Spec },
  { slug: 'qwen3-30b-a3b', name: 'Qwen3 (30B-A3B)', reference: '../images/qwen3-30b-a3b.webp', width: 2829, height: 2715, spec: qwen3MoeSpec },
  { slug: 'minimax-m2-230b', name: 'MiniMax-M2 (230B)', reference: '../images/minimax-m2-230b.webp', width: 2751, height: 2709, spec: minimaxM2Spec },
  { slug: 'qwen3-next-80b-a3b', name: 'Qwen3-Next (80B-A3B)', reference: '../images/qwen3-next-80b-a3b.webp', width: 2946, height: 2771, spec: qwen3NextSpec },
  { slug: 'kimi-linear-48b-a3b', name: 'Kimi Linear (48B-A3B)', reference: '../images/kimi-linear-48b-a3b.webp', width: 2935, height: 2754, spec: kimiLinearSpec },
  { slug: 'xlstm-7b', name: 'xLSTM (7B)', reference: '../images/xlstm-7b.webp', width: 2874, height: 2635, spec: xlstmSpec },
  { slug: 'lfm2-5-8b-a1b', name: 'LFM2.5 (8B-A1B)', reference: '../images/lfm2-5-8b-a1b.webp', width: 2454, height: 2732, spec: lfm25Spec },
  { slug: 'inkling-2-mini', name: 'Inkling 2 Mini (26.4B)', reference: '../images/inkling-2-mini.webp', width: 3687, height: 3426, spec: inkling2MiniSpec },
  { slug: 'motif-3-beta', name: 'Motif-3-Beta (314B-A13B)', reference: '../images/motif-3-beta.webp', width: 3683, height: 3062, spec: motif3BetaSpec },
  { slug: 'deepseek-v4-1-flash', name: 'DeepSeek-V4.1-Flash (552B)', reference: '../images/deepseek-v4-1-flash.webp', width: 5000, height: 3556, spec: deepSeekV41FlashSpec },
  { slug: 'tencent-hy4-770b-a49b', name: 'Tencent Hy4 (770B-A49B)', reference: '../images/tencent-hy4-770b-a49b.webp', width: 3834, height: 2949, spec: tencentHy4Spec },
];

export { deepSeekV3Spec, gemma3Spec, gemma3SmallSpec, gemma412bSpec, gemma431bSpec, gptOss120bSpec, qwen38FlashNextSpec, glm54Spec, llama3Spec, qwen3Spec, qwen3MoeSpec, minimaxM2Spec, qwen3NextSpec, kimiLinearSpec, xlstmSpec, lfm25Spec, inkling2MiniSpec, motif3BetaSpec, deepSeekV41FlashSpec, tencentHy4Spec };
