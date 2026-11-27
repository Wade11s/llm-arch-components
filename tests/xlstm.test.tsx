import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import { figureSpecs, xlstmSpec } from '../src/specs';

describe('xLSTM recurrent-detail figure', () => {
  test('renders xLSTM (7B) with residual block, FFN inset, and mLSTM detail', () => {
    const result = renderFigure(xlstmSpec);

    expect(result.svg).toContain('xLSTM (7B)');
    expect(result.svg).toContain('50k');
    expect(result.svg).toContain('32');
    expect(result.svg).toContain('xLSTM with matrix');
    expect(result.svg).toContain('mLSTM layer');
    expect(result.svg).toContain('Adapted and modified');
    expect(result.svg).toContain('from @maxmbeck');
    expect(result.svg).toContain('mLSTM');
    expect(result.svg).toContain('Q');
    expect(result.svg).toContain('K');
    expect(result.svg).toContain('V');
    expect(result.svg).toContain('f');
    expect(result.svg).toContain('i');
    expect(result.svg).toContain('σ');
    expect(result.svg).toContain('exp');
    expect(result.svg).toContain('Sigmoid');
    expect(result.svg).toContain('Gate');
    expect(result.svg).toContain('4,096');
    expect(result.svg).toContain('10,944');
    expect(result.svg).toContain('8k');
    expect(result.svg).toContain('No fixed limit');
    expect(result.scene.elements.some((element) => element.role === 'repeat-block')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'ffn-inset')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'mlstm-inset')).toBe(true);
    expect(result.scene.elements.filter((element) => element.role === 'recurrent-input')).toHaveLength(5);
  });

  test('registers xLSTM and updates generated coverage', () => {
    expect(figureSpecs.map((entry) => entry.slug)).toContain('xlstm-7b');
    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
    expect(coverage).toContain('| xlstm-7b | yes | yes | yes |');
  });
});
