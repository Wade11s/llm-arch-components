import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderFigure } from '../src/core/renderFigure';
import { tencentHy4Layout } from '../src/core/templates/tencentHy4';
import { tencentHy4Spec } from '../src/specs/tencentHy4';
import type { FigureSpec, RenderedFigure, SceneElement } from '../src/core/types';

type OperationNode = Extract<FigureSpec['nodes'][number], { kind: 'operation' | 'composite' }>;

function render(spec: FigureSpec = tencentHy4Spec): RenderedFigure {
  return renderFigure(spec, { layout: tencentHy4Layout });
}

function withRole(result: RenderedFigure, role: string): SceneElement[] {
  return result.scene.elements.filter((element) => element.role === role);
}

function plain(result: RenderedFigure): string {
  return result.svg.replace(/<[^>]*>/g, '').replace(/\u00A0/g, ' ');
}

function maskGrids(result: RenderedFigure): Array<Extract<SceneElement, { kind: 'grid' }>> {
  return result.scene.elements.filter(
    (element): element is Extract<SceneElement, { kind: 'grid' }> => element.kind === 'grid' && element.role === 'mask-grid',
  );
}

function maskNode(spec: FigureSpec): Extract<FigureSpec['nodes'][number], { kind: 'mask' }> {
  const node = spec.nodes.find((candidate) => candidate.kind === 'mask');
  if (node?.kind !== 'mask') throw new Error('mask fixture missing');
  return node;
}

function operation(spec: FigureSpec, family: 'mla' | 'moe' | 'ffn' | 'gated-residual', operationName?: 'read' | 'write'): OperationNode {
  const node = spec.nodes.find((candidate) => {
    if (candidate.kind !== 'operation' && candidate.kind !== 'composite') return false;
    if (candidate.data.family !== family) return false;
    if (candidate.data.family === 'gated-residual' && operationName) return candidate.data.operation === operationName;
    return true;
  });
  if (!node || (node.kind !== 'operation' && node.kind !== 'composite')) throw new Error(`${family} fixture missing`);
  return node;
}

