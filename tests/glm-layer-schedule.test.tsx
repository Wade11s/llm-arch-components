import { describe, expect, test } from 'bun:test';
import { renderFigure } from '../src/core/renderFigure';
import type { Scene, SceneElement } from '../src/core/types';
import { glm54Spec } from '../src/specs/glm54';

function roles(scene: Scene): string[] {
  return scene.elements.map((element) => element.role);
}

function sceneText(scene: Scene): string {
  return scene.elements
    .filter((element) => element.kind === 'text')
    .map((element) => element.lines.map((line) => line.spans.map((span) => span.text).join('')).join('\n'))
    .join('\n');
}

function findPath(scene: Scene, role: string): Extract<SceneElement, { kind: 'path' }> {
  const element = scene.elements.find((candidate) => candidate.role === role);
  if (!element || element.kind !== 'path') throw new Error(`expected a path with role "${role}"`);
  return element;
}

describe('GLM-5.4 layer-schedule figure', () => {
  test('renders the decoder loop, layer cards, and layer arithmetic', () => {
    const { scene, svg } = renderFigure(glm54Spec);

    expect(svg).toContain('GLM-5.4 (~750B)');
    expect(svg).toContain('One token through the decoder');
    expect(svg).toContain('Same 28 middle layers');
    expect(svg).toContain('Layers before the loop');
    expect(svg).toContain('Layers 1–26 run once');
    expect(svg).toContain('Layers after the loop');
    expect(svg).toContain('Layers 55–78 run once');
    expect(sceneText(scene)).toContain('78 distinct layers');
    expect(sceneText(scene)).toContain('106 layer applications');

    expect(roles(scene)).toContain('middle-layers-block');
    expect(scene.elements.some((element) => element.role === 'middle-layer-count' && element.label === '28')).toBe(true);
    expect(scene.elements.filter((element) => element.role === 'loop-layer-card')).toHaveLength(2);
    expect(scene.elements.filter((element) => element.role === 'loop-layer-stack')).toHaveLength(2);
    expect(scene.elements.filter((element) => element.role === 'loop-pass')).toHaveLength(2);

    const middle = glm54Spec.groups.find((group) => group.id === 'middle-layers');
    expect(middle?.repeat?.count).toBe(28);
    expect(scene.elements.filter((element) => element.role === 'residual-path')).toHaveLength(2);
  });

  test('draws the thick blue feedback loop with recurrence semantics', () => {
    const { scene, svg } = renderFigure(glm54Spec);
    const feedback = findPath(scene, 'feedback-loop');

    expect(feedback.points.length).toBeGreaterThanOrEqual(3);
    expect(feedback.stroke.color).toBe(glm54Spec.theme.accent);
    expect(feedback.stroke.width).toBeGreaterThanOrEqual(12);
    expect(feedback.arrow).toBe('end');
    expect(glm54Spec.edges.some((edge) => edge.kind === 'feedback')).toBe(true);
    expect(svg).toContain('Run these 28 layers again');
  });

  test('renders the SwiGLU FFN and MoE insets with real operations', () => {
    const { scene, svg } = renderFigure(glm54Spec);

    expect(svg).toContain('Feed forward (SwiGLU) module');
    expect(svg).toContain('SiLU activation');
    expect(svg).toContain('MoE layer');
    expect(svg).toContain('Router');
    expect(svg).toContain('6,144');
    expect(svg).toContain('2,048');
    expect(svg).toContain('256');

    expect(roles(scene)).toContain('ffn-inset');
    expect(roles(scene)).toContain('moe-inset');
    expect(scene.elements.filter((element) => element.role === 'moe-expert')).toHaveLength(2);
    expect(scene.elements.filter((element) => element.role === 'moe-badge')).toHaveLength(2);
    expect(scene.elements.some((element) => element.role === 'moe-ellipsis')).toBe(true);
    expect(scene.elements.some((element) => element.role === 'ffn-operation')).toBe(true);
    expect(scene.elements.some((element) => element.kind === 'glyph' && element.glyph === 'multiply')).toBe(true);

    const moe = glm54Spec.nodes.find((node) => node.id === 'moe');
    expect(moe?.kind).toBe('composite');
    if (moe?.kind !== 'composite' || moe.data.family !== 'moe') throw new Error('expected typed MoE data');
    expect(moe.data).toEqual({ family: 'moe', experts: 256, activeExperts: 8, sharedExperts: 1 });

    const ffn = glm54Spec.nodes.find((node) => node.id === 'ffn');
    expect(ffn?.kind).toBe('composite');
    if (ffn?.kind !== 'composite' || ffn.data.family !== 'ffn') throw new Error('expected typed FFN data');
    expect(ffn.data).toEqual({ family: 'ffn', hidden: 2048, activation: 'SiLU' });
  });

  test('carries the reference facts and aspect ratio', () => {
    const { scene, svg } = renderFigure(glm54Spec);

    expect(glm54Spec.canvas).toEqual({ width: 3354, height: 2862 });
    expect(glm54Spec.canvas.width / glm54Spec.canvas.height).toBeCloseTo(3354 / 2862, 6);
    for (const fact of ['155k', '1M', '6,144', '2,048', '744B', '40B', '12,288', '8 of 256']) {
      expect(sceneText(scene)).toContain(fact);
    }
    expect(sceneText(scene)).toContain('1 shared expert');
    expect(svg).toContain('Context length');
    expect(svg).toContain('Embedding');
    expect(svg).toContain('Partial RoPE');
  });

  test('is deterministic, self-contained, and template-driven', () => {
    const first = renderFigure(glm54Spec);
    const second = renderFigure(glm54Spec);

    expect(first.svg).toBe(second.svg);
    expect(JSON.stringify(first.scene)).toBe(JSON.stringify(second.scene));
    expect(first.diagnostics).toEqual([]);
    expect(first.svg).not.toContain('<image');
    expect(first.svg).not.toContain('foreignObject');
    expect(first.svg).not.toContain('glm-5-4.webp');
    expect(first.svg).not.toContain('href=');

    expect(glm54Spec.layout.mode).toBe('template');
    if (glm54Spec.layout.mode !== 'template') throw new Error('expected template layout');
    expect(glm54Spec.layout.template).toBe('layer-schedule');
    expect(glm54Spec.layout.options).toBeUndefined();
  });
});
