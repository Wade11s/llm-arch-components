import { describe, expect, test } from 'bun:test';
import { FigureLayoutError } from '../src/core/errors';
import { systemTextMetrics } from '../src/core/metrics';
import { TemplateScene, templateText, requireSlot } from '../src/core/templates/templateScene';
import type { FigureSpec } from '../src/core/types';

const theme = { accent: '#000', surface: '#ddd', ink: '#000', muted: '#666', background: '#fff', fontFamily: 'Arial' };

function spec(): FigureSpec {
  return {
    schemaVersion: 1,
    id: 'template-scene-test',
    title: 'TemplateScene test',
    description: 'TemplateScene helper test',
    canvas: { width: 400, height: 300 },
    theme,
    groups: [{ id: 'model', kind: 'model', children: ['label'] }],
    nodes: [{ id: 'label', kind: 'text', data: templateText('Label') }],
    edges: [],
    annotations: [
      { id: 'context', target: 'model', placement: 'left', content: { bullets: [templateText('Context length'), templateText('32k')] } },
    ],
    layout: { mode: 'manual', placements: { label: { x: 0, y: 0, width: 100, height: 50 } } },
  };
}

describe('TemplateScene', () => {
  test('pill preserves unlabeled output by default', () => {
    const scene = new TemplateScene(theme, systemTextMetrics);
    scene.pill('label', 'test-pill', { x: 10, y: 10, width: 100, height: 50 }, templateText('Label'));
    const box = scene.scene(spec()).elements.find((element) => element.kind === 'box');
    expect(box?.label).toBeUndefined();
    expect(box?.sourceId).toBeUndefined();
  });

  test('callout renders annotation lines with stable ids', () => {
    const scene = new TemplateScene(theme, systemTextMetrics);
    const value = spec();
    scene.callout(value, 'context', { x: 20, y: 100 }, { size: 40, lineGap: 50 });
    const texts = scene.scene(value).elements.filter((element) => element.kind === 'text');
    expect(texts.map((element) => element.id)).toEqual(['context-0', 'context-1']);
  });

  test('requireSlot rejects a missing slot with a structured layout error', () => {
    const value = spec();
    expect(() => requireSlot(value, 'missing')).toThrow(FigureLayoutError);
  });
});
