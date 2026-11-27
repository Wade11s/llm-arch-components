import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import type { Scene } from '../src/core/types';
import {
  figureSpecs,
  glm45355bSpec,
  glm45AirSpec,
  glm5744bSpec,
  gptOss20bSpec,
  intellect3Spec,
  qwen3235bSpec,
} from '../src/specs';

function sceneText(scene: Scene): string {
  return scene.elements
    .flatMap((element) => element.kind === 'text' ? element.lines.map((line) => line.spans.map((span) => span.text).join('')) : [])
    .join('\n');
}

describe('second MoE family batch', () => {
  test('renders gpt-oss (20B) with 24 blocks and 32 experts', () => {
    const result = renderFigure(gptOss20bSpec);
    const text = sceneText(result.scene);

    expect(text).toContain('gpt-oss (20B)');
    expect(text).toContain('Vocabulary size of 200k');
    expect(text).toContain('24');
    expect(text).toContain('32');
    expect(text).toContain('4 experts');
    expect(text).toContain('Model size is 20B');
    expect(text).toContain('3.6B');
    expect(text).toContain('Input expert size: 2,880');
    expect(text).toContain('Intermediate projection size: 2,880');
    expect(text).toContain('64 heads');
    expect(text).toContain('Resource savings:');
  });

  test('renders Qwen3 (235B-A22B) without a heads annotation', () => {
    const result = renderFigure(qwen3235bSpec);
    const text = sceneText(result.scene);

    expect(text).toContain('Qwen3 (235B-A22B)');
    expect(text).toContain('94');
    expect(text).toContain('128');
    expect(text).toContain('8 experts');
    expect(text).toContain('Model size is 235B');
    expect(text).toContain('22B');
    expect(text).toContain('QK-Norm');
    expect(text).toContain('Intermediate hidden');
    expect(text).toContain('1,536');
    expect(text).not.toContain('64 heads');
    expect(result.scene.elements.some((element) => element.id === 'attention-leader')).toBe(false);
  });

  test('renders INTELLECT-3 with gray emphasis, black title, and a shared expert', () => {
    const result = renderFigure(intellect3Spec);
    const text = sceneText(result.scene);
    const title = result.scene.elements.find((element) => element.id === 'figure-title');
    const lastBadge = result.scene.elements.find((element) => element.id === 'badge-last-box');

    expect(text).toContain('INTELLECT-3 (106B)');
    expect(text).toContain('46');
    expect(text).toContain('128');
    expect(text).toContain('8 experts + 1 shared');
    expect(text).toContain('expert active per token');
    expect(text).toContain('First block uses');
    expect(text).toContain('hidden size 10,944');
    expect(text).toContain('Intermediate projection size:');
    expect(text).toContain('1,408');
    expect(title?.kind === 'text' && title.lines[0].spans[0].fill).toBe('#000000');
    expect(lastBadge?.kind === 'box' && lastBadge.fill.kind === 'solid' && lastBadge.fill.color).toBe('#000000');
    expect(result.scene.elements.some((element) => element.id === 'dense-first-leader')).toBe(true);
  });

  test('renders GLM-4.5-Air with Partial RoPE and shared-expert wording', () => {
    const result = renderFigure(glm45AirSpec);
    const text = sceneText(result.scene);

    expect(text).toContain('GLM-4.5-Air (106B)');
    expect(text).toContain('Native context');
    expect(text).toContain('128k tokens');
    expect(text).toContain('4k pretraining');
    expect(text).toContain('Partial RoPE');
    expect(text).toContain('8 experts + 1 shared');
    expect(text).toContain('expert active per token');
    expect(text).toContain('hidden size 10,944');
    expect(text).not.toContain('64 heads');
    expect(result.scene.elements.some((element) => element.id === 'dense-first-leader')).toBe(true);
  });

  test('renders GLM-4.5 (355B) with QK-Norm and 160 experts', () => {
    const result = renderFigure(glm45355bSpec);
    const text = sceneText(result.scene);

    expect(text).toContain('GLM-4.5 (355B)');
    expect(text).toContain('92');
    expect(text).toContain('160');
    expect(text).toContain('QK-Norm');
    expect(text).toContain('Partial RoPE');
    expect(text).toContain('8 experts + 1 shared');
    expect(text).toContain('expert active per token');
    expect(text).toContain('hidden size 12,288');
    expect(text).toContain('5,120');
    expect(text).toContain('1,536');
    expect(text).toContain('Model size is 355B');
    expect(text).toContain('32B');
  });

  test('renders GLM-5 (744B) with a five-line MLA + DSA attention box', () => {
    const result = renderFigure(glm5744bSpec);
    const text = sceneText(result.scene);
    const attentionBox = result.scene.elements.find((element) => element.id === 'attention-box');

    expect(text).toContain('GLM-5 (744B)');
    expect(text).toContain('Multi-head');
    expect(text).toContain('latent');
    expect(text).toContain('(MLA)');
    expect(text).toContain('DeepSeek');
    expect(text).toContain('Sparse');
    expect(text).toContain('Attention (DSA)');
    expect(text).toContain('256');
    expect(text).toContain('8 experts + 1 shared');
    expect(text).toContain('expert active per token');
    expect(text).toContain('Model size is 744B');
    expect(text).toContain('40B');
    expect(text).toContain('6,144');
    expect(text).toContain('2,048');
    expect(attentionBox?.kind === 'box' && attentionBox.box.height > 200).toBe(true);
    expect(result.scene.elements.filter((element) => element.role === 'attention-label')).toHaveLength(8);
  });

  test('registers the second MoE family and reports 35 verified figures', () => {
    const slugs = figureSpecs.map((entry) => entry.slug);
    expect(slugs).toContain('gpt-oss-20b');
    expect(slugs).toContain('qwen3-235b-a22b');
    expect(slugs).toContain('intellect-3');
    expect(slugs).toContain('glm-4-5-air');
    expect(slugs).toContain('glm-4-5-355b');
    expect(slugs).toContain('glm-5-744b');
    expect(figureSpecs).toHaveLength(35);

    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain('| Verified rendering | 35 / 132 |');
  });
});
