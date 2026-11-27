import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import { figureSpecs, motif3BetaSpec } from '../src/specs';

describe('Motif-3-Beta multi-stream residual figure', () => {
  test('renders 4 residual streams, mHC mixers, MoE, PolyNorm FFN, and mHC detail', () => {
    const result = renderFigure(motif3BetaSpec);

    expect(result.svg).toContain('Motif-3-Beta (314B-A13B)');
    expect(result.svg).toContain('53');
    expect(result.svg).toContain('mHC mixer');
    expect(result.svg).toContain('Grouped Differential');
    expect(result.svg).toContain('GDLA');
    expect(result.svg).toContain('39 sliding-window + 14 full-attention layers');
    expect(result.svg).toContain('parallel residual streams');
    expect(result.svg).toContain('manifold-constrained hyper-connections');
    expect(result.svg).toContain('MoE layer');
    expect(result.svg).toContain('384');
    expect(result.svg).toContain('1 (shared) + 8 routed');
    expect(result.svg).toContain('314B');
    expect(result.svg).toContain('13B');
    expect(result.svg).toContain('PolyNorm');
    expect(result.svg).toContain('1,280');
    expect(result.svg).toContain('220k');
    expect(result.svg).toContain('80 Q heads');
    expect(result.svg).toContain('16 KV heads');
    expect(result.svg).toContain('16 noise heads');
    expect(result.svg).toContain('256k');
    expect(result.svg).toContain('4k');
    expect(result.svg).toContain('First 2 blocks use');
    expect(result.svg).toContain('dense FFNs');
    expect(result.svg).toContain('4,096');
    expect(result.scene.elements.filter((element) => element.role === 'residual-stream')).toHaveLength(4);
    expect(result.scene.elements.filter((element) => element.role === 'mhc-mixer').length).toBeGreaterThanOrEqual(4);
    expect(result.scene.elements.some((element) => element.role === 'mhc-read')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'mhc-write')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'moe-inset')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'ffn-inset')).toBe(true);
  });

  test('registers Motif and updates generated coverage', () => {
    expect(figureSpecs.map((entry) => entry.slug)).toContain('motif-3-beta');
    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
    expect(coverage).toContain('| motif-3-beta | yes | yes | yes |');
  });
});
