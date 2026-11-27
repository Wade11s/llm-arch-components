import { useState } from 'react';
import deepseekV3Ref from '../images/deepseek-v3.webp';
import gemma3Ref from '../images/gemma-3-27b.webp';
import gptOssRef from '../images/gpt-oss-120b.webp';
import qwen38FlashNextRef from '../images/qwen3-8-flash-next-125b-a6b.webp';
import glm54Ref from '../images/glm-5-4.webp';
import llama3Ref from '../images/llama-3-8b.webp';
import qwen3Ref from '../images/qwen3-8b.webp';
import qwen3MoeRef from '../images/qwen3-30b-a3b.webp';
import minimaxM2Ref from '../images/minimax-m2-230b.webp';
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
  'gemma-3-27b': gemma3Ref,
  'gpt-oss-120b': gptOssRef,
  'qwen3-8-flash-next-125b-a6b': qwen38FlashNextRef,
  'glm-5-4': glm54Ref,
  'llama-3-8b': llama3Ref,
  'qwen3-8b': qwen3Ref,
  'qwen3-30b-a3b': qwen3MoeRef,
  'minimax-m2-230b': minimaxM2Ref,
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
