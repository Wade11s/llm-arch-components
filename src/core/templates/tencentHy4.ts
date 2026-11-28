import { TemplateScene, templateText as text, createTemplateApi, annotationOf, annotationLines, templateFailure } from './templateScene';
import type { ConnectorBox } from '../connectors';
import type {
  Box,
  EdgeSpec,
  FigureSpec,
  GroupSpec,
  Id,
  LayoutContext,
  LayoutEngine,
  NodeSpec,
  Point,
  Scene,
  TextMetrics,
  TextSpec,
} from '../types';

type OperationNode = Extract<NodeSpec, { kind: 'operation' | 'composite' }>;
type MaskNode = Extract<NodeSpec, { kind: 'mask' }>;
type TemplateLayout = Extract<FigureSpec['layout'], { mode: 'template' }>;
type Annotation = NonNullable<FigureSpec['annotations']>[number];

const { slot, groupOf } = createTemplateApi('Tencent Hy4', 'attention-mask-ihc');

const VARIANT = 'ihc-pipeline';

const MODEL: Box = { x: 596, y: 360, width: 1090, height: 2047 };
const BLOCK: Box = { x: 772, y: 782, width: 771, height: 1498 };
const MASK_INSET: Box = { x: 2149, y: 517, width: 1632, height: 1560 };
const IHC_INSET: Box = { x: 1893, y: 2135, width: 1913, height: 792 };
const CENTER_X = 1150;
const RESIDUAL_X = 1428;

const MASK = {
  originX: 2534,
  originY: 1023,
  cell: 108,
  gap: 31,
  labelGap: 40,
};

const IHC = {
  read: { x: 2072, y: 2320, width: 554, height: 230 },
  sublayer: { x: 2738, y: 2320, width: 350, height: 230 },
  write: { x: 3199, y: 2320, width: 342, height: 230 },
  branchInX: 1996,
  branchOutX: 3617,
};

const COLORS = {
  maskHit: '#B3C7E7',
  maskMiss: '#F1C7A1',
  attention: '#5E5E5E',
  selection: '#C8241B',
};

function templateLayout(spec: FigureSpec): TemplateLayout {
  if (spec.layout.mode !== 'template' || spec.layout.template !== 'attention-mask') {
    templateFailure('wrong-template', 'iHC pipeline is an attention-mask template variant');
  }
  if (spec.layout.variant !== VARIANT) {
    templateFailure('wrong-variant', `attention-mask layout requires layout.variant = "${VARIANT}"`);
  }
  return spec.layout;
}

function numberOption(spec: FigureSpec, name: string, fallback: number): number {
  const value = templateLayout(spec).options?.[name];
  return typeof value === 'number' ? value : fallback;
}

function nodeOf(spec: FigureSpec, id: Id): NodeSpec {
  const node = spec.nodes.find((candidate) => candidate.id === id);
  if (!node) templateFailure('missing-node', `Node "${id}" does not exist`, [id]);
  return node;
}

function operationOf(spec: FigureSpec, id: Id): OperationNode {
  const node = nodeOf(spec, id);
  if (node.kind !== 'operation' && node.kind !== 'composite') {
    templateFailure('wrong-node-kind', `Node "${id}" must be an operation or composite`, [id]);
  }
  return node;
}

function requiredOperation(spec: FigureSpec, name: string, predicate: (node: OperationNode) => boolean, message: string): OperationNode {
  const node = operationOf(spec, slot(spec, name));
  if (!predicate(node)) templateFailure('wrong-operation', message, [node.id]);
  return node;
}

