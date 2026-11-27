import { FigureLayoutError } from '../errors';
import { SceneBuilder } from '../sceneBuilder';
import type {
  AnnotationSpec,
  Box,
  FigureSpec,
  GroupSpec,
  Id,
  LayoutContext,
  NodeSpec,
  Point,
  Scene,
  TextSpec,
} from '../types';

type OperationNode = Extract<NodeSpec, { kind: 'operation' | 'composite' }>;

function layoutFailure(code: string, message: string, sourceIds?: Id[]): never {
  throw new FigureLayoutError([{ severity: 'error', code, message, sourceIds }]);
}

function text(value: string): TextSpec {
  return { spans: [{ text: value }] };
}

function slot(spec: FigureSpec, name: string): Id {
  if (spec.layout.mode !== 'template') layoutFailure('wrong-layout', 'mixing-detail requires template layout');
  const value = spec.layout.slots[name];
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) layoutFailure('missing-slot', `mixing-detail requires a "${name}" slot`, [name]);
  return id;
}

function groupOf(spec: FigureSpec, id: Id): GroupSpec {
  const group = spec.groups.find((candidate) => candidate.id === id);
  if (!group) layoutFailure('missing-group', `Group "${id}" does not exist`, [id]);
  return group;
}

function operation(spec: FigureSpec, predicate: (node: OperationNode) => boolean): OperationNode {
  const node = spec.nodes.find((candidate): candidate is OperationNode =>
    (candidate.kind === 'operation' || candidate.kind === 'composite') && predicate(candidate));
  if (!node) layoutFailure('missing-operation', 'mixing-detail requires matching operation nodes');
  return node;
}

function annotation(spec: FigureSpec, id: Id): AnnotationSpec | undefined {
  return (spec.annotations ?? []).find((candidate) => candidate.id === id);
}

function annotationLines(spec: FigureSpec, id: Id): TextSpec[] {
  const item = annotation(spec, id);
  if (!item) return [];
  return 'bullets' in item.content ? item.content.bullets : [item.content];
}

function flow(builder: SceneBuilder, id: Id, points: Point[], options: { stroke?: string; dash?: 'solid' | 'dashed' | 'dotted'; arrow?: 'none' | 'end' | 'both'; role?: string; junction?: 'plus' | 'multiply' | 'gate' } = {}): void {
  builder.path(id, options.role ?? 'flow-path', points, {
    stroke: builder.stroke(options.stroke ?? '#000000', 6, options.dash),
    arrow: options.arrow ?? 'end',
    junction: options.junction,
  });
}

function pill(builder: SceneBuilder, id: Id, role: string, box: Box, content: TextSpec, options: { fill?: string; stroke?: string; size?: number; textFill?: string } = {}): void {
  builder.box(`${id}-box`, role, box, {
    fill: builder.solid(options.fill ?? '#FFFFFF'),
    stroke: builder.stroke(options.stroke ?? '#000000', 5),
    radius: 28,
  });
  builder.text(`${id}-label`, `${role}-label`, { x: box.x + box.width / 2, y: box.y + box.height / 2 + (options.size ?? 34) * 0.36 }, content, {
    size: options.size ?? 34,
    weight: 500,
    fill: options.textFill,
    align: 'center',
  });
}

function title(builder: SceneBuilder, spec: FigureSpec): void {
  const splitAt = spec.layout.mode === 'template' && spec.layout.options?.titleLines === 2 ? spec.title.lastIndexOf(' (') : -1;
  if (splitAt > 0) {
    builder.text('figure-title', 'title', { x: 690, y: 112 }, spec.title.slice(0, splitAt), { size: 92, weight: 900, fill: spec.theme.accent, align: 'center', family: "'Arial Black', Arial, sans-serif" });
    builder.text('figure-title-2', 'title', { x: 690, y: 220 }, spec.title.slice(splitAt + 1), { size: 92, weight: 900, fill: spec.theme.accent, align: 'center', family: "'Arial Black', Arial, sans-serif" });
  } else {
    builder.text('figure-title', 'title', { x: 690, y: 140 }, spec.title, { size: 86, weight: 900, fill: spec.theme.accent, align: 'center', family: "'Arial Black', Arial, sans-serif" });
  }
}

