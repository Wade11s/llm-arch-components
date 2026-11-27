import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import { figureSpecs, inkling2MiniSpec } from '../src/specs';

describe('Inkling 2 Mini recurrent-pass figure', () => {
  test('renders pass strip, loop cards, GQA schedule, and MoE/FFN insets', () => {
    const result = renderFigure(inkling2MiniSpec);

    expect(result.svg).toContain('Inkling 2 Mini (26.4B)');
    expect(result.svg).toContain('One token through the decoder');
    expect(result.svg).toContain('24 distinct layers');
    expect(result.svg).toContain('48 layer applications per token');
    expect(result.svg).toContain('Same 12 middle layers');
    expect(result.svg).toContain('Pass 1');
    expect(result.svg).toContain('Pass 2');
    expect(result.svg).toContain('Pass 3');
    expect(result.svg).toContain('6 layers before the loop');
    expect(result.svg).toContain('6 layers after the loop');
    expect(result.svg).toContain('Layers after the loop');
    expect(result.svg).toContain('Layers before the loop');
    expect(result.svg).toContain('12');
    expect(result.svg).toContain('per pass');
    expect(result.svg).toContain('Gated grouped-query');
    expect(result.svg).toContain('5 local layers');
    expect(result.svg).toContain('1 global layer');
    expect(result.svg).toContain('MoE layer');
    expect(result.svg).toContain('128');
    expect(result.svg).toContain('8 of 128');
    expect(result.svg).toContain('0 shared');
    expect(result.svg).toContain('26.4B');
    expect(result.svg).toContain('3.4B');
    expect(result.svg).toContain('5.4B');
    expect(result.svg).toContain('1M');
    expect(result.svg).toContain('2,304');
    expect(result.svg).toContain('1,152');
    expect(result.scene.elements.some((element) => element.role === 'repeat-block')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'ffn-inset')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'moe-inset')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'pass-strip')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'feedback-loop')).toBe(true);
  });

  test('registers Inkling and updates generated coverage', () => {
    expect(figureSpecs.map((entry) => entry.slug)).toContain('inkling-2-mini');
    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
    expect(coverage).toContain('| inkling-2-mini | yes | yes | yes |');
  });
});
