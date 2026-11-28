import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import type { Scene } from '../src/core/types';
import {
  figureSpecs,
  gemma4E2bSpec,
  gemma4E4bSpec,
  kimiK2Spec,
  nanbeige42Spec,
  olmo3Spec,
  smollm3Spec,
} from '../src/specs';

function sceneText(scene: Scene): string {
  return scene.elements
    .flatMap((element) => element.kind === 'text' ? element.lines.map((line) => line.spans.map((span) => span.text).join('')) : [])
    .join('\n');
}

describe('structure-expansion batch', () => {
  test('renders Gemma 4 E2B with Per-Layer Embeddings and 4:1 local/global attention', () => {
    const result = renderFigure(gemma4E2bSpec);
    const text = sceneText(result.scene);

    expect(text).toContain('Gemma 4 E2B');
    expect(text).toContain('Per-Layer Embeddings');
    expect(text).toContain('4:1 (local:global)');
    expect(text).toContain('Partial RoPE (global)');
    expect(text).toContain('Full RoPE (local)');
    expect(text).toContain('Post-RMSNorm 1');
    expect(text).toContain('Layers 1–15 use FFN width 6,144');
    expect(text).toContain('Layers 16–35 use FFN width 12,288');
    expect(text).toContain('8 attention heads');
    expect(text).toContain('1 key & value heads');
    expect(text).toContain('35');
    const perLayerIndex = result.scene.elements.findIndex((element) => element.id === 'per-layer-embeddings-box');
    const outputFlowIndex = result.scene.elements.findIndex((element) => element.id === 'flow-output');
    expect(perLayerIndex).toBeGreaterThan(outputFlowIndex);
    expect(result.scene.elements.some((element) => element.id === 'per-layer-embeddings-box')).toBe(true);
  });

  test('renders Gemma 4 E4B with Per-Layer Embeddings and 5:1 local/global attention', () => {
    const result = renderFigure(gemma4E4bSpec);
    const text = sceneText(result.scene);

    expect(text).toContain('Gemma 4 E4B');
    expect(text).toContain('Per-Layer Embeddings');
    expect(text).toContain('5:1 (local:global)');
    expect(text).toContain('Input dim.: 2,560');
    expect(text).toContain('Intermediate dim.: 10,240');
    expect(text).toContain('2 key & value heads');
    expect(text).toContain('42');
    expect(result.scene.elements.some((element) => element.id === 'per-layer-embeddings-box')).toBe(true);
  });

  test('renders SmolLM3 (3B) with NoPE plus RoPE and a masked GQA label', () => {
    const result = renderFigure(smollm3Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('SmolLM3 (3B)');
    expect(text).toContain('NoPE every');
    expect(text).toContain('4th layer');
    expect(text).toContain('NoPE');
    expect(text).toContain('+');
    expect(text).toContain('RoPE');
    expect(text).toContain('Masked grouped-query');
    expect(text).toContain('attention');
    expect(text).toContain('16 heads');
    expect(text).toContain('dimension of 11,008');
    expect(text).toContain('128k');
    expect(result.scene.elements.some((element) => element.id === 'nope-box')).toBe(true);
    expect(result.scene.elements.find((element) => element.id === 'leader-nope')).toMatchObject({
      kind: 'path',
      points: [{ x: 250, y: 960 }, { x: 260, y: 1535 }],
    });
    expect(result.scene.elements.find((element) => element.id === 'leader-context')).toMatchObject({
      kind: 'path',
      points: [{ x: 320, y: 1845 }, { x: 740, y: 1624 }],
    });
  });

  test('renders Olmo 3 (7B) with sliding-window MHA and a window-size callout', () => {
    const result = renderFigure(olmo3Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('Olmo 3 (7B)');
    expect(text).toContain('3:1 (local:global) sliding');
    expect(text).toContain('window multi-head');
    expect(text).toContain('attention');
    expect(text).toContain('Sliding');
    expect(text).toContain('window size');
    expect(text).toContain('4,096');
    expect(text).toContain('RoPE + YaRN');
    expect(text).toContain('Post-RMSNorm 1');
    expect(text).toContain('32 attention heads');
    expect(text).toContain('32 key & value heads');
    expect(text).toContain('(regular multi-head attention)');
    expect(result.scene.elements.some((element) => element.id === 'leader-window-size')).toBe(true);
    expect(result.scene.elements.find((element) => element.id === 'leader-hidden')).toMatchObject({
      kind: 'path',
      points: [{ x: 1600, y: 1184 }, { x: 1600, y: 1388 }],
    });
  });

  test('renders Nanbeige4.2 (3B) with repeat-once weight sharing and distinct/total layer note', () => {
    const result = renderFigure(nanbeige42Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('Nanbeige4.2 (3B)');
    expect(text).toContain('Repeat once with same');
    expect(text).toContain('22-layer weights');
    expect(text).toContain('22× distinct layers;');
    expect(text).toContain('44× total layers');
    expect(text).toContain('48 Q heads, 8 KV heads (group size 6)');
    expect(text).toContain('head dim 128');
    expect(text).toContain('size of 10,752');
    expect(text).toContain('22');
    expect(result.scene.elements.some((element) => element.id === 'repeat-loop')).toBe(true);
    expect(result.scene.elements.some((element) => element.id === 'repeat-loop-label-box')).toBe(true);
  });

  test('renders Kimi K2 (1T) with MLA, 384 experts, and one dense-first block', () => {
    const result = renderFigure(kimiK2Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('Kimi K2 (1T)');
    expect(text).toContain('Vocabulary size of 160k');
    expect(text).toContain('61');
    expect(text).toContain('Multi-head');
    expect(text).toContain('latent');
    expect(text).toContain('64 heads');
    expect(text).toContain('384');
    expect(text).toContain('1 (shared) + 8 experts');
    expect(text).toContain('First 1 block uses');
    expect(text).toContain('hidden size 18,432');
    expect(text).toContain('Model size is 1T');
    expect(text).toContain('32B');
    expect(text).toContain('dimension of 7,168');
  });

  test('keeps all structure-expansion text within canvas and without diagnostics', () => {
    for (const spec of [gemma4E2bSpec, gemma4E4bSpec, smollm3Spec, olmo3Spec, nanbeige42Spec, kimiK2Spec]) {
      const result = renderFigure(spec);
      expect(result.diagnostics).toEqual([]);
      for (const element of result.scene.elements) {
        if (element.kind !== 'text') continue;
        for (const line of element.lines) {
          expect(line.baseline).toBeLessThanOrEqual(result.scene.canvas.height - 5);
          for (const span of line.spans) {
            expect(span.x).toBeGreaterThanOrEqual(0);
            expect(span.x + span.width).toBeLessThanOrEqual(result.scene.canvas.width + 1);
          }
        }
      }
    }
  });

  test('registers the structure-expansion batch and reports verified coverage', () => {
    const slugs = figureSpecs.map((entry) => entry.slug);
    expect(slugs).toContain('gemma-4-e2b');
    expect(slugs).toContain('gemma-4-e4b');
    expect(slugs).toContain('smollm3-3b');
    expect(slugs).toContain('olmo-3-7b');
    expect(slugs).toContain('nanbeige-4-2-3b');
    expect(slugs).toContain('kimi-k2');

    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
  });
});
