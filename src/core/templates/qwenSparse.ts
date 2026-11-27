import { TemplateScene, templateText as text, createTemplateApi, templateFailure as layoutFailure } from './templateScene';
import type {
  Box,
  FigureSpec,
  Fill,
  Id,
  LayoutContext,
  NodeSpec,
  Point,
  Scene,
  SceneElement,
  Size,
  TextSpec,
} from '../types';

type OperationNode = Extract<NodeSpec, { kind: 'operation' | 'composite' }>;
type MaskNode = Extract<NodeSpec, { kind: 'mask' }>;

/** Native coordinate system of the reference artwork (4078 x 3391). */
const REFERENCE: Size = { width: 4078, height: 3391 };

const BACKBONE = {
  container: { x: 594, y: 482, width: 1096, height: 1924 },
  block: { x: 766, y: 780, width: 784, height: 1510 },
  centerX: 1152,
  pillX: 965,
  pillWidth: 374,
  trunkX: 1420,
  attention: { x: 880, y: 1690, width: 500, height: 260 },
};

const MASK = {
  inset: { x: 2170, y: 175, width: 1800, height: 2200 },
  originX: 2430,
  originY: 700,
  blockSize: 454,
  blockGap: 42,
  cell: 113.5,
  rowLabelX: 2390,
  centerX: 3153,
};

const GR = {
  inset: { x: 1490, y: 2515, width: 1940, height: 840 },
  read: { x: 1740, y: 2745, width: 485, height: 200 },
  sublayer: { x: 2300, y: 2745, width: 255, height: 200 },
  write: { x: 2635, y: 2745, width: 375, height: 200 },
  branchInX: 1600,
  branchOutX: 3150,
};

const COLORS = {
  block: '#71A3D4',
  maskHit: '#B8CCE5',
  maskMiss: '#F3C49D',
  attention: '#5E5E5E',
  delta: '#F0A48F',
};

function isOperation(node: NodeSpec | undefined): node is OperationNode {
  return Boolean(node) && (node?.kind === 'operation' || node?.kind === 'composite');
}

const { slot, groupOf } = createTemplateApi('attention-mask layout', 'attention-mask');

function optionalSlot(spec: FigureSpec, name: string): Id | undefined {
  if (spec.layout.mode !== 'template') return undefined;
  const value = spec.layout.slots[name];
  return Array.isArray(value) ? value[0] : value;
}

function operationByFamily(spec: FigureSpec, predicate: (node: OperationNode) => boolean): OperationNode | undefined {
  return spec.nodes.find((node): node is OperationNode => isOperation(node) && predicate(node));
}

function requiredOperation(spec: FigureSpec, slotName: string, predicate: (node: OperationNode) => boolean, message: string): OperationNode {
  const id = optionalSlot(spec, slotName);
  const node = id ? operationOf(spec, id) : operationByFamily(spec, predicate);
  if (!node) layoutFailure('missing-operation', message, id ? [id] : undefined);
  return node;
}

function nodeOf(spec: FigureSpec, id: Id): NodeSpec {
  const node = spec.nodes.find((candidate) => candidate.id === id);
  if (!node) layoutFailure('missing-node', `Node "${id}" does not exist`, [id]);
  return node;
}

function operationOf(spec: FigureSpec, id: Id): OperationNode {
  const node = nodeOf(spec, id);
  if (!isOperation(node)) layoutFailure('wrong-node-kind', `Node "${id}" must be an operation or composite`, [id]);
  return node;
}

function familyName(family: OperationNode['data']['family']): string {
  switch (family) {
    case 'gated-delta-net': return 'Gated DeltaNet';
    case 'qsa': return 'Qwen Sparse Attention (QSA)';
    case 'gated-residual': return 'GR';
    case 'moe': return 'MoE';
    case 'gqa': return 'Grouped-query attention';
    case 'mla': return 'Multi-head latent attention';
    case 'ffn': return 'Feed forward';
    default: return family;
  }
}

function right(box: Box): number {
  return box.x + box.width;
}

function bottom(box: Box): number {
  return box.y + box.height;
}

