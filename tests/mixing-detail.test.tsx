import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import { figureSpecs, kimiLinearSpec, qwen3NextSpec } from '../src/specs';

describe('mixing-detail pilot figures', () => {
  test('renders Qwen3-Next with Gated GQA, Gated DeltaNet, and 3:1 schedule', () => {
    const result = renderFigure(qwen3NextSpec);

    expect(result.svg).toContain('Qwen3-Next');
    expect(result.svg).toContain('(80B-A3B)');
    expect(result.svg).toContain('Gated grouped-query attention');
    expect(result.svg).toContain('Gated DeltaNet');
    expect(result.svg).toContain('Scaled dot-product attention');
    expect(result.svg).toContain('Gated Delta Rule');
    expect(result.svg).toContain('Q');
    expect(result.svg).toContain('K');
    expect(result.svg).toContain('V');
    expect(result.svg).toContain('L2 Norm');
    expect(result.svg).toContain('Conv');
    expect(result.svg).toContain('Sigmoid');
    expect(result.svg).toContain('SiLU');
    expect(result.svg).toContain('Gate');
    expect(result.svg).toContain('3:1 Ratio');
    expect(result.svg).toContain('Layer 4');
    expect(result.scene.elements.some((element) => element.role === 'mixing-attention-inset')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'mixing-delta-inset')).toBe(true);
    expect(result.scene.elements.filter((element) => element.role === 'mixing-lane').length).toBeGreaterThanOrEqual(3);
  });

  test('renders Kimi Linear with MLA, KDA, and monospaced layer split', () => {
    const result = renderFigure(kimiLinearSpec);

    expect(result.svg).toContain('Kimi Linear (48B-A3B)');
    expect(result.svg).toContain('Multi-head latent attention');
    expect(result.svg).toContain('Kimi Delta Attention');
    expect(result.svg).toContain('Output proj.');
    expect(result.svg).toContain('Q projection');
    expect(result.svg).toContain('KV down-proj.');
    expect(result.svg).toContain('Latent RMSNorm');
    expect(result.svg).toContain('L2 Norm');
    expect(result.svg).toContain('Conv');
    expect(result.svg).toContain('Sigmoid');
    expect(result.svg).toContain('Gate');
    expect(result.svg).toContain('20 KDA layers and 7 MLA layers');
    expect(result.svg).toContain('MLA layers 4, 8, 12, 16, 20, 24, 27');
    expect(result.scene.elements.some((element) => element.role === 'mixing-attention-inset')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'mixing-delta-inset')).toBe(true);
  });

  test('registers the mixing-detail batch and updates generated coverage', () => {
    const slugs = figureSpecs.map((entry) => entry.slug);
    expect(slugs).toContain('qwen3-next-80b-a3b');
    expect(slugs).toContain('kimi-linear-48b-a3b');

    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
    expect(coverage).toContain('| qwen3-next-80b-a3b | yes | yes | yes |');
    expect(coverage).toContain('| kimi-linear-48b-a3b | yes | yes | yes |');
  });
});