function formatNumber(value: number): string {
  return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function headsOf(node: OperationNode): number {
  if (node.data.family === 'mla' || node.data.family === 'gqa' || node.data.family === 'qsa') return node.data.heads;
  return 0;
}

function streamsOf(node: OperationNode): number {
  return node.data.family === 'gated-residual' ? node.data.streams : 4;
}

function drawTitle(builder: TemplateScene, spec: FigureSpec): void {
  builder.text('figure-title', 'title', { x: 280, y: 150 }, spec.title, {
    size: 144,
    weight: 900,
    fill: spec.theme.accent,
    family: "'Arial Black', Arial, sans-serif",
    label: spec.title,
  });

  const drafter = annotationOf(spec, 'drafter');
  if (drafter) {
    annotationLines(spec, 'drafter').forEach((line, index) => {
      builder.text(`title-subtitle-${index + 1}`, 'title-subtitle', { x: CENTER_X, y: 225 + index * 52 }, line, {
        size: 46,
        weight: 500,
        align: 'center',
        sourceId: drafter.id,
        label: builder.labelOf(line),
      });
    });
  }

}

function drawBackbone(
  builder: TemplateScene,
  spec: FigureSpec,
  block: GroupSpec,
  attention: OperationNode,
  moe: OperationNode,
  read: OperationNode,
  write: OperationNode,
  metrics: TextMetrics,
): void {
  const repeatCount = block.repeat?.count ?? 0;
  const blockFill = block.style?.fill?.kind === 'solid' ? block.style.fill.color : spec.theme.accent;

  builder.group('model', 'model-container', MODEL, [], {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 6),
    sourceId: 'model',
  });
  builder.box('repeat-block', 'repeat-block', BLOCK, {
    fill: builder.solid(blockFill),
    stroke: builder.stroke(block.style?.stroke ?? spec.theme.ink, 6),
    radius: 90,
    sourceId: block.id,
    label: `${repeatCount}×`,
  });

  const edgeOf = (id: Id): EdgeSpec => {
    const edge = spec.edges.find((candidate) => candidate.id === id);
    if (!edge) templateFailure('missing-edge', `Tencent Hy4 requires edge "${id}"`, [id]);
    return edge;
  };
  const sampleInputText = 'Sample input text';
  const sampleInputWidth = metrics.measure(
    { text: sampleInputText },
    { size: 38, weight: 400, family: spec.theme.monospaceFamily ?? 'monospace' },
  );
  const sampleInputBox: ConnectorBox = {
    id: 'sample-input-box',
    owner: 'sample-input',
    box: { x: CENTER_X - sampleInputWidth / 2, y: 2680 - 38, width: sampleInputWidth, height: 38 },
    kind: 'text',
  };
  builder.edge(edgeOf('flow-sample-tokenized'), { fromBox: sampleInputBox, to: 'tokenized-text', fromGap: 8 });
  builder.edge(edgeOf('flow-tokenized-embedding'), { from: 'tokenized-text', to: 'embedding-layer' });
  builder.edge(edgeOf('flow-embedding-read'), { from: 'embedding-layer', to: 'ihc-read-low' });
  builder.edge(edgeOf('flow-read-norm1'), { from: 'ihc-read-low', to: 'rmsnorm-1' });
  builder.edge(edgeOf('flow-norm1-attention'), { from: 'rmsnorm-1', to: 'attention-block' });
  builder.edge(edgeOf('flow-attention-write'), { from: 'attention-block', to: 'ihc-write-mid' });
  builder.edge(edgeOf('flow-write-read'), { from: 'ihc-write-mid', to: 'ihc-read-top' });
  builder.edge(edgeOf('flow-read-norm2'), { from: 'ihc-read-top', to: 'rmsnorm-2' });
  builder.edge(edgeOf('flow-norm2-moe'), { from: 'rmsnorm-2', to: 'moe' });
  builder.edge(edgeOf('flow-moe-write'), { from: 'moe', to: 'ihc-write-top' });
  builder.edge(edgeOf('flow-write-head'), { from: 'ihc-write-top', to: 'final-ihc-head' });
  builder.edge(edgeOf('flow-head-norm'), { from: 'final-ihc-head', to: 'final-rmsnorm' });
  builder.edge(edgeOf('flow-norm-output'), { from: 'final-rmsnorm', to: 'output-layer' });

  builder.pill('output-layer', 'output-layer', { x: 970, y: 418, width: 360, height: 80 }, text('Linear output layer'), {
    fill: spec.theme.surface,
    size: 32,
  });
  builder.pill('final-rmsnorm', 'norm', { x: 975, y: 534, width: 350, height: 80 }, text('Final RMSNorm'), {
    fill: spec.theme.surface,
    size: 32,
  });
  builder.pill('final-ihc-head', 'final-ihc-head', { x: 975, y: 656, width: 350, height: 80 }, text('Final iHC Head'), {
    fill: spec.theme.surface,
    size: 32,
  });

  const ihcBox = (y: number): Box => ({ x: 1000, y, width: 300, height: 56 });
  builder.pill('ihc-write-top', 'ihc-write-pill', ihcBox(844), text('iHC Write'), {
    size: 30,
    weight: 700,
    textFill: spec.theme.accent,
    sourceId: write.id,
  });
  builder.pill('moe', 'moe-block', { x: 975, y: 973, width: 350, height: 74 }, text('MoE'), {
    fill: spec.theme.surface,
    size: 32,
    sourceId: moe.id,
  });
  builder.pill('rmsnorm-2', 'norm', { x: 975, y: 1120, width: 350, height: 74 }, text('RMSNorm 2'), { size: 32 });
  builder.pill('ihc-read-top', 'ihc-read-pill', ihcBox(1300), text('iHC Read'), {
    size: 30,
    weight: 700,
    textFill: spec.theme.accent,
    sourceId: read.id,
  });
  builder.pill('ihc-write-mid', 'ihc-write-pill', ihcBox(1492), text('iHC Write'), {
    size: 30,
    weight: 700,
    textFill: spec.theme.accent,
    sourceId: write.id,
  });

  builder.box('attention-block', 'attention-block', { x: 897.5, y: 1612, width: 505, height: 250 }, {
    fill: builder.solid(COLORS.attention),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 28,
    sourceId: attention.id,
  });
  const attentionLines: TextSpec[] = [
    { spans: [{ text: 'Gated multi-head latent', color: 'inverse' }] },
    { spans: [{ text: 'attention\u00A0', color: 'inverse' }, { text: '(MLA)', color: 'accent' }] },
    { spans: [{ text: 'with DeepSeek Sparse', color: 'inverse' }] },
    { spans: [{ text: 'Attention\u00A0', color: 'inverse' }, { text: '(DSA)', color: 'accent' }] },
  ];
  attentionLines.forEach((line, index) => {
    builder.text(`attention-line-${index + 1}`, 'attention-label', { x: 1150, y: 1670 + index * 40 }, line, {
      size: 29,
      align: 'center',
      sourceId: attention.id,
      label: builder.labelOf(line),
    });
  });

  builder.pill('rmsnorm-1', 'norm', { x: 975, y: 1961, width: 350, height: 74 }, text('RMSNorm 1'), {
    size: 32,
    sourceId: 'rmsnorm-1',
  });
  builder.pill('ihc-read-low', 'ihc-read-pill', ihcBox(2098), text('iHC Read'), {
    size: 30,
    weight: 700,
    textFill: spec.theme.accent,
    sourceId: read.id,
  });
  builder.pill('embedding-layer', 'embedding', { x: 880, y: 2296, width: 540, height: 88 }, text('Token embedding layer'), {
    size: 32,
  });
  builder.pill('tokenized-text', 'input', { x: 980, y: 2445, width: 340, height: 88 }, text('Tokenized text'), {
    size: 32,
  });
  builder.text('sample-input', 'input-label', { x: CENTER_X, y: 2680 }, 'Sample input text', {
    size: 38,
    align: 'center',
    family: spec.theme.monospaceFamily ?? 'monospace',
    label: 'Sample input text',
  });

  builder.flow('residual-trunk', [{ x: RESIDUAL_X, y: 872 }, { x: RESIDUAL_X, y: 2126 }], {
    role: 'residual-path',
    width: 5,
    arrow: 'none',
    sourceId: 'backbone',
  });
  [872, 1328, 1520, 2126].forEach((y, index) => {
    builder.flow(`residual-branch-${index + 1}`, [{ x: 1300, y }, { x: RESIDUAL_X, y }], {
      role: 'residual-branch',
      width: 5,
      arrow: 'none',
      sourceId: 'backbone',
    });
    builder.box(`residual-dot-${index + 1}`, 'residual-dot', { x: RESIDUAL_X - 11, y: y - 11, width: 22, height: 22 }, {
      fill: builder.solid(spec.theme.ink),
      stroke: builder.stroke(spec.theme.ink, 0),
      radius: 11,
      sourceId: 'backbone',
    });
  });
  builder.text('residual-label', 'residual-label', { x: 1440, y: 1584 }, '4× residual branches', {
    size: 26,
    weight: 700,
    label: '4× residual branches',
  });

  builder.glyph('repeat-brace', 'repeat-marker', { x: 740, y: 2140 }, 'brace', 240, { label: `${repeatCount}×` });
  builder.text('repeat-count', 'repeat-marker', { x: 610, y: 2230 }, `${repeatCount}`, {
    size: 50,
    weight: 700,
    fill: spec.theme.accent,
    label: `${repeatCount}`,
  });
  builder.text('repeat-x', 'repeat-marker', { x: 694, y: 2230 }, '×', {
    size: 50,
    weight: 700,
    fill: spec.theme.accent,
    label: '×',
  });

  builder.pill('partial-rope', 'side-pill', { x: 470, y: 1615, width: 330, height: 120 }, text('Partial RoPE'), {
    size: 30,
  });
  builder.text('partial-rope-detail', 'side-pill-label', { x: 635, y: 1718 }, '(RoPE + NoPE)', {
    size: 28,
    align: 'center',
    label: '(RoPE + NoPE)',
  });
  builder.flow('rope-flow', [{ x: 800, y: 1675 }, { x: 897.5, y: 1675 }]);

}