function centerX(box: Box): number {
  return box.x + box.width / 2;
}

function centerY(box: Box): number {
  return box.y + box.height / 2;
}

function drawTitle(builder: TemplateScene, spec: FigureSpec): void {
  const [name, qualifier] = spec.title.split(' (');
  builder.text('figure-title', 'title', { x: 1210, y: 112 }, name, {
    size: 116,
    weight: 900,
    fill: spec.theme.accent,
    align: 'center',
    family: "'Arial Black', Arial, sans-serif",
    label: name,
  });
  if (qualifier) {
    const suffix = `(${qualifier}`;
    builder.text('title-qualifier', 'title-qualifier', { x: 1152, y: 258 }, suffix, {
      size: 116,
      weight: 900,
      fill: spec.theme.accent,
      align: 'center',
      family: "'Arial Black', Arial, sans-serif",
      label: suffix,
    });
  }
}

function drawBackbone(
  builder: TemplateScene,
  spec: FigureSpec,
  blockId: Id,
  attention: OperationNode,
  delta: OperationNode | undefined,
  moe: OperationNode,
  read: OperationNode,
  write: OperationNode,
): void {
  const block = groupOf(spec, blockId);
  const repeatCount = block.repeat?.count ?? 0;
  const blockFill = block.style?.fill?.kind === 'solid' ? block.style.fill.color : COLORS.block;
  const cx = BACKBONE.centerX;

  builder.group('model', 'model-container', BACKBONE.container, [], {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 6),
    sourceId: 'model',
  });
  builder.box('repeat-block', 'repeat-block', BACKBONE.block, {
    fill: builder.solid(blockFill),
    stroke: builder.stroke(block.style?.stroke ?? spec.theme.ink, 6),
    radius: 60,
    sourceId: block.id,
    label: `${repeatCount}×`,
  });

  // Vertical sublayer flow.
  const flows: Array<[Id, number, number]> = [
    ['flow-input', 2660, 2545],
    ['flow-embedding', 2467, 2322],
    ['flow-read-1', 2320, 2052],
    ['flow-read-1-attention', 1980, 1950],
    ['flow-attention-write-1', 1690, 1632],
    ['flow-write-1-read-2', 1560, 1212],
    ['flow-read-2-moe', 1140, 1096],
    ['flow-moe-write-2', 1020, 972],
    ['flow-write-2-final-read', 900, 716],
    ['flow-final-read-output', 640, 576],
    ['flow-output', 500, 415],
  ];
  for (const [id, from, to] of flows) {
    builder.flow(id, [{ x: cx, y: from }, { x: cx, y: to }]);
  }

  // Residual trunk: one line per branch, each joining a GR pill.
  const trunkTop = 936;
  builder.flow('residual-trunk', [
    { x: cx, y: 2115 },
    { x: BACKBONE.trunkX, y: 2115 },
    { x: BACKBONE.trunkX, y: trunkTop },
  ], { role: 'residual-path', arrow: 'none' });
  const junctions = [936, 1176, 1596, 2016];
  junctions.forEach((y, index) => {
    builder.flow(`residual-branch-${index + 1}`, [{ x: BACKBONE.trunkX, y }, { x: BACKBONE.pillX + BACKBONE.pillWidth, y }], {
      role: 'residual-stub',
      width: 5,
    });
    builder.box(`residual-junction-${index + 1}`, 'residual-junction', {
      x: BACKBONE.trunkX - 11,
      y: y - 11,
      width: 22,
      height: 22,
    }, {
      fill: builder.solid(spec.theme.ink),
      stroke: builder.stroke(spec.theme.ink, 0),
      radius: 11,
    });
  });
  builder.text('residual-branches', 'residual-label', { x: 1702, y: 1884 }, '4× residual branches', {
    size: 28,
    weight: 700,
    label: '4× residual branches',
  });

  // Stacked backbone pills.
  const midBox = (y: number, height: number): Box => ({ x: BACKBONE.pillX, y, width: BACKBONE.pillWidth, height });
  builder.pill('output-layer', 'output-layer', midBox(500, 76), text('Linear output layer'));
  builder.pill('final-gr-read', 'final-gr-read', midBox(640, 76), text('Final GR Read'));

  const residualLabel = (operation: 'read' | 'write'): string => `${familyName('gated-residual')} ${operation === 'read' ? 'Read' : 'Write'}`;
  const readLabel = residualLabel('read');
  const writeLabel = residualLabel('write');
  const grLabel = (value: string): TextSpec => ({ spans: [{ text: value, color: 'accent', emphasis: 'bold' }] });

  builder.pill('gr-write-2', 'gr-write-pill', midBox(900, 72), grLabel(writeLabel), { size: 34, sourceId: write.id });
  builder.pill('moe', 'moe-block', midBox(1020, 76), text(familyName('moe')), {
    fill: builder.solid(spec.theme.surface),
    size: 34,
    sourceId: moe.id,
  });
  builder.pill('gr-read-2', 'gr-read-pill', midBox(1140, 72), grLabel(readLabel), { size: 34, sourceId: read.id });
  builder.pill('gr-write-1', 'gr-write-pill', midBox(1560, 72), grLabel(writeLabel), { size: 34, sourceId: write.id });
  builder.pill('gr-read-1', 'gr-read-pill', midBox(1980, 72), grLabel(readLabel), { size: 34, sourceId: read.id });
  builder.pill('embedding-layer', 'embedding', { x: 908, y: 2320, width: 521, height: 72 }, text('Token embedding layer'), { size: 32 });
  builder.pill('tokenized-text', 'input', { x: 965, y: 2467, width: 374, height: 72 }, text('Tokenized text'), { size: 32 });
  builder.text('sample-input', 'input-label', { x: cx, y: 2700 }, 'Sample input text', {
    size: 34,
    align: 'center',
    fill: spec.theme.muted,
  });

  // Hybrid attention: Gated DeltaNet / QSA in a 3:1 ratio.
  const attentionBox = BACKBONE.attention;
  builder.box('attention-block', 'attention-block', attentionBox, {
    fill: builder.solid(COLORS.attention),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 26,
    sourceId: attention.id,
  });
  const attentionCenter = centerX(attentionBox);
  const deltaName = delta ? familyName((delta.data as OperationNode['data']).family) : 'Gated DeltaNet';
  builder.text('attention-line-1', 'attention-label', { x: attentionCenter, y: attentionBox.y + 62 }, `${deltaName} or`, {
    size: 33,
    fill: COLORS.delta,
    align: 'center',
    sourceId: attention.id,
    label: `${deltaName} or`,
  });
  builder.text('attention-line-2', 'attention-label', { x: attentionCenter, y: attentionBox.y + 118 }, familyName((attention.data as OperationNode['data']).family), {
    size: 28,
    fill: spec.theme.accent,
    align: 'center',
    sourceId: attention.id,
    label: familyName((attention.data as OperationNode['data']).family),
  });
  builder.text('attention-line-3', 'attention-label', { x: attentionCenter, y: attentionBox.y + 172 }, 'in 3:1 ratio', {
    size: 31,
    fill: '#FFFFFF',
    align: 'center',
    sourceId: attention.id,
    label: 'in 3:1 ratio',
  });

  // Norm and position-embedding side pills.
  builder.pill('qk-norm', 'side-pill', { x: 526, y: 1641, width: 290, height: 68 }, text('QK-Norm'), { size: 30 });
  builder.box('rope', 'side-pill', { x: 495, y: 1733, width: 396, height: 122 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke(spec.theme.ink, 5),
    radius: 30,
    sourceId: 'rope',
    label: 'Partial RoPE (QSA layers only)',
  });
  builder.text('rope-label', 'side-pill-label', { x: 693, y: 1786 }, 'Partial RoPE', { size: 30, align: 'center' });
  builder.text('rope-note', 'side-pill-label', { x: 693, y: 1828 }, '(QSA layers only)', { size: 28, align: 'center' });
  builder.flow('qk-norm-flow', [{ x: 816, y: 1675 }, { x: attentionBox.x - 6, y: 1752 }], { width: 5 });
  builder.flow('rope-flow', [{ x: 891, y: 1794 }, { x: attentionBox.x - 6, y: 1828 }], { width: 5 });

  // Repetition marker.
  builder.glyph('repeat-brace', 'repeat-marker', { x: 735, y: 2125 }, 'brace', 190);
  builder.text('repeat-count', 'repeat-marker', { x: 652, y: 2245 }, `${repeatCount}`, {
    size: 42,
    weight: 700,
    fill: spec.theme.accent,
    label: `${repeatCount}`,
  });
  builder.text('repeat-x', 'repeat-marker', { x: 712, y: 2244 }, '×', { size: 42, weight: 700, fill: spec.theme.accent });

  // Leaders to the mask and GR insets.
  builder.flow('mask-zoom-leader', [{ x: 1382, y: 1700 }, { x: 2150, y: 1140 }], {
    role: 'zoom-leader',
    dash: 'dotted',
    arrow: 'none',
  });
  builder.flow('gr-zoom-leader', [{ x: 1445, y: 2035 }, { x: 1596, y: 2508 }], {
    role: 'zoom-leader',
    dash: 'dotted',
    arrow: 'none',
  });
}