function backbone(builder: SceneBuilder, spec: FigureSpec, attention: OperationNode, sideNote: TextSpec[]): void {
  const cx = 990;
  const block = spec.groups.find((group) => group.kind === 'repeat-block');
  const repeatCount = block?.repeat?.count ?? 0;
  builder.group('model', 'model-container', { x: 430, y: 420, width: 1120, height: 2040 }, [], {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 6),
    sourceId: 'model',
  });
  builder.box('repeat-block', 'repeat-block', { x: 620, y: 760, width: 790, height: 1240 }, {
    fill: builder.solid(block?.style?.fill?.kind === 'solid' ? block.style.fill.color : spec.theme.accent),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 64,
    sourceId: block?.id,
  });

  flow(builder, 'residual-attention', [{ x: cx, y: 1680 }, { x: 1245, y: 1680 }, { x: 1245, y: 1420 }, { x: 1025, y: 1420 }], { role: 'residual-path', junction: 'plus' });
  flow(builder, 'residual-moe', [{ x: cx, y: 1110 }, { x: 1245, y: 1110 }, { x: 1245, y: 700 }, { x: 1025, y: 700 }], { role: 'residual-path', junction: 'plus' });
  const rail: Array<[string, number, number]> = [
    ['input', 2670, 2590], ['embedding', 2435, 2285], ['pre-attention', 2100, 1888], ['attention', 1700, 1665],
    ['post-attention', 1500, 1270], ['moe', 1090, 1085], ['block-output', 970, 730], ['final-norm', 630, 585],
    ['output', 500, 340],
  ];
  rail.forEach(([id, from, to]) => flow(builder, `flow-${id}`, [{ x: cx, y: from }, { x: cx, y: to }]));

  pill(builder, 'output-layer', 'output-layer', { x: 800, y: 500, width: 380, height: 84 }, text('Linear output layer'));
  pill(builder, 'final-rmsnorm', 'norm', { x: 800, y: 640, width: 380, height: 84 }, text('Final RMSNorm'));
  pill(builder, 'moe', 'moe-block', { x: 800, y: 1000, width: 380, height: 84 }, text('MoE'), { fill: spec.theme.surface });
  pill(builder, 'rmsnorm-2', 'norm', { x: 800, y: 1180, width: 380, height: 84 }, text('RMSNorm 2'));

  builder.box('attention-box', 'attention-block', { x: 750, y: 1500, width: 480, height: 165 }, {
    fill: builder.solid('#5E5E5E'),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 28,
    sourceId: attention.id,
  });
  const spans = attention.label?.spans ?? [{ text: 'Gated DeltaNet or' }, { text: 'Gated GQA' }];
  const split = spans.length > 1 ? 1 : spans.length;
  builder.text('attention-line-1', 'attention-label', { x: cx, y: 1562 }, { spans: spans.slice(0, split) }, { size: 34, fill: '#FFFFFF', align: 'center', sourceId: attention.id });
  builder.text('attention-line-2', 'attention-label', { x: cx, y: 1610 }, { spans: spans.slice(split) }, { size: 34, fill: '#FFFFFF', align: 'center', sourceId: attention.id });
  pill(builder, 'rmsnorm-1', 'norm', { x: 800, y: 1800, width: 380, height: 84 }, text('RMSNorm 1'));
  pill(builder, 'embedding-layer', 'embedding', { x: 720, y: 2200, width: 540, height: 90 }, text('Token embedding layer'));
  pill(builder, 'tokenized-text', 'input', { x: 820, y: 2500, width: 340, height: 84 }, text('Tokenized text'));
  builder.text('sample-input', 'input-label', { x: cx, y: 2700 }, text('Sample input text'), { size: 48, align: 'center', family: spec.theme.monospaceFamily ?? 'monospace' });

  builder.box('side-note-box', 'side-note', { x: 330, y: 1440, width: 360, height: 140 }, { fill: builder.solid('#FFFFFF'), stroke: builder.stroke('#000000', 5), radius: 28 });
  sideNote.forEach((line, index) => {
    builder.text(`side-note-line-${index}`, 'side-note-label', { x: 510, y: 1490 + index * 42 }, line, { size: 30, align: 'center' });
  });
  flow(builder, 'side-note-flow', [{ x: 690, y: 1510 }, { x: 750, y: 1560 }]);
  annotationLines(spec, 'context').forEach((line, index) => {
    builder.text(`context-${index}`, 'annotation-context', { x: 20, y: 1930 + index * 58 }, line, { size: 46, weight: 700 });
  });

  builder.text('repeat-count', 'repeat-marker', { x: 470, y: 1905 }, `${repeatCount}`, { size: 58, weight: 700, fill: spec.theme.accent });
  builder.text('repeat-x', 'repeat-marker', { x: 555, y: 1905 }, '×', { size: 58, weight: 700, fill: spec.theme.accent });
  builder.glyph('repeat-brace', 'repeat-marker', { x: 665, y: 1870 }, 'brace', 150);
}

