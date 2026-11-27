import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import { figureSpecs, minimaxM2Spec, qwen3MoeSpec } from '../src/specs';

describe('MoE pilot figures', () => {
  test('renders Qwen3 (30B-A3B) with QK-Norm, 128 experts, and 8 active experts', () => {
    const result = renderFigure(qwen3MoeSpec);

    expect(result.svg).toContain('Qwen3 (30B-A3B)');
    expect(result.svg).toContain('151k');
    expect(result.svg).toContain('48');
    expect(result.svg).toContain('128');
    expect(result.svg).toContain('8 experts');
    expect(result.svg).toContain('30B');
    expect(result.svg).toContain('3B');
    expect(result.svg).toContain('768');
    expect(result.svg).toContain('2,048');
    expect(result.svg).toContain('QK-Norm');
    expect(result.svg).toContain('RoPE');
    expect(result.svg).toContain('Intermediate hidden');
    expect(result.svg).toContain('Resource savings');
    expect(result.scene.elements.some((element) => element.role === 'moe-inset')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'ffn-inset')).toBe(true);
  });

  test('renders MiniMax-M2 (230B) with Partial RoPE, 256 experts, and resource annotations', () => {
    const result = renderFigure(minimaxM2Spec);

    expect(result.svg).toContain('MiniMax-M2 (230B)');
    expect(result.svg).toContain('200,064');
    expect(result.svg).toContain('62');
    expect(result.svg).toContain('256');
    expect(result.svg).toContain('experts');
    expect(result.svg).toContain('229B');
    expect(result.svg).toContain('10B');
    expect(result.svg).toContain('4.37%');
    expect(result.svg).toContain('Partial RoPE');
    expect(result.svg).toContain('QK-Norm');
    expect(result.svg).toContain('3,072');
    expect(result.svg).toContain('1,536');
    expect(result.scene.elements.some((element) => element.role === 'moe-inset')).toBe(true);
  });

  test('registers the MoE pilot and updates generated coverage', () => {
    const slugs = figureSpecs.map((entry) => entry.slug);
    expect(slugs).toContain('qwen3-30b-a3b');
    expect(slugs).toContain('minimax-m2-230b');

    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
    expect(coverage).toContain('| qwen3-30b-a3b | yes | yes | yes |');
    expect(coverage).toContain('| minimax-m2-230b | yes | yes | yes |');
  });
});