function drawMask(
  builder: TemplateScene,
  spec: FigureSpec,
  mask: MaskNode,
  maskInsetId: Id,
  blockSize: number,
): void {
  const inset = groupOf(spec, maskInsetId);
  builder.group(maskInsetId, 'mask-inset', MASK.inset, [], {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke(spec.theme.ink, 9, 'dashed'),
    sourceId: inset.id,
  });
  if (inset.title) {
    builder.text('mask-inset-title', 'mask-inset-title', { x: MASK.centerX, y: 330 }, inset.title, {
      size: 52,
      weight: 700,
      align: 'center',
      sourceId: inset.id,
      label: builder.labelOf(inset.title),
    });
  }

  const { rows, columns, values } = mask.data;
  const columnsPerBlock = blockSize > 0 ? blockSize : 4;
  const rowsPerBlock = columnsPerBlock;
  const columnBlocks = Math.ceil(columns.length / columnsPerBlock);
  const rowBlocks = Math.ceil(rows.length / rowsPerBlock);
  const blockX = (index: number) => MASK.originX + index * (MASK.blockSize + MASK.blockGap);
  const blockY = (index: number) => MASK.originY + index * (MASK.blockSize + MASK.blockGap);

  for (let block = 0; block < columnBlocks; block += 1) {
    const label = `Block ${block + 1}`;
    builder.text(`mask-block-label-${block + 1}`, 'mask-block-label', {
      x: blockX(block) + MASK.blockSize / 2,
      y: MASK.originY - 248,
    }, label, {
      size: 30,
      align: 'center',
      fill: spec.theme.muted,
      sourceId: inset.id,
      label,
    });
  }

  columns.forEach((column, index) => {
    const block = Math.floor(index / columnsPerBlock);
    const local = index % columnsPerBlock;
    builder.text(`mask-column-label-${index + 1}`, 'mask-column-label', {
      x: blockX(block) + local * MASK.cell + MASK.cell / 2,
      y: MASK.originY - 22,
    }, `${index + 1}`, {
      size: 24,
      align: 'center',
      fill: spec.theme.muted,
      sourceId: mask.id,
      label: column,
    });
  });

  rows.forEach((row, index) => {
    const block = Math.floor(index / rowsPerBlock);
    const local = index % rowsPerBlock;
    builder.text(`mask-row-label-${index + 1}`, 'mask-row-label', {
      x: MASK.rowLabelX,
      y: blockY(block) + local * MASK.cell + 67,
    }, row, {
      size: 30,
      align: 'end',
      sourceId: mask.id,
      label: row,
    });
  });

  for (let rowBlock = 0; rowBlock < rowBlocks; rowBlock += 1) {
    for (let columnBlock = 0; columnBlock < columnBlocks; columnBlock += 1) {
      const cells: Array<{ row: number; column: number; text: string; fill: Fill }> = [];
      for (let localRow = 0; localRow < rowsPerBlock; localRow += 1) {
        for (let localColumn = 0; localColumn < columnsPerBlock; localColumn += 1) {
          const row = rowBlock * rowsPerBlock + localRow;
          const column = columnBlock * columnsPerBlock + localColumn;
          if (row >= rows.length || column >= columns.length) continue;
          const value = values[row * columns.length + column] ?? 0;
          cells.push({
            row: localRow,
            column: localColumn,
            text: `${value}`,
            fill: builder.solid(value === 1 ? COLORS.maskHit : COLORS.maskMiss),
          });
        }
      }
      builder.elements.push({
        id: `mask-grid-${rowBlock + 1}-${columnBlock + 1}`,
        sourceId: mask.id,
        role: 'mask-grid',
        label: `rows ${rowBlock * rowsPerBlock + 1}-${(rowBlock + 1) * rowsPerBlock}, columns ${columnBlock * columnsPerBlock + 1}-${(columnBlock + 1) * columnsPerBlock}`,
        kind: 'grid',
        box: { x: blockX(columnBlock), y: blockY(rowBlock), width: MASK.blockSize, height: MASK.blockSize },
        rows: Math.min(rowsPerBlock, rows.length - rowBlock * rowsPerBlock),
        columns: Math.min(columnsPerBlock, columns.length - columnBlock * columnsPerBlock),
        cells,
      });
    }
  }

  // Highlight the current token row across two selected micro-blocks.
  const currentRow = rows.indexOf('context');
  if (currentRow >= 0) {
    const rowBlock = Math.floor(currentRow / rowsPerBlock);
    const localRow = currentRow % rowsPerBlock;
    const y = blockY(rowBlock) + localRow * MASK.cell;
    const highlight = (id: string, box: Box) => builder.box(id, 'mask-highlight', box, {
      fill: builder.solid('none'),
      stroke: builder.stroke(spec.theme.accent, 9),
      radius: 22,
      sourceId: mask.id,
      label: 'context row',
    });
    highlight('mask-highlight-1', {
      x: blockX(0) - 9,
      y: y - 9,
      width: MASK.blockSize + 18,
      height: MASK.cell + 18,
    });
    highlight('mask-highlight-2', {
      x: blockX(columnBlocks - 1) - 9,
      y: y - 9,
      width: MASK.cell * Math.max(1, columnsPerBlock - 1) + 18,
      height: MASK.cell + 18,
    });
    const arcStart = { x: blockX(0) + MASK.blockSize * 0.45, y: y - 26 };
    const arcEnd = { x: blockX(columnBlocks - 1) + 14, y: y - 26 };
    const arcMid = (arcStart.x + arcEnd.x) / 2;
    builder.flow('mask-selection-arc', [
      arcStart,
      { x: arcMid - 170, y: y - 120 },
      { x: arcMid + 60, y: y - 132 },
      { x: arcEnd.x - 150, y: y - 70 },
      arcEnd,
    ], { role: 'mask-selection-arc', stroke: spec.theme.accent, width: 7 });
  }

  const caption = [
    'The current token attends to every token in selected complete',
    'micro-blocks, plus visible tokens in its current incomplete block',
  ];
  caption.forEach((line, index) => {
    builder.text(`mask-caption-${index + 1}`, 'mask-caption', {
      x: MASK.centerX,
      y: bottom(MASK.inset) - 100 + index * 48,
    }, line, { size: 34, align: 'center', sourceId: inset.id, label: line });
  });
}

