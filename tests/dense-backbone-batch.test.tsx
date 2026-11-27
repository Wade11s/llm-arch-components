import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import {
  figureSpecs,
  llama321bSpec,
  llama323bSpec,
  phi4Spec,
  qwen306bSpec,
  qwen34bSpec,
  qwen332bSpec,
} from '../src/specs';
import type { RenderedFigure } from '../src/core/types';

function sceneText(result: RenderedFigure): string {
  return result.scene.elements
    .flatMap((element) => element.kind === 'text' ? element.lines.flatMap((line) => line.spans.map((span) => span.text)) : [])
    .join(' ')
    .replace(/\s+/g, ' ');
}

function expectDenseFigure(result: RenderedFigure, expected: { title: string; layers: string; hidden: string; embedding: string; context: string; headsY: number }) {
  expect(result.svg).toContain(expected.title);
  expect(sceneText(result)).toContain(expected.layers);
  expect(result.svg).toContain(expected.hidden);
  expect(result.svg).toContain(expected.embedding);
  expect(result.svg).toContain(expected.context);
  expect(result.scene.elements.some((element) => element.role === 'repeat-block')).toBe(true);
  expect(result.scene.elements.find((element) => element.id === 'heads-0')).toMatchObject({
    kind: 'text',
    at: { y: expected.headsY },
  });
  expect(result.diagnostics.filter((diagnostic) => diagnostic.code === 'text-overflow')).toEqual([]);
}

describe('Llama / Qwen / Phi dense batch', () => {
  test('renders Llama 3.2 (1B)', () => {
    const result = renderFigure(llama321bSpec);
    expectDenseFigure(result, { title: 'Llama 3.2 (1B)', layers: '16', hidden: '8,192', embedding: '2,048', context: '128k', headsY: 1280 });
    expect(sceneText(result)).toContain('32 heads');
    expect(sceneText(result)).toContain('Masked grouped-query attention');
    expect(result.svg).toContain('Llama 3 RoPE');
    expect(result.svg).not.toContain('QK-Norm');
  });

  test('renders Llama 3.2 (3B)', () => {
    const result = renderFigure(llama323bSpec);
    expectDenseFigure(result, { title: 'Llama 3.2 (3B)', layers: '28', hidden: '8,192', embedding: '3,072', context: '128k', headsY: 1280 });
    expect(sceneText(result)).toContain('24 heads');
    expect(sceneText(result)).toContain('Masked grouped-query attention');
    expect(result.svg).not.toContain('QK-Norm');
  });

  test('renders Qwen3 (0.6B)', () => {
    const result = renderFigure(qwen306bSpec);
    expectDenseFigure(result, { title: 'Qwen3 (0.6B)', layers: '28', hidden: '3,072', embedding: '1,024', context: '32,768', headsY: 1280 });
    expect(sceneText(result)).toContain('16 heads');
    expect(sceneText(result)).toContain('Masked grouped-query attention');
    expect(result.svg).toContain('QK-Norm');
    expect(result.svg).not.toContain('YaRN');
  });

  test('renders Qwen3 (4B)', () => {
    const result = renderFigure(qwen34bSpec);
    expectDenseFigure(result, { title: 'Qwen3 (4B)', layers: '36', hidden: '9,728', embedding: '2,560', context: '128k', headsY: 1280 });
    expect(sceneText(result)).toContain('32 heads');
    expect(sceneText(result)).toContain('Masked grouped-query attention');
    expect(result.svg).toContain('QK-Norm');
    expect(result.svg).toContain('YaRN');
  });

  test('renders Qwen3 (32B)', () => {
    const result = renderFigure(qwen332bSpec);
    expectDenseFigure(result, { title: 'Qwen3 (32B)', layers: '64', hidden: '25,600', embedding: '5,120', context: '128k', headsY: 1905 });
    expect(sceneText(result)).toContain('64 attention heads');
    expect(sceneText(result)).toContain('8 key & value heads');
    expect(result.svg).toContain('Pre-RMSNorm');
    expect(result.svg).toContain('5×5,120 =');
  });

  test('renders Phi-4 (14B)', () => {
    const result = renderFigure(phi4Spec);
    expectDenseFigure(result, { title: 'Phi-4 (14B)', layers: '40', hidden: '17,920', embedding: '5,120', context: '16,384', headsY: 1905 });
    expect(sceneText(result)).toContain('40 attention heads');
    expect(sceneText(result)).toContain('10 key & value heads');
    expect(result.svg).toContain('100k');
    expect(result.svg).not.toContain('QK-Norm');
  });

  test('registers the six dense figures and reports 26 verified figures', () => {
    const slugs = figureSpecs.map((entry) => entry.slug);
    for (const slug of ['llama-3-2-1b', 'llama-3-2-3b', 'qwen3-0-6b', 'qwen3-4b', 'qwen3-32b', 'phi-4']) {
      expect(slugs).toContain(slug);
    }
    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain('| Verified rendering | 26 / 132 |');
    for (const slug of ['llama-3-2-1b', 'llama-3-2-3b', 'qwen3-0-6b', 'qwen3-4b', 'qwen3-32b', 'phi-4']) {
      expect(coverage).toContain(`| ${slug} | yes | yes | yes |`);
    }
  });
});