function drawMask(builder: TemplateScene, spec: FigureSpec, inset: GroupSpec, mask: MaskNode): void {
  const insetCenter = MASK_INSET.x + MASK_INSET.width / 2;
  builder.group(inset.id, 'mask-inset', MASK_INSET, [], {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke(spec.theme.ink, 10, 'dotted'),
    sourceId: inset.id,
  });
  const title = inset.title ?? text('Gated DeepSeek Sparse Attention (DSA)');
  builder.text('mask-inset-title', 'mask-inset-title', { x: insetCenter, y: 700 }, title, {
    size: 64,
    weight: 800,
    align: 'center',
    sourceId: inset.id,
    label: builder.labelOf(title),
  });

  const { rows, columns, values } = mask.data;
  const columnCount = columns.length;
  const cellX = (column: number) => MASK.originX + column * (MASK.cell + MASK.gap);
  const cellY = (row: number) => MASK.originY + row * (MASK.cell + MASK.gap);
  columns.forEach((column, index) => {
    builder.text(`mask-column-label-${index + 1}`, 'mask-column-label', {
      x: cellX(index) + MASK.cell / 2,
      y: MASK.originY - 28,
    }, column, {
      size: 20,
      align: 'center',
      sourceId: mask.id,
      label: column,
    });
  });

  rows.forEach((row, rowIndex) => {
    builder.text(`mask-row-label-${rowIndex + 1}`, 'mask-row-label', {
      x: MASK.originX - MASK.labelGap,
      y: cellY(rowIndex) + MASK.cell / 2 + 10,
    }, row, {
      size: 32,
      align: 'end',
      sourceId: mask.id,
      label: row,
    });
    columns.forEach((column, columnIndex) => {
      const value = values[rowIndex * columnCount + columnIndex] ?? 0;
      builder.elements.push({
        id: `mask-grid-${rowIndex + 1}-${columnIndex + 1}`,
        sourceId: mask.id,
        role: 'mask-grid',
        label: `${row} → ${column}: ${value}`,
        kind: 'grid',
        box: { x: cellX(columnIndex), y: cellY(rowIndex), width: MASK.cell, height: MASK.cell },
        rows: 1,
        columns: 1,
        cells: [{
          row: 0,
          column: 0,
          text: `${value}`,
          fill: builder.solid(value === 1 ? COLORS.maskHit : COLORS.maskMiss),
        }],
      });
    });
  });

  const currentRow = rows.indexOf('to');
  if (currentRow >= 0) {
    const rowY = cellY(currentRow);
    builder.box('mask-current-row', 'mask-highlight', {
      x: MASK.originX - 140,
      y: rowY - 6,
      width: 128,
      height: MASK.cell + 12,
    }, {
      fill: builder.solid('none'),
      stroke: builder.stroke(COLORS.selection, 7),
      radius: 18,
      sourceId: mask.id,
      label: rows[currentRow],
    });

    const start = { x: MASK.originX - 10, y: rowY + MASK.cell / 2 };
    columns.forEach((_column, columnIndex) => {
      if (values[currentRow * columnCount + columnIndex] !== 1) return;
      const endX = cellX(columnIndex) + MASK.cell / 2;
      builder.flow(`mask-selection-arc-${columnIndex + 1}`, [
        start,
        { x: start.x + 24, y: rowY - 54 },
        { x: endX - 24, y: rowY - 76 },
        { x: endX, y: rowY - 4 },
      ], {
        role: 'mask-selection-arc',
        stroke: COLORS.selection,
        width: 5,
        arrow: 'end',
        sourceId: mask.id,
      });
    });
  }

  const captionLines: TextSpec[] = [
    text('With DSA, the current token can'),
    { spans: [{ text: 'only attend itself and ' }, { text: 'selected', emphasis: 'bold' }] },
    text('previous tokens'),
  ];
  captionLines.forEach((line, index) => {
    builder.text(`mask-caption-${index + 1}`, 'mask-caption', {
      x: MASK.originX + 45,
      y: 1920 + index * 52,
    }, line, {
      size: 36,
      weight: 500,
      align: 'start',
      sourceId: inset.id,
      label: builder.labelOf(line),
    });
  });
}

