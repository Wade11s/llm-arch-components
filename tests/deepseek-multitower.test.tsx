import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import { deepSeekV41FlashSpec, figureSpecs } from '../src/specs';

describe('DeepSeek-V4.1-Flash multi-tower figure', () => {
  test('renders encoder/decoder towers, CSA2 legend, Engram, candidate pool, MoE, and Single-Pass mHC', () => {
    const result = renderFigure(deepSeekV41FlashSpec);

    expect(result.svg).toContain('DeepSeek-V4.1-Flash (552B)');
    expect(result.svg).toContain('Text backbone shown');
    expect(result.svg).toContain('Causal encoder');
    expect(result.svg).toContain('Decoder');
    expect(result.svg).toContain('20 layers');
    expect(result.svg).toContain('Final encoder hidden states');
    expect(result.svg).toContain('Final pre-mix (4 to 1)');
    expect(result.svg).toContain('CSA2(2, Reuse)');
    expect(result.svg).toContain('CSA2(1, Reuse)');
    expect(result.svg).toContain('CSA2(1, Reindex)');
    expect(result.svg).toContain('CSA2(1, Full)');
    expect(result.svg).toContain('CSA2(2, Full)');
    expect(result.svg).toContain('Sliding window attention');
    expect(result.svg).toContain('SWA');
    expect(result.svg).toContain('Engram');
    expect(result.svg).toContain('196B parameters');
    expect(result.svg).toContain('CED');
    expect(result.svg).toContain('Global KV');
    expect(result.svg).toContain('Hierarchical sparse indexer');
    expect(result.svg).toContain('Candidate pool');
    expect(result.svg).toContain('Partial RoPE');
    expect(result.svg).toContain('YaRN context');
    expect(result.svg).toContain('1M tokens');
    expect(result.svg).toContain('64k pretraining');
    expect(result.svg).toContain('129k');
    expect(result.svg).toContain('5,120');
    expect(result.svg).toContain('MoE layer');
    expect(result.svg).toContain('384');
    expect(result.svg).toContain('552B backbone + 196B Engram');
    expect(result.svg).toContain('1 shared + 6 routed experts');
    expect(result.svg).toContain('8B');
    expect(result.svg).toContain('active for prefill');
    expect(result.svg).toContain('16B');
    expect(result.svg).toContain('active for decoding');
    expect(result.svg).toContain('Single-Pass mHC');
    expect(result.svg).toContain('mHC res');
    expect(result.svg).toContain('RMSNorm +');
    expect(result.svg).toContain('sublayer');
    expect(result.svg).toContain('mHC post');
    expect(result.svg).toContain('parallel residual streams');
    expect(result.scene.elements.some((element) => element.role === 'encoder-tower')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'decoder-tower')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'candidate-pool')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'hierarchical-indexer')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'engram')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'mhc-res')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'mhc-post')).toBe(true);
    expect(result.scene.elements.filter((element) => element.role === 'residual-stream')).toHaveLength(4);
    expect(result.scene.elements.some((element) => element.role === 'cross-tower-link')).toBe(true);
  });

  test('registers DeepSeek-V4.1 and updates generated coverage', () => {
    expect(figureSpecs.map((entry) => entry.slug)).toContain('deepseek-v4-1-flash');
    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
    expect(coverage).toContain('| deepseek-v4-1-flash | yes | yes | yes |');
  });
});
