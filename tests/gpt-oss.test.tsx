import { describe, expect, test } from 'bun:test';
import { renderFigure } from '../src/core/renderFigure';
import { gptOss120bSpec } from '../src/specs/gptOss120b';

describe('GPT-OSS spec-driven figure', () => {
  test('renders FFN, MoE, badges, ellipsis, and resource annotations', () => {
    const result = renderFigure(gptOss120bSpec);
    expect(result.svg).toContain('gpt-oss (120B)');
    expect(result.svg).toContain('Feed forward (SwiGLU) module');
    expect(result.svg).toContain('MoE layer');
    expect(result.svg).toContain('128');
    const sceneText = result.scene.elements
      .flatMap((element) => element.kind === 'text' ? element.lines.flatMap((line) => line.spans.map((span) => span.text)) : [])
      .join(' ')
      .replace(/\s+/g, ' ');
    expect(sceneText).toContain('4 experts');
    expect(result.svg).toContain('5.1B');
    expect(result.svg).toContain('Resource savings:');
    expect(result.svg).toContain('•');
    expect(result.scene.elements.some((element) => element.role === 'moe-inset')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'resource-savings')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'badge')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'ellipsis')).toBe(true);
  });

  test('is deterministic and self-contained', () => {
    const first = renderFigure(gptOss120bSpec);
    const second = renderFigure(gptOss120bSpec);
    expect(first.svg).toBe(second.svg);
    expect(first.svg).not.toContain('<image');
    expect(first.svg).not.toContain('foreignObject');
    expect(first.svg).toContain('<text');
  });
});