function drawIhc(builder: TemplateScene, spec: FigureSpec, inset: GroupSpec, read: OperationNode, write: OperationNode): void {
  const streams = streamsOf(read);
  builder.group(inset.id, 'ihc-inset', IHC_INSET, [], {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke(spec.theme.ink, 10, 'dotted'),
    sourceId: inset.id,
  });

  const title = inset.title ?? text('iHC (identity Hyper-Connections)');
  builder.text('ihc-inset-title', 'ihc-inset-title', { x: 2164, y: 2260 }, title, {
    size: 64,
    weight: 800,
    sourceId: inset.id,
    label: builder.labelOf(title),
  });

  builder.box('ihc-read-node', 'ihc-read-node', IHC.read, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke(spec.theme.ink, 5),
    radius: 18,
    sourceId: read.id,
    label: 'iHC Read',
  });
  builder.box('ihc-sublayer', 'ihc-sublayer', IHC.sublayer, {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 5),
    radius: 18,
    label: 'Sublayer (attention or MoE)',
  });
  builder.box('ihc-write-node', 'ihc-write-node', IHC.write, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke(spec.theme.ink, 5),
    radius: 18,
    sourceId: write.id,
    label: 'iHC Write',
  });

  const readCenter = IHC.read.x + IHC.read.width / 2;
  builder.text('ihc-read-title', 'ihc-node-title', { x: readCenter, y: 2380 }, 'iHC Read', {
    size: 36,
    weight: 700,
    fill: spec.theme.accent,
    align: 'center',
    sourceId: read.id,
    label: 'iHC Read',
  });
  [
    `RMSNorm ${streams}-stream state`,
    'one scalar gate per stream',
    'gated sum',
  ].forEach((line, index) => {
    builder.text(`ihc-read-body-${index + 1}`, 'ihc-node-body', { x: readCenter, y: 2420 + index * 36 }, line, {
      size: 26,
      align: 'center',
      sourceId: read.id,
      label: line,
    });
  });

  const subCenter = IHC.sublayer.x + IHC.sublayer.width / 2;
  builder.text('ihc-sublayer-title', 'ihc-node-body', { x: subCenter, y: 2430 }, 'Sublayer', {
    size: 32,
    align: 'center',
    label: 'Sublayer',
  });
  builder.text('ihc-sublayer-note', 'ihc-node-body', { x: subCenter, y: 2468 }, '(attention or MoE)', {
    size: 28,
    align: 'center',
    label: '(attention or MoE)',
  });

  const writeCenter = IHC.write.x + IHC.write.width / 2;
  builder.text('ihc-write-title', 'ihc-node-title', { x: writeCenter, y: 2380 }, 'iHC Write', {
    size: 36,
    weight: 700,
    fill: spec.theme.accent,
    align: 'center',
    sourceId: write.id,
    label: 'iHC Write',
  });
  builder.text('ihc-write-body-1', 'ihc-node-body', { x: writeCenter, y: 2420 }, 'one scalar gate', {
    size: 30,
    align: 'center',
    sourceId: write.id,
  });
  builder.text('ihc-write-body-2', 'ihc-node-body', { x: writeCenter, y: 2456 }, 'for each branch', {
    size: 30,
    align: 'center',
    sourceId: write.id,
  });
  builder.text('ihc-formula', 'ihc-formula', { x: writeCenter, y: 2496 }, { spans: [{ text: "R_i′ = R_i + s_i y", emphasis: 'italic' }] }, {
    size: 32,
    align: 'center',
    sourceId: write.id,
    label: "R_i′ = R_i + s_i y",
  });

  builder.flow('ihc-flow-1', [{ x: IHC.read.x + IHC.read.width, y: 2435 }, { x: IHC.sublayer.x, y: 2435 }], {
    role: 'ihc-flow',
    width: 6,
  });
  builder.flow('ihc-flow-2', [{ x: IHC.sublayer.x + IHC.sublayer.width, y: 2435 }, { x: IHC.write.x, y: 2435 }], {
    role: 'ihc-flow',
    width: 6,
  });

  [2355, 2392, 2429, 2466].forEach((y, index) => {
    builder.flow(`ihc-branch-in-${index + 1}`, [{ x: IHC.branchInX, y }, { x: IHC.read.x, y }], {
      role: 'ihc-branch',
      width: 5,
      arrow: 'none',
    });
    builder.box(`ihc-branch-dot-in-${index + 1}`, 'ihc-branch-dot', {
      x: IHC.branchInX - 12,
      y: y - 12,
      width: 24,
      height: 24,
    }, {
      fill: builder.solid(spec.theme.ink),
      stroke: builder.stroke(spec.theme.ink, 0),
      radius: 12,
    });
    builder.flow(`ihc-branch-out-${index + 1}`, [{ x: IHC.write.x + IHC.write.width, y }, { x: IHC.branchOutX, y }], {
      role: 'ihc-branch',
      width: 5,
      arrow: 'none',
    });
    builder.box(`ihc-branch-dot-out-${index + 1}`, 'ihc-branch-dot', {
      x: IHC.branchOutX - 12,
      y: y - 12,
      width: 24,
      height: 24,
    }, {
      fill: builder.solid(spec.theme.ink),
      stroke: builder.stroke(spec.theme.ink, 0),
      radius: 12,
    });
  });

  builder.text('ihc-note-title', 'ihc-note-title', { x: 2265, y: 2720 }, {
    spans: [
      { text: 'with ', emphasis: 'bold' },
      { text: `${streams}\u00A0`, color: 'accent', emphasis: 'bold' },
      { text: 'parallel residual branches', emphasis: 'bold' },
    ],
  }, {
    size: 38,
    align: 'start',
    sourceId: inset.id,
    label: `with ${streams} parallel residual branches`,
  });

  const notes: TextSpec[] = [
    text('iHC Read collapses the branches to one sublayer input'),
    { spans: [{ text: 'iHC Write injects the output into all branches; there is no\u00A0' }, { text: 'H_res', emphasis: 'italic' }] },
    text('branch mixer as in mHC'),
  ];
  notes.forEach((note, index) => {
    builder.text(`ihc-note-${index + 1}`, 'ihc-note', { x: 2265, y: 2780 + index * 44 }, note, {
      size: 36,
      align: 'start',
      sourceId: inset.id,
      label: builder.labelOf(note),
    });
  });
}