function drawResidualInset(
  builder: TemplateScene,
  spec: FigureSpec,
  residualInsetId: Id,
  read: OperationNode,
  write: OperationNode,
): void {
  const inset = groupOf(spec, residualInsetId);
  const streams = read.data.family === 'gated-residual' ? read.data.streams : 4;
  builder.group(residualInsetId, 'gr-inset', GR.inset, [], {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke(spec.theme.ink, 9, 'dotted'),
    sourceId: inset.id,
  });
  builder.text('gr-inset-title', 'gr-inset-title', { x: 1730, y: 2670 }, {
    spans: [
      { text: 'GR ', color: 'accent', emphasis: 'bold' },
      { text: '(Gated Residual)', emphasis: 'bold' },
    ],
  }, {
    size: 58,
    align: 'start',
    sourceId: inset.id,
    label: 'GR (Gated Residual)',
  });

  const readBox = GR.read;
  const subBox = GR.sublayer;
  const writeBox = GR.write;
  builder.box('gr-read-node', 'gr-read-node', readBox, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke(spec.theme.ink, 5),
    radius: 18,
    sourceId: read.id,
    label: 'GR Read',
  });
  builder.box('gr-sublayer', 'gr-sublayer', subBox, {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 5),
    radius: 18,
    label: 'Sublayer (attention or MoE)',
  });
  builder.box('gr-write-node', 'gr-write-node', writeBox, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke(spec.theme.ink, 5),
    radius: 18,
    sourceId: write.id,
    label: 'GR Write',
  });

  const readCenter = centerX(readBox);
  builder.text('gr-read-title', 'gr-node-title', { x: readCenter, y: readBox.y + 56 }, { spans: [{ text: 'GR Read', color: 'accent', emphasis: 'bold' }] }, {
    size: 34,
    align: 'center',
    sourceId: read.id,
    label: 'GR Read',
  });
  builder.text('gr-read-body-1', 'gr-node-body', { x: readCenter, y: readBox.y + 100 }, 'RMSNorm each branch', { size: 28, align: 'center', sourceId: read.id });
  builder.text('gr-read-body-2', 'gr-node-body', { x: readCenter, y: readBox.y + 137 }, 'element-wise gates', { size: 28, align: 'center', sourceId: read.id });
  builder.text('gr-read-body-3', 'gr-node-body', { x: readCenter, y: readBox.y + 174 }, 'gated average', { size: 28, align: 'center', sourceId: read.id });

  const subCenter = centerX(subBox);
  builder.text('gr-sublayer-title', 'gr-node-body', { x: subCenter, y: subBox.y + 90 }, 'Sublayer', { size: 31, align: 'center' });
  builder.text('gr-sublayer-note', 'gr-node-body', { x: subCenter, y: subBox.y + 132 }, '(attention or MoE)', { size: 26, align: 'center' });

  const writeCenter = centerX(writeBox);
  builder.text('gr-write-title', 'gr-node-title', { x: writeCenter, y: writeBox.y + 56 }, { spans: [{ text: 'GR Write', color: 'accent', emphasis: 'bold' }] }, {
    size: 34,
    align: 'center',
    sourceId: write.id,
    label: 'GR Write',
  });
  builder.text('gr-write-body-1', 'gr-node-body', { x: writeCenter, y: writeBox.y + 96 }, 'one scalar gate', { size: 27, align: 'center', sourceId: write.id });
  builder.text('gr-write-body-2', 'gr-node-body', { x: writeCenter, y: writeBox.y + 132 }, 'for each branch', { size: 27, align: 'center', sourceId: write.id });
  builder.text('gr-formula', 'gr-formula', { x: writeCenter, y: writeBox.y + 176 }, { spans: [{ text: 'R′ = R + s·y', emphasis: 'italic' }] }, {
    size: 30,
    align: 'center',
    sourceId: write.id,
    label: 'R′ = R + s·y',
  });

  const top = readBox.y + 40;
  const step = streams > 1 ? (readBox.height - 80) / (streams - 1) : 0;
  for (let index = 0; index < streams; index += 1) {
    const y = top + index * step;
    builder.flow(`gr-branch-in-${index + 1}`, [{ x: GR.branchInX, y }, { x: readBox.x, y }], {
      role: 'gr-branch',
      width: 5,
      arrow: 'none',
    });
    builder.flow(`gr-branch-out-${index + 1}`, [{ x: right(writeBox), y }, { x: GR.branchOutX, y }], {
      role: 'gr-branch',
      width: 5,
      arrow: 'none',
    });
    for (const [suffix, x] of [['in', GR.branchInX], ['out', GR.branchOutX]] as const) {
      builder.box(`gr-branch-dot-${suffix}-${index + 1}`, 'gr-branch-dot', { x: x - 10, y: y - 10, width: 20, height: 20 }, {
        fill: builder.solid(spec.theme.ink),
        stroke: builder.stroke(spec.theme.ink, 0),
        radius: 10,
      });
    }
  }

  builder.flow('gr-read-to-sublayer', [{ x: right(readBox), y: centerY(readBox) }, { x: subBox.x, y: centerY(readBox) }], { width: 5 });
  builder.flow('gr-sublayer-to-write', [{ x: right(subBox), y: centerY(subBox) }, { x: writeBox.x, y: centerY(subBox) }], { width: 5 });

  builder.text('gr-caption-title', 'gr-note-title', { x: 1900, y: 3065 }, {
    spans: [
      { text: 'with ', emphasis: 'bold' },
      { text: `${streams}`, color: 'accent', emphasis: 'bold' },
      { text: ' parallel residual branches', emphasis: 'bold' },
    ],
  }, { size: 34, align: 'start', sourceId: inset.id, label: `with ${streams} parallel residual branches` });

  const notes = [
    'GR Read collapses the branches to one sublayer input',
    'GR Write injects the output into all branches; there is no H_res',
    'branch mixer as in mHC',
  ];
  notes.forEach((note, index) => {
    builder.text(`gr-note-${index + 1}`, 'gr-note', { x: 1900, y: 3125 + index * 44 }, note, {
      size: 29,
      align: 'start',
      sourceId: inset.id,
      label: note,
    });
  });
}

