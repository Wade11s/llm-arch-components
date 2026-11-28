import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import type { Scene } from '../src/core/types';
import {
  deepSeekV32Spec,
  figureSpecs,
  kimiK25Spec,
  minimaxM3Spec,
  mistralSmall4Spec,
  xiaomiMimoV2FlashSpec,
} from '../src/specs';

function sceneText(scene: Scene): string {
  return scene.elements
    .flatMap((element) => element.kind === 'text' ? element.lines.map((line) => line.spans.map((span) => span.text).join('')) : [])
    .join('\n');
}

describe('large MoE / MLA family', () => {
  test('renders Kimi K2.5 (1T) with 61x and a repeat brace', () => {
    const result = renderFigure(kimiK25Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('Kimi K2.5 (1T)');
    expect(text).toContain('Vocabulary size of 160k');
    expect(text).toContain('61');
    expect(text).toContain('384');
    expect(text).toContain('64 heads');
    expect(text).toContain('First 1 block uses');
    expect(text).toContain('hidden size 18,432');
    expect(text).toContain('Model size is 1T');
    expect(text).toContain('32B');
    expect(text).toContain('256k tokens');
    expect(result.scene.elements.some((element) => element.id === 'repeat-brace')).toBe(true);
  });

  test('renders Mistral Small 4 (119B-A6B) with 4 routed experts', () => {
    const result = renderFigure(mistralSmall4Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('Mistral Small 4 (119B-A6B)');
    expect(text).toContain('Vocabulary size of 131k');
    expect(text).toContain('36');
    expect(text).toContain('128');
    expect(text).toContain('4 routed experts + 1');
    expect(text).toContain('shared expert active per token');
    expect(text).toContain('Model size is 119B');
    expect(text).toContain('6.63B');
    expect(text).toContain('32 heads');
    expect(text).toContain('Input dim.: 4,096');
    expect(text).toContain('Intermediate dim.: 2,048');
  });

  test('renders MiniMax-M3 (428B) with GQA / MiniMax Sparse Attention', () => {
    const result = renderFigure(minimaxM3Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('MiniMax-M3 (428B)');
    expect(text).toContain('Vocabulary size of 200k');
    expect(text).toContain('60');
    expect(text).toContain('GQA / MiniMax Sparse');
    expect(text).toContain('Attention');
    expect(text).toContain('128');
    expect(text).toContain('4 experts + 1 shared');
    expect(text).toContain('expert active per token');
    expect(text).toContain('Model size is 428B');
    expect(text).toContain('23B');
    expect(text).toContain('5.37%');
    expect(text).toContain('1M tokens');
    expect(text).toContain('QK-Norm');
    expect(text).toContain('Input expert size: 6,144');
    expect(text).toContain('3,072');
  });

  test('renders DeepSeek-V3.2 (671B) with plain MLA + DSA attention label', () => {
    const result = renderFigure(deepSeekV32Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('DeepSeek-V3.2 (671B)');
    expect(text).toContain('Vocabulary size of 129k');
    expect(text).toContain('61');
    expect(text).toContain('Multi-head attention');
    expect(text).toContain('(MLA)');
    expect(text).toContain('DeepSeek');
    expect(text).toContain('Sparse');
    expect(text).toContain('Attention (DSA)');
    expect(text).toContain('256');
    expect(text).toContain('128 heads');
    expect(text).toContain('Model size is 671B');
    expect(text).toContain('37B');
  });

  test('renders Xiaomi MiMo-V2-Flash (309B) with GQA + SWA', () => {
    const result = renderFigure(xiaomiMimoV2FlashSpec);
    const text = sceneText(result.scene);

    expect(text).toContain('Xiaomi MiMo-V2-Flash (309B)');
    expect(text).toContain('Vocabulary size of 152k');
    expect(text).toContain('Grouped-query');
    expect(text).toContain('attention (GQA)');
    expect(text).toContain('Sliding window attention');
    expect(text).toContain('(SWA)');
    expect(text).toContain('256');
    expect(text).toContain('8 routed experts');
    expect(text).toContain('Model size is 309B');
    expect(text).toContain('15B');
    expect(text).toContain('(SWA)');
    expect(text).toContain('First block uses');
    expect(text).toContain('hidden size 16,384');
  });

  test('keeps large-family text within canvas and without diagnostics', () => {
    for (const spec of [kimiK25Spec, mistralSmall4Spec, minimaxM3Spec, deepSeekV32Spec, xiaomiMimoV2FlashSpec]) {
      const result = renderFigure(spec);
      expect(result.diagnostics).toEqual([]);
      for (const element of result.scene.elements) {
        if (element.kind !== 'text') continue;
        for (const line of element.lines) {
          expect(line.baseline).toBeLessThanOrEqual(result.scene.canvas.height - 5);
          for (const span of line.spans) {
            expect(span.x).toBeGreaterThanOrEqual(0);
            expect(span.x + span.width).toBeLessThanOrEqual(result.scene.canvas.width + 1);
          }
        }
      }
    }
  });

  test('registers the large MoE / MLA family and reports verified coverage', () => {
    const slugs = figureSpecs.map((entry) => entry.slug);
    expect(slugs).toContain('kimi-k2-5');
    expect(slugs).toContain('mistral-small-4');
    expect(slugs).toContain('minimax-m3-428b');
    expect(slugs).toContain('deepseek-v3-2');
    expect(slugs).toContain('xiaomi-mimo-v2-flash-309b');

    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
  });
});