function caption(
  builder: TemplateScene,
  id: Id,
  at: Point,
  content: TextSpec,
  options: { size: number; weight?: number; fill?: string; sourceId?: Id; align?: 'start' | 'center' | 'end' },
): void {
  builder.text(id, 'caption-stack', at, content, {
    size: options.size,
    weight: options.weight ?? 700,
    fill: options.fill,
    sourceId: options.sourceId,
    align: options.align ?? 'start',
    label: builder.labelOf(content),
  });
}

function drawAnnotation(
  builder: TemplateScene,
  spec: FigureSpec,
  annotation: Annotation,
  at: Point,
  options: { size: number; lineGap: number; x?: number },
): void {
  annotationLines(spec, annotation.id).forEach((line, index) => {
    caption(builder, `caption-${annotation.id}-${index + 1}`, {
      x: options.x ?? at.x,
      y: at.y + index * options.lineGap,
    }, line, {
      size: options.size,
      sourceId: annotation.id,
    });
  });
}

function drawCaptions(
  builder: TemplateScene,
  spec: FigureSpec,
  block: GroupSpec,
  attention: OperationNode,
  moe: OperationNode,
  ffn: OperationNode,
): void {
  const vocabulary = annotationOf(spec, 'vocabulary');
  if (vocabulary) drawAnnotation(builder, spec, vocabulary, { x: 24, y: 530 }, { size: 52, lineGap: 62 });

  const repeatCount = block.repeat?.count ?? 0;
  const remaining = Math.max(0, repeatCount - 1);
  const expertCount = moe.data.family === 'moe' ? moe.data.experts : 0;
  const activeExperts = moe.data.family === 'moe' ? moe.data.activeExperts : 0;
  const sharedExperts = moe.data.family === 'moe' ? moe.data.sharedExperts ?? 0 : 0;
  const attentionHeads = headsOf(attention);
  const indexerHeads = numberOption(spec, 'indexerHeads', 32);
  const topK = numberOption(spec, 'dsaTopK', 2048);
  const ffnHidden = ffn.data.family === 'ffn' ? ffn.data.hidden : 0;

  [
    { line: text(`${expertCount} experts:`), y: 895 },
    { line: text(`${activeExperts} routed`), y: 945 },
    { line: text(`+ ${sharedExperts} shared active`), y: 995 },
  ].forEach(({ line, y }, index) => {
    caption(builder, `caption-moe-${index + 1}`, { x: 24, y }, line, {
      size: 44,
      fill: spec.theme.accent,
      sourceId: moe.id,
    });
  });

  caption(builder, 'caption-dsa-1', { x: 24, y: 1225 }, text('Gated DSA:'), { size: 44, sourceId: attention.id });
  [
    `${attentionHeads} attention heads`,
    `${indexerHeads} indexer heads`,
    `top-k ${formatNumber(topK)}`,
  ].forEach((line, index) => {
    caption(builder, `caption-dsa-${index + 2}`, { x: 24, y: 1273 + index * 48 }, text(line), {
      size: 44,
      fill: spec.theme.accent,
      sourceId: attention.id,
    });
  });

  const context = annotationOf(spec, 'context');
  if (context) drawAnnotation(builder, spec, context, { x: 24, y: 1830 }, { size: 48, lineGap: 60 });

  const denseLines: TextSpec[] = [
    text('First layer uses a'),
    text('dense FFN'),
    text('with intermediate'),
    { spans: [{ text: 'size\u00A0' }, { text: formatNumber(ffnHidden), color: 'accent', emphasis: 'bold' }, { text: ';' }] },
    { spans: [{ text: 'the remaining\u00A0' }, { text: formatNumber(remaining), color: 'accent', emphasis: 'bold' }] },
    text('layers use MoE'),
  ];
  denseLines.forEach((line, index) => {
    caption(builder, `caption-dense-first-${index + 1}`, { x: 24, y: 2210 + index * 46 }, line, {
      size: 42,
      sourceId: ffn.id,
    });
  });

  const embedding = annotationOf(spec, 'embedding');
  if (embedding) drawAnnotation(builder, spec, embedding, { x: 350, y: 2525 }, { size: 46, lineGap: 58 });
}

