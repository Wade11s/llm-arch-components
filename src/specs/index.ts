import type { FigureSpec } from '../core/types';
import { deepSeekV3Spec } from './deepSeekV3';
import { gemma3Spec } from './gemma3';
import { gemma3SmallSpec, gemma412bSpec, gemma431bSpec } from './gemmaDense';
import { gptOss120bSpec } from './gptOss120b';
import { qwen38FlashNextSpec } from './qwen38FlashNext';
import { glm54Spec } from './glm54';
import { llama3Spec } from './llama3';
import { llama321bSpec, llama323bSpec, phi4Spec, qwen306bSpec, qwen34bSpec, qwen332bSpec } from './denseBackbone';
import { domynEdgeSpec, granite41Spec, gpt2xlSpec } from './edgeBackbone';
import { glm45355bSpec, glm45AirSpec, glm5744bSpec, gptOss20bSpec, intellect3Spec, qwen3235bSpec } from './moeFamily';
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
  { slug: 'gpt-oss-20b', name: 'gpt-oss (20B)', reference: '../images/gpt-oss-20b.webp', width: 2873, height: 2699, spec: gptOss20bSpec },
  { slug: 'gpt-oss-120b', name: 'gpt-oss (120B)', reference: '../images/gpt-oss-120b.webp', width: 2904, height: 2699, spec: gptOss120bSpec },
  { slug: 'qwen3-8-flash-next-125b-a6b', name: 'Qwen3.8-Flash-Next (125B-A6B)', reference: '../images/qwen3-8-flash-next-125b-a6b.webp', width: 4078, height: 3391, spec: qwen38FlashNextSpec },
  { slug: 'glm-5-4', name: 'GLM-5.4 (~750B)', reference: '../images/glm-5-4.webp', width: 3354, height: 2862, spec: glm54Spec },
  { slug: 'llama-3-2-1b', name: 'Llama 3.2 (1B)', reference: '../images/llama-3-2-1b.webp', width: 2553, height: 2664, spec: llama321bSpec },
  { slug: 'llama-3-2-3b', name: 'Llama 3.2 (3B)', reference: '../images/llama-3-2-3b.webp', width: 2553, height: 2664, spec: llama323bSpec },
  { slug: 'llama-3-8b', name: 'Llama 3 (8B)', reference: '../images/llama-3-8b.webp', width: 2554, height: 2670, spec: llama3Spec },
  { slug: 'qwen3-0-6b', name: 'Qwen3 (0.6B)', reference: '../images/qwen3-0-6b.webp', width: 2531, height: 2654, spec: qwen306bSpec },
  { slug: 'qwen3-4b', name: 'Qwen3 (4B)', reference: '../images/qwen3-4b.webp', width: 2531, height: 2654, spec: qwen34bSpec },
  { slug: 'qwen3-8b', name: 'Qwen3 (8B)', reference: '../images/qwen3-8b.webp', width: 2533, height: 2642, spec: qwen3Spec },
  { slug: 'qwen3-32b', name: 'Qwen3 (32B)', reference: '../images/qwen3-32b.webp', width: 2531, height: 2634, spec: qwen332bSpec },
  { slug: 'phi-4', name: 'Phi-4 (14B)', reference: '../images/phi-4.webp', width: 2563, height: 2671, spec: phi4Spec },
  { slug: 'domyn-edge-3-93b', name: 'Domyn Edge (3.93B)', reference: '../images/domyn-edge-3-93b.webp', width: 2494, height: 2663, spec: domynEdgeSpec },
  { slug: 'granite-4-1-30b', name: 'Granite 4.1 (30B)', reference: '../images/granite-4-1-30b.webp', width: 2530, height: 2634, spec: granite41Spec },
  { slug: 'gpt-2-xl-1-5b', name: 'GPT-2 XL (1.5B)', reference: '../images/gpt-2-xl-1-5b.webp', width: 2488, height: 2698, spec: gpt2xlSpec },
  { slug: 'qwen3-30b-a3b', name: 'Qwen3 (30B-A3B)', reference: '../images/qwen3-30b-a3b.webp', width: 2829, height: 2715, spec: qwen3MoeSpec },
  { slug: 'qwen3-235b-a22b', name: 'Qwen3 (235B-A22B)', reference: '../images/qwen3-235b-a22b.webp', width: 2766, height: 2715, spec: qwen3235bSpec },
  { slug: 'minimax-m2-230b', name: 'MiniMax-M2 (230B)', reference: '../images/minimax-m2-230b.webp', width: 2751, height: 2709, spec: minimaxM2Spec },
  { slug: 'intellect-3', name: 'INTELLECT-3 (106B)', reference: '../images/intellect-3.webp', width: 2778, height: 2709, spec: intellect3Spec },
  { slug: 'glm-4-5-air', name: 'GLM-4.5-Air (106B)', reference: '../images/glm-4-5-air.webp', width: 2778, height: 2709, spec: glm45AirSpec },
  { slug: 'glm-4-5-355b', name: 'GLM-4.5 (355B)', reference: '../images/glm-4-5-355b.webp', width: 2778, height: 2709, spec: glm45355bSpec },
  { slug: 'glm-5-744b', name: 'GLM-5 (744B)', reference: '../images/glm-5-744b.webp', width: 2777, height: 2703, spec: glm5744bSpec },
  { slug: 'qwen3-next-80b-a3b', name: 'Qwen3-Next (80B-A3B)', reference: '../images/qwen3-next-80b-a3b.webp', width: 2946, height: 2771, spec: qwen3NextSpec },
  { slug: 'kimi-linear-48b-a3b', name: 'Kimi Linear (48B-A3B)', reference: '../images/kimi-linear-48b-a3b.webp', width: 2935, height: 2754, spec: kimiLinearSpec },
  { slug: 'xlstm-7b', name: 'xLSTM (7B)', reference: '../images/xlstm-7b.webp', width: 2874, height: 2635, spec: xlstmSpec },
  { slug: 'lfm2-5-8b-a1b', name: 'LFM2.5 (8B-A1B)', reference: '../images/lfm2-5-8b-a1b.webp', width: 2454, height: 2732, spec: lfm25Spec },
  { slug: 'inkling-2-mini', name: 'Inkling 2 Mini (26.4B)', reference: '../images/inkling-2-mini.webp', width: 3687, height: 3426, spec: inkling2MiniSpec },
  { slug: 'motif-3-beta', name: 'Motif-3-Beta (314B-A13B)', reference: '../images/motif-3-beta.webp', width: 3683, height: 3062, spec: motif3BetaSpec },
  { slug: 'deepseek-v4-1-flash', name: 'DeepSeek-V4.1-Flash (552B)', reference: '../images/deepseek-v4-1-flash.webp', width: 5000, height: 3556, spec: deepSeekV41FlashSpec },
  { slug: 'tencent-hy4-770b-a49b', name: 'Tencent Hy4 (770B-A49B)', reference: '../images/tencent-hy4-770b-a49b.webp', width: 3834, height: 2949, spec: tencentHy4Spec },
];

export { deepSeekV3Spec, gemma3Spec, gemma3SmallSpec, gemma412bSpec, gemma431bSpec, gptOss120bSpec, gptOss20bSpec, qwen38FlashNextSpec, glm54Spec, llama3Spec, llama321bSpec, llama323bSpec, qwen3Spec, qwen306bSpec, qwen34bSpec, qwen332bSpec, phi4Spec, domynEdgeSpec, granite41Spec, gpt2xlSpec, qwen3MoeSpec, qwen3235bSpec, minimaxM2Spec, intellect3Spec, glm45AirSpec, glm45355bSpec, glm5744bSpec, qwen3NextSpec, kimiLinearSpec, xlstmSpec, lfm25Spec, inkling2MiniSpec, motif3BetaSpec, deepSeekV41FlashSpec, tencentHy4Spec };
