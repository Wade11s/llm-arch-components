import { useState } from 'react';
import deepseekRef from '../images/deepseek-v3.webp';
import gemmaRef from '../images/gemma-3-27b.webp';
import gptOssRef from '../images/gpt-oss-120b.webp';
import qwenRef from '../images/qwen3-8-flash-next-125b-a6b.webp';
import glmRef from '../images/glm-5-4.webp';
import { renderFigure, SceneSvg } from './core/renderFigure';
import { figureSpecs } from './specs';

const references: Record<string, string> = {
  'deepseek-v3': deepseekRef,
  'gemma-3-27b': gemmaRef,
  'gpt-oss-120b': gptOssRef,
  'qwen3-8-flash-next-125b-a6b': qwenRef,
  'glm-5-4': glmRef,
};

export default function App() {
  const [scale, setScale] = useState(25);
  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Issue #7 · renderFigure integration</p>
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