function drawLeaders(builder: TemplateScene, spec: FigureSpec): void {
  const leaders: Array<[Id, Point[]]> = [
    ['vocabulary', [{ x: 530, y: 550 }, { x: 970, y: 500 }]],
    ['moe', [{ x: 380, y: 915 }, { x: 975, y: 1010 }]],
    ['attention', [{ x: 300, y: 1250 }, { x: 897.5, y: 1620 }]],
    ['context', [{ x: 340, y: 1860 }, { x: 895, y: 1840 }]],
    ['ffn', [{ x: 460, y: 2270 }, { x: 770, y: 2200 }]],
    ['embedding', [{ x: 430, y: 2560 }, { x: 860, y: 2385 }]],
  ];
  leaders.forEach(([id, points]) => {
    const annotation = annotationOf(spec, id);
    const node = spec.nodes.find((candidate) => candidate.id === id);
    builder.flow(`leader-${id}`, points, {
      role: 'leader',
      width: 5,
      dash: 'dotted',
      arrow: 'none',
      sourceId: annotation?.id ?? node?.id,
    });
  });

  builder.flow('mask-zoom-leader', [{ x: 1440, y: 900 }, { x: MASK_INSET.x, y: 1050 }], {
    role: 'zoom-leader',
    dash: 'dotted',
    width: 6,
    arrow: 'none',
  });
  builder.flow('ihc-zoom-leader', [{ x: 1440, y: 2130 }, { x: IHC_INSET.x, y: 2240 }], {
    role: 'zoom-leader',
    dash: 'dotted',
    width: 6,
    arrow: 'none',
  });
}

