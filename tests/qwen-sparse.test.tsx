import { describe, expect, test } from 'bun:test';
import { renderFigure } from '../src/core/renderFigure';
import { qwen38FlashNextSpec } from '../src/specs/qwen38FlashNext';
import type { RenderedFigure, SceneElement } from '../src/core/types';

function withRole(result: RenderedFigure, role: string): SceneElement[] {
  return result.scene.elements.filter((element) => element.role === role);
}

/** Concatenated text of every SVG text node, with markup removed. */
function plain(result: RenderedFigure): string {
  return result.svg.replace(/<[^>]*>/g, '');
}

function maskGrids(result: RenderedFigure): Array<Extract<SceneElement, { kind: 'grid' }>> {
  return result.scene.elements.filter(
    (element): element is Extract<SceneElement, { kind: 'grid' }> => element.kind === 'grid' && element.role === 'mask-grid',
  );
}

describe('Qwen3.8-Flash-Next (125B-A6B) spec-driven figure', () => {
  test('renders the 48x backbone with hybrid QSA / Gated DeltaNet attention and MoE', () => {
    const result = renderFigure(qwen38FlashNextSpec);
    const copy = plain(result);
    expect(copy).toContain('Qwen3.8-Flash-Next');
    expect(copy).toContain('(125B-A6B)');
    expect(copy).toContain('48');
    expect(copy).toContain('Gated DeltaNet or');
    expect(copy).toContain('Qwen Sparse Attention (QSA)');
    expect(copy).toContain('in 3:1 ratio');
    expect(copy).toContain('MoE');
    expect(copy).toContain('GR Read');
    expect(copy).toContain('GR Write');
    expect(copy).toContain('4× residual branches');

    expect(withRole(result, 'repeat-marker').map((element) => element.label)).toContain('48');
    expect(withRole(result, 'model-container')).toHaveLength(1);
    expect(withRole(result, 'repeat-block')).toHaveLength(1);
    expect(withRole(result, 'attention-block')).toHaveLength(1);
    expect(withRole(result, 'moe-block')).toHaveLength(1);
    expect(withRole(result, 'residual-path')).toHaveLength(1);
    expect(withRole(result, 'residual-junction')).toHaveLength(4);
    expect(withRole(result, 'gr-read-pill').length).toBeGreaterThanOrEqual(2);
    expect(withRole(result, 'gr-write-pill').length).toBeGreaterThanOrEqual(2);
  });

  test('renders a labeled 0/1 attention-mask matrix with block columns and highlights', () => {
    const result = renderFigure(qwen38FlashNextSpec);
    const grids = maskGrids(result);
    expect(grids).toHaveLength(9);

    const cells = grids.flatMap((grid) => grid.cells);
    expect(cells).toHaveLength(144);
    const ones = cells.filter((cell) => cell.text === '1');
    const zeros = cells.filter((cell) => cell.text === '0');
    expect(ones).toHaveLength(62);
    expect(zeros).toHaveLength(82);
    expect(cells.every((cell) => cell.text === '0' || cell.text === '1')).toBe(true);
    expect(cells.every((cell) => cell.fill?.kind === 'solid')).toBe(true);

    const fills = new Set(cells.map((cell) => (cell.fill?.kind === 'solid' ? cell.fill.color : '')));
    expect(fills.size).toBe(2);

    const blockLabels = withRole(result, 'mask-block-label').map((element) => element.label ?? '');
    expect(blockLabels).toEqual(['Block 1', 'Block 2', 'Block 3']);
    expect(withRole(result, 'mask-column-label')).toHaveLength(12);
    expect(withRole(result, 'mask-row-label')).toHaveLength(12);
    expect(withRole(result, 'mask-row-label').map((element) => element.label)).toContain('selectively');
    expect(withRole(result, 'mask-highlight')).toHaveLength(2);
    expect(withRole(result, 'mask-selection-arc')).toHaveLength(1);
    expect(withRole(result, 'mask-inset')).toHaveLength(1);
    expect(plain(result)).toContain('attends to every token');
  });

  test('renders the GR inset with read/write nodes and four residual branches', () => {
    const result = renderFigure(qwen38FlashNextSpec);
    expect(withRole(result, 'gr-inset')).toHaveLength(1);
    expect(withRole(result, 'gr-read-node')).toHaveLength(1);
    expect(withRole(result, 'gr-write-node')).toHaveLength(1);
    expect(withRole(result, 'gr-sublayer')).toHaveLength(1);
    expect(withRole(result, 'gr-branch')).toHaveLength(8);
    expect(withRole(result, 'gr-branch-dot')).toHaveLength(8);
    expect(withRole(result, 'gr-note')).toHaveLength(3);

    expect(plain(result)).toContain('GR (Gated Residual)');
    expect(plain(result)).toContain('with 4 parallel residual branches');
    expect(plain(result)).toContain('RMSNorm each branch');
    expect(plain(result)).toContain('attention or MoE');
    expect(plain(result)).toContain('one scalar gate');
    expect(plain(result)).toContain('R′ = R + s·y');
    expect(plain(result)).toContain('branch mixer as in mHC');
  });

  test('drives labels from typed node data and renders reference annotations', () => {
    const result = renderFigure(qwen38FlashNextSpec);
    const copy = plain(result);
    for (const text of [
      '248k',
      '512 experts:',
      '10 routed',
      '+ 1 shared active',
      '24 Q heads',
      '2 KV heads',
      '16 QK heads',
      '48 V heads',
      '256k native',
      '1M with YaRN',
      '2,560',
      'N-gram embedding',
    ]) {
      expect(copy).toContain(text);
    }
    expect(withRole(result, 'annotation-vocabulary').length).toBe(2);
    expect(withRole(result, 'annotation-moe-spec').length).toBe(3);
    expect(withRole(result, 'annotation-embedding').length).toBe(2);
  });

  test('is deterministic, self-contained, and keeps the reference aspect ratio', () => {
    const first = renderFigure(qwen38FlashNextSpec);
    const second = renderFigure(qwen38FlashNextSpec);
    expect(first.svg).toBe(second.svg);
    expect(first.scene.canvas).toEqual({ width: 4078, height: 3391 });
    expect(first.scene.canvas.width / first.scene.canvas.height).toBeCloseTo(4078 / 3391, 6);
    expect(first.svg).not.toContain('<image');
    expect(first.svg).not.toContain('foreignObject');
    expect(first.svg).not.toContain('xlink:href');
    expect(first.svg).not.toContain('<script');
    expect(first.svg).toContain('<text');
    expect(first.svg).toContain('<rect');
  });
});
