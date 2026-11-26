import { describe, expect, test } from 'bun:test';
import { renderFigure, FigureValidationError } from '../src/core/renderFigure';
import type { FigureSpec } from '../src/core/types';
import { gemma3Spec } from '../src/specs/gemma3';

const text = (value: string) => ({ spans: [{ text: value }] });

function gemmaSpec(): FigureSpec {
  return {
    schemaVersion: 1,
    id: 'gemma-3-27b',
    title: 'Gemma 3 (27B)',
    description: 'Gemma 3 architecture with 62 repeated residual blocks and a feed-forward inset.',
    canvas: { width: 2593, height: 2686 },
    theme: {
      accent: '#F27200',
      surface: '#D5D5D5',
      ink: '#000000',
      muted: '#666666',
      background: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
    },
    groups: [
      { id: 'model', kind: 'model', children: ['backbone', 'ffn-inset'] },
      { id: 'backbone', kind: 'repeat-block', parent: 'model', repeat: { count: 62 }, children: ['attention', 'ffn'] },
      { id: 'ffn-inset', kind: 'inset', parent: 'model', title: text('Feed forward (GELU) module'), children: ['ffn'] },
    ],
    nodes: [
      { id: 'attention', kind: 'composite', data: { family: 'gqa', heads: 32, kvHeads: 16, ratio: '5:1' } },
      { id: 'ffn', kind: 'composite', data: { family: 'ffn', hidden: 21504, activation: 'GELU' } },
    ],
    edges: [
      { id: 'residual-attention', kind: 'residual', from: { node: 'attention' }, to: { node: 'attention', side: 'top' }, junction: 'plus' },
      { id: 'residual-ffn', kind: 'residual', from: { node: 'ffn' }, to: { node: 'ffn', side: 'top' }, junction: 'plus' },
    ],
    annotations: [
      { id: 'heads', target: 'attention', placement: 'right', content: text('32 attention heads') },
    ],
    layout: { mode: 'template', template: 'backbone', slots: { block: 'backbone', inset: 'ffn-inset' } },
  };
}

describe('renderFigure', () => {
  test('renders a deterministic, serializable Gemma figure with real SVG text', () => {
    const result = renderFigure(gemmaSpec());
    const second = renderFigure(gemmaSpec());
    expect(result.svg).toBe(second.svg);
    expect(JSON.stringify(result.scene)).toBe(JSON.stringify(second.scene));
    expect(result.svg).toContain('Gemma 3 (27B)');
    expect(result.svg).toContain('<text');
    expect(result.svg).not.toContain('<image');
    expect(result.svg).not.toContain('foreignObject');
    expect(result.scene.elements.some((element) => element.role === 'repeat-block')).toBe(true);
    expect(result.scene.elements.filter((element) => element.role === 'residual-path')).toHaveLength(2);
    expect(result.scene.elements.some((element) => element.role === 'ffn-inset')).toBe(true);
  });

  test('renders the full Gemma reference Spec with its measured annotations', () => {
    const result = renderFigure(gemma3Spec);
    expect(result.svg).toContain('Vocabulary size of ');
    expect(result.svg).toContain('262k');
    expect(result.svg).toContain('21,504');
    expect(result.svg).toContain('62');
    expect(result.scene.elements.some((element) => element.role === 'ffn-inset')).toBe(true);
  });

  test('rejects duplicate IDs with a structured path-aware error', () => {
    const spec = gemmaSpec();
    spec.nodes.push(spec.nodes[0]);
    try {
      renderFigure(spec);
      throw new Error('expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(FigureValidationError);
      expect((error as FigureValidationError).issues.some((issue) => issue.code === 'duplicate-id')).toBe(true);
    }
  });

  test('rejects dangling edge references', () => {
    const spec = gemmaSpec();
    spec.edges[0].to.node = 'missing-node';
    expect(() => renderFigure(spec)).toThrow(FigureValidationError);
  });

  test('rejects missing description and unknown fields', () => {
    const missingDescription = { ...gemmaSpec(), description: undefined };
    expect(() => renderFigure(missingDescription as unknown as FigureSpec)).toThrow(FigureValidationError);

    const unknownField = { ...gemmaSpec(), unexpected: true };
    expect(() => renderFigure(unknownField as unknown as FigureSpec)).toThrow(FigureValidationError);
  });

  test('supports validated manual placement through the same interface', () => {
    const spec: FigureSpec = {
      ...gemmaSpec(),
      id: 'manual-test',
      groups: [{ id: 'model', kind: 'model', children: ['label'] }],
      nodes: [{ id: 'label', kind: 'text', data: text('Hello') }],
      edges: [],
      annotations: [],
      layout: { mode: 'manual', placements: { label: { x: 40, y: 60, width: 160, height: 60 } } },
    };
    const result = renderFigure(spec);
    expect(result.scene.elements.some((element) => element.kind === 'box' && element.box.x === 40 && element.box.y === 60)).toBe(true);
    expect(result.svg).toContain('Hello');
  });
});