export function layoutTencentHy4(spec: FigureSpec, context: LayoutContext): Scene {
  templateLayout(spec);
  const block = groupOf(spec, slot(spec, 'block'));
  const maskInset = groupOf(spec, slot(spec, 'mask'));
  const ihcInset = groupOf(spec, slot(spec, 'residual'));
  const attention = requiredOperation(spec, 'attention', (node) => node.data.family === 'mla' || node.data.family === 'gqa', 'iHC pipeline layout requires an MLA or GQA attention node');
  const moe = requiredOperation(spec, 'moe', (node) => node.data.family === 'moe', 'iHC pipeline layout requires a MoE node');
  const ffn = requiredOperation(spec, 'ffn', (node) => node.data.family === 'ffn', 'iHC pipeline layout requires a dense FFN node');
  const read = requiredOperation(spec, 'read', (node) => node.data.family === 'gated-residual' && node.data.operation === 'read', 'iHC pipeline layout requires an iHC Read node');
  const write = requiredOperation(spec, 'write', (node) => node.data.family === 'gated-residual' && node.data.operation === 'write', 'iHC pipeline layout requires an iHC Write node');
  const maskNode = nodeOf(spec, slot(spec, 'maskNode'));
  if (maskNode.kind !== 'mask') templateFailure('wrong-node-kind', `Node "${maskNode.id}" must be a mask node`, [maskNode.id]);

  const builder = new TemplateScene(spec.theme, context.metrics, { pillRadius: 24, pillSize: 28, pillSourceId: 'id', pillIdSuffix: false, pillTextLabel: true });
  drawTitle(builder, spec);
  drawBackbone(builder, spec, block, attention, moe, read, write, context.metrics);
  builder.flow('output-to-drafter', [{ x: CENTER_X, y: 418 }, { x: CENTER_X, y: 300 }], { role: 'flow-path' });
  drawMask(builder, spec, maskInset, maskNode);
  drawIhc(builder, spec, ihcInset, read, write);
  drawCaptions(builder, spec, block, attention, moe, ffn);
  drawLeaders(builder, spec);
  return builder.scene(spec);
}

export const tencentHy4Layout: LayoutEngine = {
  id: 'attention-mask-ihc-v1',
  layout: layoutTencentHy4,
};
