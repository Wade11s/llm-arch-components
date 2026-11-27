import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import type { Scene } from '../src/core/types';
import {
  antares1bSpec,
  figureSpecs,
  mistralSmall31Spec,
  nanbeige41Spec,
  nanbeige43Spec,
  olmo2Spec,
  vibeThinker3bSpec,
} from '../src/specs';

function sceneText(scene: Scene): string {
  return scene.elements
    .flatMap((element) => element.kind === 'text' ? element.lines.map((line) => line.spans.map((span) => span.text).join('')) : [])
    .join('\n');
}

describe('simple dense family', () => {
  test('renders Antares-1B with Pre-RMSNorm and 16/4 heads', () => {
    const result = renderFigure(antares1bSpec);
    const text = sceneText(result.scene);

    expect(text).toContain('Antares-1B');
    expect(text).toContain('Vocabulary size of 100k');
    expect(text).toContain('40');
    expect(text).toContain('16 Q heads');
    expect(text).toContain('4 KV heads');
    expect(text).toContain('Pre-RMSNorm 1');
    expect(text).toContain('Pre-RMSNorm 2');
    expect(text).toContain('Feed forward (SwiGLU) module');
    expect(text).toContain('Input size: 2,048');
    expect(text).toContain('4,096');
    expect(text).toContain('131,072 tokens');
    expect(text).toContain('RoPE');
  });

  test('renders VibeThinker-3B with the GQA suffix and 64k training context', () => {
    const result = renderFigure(vibeThinker3bSpec);
    const text = sceneText(result.scene);

    expect(text).toContain('VibeThinker-3B');
    expect(text).toContain('36');
    expect(text).toContain('64k training');
    expect(text).toContain('128k in config');
    expect(text).toContain('16 heads,');
    expect(text).toContain('2 KV heads');
    expect(text).toContain('(GQA)');
    expect(text).toContain('Intermediate projection size: 11,008');
    expect(text).toContain('dimension of 2,048');
  });

  test('renders Nanbeige4.1 (3B) with grouped head dimensions', () => {
    const result = renderFigure(nanbeige41Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('Nanbeige4.1 (3B)');
    expect(text).toContain('Vocabulary size of 166k');
    expect(text).toContain('32');
    expect(text).toContain('20 Q heads, 4 KV heads (group size 5)');
    expect(text).toContain('head dim 128');
    expect(text).toContain('Intermediate projection');
    expect(text).toContain('size of 10,496');
    expect(text).toContain('262,144 tokens');
    expect(text).toContain('dimension of 2,560');
  });

  test('renders Nanbeige4.3 (33B) with 52 blocks and 56/8 heads', () => {
    const result = renderFigure(nanbeige43Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('Nanbeige4.3 (33B)');
    expect(text).toContain('Vocabulary size of 167k');
    expect(text).toContain('52');
    expect(text).toContain('56 Q heads, 8 KV heads (group size 7)');
    expect(text).toContain('head dim 128');
    expect(text).toContain('size of 22,016');
    expect(text).toContain('524,288 tokens');
    expect(text).toContain('dimension of 7,168');
  });

  test('renders Mistral Small 3.1 (24B) with accent attention and norm strokes', () => {
    const result = renderFigure(mistralSmall31Spec);
    const text = sceneText(result.scene);
    const attentionFirstLine = result.scene.elements.find((element) => element.id === 'attention-line-1');

    expect(text).toContain('Mistral Small 3.1 (24B)');
    expect(text).toContain('40');
    expect(text).toContain('Pre-RMSNorm 1');
    expect(text).toContain('32 attention heads');
    expect(text).toContain('8 key & value heads');
    expect(text).toContain('Hidden layer');
    expect(text).toContain('dimension of 32,768');
    expect(text).toContain('131,072 tokens');
    expect(attentionFirstLine?.kind === 'text' && attentionFirstLine.lines[0].spans[0].fill).toBe('#FF644E');
  });

  test('renders OLMo 2 (7B) with post-norm and regular multi-head attention', () => {
    const result = renderFigure(olmo2Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('OLMo 2 (7B)');
    expect(text).toContain('32');
    expect(text).toContain('Post-RMSNorm 1');
    expect(text).toContain('Post-RMSNorm 2');
    expect(text).toContain('QK-Norm');
    expect(text).toContain('Multi-head attention');
    expect(text).not.toContain('Pre-RMSNorm');
    expect(text).toContain('32 attention heads');
    expect(text).toContain('32 key & value heads');
    expect(text).toContain('(regular multi-head attention)');
    expect(text).toContain('Input size: 4,096');
    expect(text).toContain('size = 11,008');
    expect(text).toContain('4,096 tokens');
  });

  test('keeps all text within canvas and produces no diagnostics', () => {
    for (const spec of [antares1bSpec, vibeThinker3bSpec, nanbeige41Spec, nanbeige43Spec, mistralSmall31Spec, olmo2Spec]) {
      const result = renderFigure(spec);
      expect(result.diagnostics).toEqual([]);
      for (const element of result.scene.elements) {
        if (element.kind !== 'text') continue;
        for (const line of element.lines) {
          expect(line.baseline).toBeLessThanOrEqual(result.scene.canvas.height);
          for (const span of line.spans) {
            expect(span.x).toBeGreaterThanOrEqual(0);
            expect(span.x + span.width).toBeLessThanOrEqual(result.scene.canvas.width + 1);
          }
        }
      }
    }
  });

  test('registers the simple dense batch and reports verified coverage', () => {
    const slugs = figureSpecs.map((entry) => entry.slug);
    expect(slugs).toContain('antares-1b');
    expect(slugs).toContain('vibethinker-3b');
    expect(slugs).toContain('nanbeige-4-1-3b');
    expect(slugs).toContain('nanbeige-4-3-33b');
    expect(slugs).toContain('mistral-small-3-1-24b');
    expect(slugs).toContain('olmo-2-7b');

    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
  });
});