function insetFrame(builder: SceneBuilder, id: string, role: string, box: Box, titleText: TextSpec): void {
  builder.box(id, role, box, {
    fill: builder.solid('#F3F3F3'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 58,
  });
  builder.text(`${id}-title`, `${role}-title`, { x: box.x, y: box.y - 60 }, titleText, { size: 46, weight: 800 });
}

function renderGatedGqa(builder: SceneBuilder, box: Box): void {
  const x = box.x;
  const y = box.y;
  pill(builder, 'gqa-output', 'mixing-output', { x: x + 430, y: y + 55, width: 160, height: 70 }, text('Linear'));
  builder.glyph('gqa-multiply', 'operator', { x: x + 510, y: y + 185 }, 'multiply', 54);
  pill(builder, 'gqa-attention', 'mixing-operation', { x: x + 190, y: y + 280, width: 640, height: 85 }, text('Scaled dot-product attention'), { fill: '#FFF6BF', size: 32 });
  const lanes = [
    { id: 'q', label: 'Q', x: x + 230 },
    { id: 'k', label: 'K', x: x + 420 },
    { id: 'v', label: 'V', x: x + 610 },
  ];
  builder.text('gqa-qk-norm-label', 'mixing-note', { x: x + 120, y: y + 500 }, text('QK-Norm'), { size: 28, align: 'center' });
  lanes.forEach((lane) => {
    builder.text(`gqa-${lane.id}`, 'mixing-lane', { x: lane.x, y: y + 425 }, text(lane.label), { size: 38, weight: 700, align: 'center' });
    flow(builder, `gqa-${lane.id}-flow`, [{ x: lane.x, y: y + 565 }, { x: lane.x, y: y + 365 }], { role: 'mixing-flow' });
    pill(builder, `gqa-${lane.id}-linear`, 'mixing-linear', { x: lane.x - 70, y: y + 565, width: 140, height: 70 }, text('Linear'), { size: 28 });
    if (lane.id !== 'v') pill(builder, `gqa-${lane.id}-norm`, 'mixing-norm', { x: lane.x - 85, y: y + 465, width: 170, height: 70 }, text('RMSNorm'), { size: 26 });
  });
  pill(builder, 'gqa-gate-linear', 'mixing-linear', { x: x + 830, y: y + 565, width: 140, height: 70 }, text('Linear'), { size: 28 });
  builder.glyph('gqa-gate', 'operator', { x: x + 900, y: y + 330 }, 'sigmoid', 50);
  builder.text('gqa-gate-label', 'mixing-gate', { x: x + 950, y: y + 320 }, text('Sigmoid'), { size: 30 });
  builder.text('gqa-gate-label-2', 'mixing-gate', { x: x + 950, y: y + 360 }, text('Gate'), { size: 30 });
  flow(builder, 'gqa-attention-up', [{ x: x + 510, y: y + 280 }, { x: x + 510, y: y + 185 }], { role: 'mixing-flow' });
  flow(builder, 'gqa-output-up', [{ x: x + 510, y: y + 185 }, { x: x + 510, y: y + 125 }], { role: 'mixing-flow' });
  flow(builder, 'gqa-gate-flow', [{ x: x + 900, y: y + 565 }, { x: x + 900, y: y + 330 }, { x: x + 565, y: y + 185 }], { role: 'mixing-flow' });
}

function renderMla(builder: SceneBuilder, box: Box): void {
  const x = box.x;
  const y = box.y;
  pill(builder, 'mla-output', 'mixing-output', { x: x + 410, y: y + 55, width: 200, height: 70 }, text('Output proj.'), { size: 30 });
  pill(builder, 'mla-attention', 'mixing-operation', { x: x + 120, y: y + 230, width: 800, height: 85 }, text('Multi-head latent attention'), { fill: '#F59ECB', size: 34 });
  pill(builder, 'mla-q-projection', 'mixing-linear', { x: x + 70, y: y + 650, width: 220, height: 75 }, text('Q projection'), { size: 30 });
  pill(builder, 'mla-k-up', 'mixing-linear', { x: x + 330, y: y + 400, width: 210, height: 75 }, text('K up-proj.'), { size: 30 });
  pill(builder, 'mla-v-up', 'mixing-linear', { x: x + 690, y: y + 400, width: 210, height: 75 }, text('V up-proj.'), { size: 30 });
  pill(builder, 'mla-latent-norm', 'mixing-norm', { x: x + 420, y: y + 535, width: 260, height: 75 }, text('Latent RMSNorm'), { size: 28 });
  pill(builder, 'mla-kv-down', 'mixing-linear', { x: x + 440, y: y + 650, width: 230, height: 75 }, text('KV down-proj.'), { size: 30 });
  builder.text('mla-q-label', 'mixing-lane', { x: x + 180, y: y + 210 }, text('Q'), { size: 38, weight: 700, align: 'center' });
  builder.text('mla-k-label', 'mixing-lane', { x: x + 430, y: y + 210 }, text('K'), { size: 38, weight: 700, align: 'center' });
  builder.text('mla-v-label', 'mixing-lane', { x: x + 790, y: y + 210 }, text('V'), { size: 38, weight: 700, align: 'center' });
  builder.text('mla-key-size', 'mixing-note', { x: x + 330, y: y + 560 }, { spans: [{ text: '64-d' }] }, { size: 28, align: 'center' });
  builder.text('mla-key-size-2', 'mixing-note', { x: x + 330, y: y + 595 }, { spans: [{ text: 'key' }] }, { size: 28, align: 'center' });
  flow(builder, 'mla-q-flow', [{ x: x + 180, y: y + 650 }, { x: x + 180, y: y + 315 }], { role: 'mixing-flow' });
  flow(builder, 'mla-kv-down-flow', [{ x: x + 555, y: y + 650 }, { x: x + 555, y: y + 610 }], { role: 'mixing-flow' });
  flow(builder, 'mla-latent-flow', [{ x: x + 555, y: y + 535 }, { x: x + 555, y: y + 315 }], { role: 'mixing-flow' });
  flow(builder, 'mla-k-flow', [{ x: x + 435, y: y + 400 }, { x: x + 435, y: y + 315 }], { role: 'mixing-flow' });
  flow(builder, 'mla-v-flow', [{ x: x + 795, y: y + 400 }, { x: x + 795, y: y + 315 }], { role: 'mixing-flow' });
  flow(builder, 'mla-output-flow', [{ x: x + 510, y: y + 230 }, { x: x + 510, y: y + 125 }], { role: 'mixing-flow' });
  flow(builder, 'mla-key-branch', [{ x: x + 555, y: y + 610 }, { x: x + 435, y: y + 610 }, { x: x + 435, y: y + 475 }], { role: 'mixing-flow', arrow: 'none' });
  flow(builder, 'mla-value-branch', [{ x: x + 555, y: y + 610 }, { x: x + 795, y: y + 610 }, { x: x + 795, y: y + 475 }], { role: 'mixing-flow', arrow: 'none' });
}

function renderDelta(builder: SceneBuilder, box: Box, gateLabel: string): void {
  const x = box.x;
  const y = box.y;
  pill(builder, 'delta-output', 'mixing-output', { x: x + 430, y: y + 60, width: 160, height: 70 }, text('Linear'), { size: 30 });
  builder.glyph('delta-multiply', 'operator', { x: x + 510, y: y + 190 }, 'multiply', 54);
  pill(builder, 'delta-rmsnorm', 'mixing-norm', { x: x + 420, y: y + 270, width: 180, height: 70 }, text('RMSNorm'), { size: 28 });
  pill(builder, 'delta-rule', 'mixing-operation', { x: x + 190, y: y + 400, width: 680, height: 85 }, text('Gated Delta Rule'), { fill: '#FFF6BF', size: 34 });
  const labels: Array<[string, string, number]> = [
    ['q', 'Q', x + 230], ['k', 'K', x + 310], ['v', 'V', x + 470], ['alpha', 'α', x + 650], ['beta', 'β', x + 730],
  ];
  labels.forEach(([id, label, lx]) => builder.text(`delta-${id}`, 'mixing-lane', { x: lx, y: y + 545 }, text(label), { size: 38, weight: 700, align: 'center' }));
  pill(builder, 'delta-l2', 'mixing-norm', { x: x + 185, y: y + 605, width: 180, height: 70 }, text('L2 Norm'), { fill: '#F8D76B', size: 30 });
  builder.glyph('delta-q-sigmoid', 'operator', { x: x + 230, y: y + 710 }, 'sigmoid', 44);
  builder.glyph('delta-k-sigmoid', 'operator', { x: x + 310, y: y + 710 }, 'sigmoid', 44);
  builder.glyph('delta-v-sigmoid', 'operator', { x: x + 470, y: y + 710 }, 'sigmoid', 44);
  builder.glyph('delta-alpha-sigmoid', 'operator', { x: x + 650, y: y + 710 }, 'sigmoid', 44);
  builder.glyph('delta-beta-sigmoid', 'operator', { x: x + 730, y: y + 710 }, 'sigmoid', 44);
  pill(builder, 'delta-qk-conv', 'mixing-conv', { x: x + 180, y: y + 790, width: 190, height: 75 }, text('Conv'), { fill: '#F59A8A', size: 32 });
  pill(builder, 'delta-v-conv', 'mixing-conv', { x: x + 420, y: y + 790, width: 160, height: 75 }, text('Conv'), { fill: '#F59A8A', size: 32 });
  pill(builder, 'delta-qk-linear', 'mixing-linear', { x: x + 190, y: y + 930, width: 170, height: 70 }, text('Linear'), { size: 28 });
  pill(builder, 'delta-v-linear', 'mixing-linear', { x: x + 420, y: y + 930, width: 160, height: 70 }, text('Linear'), { size: 28 });
  pill(builder, 'delta-ab-linear', 'mixing-linear', { x: x + 620, y: y + 930, width: 170, height: 70 }, text('Linear'), { size: 28 });
  pill(builder, 'delta-gate-linear', 'mixing-linear', { x: x + 850, y: y + 930, width: 170, height: 70 }, text('Linear'), { size: 28 });
  builder.glyph('delta-gate', 'operator', { x: x + 935, y: y + 590 }, 'sigmoid', 50);
  builder.text('delta-gate-label', 'mixing-gate', { x: x + 985, y: y + 580 }, text(gateLabel), { size: 28 });
  builder.text('delta-gate-label-2', 'mixing-gate', { x: x + 985, y: y + 618 }, text('Gate'), { size: 28 });
  flow(builder, 'delta-rule-up', [{ x: x + 510, y: y + 400 }, { x: x + 510, y: y + 340 }], { role: 'mixing-flow' });
  flow(builder, 'delta-output-up', [{ x: x + 510, y: y + 270 }, { x: x + 510, y: y + 190 }], { role: 'mixing-flow' });
  flow(builder, 'delta-output-top', [{ x: x + 510, y: y + 190 }, { x: x + 510, y: y + 130 }], { role: 'mixing-flow' });
  flow(builder, 'delta-q-flow', [{ x: x + 275, y: y + 930 }, { x: x + 275, y: y + 865 }, { x: x + 230, y: y + 865 }, { x: x + 230, y: y + 675 }], { role: 'mixing-flow' });
  flow(builder, 'delta-k-flow', [{ x: x + 275, y: y + 930 }, { x: x + 275, y: y + 675 }, { x: x + 310, y: y + 675 }], { role: 'mixing-flow' });
  flow(builder, 'delta-v-flow', [{ x: x + 500, y: y + 930 }, { x: x + 500, y: y + 865 }, { x: x + 470, y: y + 865 }, { x: x + 470, y: y + 485 }], { role: 'mixing-flow' });
  flow(builder, 'delta-ab-flow', [{ x: x + 705, y: y + 930 }, { x: x + 705, y: y + 485 }], { role: 'mixing-flow' });
  flow(builder, 'delta-gate-flow', [{ x: x + 935, y: y + 930 }, { x: x + 935, y: y + 590 }, { x: x + 565, y: y + 190 }], { role: 'mixing-flow' });
}

function schedule(builder: SceneBuilder, spec: FigureSpec): void {
  const lines = annotationLines(spec, 'schedule');
  const x = 1840;
  const y = 2290;
  lines.forEach((line, index) => {
    builder.text(`schedule-${index}`, 'layer-schedule', { x, y: y + index * 50 }, line, {
      size: 36,
      weight: index === 0 ? 800 : 500,
      family: spec.theme.monospaceFamily ?? 'monospace',
    });
  });
  if (spec.id === 'qwen3-next-80b-a3b') {
    flow(builder, 'schedule-underline', [{ x, y: y + 35 }, { x: x + 800, y: y + 35 }], { role: 'layer-schedule-rule', arrow: 'none' });
  }
}

export function layoutMixingDetail(spec: FigureSpec, context: LayoutContext): Scene {
  if (spec.layout.mode !== 'template' || spec.layout.template !== 'moe') {
    layoutFailure('wrong-template', 'mixing-detail is an moe template variant');
  }
  slot(spec, 'block');
  const attentionInset = groupOf(spec, slot(spec, 'attention'));
  const deltaInset = groupOf(spec, slot(spec, 'delta'));
  const attention = operation(spec, (node) => node.data.family === 'gqa' || node.data.family === 'mla');
  operation(spec, (node) => node.data.family === 'gated-delta-net');
  operation(spec, (node) => node.data.family === 'moe');

  const builder = new SceneBuilder(spec.theme, context.metrics);
  title(builder, spec);
  backbone(builder, spec, attention, annotationLines(spec, 'side-note'));

  const attentionBox = { x: 1800, y: 180, width: 1100, height: 850 };
  const deltaBox = { x: 1800, y: 1150, width: 1100, height: 1000 };
  insetFrame(builder, 'attention-inset', 'mixing-attention-inset', attentionBox, attentionInset.title ?? text('Attention'));
  insetFrame(builder, 'delta-inset', 'mixing-delta-inset', deltaBox, deltaInset.title ?? text('Delta attention'));

  if (attention.data.family === 'mla') renderMla(builder, attentionBox);
  else renderGatedGqa(builder, attentionBox);
  renderDelta(builder, deltaBox, spec.id === 'kimi-linear-48b-a3b' ? 'Sigmoid' : 'SiLU');
  schedule(builder, spec);

  flow(builder, 'attention-zoom', [{ x: 1230, y: 1550 }, { x: 1800, y: 500 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  flow(builder, 'delta-zoom', [{ x: 1230, y: 1600 }, { x: 1800, y: 1750 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });

  return builder.scene(spec);
}
