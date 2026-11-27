import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import type { Scene } from '../src/core/types';
import {
  deepSeekR1Spec,
  figureSpecs,
  glm47Spec,
  glm51Spec,
  minimaxM25Spec,
  mistralLarge3Spec,
  qwen3CoderFlashSpec,
} from '../src/specs';

function sceneText(scene: Scene): string {
  return scene.elements
    .flatMap((element) => element.kind === 'text' ? element.lines.map((line) => line.spans.map((span) => span.text).join('')) : [])
    .join('\n');
}

describe('standard MoE variants', () => {
  test('renders Qwen3-Coder-Flash (30B-A3B) with 256k native context', () => {
    const result = renderFigure(qwen3CoderFlashSpec);
    const text = sceneText(result.scene);

    expect(text).toContain('Qwen3-Coder-Flash (30B-A3B)');
    expect(text).toContain('Vocabulary size of 151k');
    expect(text).toContain('48');
    expect(text).toContain('256k native');
    expect(text).toContain('1M with YaRN');
    expect(text).toContain('128');
    expect(text).toContain('8 experts');
    expect(text).toContain('Model size is 30B');
    expect(text).toContain('3.3B');
    expect(text).toContain('768');
    expect(text).toContain('dimension of 2,048');
    expect(text).toContain('QK-Norm');
  });

  test('renders MiniMax-M2.5 (230B) with QK-Norm and 4.37% active parameters', () => {
    const result = renderFigure(minimaxM25Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('MiniMax-M2.5 (230B)');
    expect(text).toContain('Vocabulary size of 200k');
    expect(text).toContain('62');
    expect(text).toContain('256');
    expect(text).toContain('QK-Norm');
    expect(text).toContain('Partial RoPE');
    expect(text).toContain('Model size is 230B');
    expect(text).toContain('10B');
    expect(text).toContain('4.37%');
    expect(text).toContain('196,608 tokens');
    expect(text).toContain('1,536');
  });

  test('renders GLM-4.7 (355B) with dense-first blocks and 202,752-token context', () => {
    const result = renderFigure(glm47Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('GLM-4.7 (355B)');
    expect(text).toContain('92');
    expect(text).toContain('160');
    expect(text).toContain('202,752 tokens');
    expect(text).toContain('QK-Norm');
    expect(text).toContain('Partial RoPE');
    expect(text).toContain('First 3 blocks use');
    expect(text).toContain('hidden size 12,288');
    expect(text).toContain('8 experts + 1 shared');
    expect(text).toContain('expert active per token');
    expect(text).toContain('Model size is 355B');
    expect(text).toContain('32B');
    expect(result.scene.elements.some((element) => element.id === 'dense-first-leader')).toBe(true);
  });

  test('renders DeepSeek-R1 (671B) with MLA and 128 heads', () => {
    const result = renderFigure(deepSeekR1Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('DeepSeek-R1 (671B)');
    expect(text).toContain('Vocabulary size of 129k');
    expect(text).toContain('61');
    expect(text).toContain('Multi-head');
    expect(text).toContain('latent');
    expect(text).toContain('128 heads');
    expect(text).toContain('256');
    expect(text).toContain('1 (shared) + 8 experts');
    expect(text).toContain('Model size is 671B');
    expect(text).toContain('37B');
    expect(text).toContain('hidden size 18,432');
    expect(text).toContain('dimension of 7,168');
    expect(result.scene.elements.find((element) => element.id === 'badge-last-box')).toMatchObject({
      kind: 'box',
      fill: { kind: 'solid', color: '#FF3B30' },
    });
  });

  test('renders Mistral Large 3 (673B) with four active experts and 41B active parameters', () => {
    const result = renderFigure(mistralLarge3Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('Mistral Large 3 (673B)');
    expect(text).toContain('Vocabulary size of 131k');
    expect(text).toContain('256k tokens');
    expect(text).toContain('8k RoPE base');
    expect(text).toContain('Multi-head');
    expect(text).toContain('128 heads');
    expect(text).toContain('128');
    expect(text).toContain('1 (shared) + 4 experts');
    expect(text).toContain('Model size is 671B');
    expect(text).toContain('41B');
    expect(text).toContain('hidden size 16,384');
    expect(text).toContain('4,096');
  });

  test('renders GLM-5.1 (744B) with the existing MLA + DSA attention style', () => {
    const result = renderFigure(glm51Spec);
    const text = sceneText(result.scene);

    expect(text).toContain('GLM-5.1 (744B)');
    expect(text).toContain('Vocabulary size of 155k');
    expect(text).toContain('78');
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
    expect(result.scene.elements.filter((element) => element.role === 'attention-label')).toHaveLength(8);
  });

  test('keeps expert annotations inside the clear band between insets', () => {
    for (const spec of [qwen3CoderFlashSpec, minimaxM25Spec, glm47Spec, deepSeekR1Spec, mistralLarge3Spec, glm51Spec]) {
      const scene = renderFigure(spec).scene;
      const ffnInset = scene.elements.find((element) => element.id === 'ffn-inset');
      const moeInset = scene.elements.find((element) => element.id === 'moe-inset');
      const expertAnnotation = scene.elements.find((element) => element.id === 'expert-dimensions-0');

      expect(ffnInset?.kind === 'box' && expertAnnotation?.kind === 'text' && expertAnnotation.at.y > ffnInset.box.y + ffnInset.box.height).toBe(true);
      expect(moeInset?.kind === 'box' && expertAnnotation?.kind === 'text' && (expertAnnotation.lines.at(-1)?.baseline ?? Infinity) < moeInset.box.y).toBe(true);
    }
  });

  test('registers the six standard MoE variants and reports verified coverage', () => {
    const slugs = figureSpecs.map((entry) => entry.slug);
    expect(slugs).toContain('qwen3-coder-flash-30b-a3b');
    expect(slugs).toContain('minimax-m2-5-230b');
    expect(slugs).toContain('glm-4-7-355b');
    expect(slugs).toContain('deepseek-r1');
    expect(slugs).toContain('mistral-large-3');
    expect(slugs).toContain('glm-5-1');

    const coverage = readFileSync('docs/research/rendering-coverage.md', 'utf8');
    expect(coverage).toContain(`| Verified rendering | ${figureSpecs.length} / 132 |`);
  });
});
