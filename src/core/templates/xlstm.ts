import { FigureLayoutError } from '../errors';
import { SceneBuilder } from '../sceneBuilder';
import type { Box, FigureSpec, GroupSpec, Id, LayoutContext, NodeSpec, Point, Scene, TextSpec } from '../types';

type OperationNode = Extract<NodeSpec, { kind: 'operation' | 'composite' }>;

function text(value: string): TextSpec {
  return { spans: [{ text: value }] };
}

function fail(code: string, message: string): never {
  throw new FigureLayoutError([{ severity: 'error', code, message }]);
}

function groupOf(spec: FigureSpec, id: Id): GroupSpec {
  const group = spec.groups.find((candidate) => candidate.id === id);
  if (!group) fail('missing-group', `Group "${id}" does not exist`);
  return group;
}

function slot(spec: FigureSpec, name: string): Id {
  if (spec.layout.mode !== 'template') fail('wrong-layout', 'xLSTM requires template layout');
  const value = spec.layout.slots[name];
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) fail('missing-slot', `xLSTM requires a "${name}" slot`);
  return id;
}

function operation(spec: FigureSpec, family: 'xlstm' | 'ffn'): OperationNode {
  const node = spec.nodes.find((candidate): candidate is OperationNode =>
    (candidate.kind === 'operation' || candidate.kind === 'composite') && candidate.data.family === family);
  if (!node) fail('missing-operation', `xLSTM requires a ${family} operation`);
  return node;
}

function annotationLines(spec: FigureSpec, id: Id): TextSpec[] {
  const annotation = (spec.annotations ?? []).find((candidate) => candidate.id === id);
  if (!annotation) return [];
  return 'bullets' in annotation.content ? annotation.content.bullets : [annotation.content];
}

function callout(builder: SceneBuilder, spec: FigureSpec, id: Id, at: Point, options: { size?: number; lineGap?: number } = {}): void {
  annotationLines(spec, id).forEach((line, index) => {
    builder.text(`${id}-${index}`, `annotation-${id}`, { x: at.x, y: at.y + index * (options.lineGap ?? 58) }, line, {
      size: options.size ?? 44,
      weight: 700,
    });
  });
}

function flow(builder: SceneBuilder, id: Id, points: Point[], options: { role?: string; dash?: 'solid' | 'dashed' | 'dotted'; arrow?: 'none' | 'end' | 'both'; junction?: 'plus' | 'multiply' } = {}): void {
  builder.path(id, options.role ?? 'flow-path', points, {
    stroke: builder.stroke('#000000', 6, options.dash),
    arrow: options.arrow ?? 'end',
    junction: options.junction,
  });
}

function pill(builder: SceneBuilder, id: Id, role: string, box: Box, content: TextSpec, options: { fill?: string; stroke?: string; size?: number } = {}): void {
  builder.box(`${id}-box`, role, box, {
    fill: builder.solid(options.fill ?? '#FFFFFF'),
    stroke: builder.stroke(options.stroke ?? '#000000', 5),
    radius: 28,
  });
  builder.text(`${id}-label`, `${role}-label`, { x: box.x + box.width / 2, y: box.y + box.height / 2 + (options.size ?? 34) * 0.36 }, content, {
    size: options.size ?? 34,
    weight: 500,
    align: 'center',
  });
}