function drawAnnotations(builder: TemplateScene, spec: FigureSpec): void {
  const leaders: Array<[Id, Point[]]> = [
    ['vocabulary', [{ x: 352, y: 700 }, { x: 955, y: 540 }]],
    ['moe-spec', [{ x: 350, y: 1122 }, { x: 955, y: 1058 }]],
    ['qsa', [{ x: 282, y: 1432 }, { x: 620, y: 1560 }, { x: 1000, y: 1686 }]],
    ['gated-delta', [{ x: 302, y: 1662 }, { x: 520, y: 1884 }, { x: 876, y: 1872 }]],
    ['context', [{ x: 262, y: 1992 }, { x: 760, y: 1920 }]],
    ['ngram', [{ x: 432, y: 2540 }, { x: 958, y: 2502 }]],
    ['embedding', [{ x: 472, y: 2800 }, { x: 700, y: 2410 }]],
  ];
  for (const [id, points] of leaders) {
    const annotation = (spec.annotations ?? []).find((candidate) => candidate.id === id);
    if (!annotation) continue;
    builder.flow(`leader-${id}`, points, {
      role: 'leader',
      width: 5,
      dash: 'dotted',
      arrow: 'none',
      sourceId: annotation.id,
    });
  }

  builder.callout(spec, 'vocabulary', { x: 30, y: 620 });
  builder.callout(spec, 'moe-spec', { x: 30, y: 1080 });
  builder.callout(spec, 'qsa', { x: 30, y: 1350 });
  builder.callout(spec, 'gated-delta', { x: 30, y: 1600 });
  builder.callout(spec, 'context', { x: 25, y: 1960 });
  builder.callout(spec, 'ngram', { x: 120, y: 2560 });
  builder.callout(spec, 'embedding', { x: 400, y: 2820 });
}

