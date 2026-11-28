import { useState } from 'react';
import deepseekV3Ref from '../images/deepseek-v3.webp';
import deepseekR1Ref from '../images/deepseek-r1.webp';
import deepseekV32Ref from '../images/deepseek-v3-2.webp';
import gemma3SmallRef from '../images/gemma-3-270m.webp';
import gemma3Ref from '../images/gemma-3-27b.webp';
import gemma412bRef from '../images/gemma-4-12b.webp';
import gemma431bRef from '../images/gemma-4-31b.webp';
import gemma4E2bRef from '../images/gemma-4-e2b.webp';
import gemma4E4bRef from '../images/gemma-4-e4b.webp';
import gptOssRef from '../images/gpt-oss-120b.webp';
import gptOss20bRef from '../images/gpt-oss-20b.webp';
import qwen38FlashNextRef from '../images/qwen3-8-flash-next-125b-a6b.webp';
import glm54Ref from '../images/glm-5-4.webp';
import antares1bRef from '../images/antares-1b.webp';
import llama321bRef from '../images/llama-3-2-1b.webp';
import llama323bRef from '../images/llama-3-2-3b.webp';
import llama3Ref from '../images/llama-3-8b.webp';
import qwen306bRef from '../images/qwen3-0-6b.webp';
import qwen34bRef from '../images/qwen3-4b.webp';
import qwen3Ref from '../images/qwen3-8b.webp';
import qwen332bRef from '../images/qwen3-32b.webp';
import phi4Ref from '../images/phi-4.webp';
import vibeThinker3bRef from '../images/vibethinker-3b.webp';
import nanbeige41Ref from '../images/nanbeige-4-1-3b.webp';
import nanbeige42Ref from '../images/nanbeige-4-2-3b.webp';
import nanbeige43Ref from '../images/nanbeige-4-3-33b.webp';
import mistralSmall31Ref from '../images/mistral-small-3-1-24b.webp';
import olmo2Ref from '../images/olmo-2-7b.webp';
import olmo3Ref from '../images/olmo-3-7b.webp';
import smollm3Ref from '../images/smollm3-3b.webp';
import domynEdgeRef from '../images/domyn-edge-3-93b.webp';
import granite41Ref from '../images/granite-4-1-30b.webp';
import gpt2xlRef from '../images/gpt-2-xl-1-5b.webp';
import qwen3MoeRef from '../images/qwen3-30b-a3b.webp';
import qwen3235bRef from '../images/qwen3-235b-a22b.webp';
import qwen3CoderFlashRef from '../images/qwen3-coder-flash-30b-a3b.webp';
import kimiK2Ref from '../images/kimi-k2.webp';
import kimiK25Ref from '../images/kimi-k2-5.webp';
import minimaxM2Ref from '../images/minimax-m2-230b.webp';
import minimaxM3Ref from '../images/minimax-m3-428b.webp';
import minimaxM25Ref from '../images/minimax-m2-5-230b.webp';
import mistralLarge3Ref from '../images/mistral-large-3.webp';
import mistralSmall4Ref from '../images/mistral-small-4.webp';
import intellect3Ref from '../images/intellect-3.webp';
import xiaomiMimoV2FlashRef from '../images/xiaomi-mimo-v2-flash-309b.webp';
import glm45AirRef from '../images/glm-4-5-air.webp';
import glm45355bRef from '../images/glm-4-5-355b.webp';
import glm47Ref from '../images/glm-4-7-355b.webp';
import glm51Ref from '../images/glm-5-1.webp';
import glm5744bRef from '../images/glm-5-744b.webp';
import qwen3NextRef from '../images/qwen3-next-80b-a3b.webp';
import kimiLinearRef from '../images/kimi-linear-48b-a3b.webp';
import xlstmRef from '../images/xlstm-7b.webp';
import lfm25Ref from '../images/lfm2-5-8b-a1b.webp';
import inkling2MiniRef from '../images/inkling-2-mini.webp';
import motif3BetaRef from '../images/motif-3-beta.webp';
import deepseekV41FlashRef from '../images/deepseek-v4-1-flash.webp';
import tencentHy4Ref from '../images/tencent-hy4-770b-a49b.webp';
import { renderFigure, SceneSvg } from './core/renderFigure';
import { figureSpecs } from './specs';

