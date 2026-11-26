import { describe, expect, test } from 'bun:test';
import { renderFigure } from '../src/core/renderFigure';
import { deepSeekV3Spec } from '../src/specs/deepSeekV3';
import { gptOss120bSpec } from '../src/specs/gptOss120b';

describe('DeepSeek-V3 spec-driven figure', () => {
  test('reuses the MoE template with MLA, dense-first notes, and 256 experts', () => {
    const result = renderFigure(deepSeekV3Spec);
    expect(result.svg).toContain('DeepSeek-V3 (671B)');
    expect(result.svg).toContain('Multi-head');
    expect(result.svg).toContain('latent');
    expect(result.svg).toContain('61');
    expect(result.svg).toContain('128');
    expect(result.svg).toContain('256');
    expect(result.svg).toContain('18,432');
    expect(result.svg).toContain('37B');
    expect(result.scene.elements.some((element) => element.role === 'moe-inset')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'dense-first-note')).toBe(true);
  });

  test('shares the same public interface and deterministic output as GPT-OSS', () => {
    const deepSeek = renderFigure(deepSeekV3Spec);
    const gpt = renderFigure(gptOss120bSpec);
    expect(renderFigure(deepSeekV3Spec).svg).toBe(deepSeek.svg);
    expect(deepSeek.svg).not.toContain('<image');
    expect(gpt.svg).not.toContain('<image');
    expect(deepSeek.scene.schemaVersion).toBe(gpt.scene.schemaVersion);
  });
});