function scaleScene(scene: Scene, canvas: Size): Scene {
  const sx = canvas.width / REFERENCE.width;
  const sy = canvas.height / REFERENCE.height;
  const ss = Math.min(sx, sy);
  if (sx === 1 && sy === 1) return scene;
  const scaleBox = (box: Box): Box => ({ x: box.x * sx, y: box.y * sy, width: box.width * sx, height: box.height * sy });
  const scalePoint = (point: Point): Point => ({ x: point.x * sx, y: point.y * sy });
  return {
    ...scene,
    elements: scene.elements.map((element): SceneElement => {
      switch (element.kind) {
        case 'group':
        case 'box':
          return { ...element, box: scaleBox(element.box) };
        case 'stack':
          return { ...element, box: scaleBox(element.box), offset: scalePoint(element.offset) };
        case 'grid':
          return { ...element, box: scaleBox(element.box) };
        case 'path':
          return { ...element, points: element.points.map(scalePoint), stroke: { ...element.stroke, width: element.stroke.width * ss } };
        case 'glyph':
          return { ...element, at: scalePoint(element.at), size: element.size * ss };
        case 'text':
          return {
            ...element,
            at: scalePoint(element.at),
            lines: element.lines.map((line) => ({
              ...line,
              baseline: line.baseline * sy,
              spans: line.spans.map((span) => ({ ...span, x: span.x * sx, width: span.width * sx, size: span.size * ss })),
            })),
          };
        default:
          return element;
      }
    }),
  };
}