const references: Record<string, string> = {
  'deepseek-v3': deepseekV3Ref,
  'deepseek-v3-2': deepseekV32Ref,
  'deepseek-r1': deepseekR1Ref,
  'gemma-3-270m': gemma3SmallRef,
  'gemma-3-27b': gemma3Ref,
  'gemma-4-12b': gemma412bRef,
  'gemma-4-31b': gemma431bRef,
  'gemma-4-e2b': gemma4E2bRef,
  'gemma-4-e4b': gemma4E4bRef,
  'gpt-oss-20b': gptOss20bRef,
  'gpt-oss-120b': gptOssRef,
  'qwen3-8-flash-next-125b-a6b': qwen38FlashNextRef,
  'glm-5-4': glm54Ref,
  'antares-1b': antares1bRef,
  'llama-3-2-1b': llama321bRef,
  'llama-3-2-3b': llama323bRef,
  'llama-3-8b': llama3Ref,
  'qwen3-0-6b': qwen306bRef,
  'qwen3-4b': qwen34bRef,
  'qwen3-8b': qwen3Ref,
  'qwen3-32b': qwen332bRef,
  'phi-4': phi4Ref,
  'vibethinker-3b': vibeThinker3bRef,
  'nanbeige-4-1-3b': nanbeige41Ref,
  'nanbeige-4-2-3b': nanbeige42Ref,
  'nanbeige-4-3-33b': nanbeige43Ref,
  'mistral-small-3-1-24b': mistralSmall31Ref,
  'olmo-2-7b': olmo2Ref,
  'olmo-3-7b': olmo3Ref,
  'smollm3-3b': smollm3Ref,
  'domyn-edge-3-93b': domynEdgeRef,
  'granite-4-1-30b': granite41Ref,
  'gpt-2-xl-1-5b': gpt2xlRef,
  'qwen3-30b-a3b': qwen3MoeRef,
  'qwen3-235b-a22b': qwen3235bRef,
  'qwen3-coder-flash-30b-a3b': qwen3CoderFlashRef,
  'kimi-k2': kimiK2Ref,
  'kimi-k2-5': kimiK25Ref,
  'minimax-m3-428b': minimaxM3Ref,
  'minimax-m2-230b': minimaxM2Ref,
  'minimax-m2-5-230b': minimaxM25Ref,
  'mistral-small-4': mistralSmall4Ref,
  'mistral-large-3': mistralLarge3Ref,
  'xiaomi-mimo-v2-flash-309b': xiaomiMimoV2FlashRef,
  'intellect-3': intellect3Ref,
  'glm-4-5-air': glm45AirRef,
  'glm-4-5-355b': glm45355bRef,
  'glm-4-7-355b': glm47Ref,
  'glm-5-1': glm51Ref,
  'glm-5-744b': glm5744bRef,
  'qwen3-next-80b-a3b': qwen3NextRef,
  'kimi-linear-48b-a3b': kimiLinearRef,
  'xlstm-7b': xlstmRef,
  'lfm2-5-8b-a1b': lfm25Ref,
  'inkling-2-mini': inkling2MiniRef,
  'motif-3-beta': motif3BetaRef,
  'deepseek-v4-1-flash': deepseekV41FlashRef,
  'tencent-hy4-770b-a49b': tencentHy4Ref,
};

export default function App() {
  const [scale, setScale] = useState(25);
  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Spec-driven Gallery</p>
          <h1>LLM architecture prototypes</h1>
          <p className="intro">Reference images are on the left; the right side is rendered from FigureSpec through the shared Scene interface.</p>
        </div>
        <label className="scale-control">
          Review zoom
          <select value={scale} onChange={(event) => setScale(Number(event.target.value))}>
            <option value={25}>25%</option>
            <option value={50}>50%</option>
            <option value={100}>100%</option>
          </select>
        </label>
      </header>

      {figureSpecs.map(({ slug, name, width, height, spec }) => {
        const displayWidth = Math.round(width * scale / 100);
        const idPrefix = `${slug}-gallery`;
        const rendered = renderFigure(spec, { idPrefix });
        return (
          <section className="figure-review" key={slug}>
            <div className="figure-heading">
              <h2>{name}</h2>
              <span>{width} × {height} · {scale}% zoom</span>
            </div>
            <div className="comparison-grid">
              <figure>
                <figcaption>Reference</figcaption>
                <div className="canvas-scroll">
                  <img src={references[slug]} width={displayWidth} height={Math.round(height * scale / 100)} alt={`${name} reference`} />
                </div>
              </figure>
              <figure>
                <figcaption>FigureSpec → Scene → SVG</figcaption>
                <div className="canvas-scroll" style={{ width: displayWidth, height: Math.round(height * scale / 100) }}>
                  <SceneSvg scene={rendered.scene} idPrefix={idPrefix} />
                </div>
              </figure>
            </div>
          </section>
        );
      })}
    </main>
  );
}