function backbone(builder: SceneBuilder, spec: FigureSpec, xlstm: OperationNode): void {
  const cx = 1110;
  const block = spec.groups.find((group) => group.kind === 'repeat-block');
  const repeat = block?.repeat?.count ?? 0;
  builder.group('model', 'model-container', { x: 550, y: 300, width: 1100, height: 2040 }, [], {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 6),
    sourceId: 'model',
  });
  builder.box('repeat-block', 'repeat-block', { x: 720, y: 650, width: 790, height: 1220 }, {
    fill: builder.solid(block?.style?.fill?.kind === 'solid' ? block.style.fill.color : spec.theme.accent),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 64,
    sourceId: block?.id,
  });
  flow(builder, 'residual-attention', [{ x: cx, y: 1450 }, { x: 1335, y: 1450 }, { x: 1335, y: 1200 }, { x: 1140, y: 1200 }], { role: 'residual-path', junction: 'plus' });
  flow(builder, 'residual-ffn', [{ x: cx, y: 940 }, { x: 1335, y: 940 }, { x: 1335, y: 700 }, { x: 1140, y: 700 }], { role: 'residual-path', junction: 'plus' });
  const rail: Array<[string, number, number]> = [
    ['input', 2590, 2490], ['embedding', 2360, 2155], ['pre-attention', 1960, 1730], ['attention', 1570, 1545],
    ['post-attention', 1380, 1140], ['ffn', 950, 950], ['block-output', 820, 590], ['final-norm', 510, 450], ['output', 370, 190],
  ];
  rail.forEach(([id, from, to]) => flow(builder, `flow-${id}`, [{ x: cx, y: from }, { x: cx, y: to }]));
  pill(builder, 'output-layer', 'output-layer', { x: 920, y: 360, width: 380, height: 84 }, text('Linear output layer'));
  pill(builder, 'final-rmsnorm', 'norm', { x: 920, y: 500, width: 380, height: 84 }, text('Final RMSNorm'));
  pill(builder, 'ffn', 'feed-forward', { x: 920, y: 860, width: 380, height: 84 }, text('Feed forward'), { fill: spec.theme.surface });
  pill(builder, 'rmsnorm-2', 'norm', { x: 920, y: 1050, width: 380, height: 84 }, text('RMSNorm 2'));
  builder.box('xlstm-box', 'attention-block', { x: 860, y: 1380, width: 500, height: 165 }, {
    fill: builder.solid('#5E5E5E'),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 28,
    sourceId: xlstm.id,
  });
  const spans = xlstm.label?.spans ?? [{ text: 'xLSTM with matrix' }, { text: 'memory' }];
  builder.text('xlstm-line-1', 'attention-label', { x: cx, y: 1442 }, { spans: spans.slice(0, 1) }, { size: 36, fill: '#FFFFFF', align: 'center', sourceId: xlstm.id });
  builder.text('xlstm-line-2', 'attention-label', { x: cx, y: 1490 }, { spans: spans.slice(1) }, { size: 36, fill: '#FFFFFF', align: 'center', sourceId: xlstm.id });
  pill(builder, 'rmsnorm-1', 'norm', { x: 920, y: 1640, width: 380, height: 84 }, text('RMSNorm 1'));
  pill(builder, 'embedding-layer', 'embedding', { x: 840, y: 2060, width: 540, height: 90 }, text('Token embedding layer'));
  pill(builder, 'tokenized-text', 'input', { x: 940, y: 2400, width: 340, height: 84 }, text('Tokenized text'));
  builder.text('sample-input', 'input-label', { x: cx, y: 2580 }, text('Sample input text'), { size: 48, align: 'center', family: spec.theme.monospaceFamily ?? 'monospace' });
  builder.text('repeat-count', 'repeat-marker', { x: 570, y: 1905 }, `${repeat}`, { size: 58, weight: 700, fill: spec.theme.accent });
  builder.text('repeat-x', 'repeat-marker', { x: 655, y: 1905 }, '×', { size: 58, weight: 700, fill: spec.theme.accent });
  builder.glyph('repeat-brace', 'repeat-marker', { x: 765, y: 1870 }, 'brace', 150);
}

