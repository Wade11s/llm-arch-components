import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import { figureSpecs, lfm25Spec } from '../src/specs';

describe('LFM2.5 layer-group schedule figure', () => {
  test('renders nested layer groups, repeat gutter, MoE inset, and GQA head grid', () => {
    const result = renderFigure(lfm25Spec);

    expect(result.svg).toContain('LFM2.5 (8B-A1B)');
    expect(result.svg).toContain('128k');
    expect(result.svg).toContain('24');
    expect(result.svg).toContain('Layers');
    expect(result.svg).toContain('2×');
    expect(result.svg).toContain('4×');
    expect(result.svg).toContain('1×');
    expect(result.svg).toContain('LIV Convolution + MoE');
    expect(result.svg).toContain('Attention (GQA) + MoE');
    expect(result.svg).toContain('LIV Convolution + FFN');
    expect(result.svg).toContain('MoE layer');
    expect(result.svg).toContain('32');
    expect(result.svg).toContain('4 experts');
    expect(result.svg).toContain('active per token');
    expect(result.svg).toContain('GQA + QK-Norm');
    expect(result.svg).toContain('RMSNorm before RoPE');
    expect(result.svg).toContain('32 Q / 8 K/V heads');
    expect(result.svg).toContain('Head 1');
    expect(result.svg).toContain('Head 4');
    expect(result.svg).toContain('128,000');
    expect(result.svg).toContain('2048');
    expect(result.scene.elements.some((element) => element.role === 'repeat-block')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'moe-inset')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'gqa-head-grid')).toBe(true);
    expect(result.scene.elements.filter((element) => element.role === 'layer-group-box')).toHaveLength(3);
  });

  test('registers LFM2.5 and updates generated coverage', () => {
    expect(figureSpecs.map((entry) => entry.slug)).toContain('lfm2-5-8b-a1b');
    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
    expect(coverage).toContain('| lfm2-5-8b-a1b | yes | yes | yes |');
  });
});
