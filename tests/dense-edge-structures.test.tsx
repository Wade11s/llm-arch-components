import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import { domynEdgeSpec, figureSpecs, gpt2xlSpec, granite41Spec } from '../src/specs';
import type { RenderedFigure } from '../src/core/types';

function sceneText(result: RenderedFigure): string {
  return result.scene.elements
    .flatMap((element) => element.kind === 'text' ? element.lines.flatMap((line) => line.spans.map((span) => span.text)) : [])
    .join(' ')
    .replace(/\s+/g, ' ');
}

function expectNoTextOverflow(result: RenderedFigure) {
  expect(result.diagnostics.filter((diagnostic) => diagnostic.code === 'text-overflow')).toEqual([]);
}

function expectInsetWithinCanvas(result: RenderedFigure) {
  const inset = result.scene.elements.find((element) => element.id === 'ffn-inset');
  if (!inset || inset.kind !== 'box') throw new Error('ffn-inset missing');
  expect(inset.box.x + inset.box.width).toBeLessThanOrEqual(result.scene.canvas.width);
  const sidePill = result.scene.elements.find((element) => element.id === 'ffn-linear-side-box');
  if (!sidePill || sidePill.kind !== 'box') throw new Error('side pill missing');
  expect(sidePill.box.x + sidePill.box.width).toBeLessThanOrEqual(result.scene.canvas.width);
}

describe('dense edge structures', () => {
  test('renders Domyn Edge (3.93B) with Pre/Post norms and Local RoPE / Global NoPE', () => {
    const result = renderFigure(domynEdgeSpec);

    expect(result.svg).toContain('Domyn Edge (3.93B)');
    expect(result.svg).toContain('>36<');
    expect(result.svg).toContain('115,272');
    expect(sceneText(result)).toContain('256k working');
    expect(sceneText(result)).toContain('1M in training');
    expect(result.svg).toContain('Local RoPE');
    expect(result.svg).toContain('Global NoPE');
    expect(result.svg).toContain('QK-Norm');
    expect(result.svg).toContain('9,728');
    expect(result.svg).toContain('2,560');
    expect(result.svg).toContain('Tied input/output weights');
    expect(result.svg).toContain('SiLU activation');
    expect(result.svg).not.toContain('GELU activation');
    expect(result.scene.elements.some((element) => element.id === 'leader-attention')).toBe(false);
    expectInsetWithinCanvas(result);
    expectNoTextOverflow(result);
  });

  test('renders Granite 4.1 (30B) with Pre-RMSNorm and 64 layers', () => {
    const result = renderFigure(granite41Spec);

    expect(result.svg).toContain('Granite 4.1 (30B)');
    expect(result.svg).toContain('>64<');
    expect(result.svg).toContain('100k');
    expect(result.svg).toContain('131,072');
    expect(sceneText(result)).toContain('32 attention heads');
    expect(sceneText(result)).toContain('8 key & value heads');
    expect(result.svg).toContain('QK-Norm');
    expect(result.svg).toContain('Pre-RMSNorm');
    expect(result.svg).toContain('8×4,096 =');
    expect(result.svg).toContain('32,768');
    expect(result.svg).toContain('SiLU activation');
    expect(result.svg).not.toContain('GELU activation');
    expectInsetWithinCanvas(result);
    expect(result.scene.elements.find((element) => element.id === 'leader-ffn')).toMatchObject({
      kind: 'path',
      points: [{ x: 1200, y: 1006 }, { x: 1692, y: 876 }],
    });
    expectNoTextOverflow(result);
  });

  test('renders GPT-2 XL (1.5B) with LayerNorm, dropout, and learned positions', () => {
    const result = renderFigure(gpt2xlSpec);

    expect(result.svg).toContain('GPT-2 XL (1.5B)');
    expect(result.svg).toContain('>48<');
    expect(result.svg).toContain('50k');
    expect(result.svg).toContain('1,024');
    expect(result.svg).toContain('LayerNorm 1');
    expect(result.svg).toContain('LayerNorm 2');
    expect(result.svg).toContain('Final LayerNorm');
    expect(result.svg).not.toContain('RMSNorm');
    expect(sceneText(result)).toContain('Masked multi-head attention');
    expect(result.svg).toContain('Dropout');
    expect(result.svg).toContain('Positional embedding layer');
    expect(sceneText(result)).toContain('25 heads');
    expect(sceneText(result)).toContain('Learned absolute positions for');
    expect(result.svg).toContain('6,400');
    expect(result.svg).toContain('1,600');
    expect(result.svg).toContain('GELU activation');
    expect(result.svg).toContain('Every effort moves you');
    expect(result.svg).not.toContain('Sample input text');
    expect(result.scene.elements.find((element) => element.id === 'figure-title')).toMatchObject({
      kind: 'text',
      lines: [{ spans: [expect.objectContaining({ fill: '#000000' })] }],
    });
    expect(result.svg).not.toContain('QK-Norm');
    expect(result.svg).not.toContain('RoPE');
    expect(result.scene.elements.some((element) => element.id === 'positions-0')).toBe(true);
    expect(result.scene.elements.find((element) => element.id === 'leader-positions')).toMatchObject({
      kind: 'path',
      points: [{ x: 1290, y: 2130 }, { x: 1600, y: 1970 }],
    });
    expect(result.scene.elements.find((element) => element.id === 'leader-context')).toMatchObject({
      kind: 'path',
      points: [{ x: 160, y: 1845 }, { x: 465, y: 1624 }],
    });
    expect(result.scene.elements.find((element) => element.id === 'leader-ffn')).toMatchObject({
      kind: 'path',
      points: [{ x: 1200, y: 1006 }, { x: 1652, y: 876 }],
    });
    expect(result.scene.elements.find((element) => element.id === 'leader-embedding')).toMatchObject({
      kind: 'path',
      points: [{ x: 1290, y: 2288 }, { x: 1598, y: 2244 }],
    });
    expectInsetWithinCanvas(result);
    expectNoTextOverflow(result);
  });

  test('registers the edge figures and reports verified coverage', () => {
    const slugs = figureSpecs.map((entry) => entry.slug);
    for (const slug of ['domyn-edge-3-93b', 'granite-4-1-30b', 'gpt-2-xl-1-5b']) {
      expect(slugs).toContain(slug);
    }
    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
    for (const slug of ['domyn-edge-3-93b', 'granite-4-1-30b', 'gpt-2-xl-1-5b']) {
      expect(coverage).toContain(`| ${slug} | yes | yes | yes |`);
    }
  });
});