describe('Tencent Hy4 (770B-A49B) attention-mask / iHC figure', () => {
  test('reuses the public attention-mask TemplateId with the typed iHC variant', () => {
    expect(tencentHy4Spec.layout.mode).toBe('template');
    if (tencentHy4Spec.layout.mode !== 'template') throw new Error('template fixture missing');
    expect(tencentHy4Spec.layout.template).toBe('attention-mask');
    expect(tencentHy4Spec.layout.variant).toBe('ihc-pipeline');
    expect(tencentHy4Spec.groups.find((group) => group.id === 'backbone')?.repeat?.count).toBe(78);
  });

  test('renders the 78x decoder backbone, DSA attention, MoE, and iHC Read/Write pills', () => {
    const result = render();
    const copy = plain(result);

    expect(copy).toContain('Tencent Hy4 (770B-A49B)');
    expect(copy).toContain('5-layer DFly2 drafter (3.3B) for speculative decoding');
    expect(copy).toContain('78');
    expect(copy).toContain('Gated multi-head latent');
    expect(copy).toContain('attention (MLA)');
    expect(copy).toContain('with DeepSeek Sparse');
    expect(copy).toContain('Attention (DSA)');
    expect(copy).toContain('Partial RoPE');
    expect(copy).toContain('(RoPE + NoPE)');
    expect(copy).toContain('MoE');
    expect(copy).toContain('RMSNorm 1');
    expect(copy).toContain('RMSNorm 2');
    expect(copy).toContain('Final iHC Head');
    expect(copy).toContain('Final RMSNorm');
    expect(copy).toContain('Linear output layer');
    expect(copy).toContain('Token embedding layer');
    expect(copy).toContain('Tokenized text');
    expect(copy).toContain('Sample input text');
    expect(copy).toContain('4× residual branches');

    expect(withRole(result, 'model-container')).toHaveLength(1);
    expect(withRole(result, 'repeat-block')).toHaveLength(1);
    expect(withRole(result, 'attention-block')).toHaveLength(1);
    expect(withRole(result, 'moe-block')).toHaveLength(1);
    expect(withRole(result, 'ihc-read-pill')).toHaveLength(2);
    expect(withRole(result, 'ihc-write-pill')).toHaveLength(2);
    expect(withRole(result, 'residual-bus-trunk')).toHaveLength(1);
    expect(withRole(result, 'residual-branch')).toHaveLength(4);
    expect(withRole(result, 'residual-dot')).toHaveLength(4);
    expect(withRole(result, 'repeat-marker').map((element) => element.label)).toEqual(expect.arrayContaining(['78', '×']));
  });

  test('renders the 6x6 DSA mask matrix, current-row block highlight, and curved selection arrows', () => {
    const result = render();
    const copy = plain(result);
    const grids = maskGrids(result);
    const cells = grids.flatMap((grid) => grid.cells);

    expect(copy).toContain('Gated DeepSeek Sparse Attention (DSA)');
    expect(copy).toContain('With DSA, the current token can');
    expect(copy).toContain('only attend itself and selected');
    expect(copy).toContain('previous tokens');

    expect(grids).toHaveLength(36);
    expect(cells).toHaveLength(36);
    expect(cells.filter((cell) => cell.text === '1')).toHaveLength(16);
    expect(cells.filter((cell) => cell.text === '0')).toHaveLength(20);
    expect(cells.every((cell) => cell.text === '0' || cell.text === '1')).toBe(true);
    expect(new Set(cells.map((cell) => (cell.fill?.kind === 'solid' ? cell.fill.color : ''))).size).toBe(2);

    expect(withRole(result, 'mask-inset')).toHaveLength(1);
    expect(withRole(result, 'mask-inset-title')).toHaveLength(1);
    expect(withRole(result, 'mask-row-label')).toHaveLength(6);
    expect(withRole(result, 'mask-column-label')).toHaveLength(6);
    expect(withRole(result, 'mask-row-label').map((element) => element.label)).toEqual([
      'The', 'model', 'attends', 'to', 'past', 'tokens',
    ]);
    expect(withRole(result, 'mask-highlight')).toHaveLength(1);
    expect(withRole(result, 'mask-highlight')[0].label).toBe('to');
    expect(withRole(result, 'mask-selection-arc')).toHaveLength(3);
    expect(withRole(result, 'mask-caption')).toHaveLength(3);

    const maskInset = withRole(result, 'mask-inset')[0];
    const ihcInset = withRole(result, 'ihc-inset')[0];
    const firstCaption = withRole(result, 'mask-caption')[0];
    if (maskInset.kind !== 'group' || ihcInset.kind !== 'group' || firstCaption.kind !== 'text') {
      throw new Error('mask layout fixture missing');
    }
    const matrixBottom = Math.max(...grids.map((grid) => grid.box.y + grid.box.height));
    expect(firstCaption.at.y - 42).toBeGreaterThan(matrixBottom);
    expect(ihcInset.box.y).toBeGreaterThan(maskInset.box.y + maskInset.box.height);
  });

  test('renders the iHC pipeline with four branch terminals and its explanatory notes', () => {
    const result = render();
    const copy = plain(result);

    expect(copy).toContain('iHC (identity Hyper-Connections)');
    expect(copy).toContain('iHC Read');
    expect(copy).toContain('RMSNorm 4-stream state');
    expect(copy).toContain('one scalar gate per stream');
    expect(copy).toContain('gated sum');
    expect(copy).toContain('Sublayer');
    expect(copy).toContain('(attention or MoE)');
    expect(copy).toContain('iHC Write');
    expect(copy).toContain('one scalar gate');
    expect(copy).toContain('for each branch');
    expect(copy).toContain("R_i′ = R_i + s_i y");
    expect(copy).toContain('with 4 parallel residual branches');
    expect(copy).toContain('iHC Read collapses the branches to one sublayer input');
    expect(copy).toContain('iHC Write injects the output into all branches; there is no H_res');
    expect(copy).toContain('branch mixer as in mHC');

    expect(withRole(result, 'ihc-inset')).toHaveLength(1);
    expect(withRole(result, 'ihc-inset-title')).toHaveLength(1);
    expect(withRole(result, 'ihc-read-node')).toHaveLength(1);
    expect(withRole(result, 'ihc-write-node')).toHaveLength(1);
    expect(withRole(result, 'ihc-sublayer')).toHaveLength(1);
    expect(withRole(result, 'ihc-branch')).toHaveLength(8);
    expect(withRole(result, 'ihc-branch-dot')).toHaveLength(8);
    expect(withRole(result, 'ihc-note-title')).toHaveLength(1);
    expect(withRole(result, 'ihc-note')).toHaveLength(3);
    expect(withRole(result, 'ihc-flow')).toHaveLength(2);
  });

  test('renders the left caption stack and reference facts', () => {
    const result = render();
    const copy = plain(result);

    for (const text of [
      'Vocabulary size of',
      '121k',
      '256 experts:',
      '8 routed',
      '+ 1 shared active',
      'Gated DSA:',
      '64 attention heads',
      '32 indexer heads',
      'top-k 2,048',
      'Native context',
      '1M tokens',
      'First layer uses a',
      'dense FFN',
      'with intermediate',
      'size 18,432;',
      'the remaining 77',
      'layers use MoE',
      'Embedding',
      'dimension of 6,144',
    ]) {
      expect(copy).toContain(text);
    }

    expect(withRole(result, 'caption-stack')).toHaveLength(19);
    const captionFor = (sourceId: string) => withRole(result, 'caption-stack').filter((element) => element.sourceId === sourceId);
    expect(captionFor('moe')).toHaveLength(3);
    expect(captionFor('attention')).toHaveLength(4);
    expect(captionFor('ffn')).toHaveLength(6);
    expect(captionFor('vocabulary')).toHaveLength(2);
    expect(captionFor('context')).toHaveLength(2);
    expect(captionFor('embedding')).toHaveLength(2);
    expect(withRole(result, 'leader')).toHaveLength(6);
  });

  test('drives the backbone, mask, and captions from typed data', () => {
    const spec = structuredClone(tencentHy4Spec);
    const backbone = spec.groups.find((group) => group.id === 'backbone');
    if (!backbone) throw new Error('backbone fixture missing');
    backbone.repeat = { count: 96, label: 'decoder layers' };

    const moe = operation(spec, 'moe');
    if (moe.data.family !== 'moe') throw new Error('moe fixture missing');
    moe.data.experts = 512;
    moe.data.activeExperts = 16;
    moe.data.sharedExperts = 2;

    const ffn = operation(spec, 'ffn');
    if (ffn.data.family !== 'ffn') throw new Error('ffn fixture missing');
    ffn.data.hidden = 32_768;

    const mask = maskNode(spec);
    mask.data.values = new Array<0 | 1>(mask.data.values.length).fill(0);

    const result = render(spec);
    const copy = plain(result);
    expect(copy).toContain('96');
    expect(copy).toContain('512 experts:');
    expect(copy).toContain('16 routed');
    expect(copy).toContain('+ 2 shared active');
    expect(copy).toContain('the remaining 95');
    expect(copy).toContain('32,768');
    expect(maskGrids(result).flatMap((grid) => grid.cells).every((cell) => cell.text === '0')).toBe(true);
  });

  test('is deterministic, self-contained, and keeps the reference aspect ratio', () => {
    const first = render();
    const second = render();
    expect(first.svg).toBe(second.svg);
    expect(first.scene.canvas).toEqual({ width: 3834, height: 2949 });
    expect(first.scene.canvas.width / first.scene.canvas.height).toBeCloseTo(3834 / 2949, 6);
    expect(first.svg).not.toContain('<image');
    expect(first.svg).not.toContain('foreignObject');
    expect(first.svg).not.toContain('xlink:href');
    expect(first.svg).not.toContain('<script');
    expect(first.svg).toContain('<text');
    expect(first.svg).toContain('<rect');
    expect(first.diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toEqual([]);
  });

  test('rejects a non-iHC attention-mask variant', () => {
    const spec = structuredClone(tencentHy4Spec);
    spec.layout = {
      mode: 'template',
      template: 'attention-mask',
      slots: tencentHy4Spec.layout.mode === 'template' ? tencentHy4Spec.layout.slots : {},
      variant: 'qsa-blocks' as never,
    };
    expect(() => render(spec)).toThrow(expect.objectContaining({
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'unsupported-variant', path: 'layout.variant' }),
      ]),
    }));
  });

  test('records the re-checked inventory confidence and the corrected layer count', () => {
    const inventory = JSON.parse(readFileSync('docs/research/inventory/batch-04.json', 'utf8')) as Array<{
      file: string;
      confidence: string;
      notes: string;
    }>;
    const entry = inventory.find((candidate) => candidate.file === 'tencent-hy4-770b-a49b.webp');
    expect(entry).toBeDefined();
    expect(entry?.confidence).toBe('high');
    expect(entry?.notes).toContain('78');
    expect(entry?.notes).toContain('60');
  });
});
