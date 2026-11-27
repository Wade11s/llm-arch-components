import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import { figureSpecs, gemma3SmallSpec, gemma412bSpec, gemma431bSpec } from '../src/specs';
import type { RenderedFigure } from '../src/core/types';

function sceneText(result: RenderedFigure): string {
  return result.scene.elements
    .flatMap((element) => element.kind === 'text' ? element.lines.flatMap((line) => line.spans.map((span) => span.text)) : [])
    .join(' ')
    .replace(/\s+/g, ' ');
}

describe('Gemma dense family', () => {
  test('renders Gemma 3 (270M) with compact dimensions and multi-query attention', () => {
    const result = renderFigure(gemma3SmallSpec);

    expect(result.svg).toContain('Gemma 3 (270M)');
    expect(result.svg).toContain('>18<');
    expect(result.svg).toContain('640');
    expect(result.svg).toContain('2,048');
    expect(sceneText(result)).toContain('4 attention heads');
    expect(sceneText(result)).toContain('1 key & value heads');
    expect(result.svg).toContain('32,768');
    expect(result.svg).toContain('5:1');
    expect(result.svg).toContain('QK-Norm');
    expect(result.svg).toContain('>RoPE<');
    expect(result.svg).not.toContain('Partial RoPE');
    expect(result.scene.elements.some((element) => element.role === 'repeat-block')).toBe(true);
    expect(result.scene.elements.find((element) => element.id === 'sample-input')).toMatchObject({
      kind: 'text',
      at: { y: 2638 },
    });
    expect(result.diagnostics.filter((diagnostic) => diagnostic.code === 'text-overflow')).toEqual([]);
  });

  test('renders Gemma 4 (12B) with two-line RoPE and local/global head annotations', () => {
    const result = renderFigure(gemma412bSpec);

    expect(result.svg).toContain('Gemma 4 (12B)');
    expect(result.svg).toContain('>48<');
    expect(result.svg).toContain('3,840');
    expect(result.svg).toContain('15,360');
    expect(sceneText(result)).toContain('16 attention heads');
    expect(sceneText(result)).toContain('8 key & value heads');
    expect(sceneText(result)).toContain('1 key & value head');
    expect(result.svg).toContain('Partial RoPE (global)');
    expect(result.svg).toContain('Full RoPE (local)');
    expect(result.scene.elements.find((element) => element.id === 'rope-box')).toMatchObject({
      kind: 'box',
      box: { y: 1527, height: 100 },
      stroke: expect.objectContaining({ color: '#000000' }),
    });
    expect(result.scene.elements.find((element) => element.id === 'qk-norm-box')).toMatchObject({
      kind: 'box',
      stroke: expect.objectContaining({ color: '#56C1FF' }),
    });
    expect(result.scene.elements.find((element) => element.id === 'leader-attention')).toMatchObject({
      kind: 'path',
      points: expect.arrayContaining([{ x: 1760, y: 1889 }]),
    });
    expect(result.svg).toContain('262,144');
    expect(result.diagnostics.filter((diagnostic) => diagnostic.code === 'text-overflow')).toEqual([]);
  });

  test('renders Gemma 4 (31B) with 60 layers and 32-head local/global attention', () => {
    const result = renderFigure(gemma431bSpec);

    expect(result.svg).toContain('Gemma 4 (31B)');
    expect(result.svg).toContain('>60<');
    expect(result.svg).toContain('5,376');
    expect(result.svg).toContain('21,504');
    expect(sceneText(result)).toContain('32 attention heads');
    expect(sceneText(result)).toContain('16 key & value heads');
    expect(sceneText(result)).toContain('4 key & value heads');
    expect(result.svg).toContain('Partial RoPE (global)');
    expect(result.svg).toContain('Full RoPE (local)');
    expect(result.scene.elements.find((element) => element.id === 'qk-norm-box')).toMatchObject({
      kind: 'box',
      stroke: expect.objectContaining({ color: '#56C1FF' }),
    });
    expect(result.scene.elements.find((element) => element.id === 'leader-attention')).toMatchObject({
      kind: 'path',
      points: expect.arrayContaining([{ x: 1760, y: 1889 }]),
    });
    expect(result.diagnostics.filter((diagnostic) => diagnostic.code === 'text-overflow')).toEqual([]);
  });

  test('registers the Gemma dense family and reports verified coverage', () => {
    const slugs = figureSpecs.map((entry) => entry.slug);
    expect(slugs).toContain('gemma-3-270m');
    expect(slugs).toContain('gemma-4-12b');
    expect(slugs).toContain('gemma-4-31b');

    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain('| Verified rendering | 20 / 132 |');
    expect(coverage).toContain('| gemma-3-270m | yes | yes | yes |');
    expect(coverage).toContain('| gemma-4-12b | yes | yes | yes |');
    expect(coverage).toContain('| gemma-4-31b | yes | yes | yes |');
  });
});
