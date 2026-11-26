import type { FigureSpec } from '../core/types';
import { deepSeekV3Spec } from './deepSeekV3';
import { gemma3Spec } from './gemma3';
import { gptOss120bSpec } from './gptOss120b';
import { qwen38FlashNextSpec } from './qwen38FlashNext';
import { glm54Spec } from './glm54';

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
  { slug: 'gemma-3-27b', name: 'Gemma 3 (27B)', reference: '../images/gemma-3-27b.webp', width: 2593, height: 2686, spec: gemma3Spec },
  { slug: 'gpt-oss-120b', name: 'gpt-oss (120B)', reference: '../images/gpt-oss-120b.webp', width: 2904, height: 2699, spec: gptOss120bSpec },
  { slug: 'qwen3-8-flash-next-125b-a6b', name: 'Qwen3.8-Flash-Next (125B-A6B)', reference: '../images/qwen3-8-flash-next-125b-a6b.webp', width: 4078, height: 3391, spec: qwen38FlashNextSpec },
  { slug: 'glm-5-4', name: 'GLM-5.4 (~750B)', reference: '../images/glm-5-4.webp', width: 3354, height: 2862, spec: glm54Spec },
];

export { deepSeekV3Spec, gemma3Spec, gptOss120bSpec, qwen38FlashNextSpec, glm54Spec };