function ffnInset(builder: SceneBuilder): void {
  builder.box('ffn-inset', 'ffn-inset', { x: 1830, y: 320, width: 800, height: 610 }, {
    fill: builder.solid('#F3F3F3'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 54,
  });
  pill(builder, 'ffn-linear-top', 'inset-operation', { x: 1880, y: 380, width: 230, height: 80 }, text('Linear layer'), { size: 30 });
  pill(builder, 'ffn-activation', 'inset-operation', { x: 1880, y: 580, width: 230, height: 80 }, text('SiLU activation'), { size: 30 });
  pill(builder, 'ffn-linear-bottom', 'inset-operation', { x: 1880, y: 780, width: 230, height: 80 }, text('Linear layer'), { size: 30 });
  pill(builder, 'ffn-linear-side', 'inset-operation', { x: 2240, y: 580, width: 230, height: 80 }, text('Linear layer'), { size: 30 });
  builder.glyph('ffn-multiply', 'operator', { x: 2210, y: 490 }, 'multiply', 54);
  flow(builder, 'ffn-up-1', [{ x: 1995, y: 780 }, { x: 1995, y: 660 }], { role: 'inset-flow' });
  flow(builder, 'ffn-up-2', [{ x: 1995, y: 580 }, { x: 1995, y: 460 }], { role: 'inset-flow' });
  flow(builder, 'ffn-side-a', [{ x: 1995, y: 490 }, { x: 2210, y: 490 }], { role: 'inset-flow', arrow: 'none' });
  flow(builder, 'ffn-side-b', [{ x: 2240, y: 490 }, { x: 2355, y: 490 }, { x: 2355, y: 580 }], { role: 'inset-flow', arrow: 'none' });
}

function mlstmInset(builder: SceneBuilder, title: TextSpec): void {
  builder.text('mlstm-title', 'mlstm-title', { x: 1930, y: 1360 }, title, { size: 44, weight: 800 });
  builder.box('mlstm-inset', 'mlstm-inset', { x: 1740, y: 1420, width: 1080, height: 1130 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke('#A58F00', 8, 'dotted'),
    radius: 58,
  });
  pill(builder, 'mlstm-output', 'inset-operation', { x: 2150, y: 1490, width: 160, height: 70 }, text('Linear'), { size: 30 });
  builder.glyph('mlstm-multiply', 'operator', { x: 2220, y: 1620 }, 'multiply', 54);
  pill(builder, 'mlstm-rmsnorm', 'inset-operation', { x: 2140, y: 1710, width: 180, height: 70 }, text('RMSNorm'), { size: 28 });
  pill(builder, 'mlstm-operation', 'inset-operation', { x: 1950, y: 1820, width: 600, height: 85 }, text('mLSTM'), { fill: '#FFF6BF', size: 34 });
  const labels: Array<[string, number]> = [['Q', 2000], ['K', 2050], ['V', 2220], ['f', 2380], ['i', 2450]];
  labels.forEach(([label, x]) => builder.text(`mlstm-${label}`, 'recurrent-input', { x, y: 1950 }, text(label), { size: 38, weight: 700, align: 'center' }));
  pill(builder, 'mlstm-qk-linear', 'inset-operation', { x: 1950, y: 2390, width: 170, height: 70 }, text('Linear'), { size: 28 });
  pill(builder, 'mlstm-v-linear', 'inset-operation', { x: 2160, y: 2390, width: 160, height: 70 }, text('Linear'), { size: 28 });
  pill(builder, 'mlstm-fi-linear', 'inset-operation', { x: 2340, y: 2390, width: 170, height: 70 }, text('Linear'), { size: 28 });
  pill(builder, 'mlstm-gate-linear', 'inset-operation', { x: 2580, y: 2390, width: 160, height: 70 }, text('Linear'), { size: 28 });
  builder.glyph('mlstm-f-sigmoid', 'operator', { x: 2380, y: 2160 }, 'sigmoid', 44);
  builder.glyph('mlstm-i-exp', 'operator', { x: 2450, y: 2260 }, 'exp', 32);
  builder.glyph('mlstm-gate', 'operator', { x: 2620, y: 2070 }, 'sigmoid', 50);
  builder.text('mlstm-gate-label', 'mixing-gate', { x: 2670, y: 2060 }, text('Sigmoid'), { size: 28 });
  builder.text('mlstm-gate-label-2', 'mixing-gate', { x: 2670, y: 2098 }, text('Gate'), { size: 28 });
  flow(builder, 'mlstm-rule-up', [{ x: 2250, y: 1820 }, { x: 2250, y: 1780 }], { role: 'inset-flow' });
  flow(builder, 'mlstm-output-up', [{ x: 2250, y: 1710 }, { x: 2250, y: 1620 }], { role: 'inset-flow' });
  flow(builder, 'mlstm-output-top', [{ x: 2250, y: 1620 }, { x: 2250, y: 1560 }], { role: 'inset-flow' });
  flow(builder, 'mlstm-q-flow', [{ x: 2000, y: 2390 }, { x: 2000, y: 1905 }], { role: 'inset-flow' });
  flow(builder, 'mlstm-k-flow', [{ x: 2050, y: 2390 }, { x: 2050, y: 1905 }], { role: 'inset-flow' });
  flow(builder, 'mlstm-v-flow', [{ x: 2240, y: 2390 }, { x: 2240, y: 1905 }], { role: 'inset-flow' });
  flow(builder, 'mlstm-f-flow', [{ x: 2400, y: 2390 }, { x: 2400, y: 1905 }], { role: 'inset-flow' });
  flow(builder, 'mlstm-i-flow', [{ x: 2450, y: 2390 }, { x: 2450, y: 1905 }], { role: 'inset-flow' });
  flow(builder, 'mlstm-gate-flow', [{ x: 2660, y: 2390 }, { x: 2660, y: 2070 }, { x: 2275, y: 1620 }], { role: 'inset-flow' });
}

export function layoutXlstm(spec: FigureSpec, context: LayoutContext): Scene {
  if (spec.layout.mode !== 'template' || spec.layout.template !== 'backbone') fail('wrong-template', 'xLSTM is a backbone recurrent-detail variant');
  const xlstm = operation(spec, 'xlstm');
  operation(spec, 'ffn');
  const mlstmGroup = groupOf(spec, slot(spec, 'mlstm'));
  groupOf(spec, slot(spec, 'ffn'));
  const builder = new SceneBuilder(spec.theme, context.metrics);
  builder.text('figure-title', 'title', { x: 790, y: 100 }, spec.title, { size: 112, weight: 900, fill: spec.theme.accent, align: 'center', family: "'Arial Black', Arial, sans-serif" });
  backbone(builder, spec, xlstm);
  ffnInset(builder);
  mlstmInset(builder, mlstmGroup.title ?? text('mLSTM layer'));
  callout(builder, spec, 'credit', { x: 2350, y: 1510 }, { size: 30, lineGap: 42 });
  callout(builder, spec, 'vocabulary', { x: 1450, y: 200 }, { size: 44 });
  callout(builder, spec, 'context', { x: 110, y: 1730 }, { size: 44 });
  callout(builder, spec, 'embedding-dimension', { x: 20, y: 2390 }, { size: 44 });
  callout(builder, spec, 'ffn-dimensions', { x: 2040, y: 1150 }, { size: 44 });
  flow(builder, 'ffn-zoom', [{ x: 1300, y: 900 }, { x: 1830, y: 550 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  flow(builder, 'mlstm-zoom', [{ x: 1360, y: 1450 }, { x: 1740, y: 1770 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  return builder.scene(spec);
}
