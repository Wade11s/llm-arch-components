import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import { figureSpecs, llama3Spec, qwen3Spec } from '../src/specs';

describe('dense/GQA pilot figures', () => {
  test('renders Llama 3 (8B) from typed dense/GQA data', () => {
    const result = renderFigure(llama3Spec);

    expect(result.svg).toContain('Llama 3 (8B)');
    expect(result.svg).toContain('Vocabulary size of ');
    expect(result.svg).toContain('128k');
    expect(result.svg).toContain('8,192');
    expect(result.svg).toContain('32');
    expect(result.svg).toContain('14,336');
    expect(result.svg).toContain('4,096');
    expect(result.svg).toContain('Masked ');
    expect(result.svg).not.toContain('Maskedgrouped-query');
    expect(result.svg).toContain('grouped-query');
    expect(result.svg).toContain('SiLU activation');
    expect(result.svg).toContain('RMSNorm 1');
    expect(result.svg).not.toContain('sliding window');
    expect(result.svg).not.toContain('QK-Norm');
    expect(result.scene.elements.some((element) => element.role === 'repeat-block')).toBe(true);
    expect(result.scene.elements.filter((element) => element.role === 'residual-path')).toHaveLength(2);
  });

  test('renders Qwen3 (8B) with QK-Norm, YaRN context, and SwiGLU dimensions', () => {
    const result = renderFigure(qwen3Spec);

    expect(result.svg).toContain('Qwen3 (8B)');
    expect(result.svg).toContain('151k');
    expect(result.svg).toContain('36');
    expect(result.svg).toContain('attention heads');
    expect(result.svg).toContain('key &amp; value heads');
    expect(result.svg).toContain('QK-Norm');
    expect(result.svg).toContain('Pre-RMSNorm 1');
    expect(result.svg).toContain('Pre-RMSNorm 2');
    expect(result.svg).toContain('SiLU activation');
    expect(result.svg).toContain('size 3×4,096 = ');
    expect(result.svg).toContain('12,288');
    expect(result.svg).toContain('128k');
    expect(result.svg).toContain('with YaRN');
    expect(result.svg).not.toContain('sliding window');
    expect(result.scene.elements.some((element) => element.role === 'repeat-block')).toBe(true);
  });

  test('registers both dense/GQA figures for Gallery and CLI rendering', () => {
    const slugs = figureSpecs.map((entry) => entry.slug);
    expect(slugs).toContain('llama-3-8b');
    expect(slugs).toContain('qwen3-8b');
  });

  test('reports verified rendering coverage for the dense/GQA batch', () => {
    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
    expect(coverage).toContain('| llama-3-8b | yes | yes | yes |');
    expect(coverage).toContain('| qwen3-8b | yes | yes | yes |');
  });
});
