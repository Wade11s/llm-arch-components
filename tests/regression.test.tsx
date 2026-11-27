import { describe, expect, test } from 'bun:test';
import { renderFigure, FigureValidationError } from '../src/core/renderFigure';
import { figureSpecs } from '../src/specs';
import { gptOss120bSpec } from '../src/specs/gptOss120b';
import type { FigureSpec } from '../src/core/types';

function duplicateIds(svg: string): string[] {
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  return ids.filter((id, index) => ids.indexOf(id) !== index);
}

describe('review regressions', () => {
  test('every spec-driven SVG has unique IDs', () => {
    for (const entry of figureSpecs) {
      const result = renderFigure(entry.spec, { idPrefix: `regression-${entry.slug}` });
      expect(duplicateIds(result.svg)).toEqual([]);
    }
  });

  test('typed node data drives heads, expert count, and active expert labels', () => {
    const spec = structuredClone(gptOss120bSpec);
    const attention = spec.nodes.find((node) => node.id === 'attention');
    const moe = spec.nodes.find((node) => node.id === 'moe');
    if (attention?.kind !== 'composite' || attention.data.family !== 'gqa') throw new Error('bad fixture');
    if (moe?.kind !== 'composite' || moe.data.family !== 'moe') throw new Error('bad fixture');
    attention.data.heads = 32;
    moe.data.experts = 64;
    moe.data.activeExperts = 2;
    const result = renderFigure(spec);
    expect(result.svg).toContain('32');
    expect(result.svg).toContain('64');
    const sceneText = result.scene.elements
      .flatMap((element) => element.kind === 'text' ? element.lines.flatMap((line) => line.spans.map((span) => span.text)) : [])
      .join(' ')
      .replace(/\s+/g, ' ');
    expect(sceneText).toContain('2 experts');
    expect(result.svg).not.toContain('128 heads');
    expect(result.svg).not.toContain('>128<');
  });

  test('manual overlap is returned as a non-fatal diagnostic', () => {
    const spec: FigureSpec = {
      schemaVersion: 1,
      id: 'overlap',
      title: 'Overlap',
      description: 'Two overlapping manual boxes.',
      canvas: { width: 500, height: 300 },
      theme: { accent: '#000', surface: '#ddd', ink: '#000', muted: '#666', background: '#fff', fontFamily: 'Arial' },
      groups: [{ id: 'model', kind: 'model', children: ['a', 'b'] }],
      nodes: [
        { id: 'a', kind: 'text', data: { spans: [{ text: 'A' }] } },
        { id: 'b', kind: 'text', data: { spans: [{ text: 'B' }] } },
      ],
      edges: [],
      annotations: [],
      layout: {
        mode: 'manual',
        placements: {
          a: { x: 40, y: 40, width: 160, height: 80 },
          b: { x: 80, y: 60, width: 160, height: 80 },
        },
      },
    };
    const result = renderFigure(spec);
    expect(result.diagnostics.some((diagnostic) => diagnostic.severity === 'warning' && diagnostic.code === 'overlap')).toBe(true);
  });

  test('unsupported template IDs fail during validation', () => {
    const spec = structuredClone(figureSpecs[0].spec);
    spec.layout = { mode: 'template', template: 'multi-stream-residual', slots: {} };
    expect(() => renderFigure(spec)).toThrow(FigureValidationError);
  });

  test('unsupported template variants fail during validation', () => {
    const spec = structuredClone(figureSpecs.find((entry) => entry.slug === 'qwen3-next-80b-a3b')!.spec);
    spec.layout = { mode: 'template', template: 'moe', variant: 'typo-variant' as never, slots: {} };
    expect(() => renderFigure(spec)).toThrow(FigureValidationError);
  });

  test('TextSpec maxWidth produces explicit wrapped lines', () => {
    const spec: FigureSpec = {
      schemaVersion: 1,
      id: 'wrap',
      title: 'Wrap',
      description: 'Long text should wrap.',
      canvas: { width: 500, height: 300 },
      theme: { accent: '#000', surface: '#ddd', ink: '#000', muted: '#666', background: '#fff', fontFamily: 'Arial' },
      groups: [{ id: 'model', kind: 'model', children: ['long'] }],
      nodes: [{ id: 'long', kind: 'text', data: { maxWidth: 120, spans: [{ text: 'A very long label that must wrap into multiple lines' }] } }],
      edges: [],
      annotations: [],
      layout: { mode: 'manual', placements: { long: { x: 40, y: 40, width: 160, height: 120 } } },
    };
    const result = renderFigure(spec);
    const text = result.scene.elements.find((element) => element.kind === 'text');
    expect(text?.kind).toBe('text');
    if (text?.kind === 'text') expect(text.lines.length).toBeGreaterThan(1);
  });
});