export function layoutQwenSparse(spec: FigureSpec, context: LayoutContext): Scene {
  if (spec.layout.mode !== 'template' || spec.layout.template !== 'attention-mask') {
    layoutFailure('wrong-template', 'attention-mask layout requires template attention-mask');
  }

  const blockId = slot(spec, 'block');
  const maskInsetId = slot(spec, 'mask');
  const residualInsetId = slot(spec, 'residual');
  const attention = requiredOperation(spec, 'attention', (node) => node.data.family === 'qsa', 'attention-mask layout requires a qsa attention node');
  const moe = requiredOperation(spec, 'moe', (node) => node.data.family === 'moe', 'attention-mask layout requires a moe node');
  const read = requiredOperation(spec, 'read', (node) => node.data.family === 'gated-residual' && node.data.operation === 'read', 'attention-mask layout requires a gated-residual read node');
  const write = requiredOperation(spec, 'write', (node) => node.data.family === 'gated-residual' && node.data.operation === 'write', 'attention-mask layout requires a gated-residual write node');
  const deltaId = optionalSlot(spec, 'delta');
  const delta = deltaId
    ? operationOf(spec, deltaId)
    : operationByFamily(spec, (node) => node.data.family === 'gated-delta-net');
  const maskId = optionalSlot(spec, 'maskNode') ?? spec.nodes.find((node) => node.kind === 'mask')?.id;
  if (!maskId) layoutFailure('missing-node', 'attention-mask layout requires a mask node');
  const maskNode = nodeOf(spec, maskId);
  if (maskNode.kind !== 'mask') layoutFailure('wrong-node-kind', `Node "${maskId}" must be a mask node`, [maskId]);
  const mask = maskNode as MaskNode;

  if (attention.data.family !== 'qsa') {
    layoutFailure('wrong-attention', 'attention-mask layout requires a qsa attention node', [attention.id]);
  }
  if (read.data.family !== 'gated-residual' || read.data.operation !== 'read') {
    layoutFailure('wrong-residual-node', 'attention-mask layout requires a gated-residual read node', [read.id]);
  }
  if (write.data.family !== 'gated-residual' || write.data.operation !== 'write') {
    layoutFailure('wrong-residual-node', 'attention-mask layout requires a gated-residual write node', [write.id]);
  }
  if (mask.data.values.length !== mask.data.rows.length * mask.data.columns.length) {
    layoutFailure('invalid-mask', 'Mask values must cover every row/column pair', [mask.id]);
  }

  const builder = new TemplateScene(spec.theme, context.metrics, { pillRadius: 30, pillSize: 32, pillIdSuffix: false, pillSourceId: 'id', calloutIdStyle: 'line' });
  drawTitle(builder, spec);
  drawBackbone(builder, spec, blockId, attention, delta, moe, read, write);
  drawMask(builder, spec, mask, maskInsetId, attention.data.blockSize ?? 4);
  drawResidualInset(builder, spec, residualInsetId, read, write);
  drawAnnotations(builder, spec);

  return scaleScene(builder.scene(spec), spec.canvas);
}
