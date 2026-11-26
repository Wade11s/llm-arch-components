import { FigureLayoutError } from '../errors';
import { SceneBuilder } from '../sceneBuilder';
import type {
  Box,
  EdgeSpec,
  FigureSpec,
  GroupSpec,
  Id,
  LayoutContext,
  NodeSpec,
  Point,
  Scene,
  TextSpec,
} from '../types';

type Annotation = NonNullable<FigureSpec['annotations']>[number];
type TextAlign = 'start' | 'center' | 'end';
type AnnotationLayout = {
  at: Point;
  size: number;
  weight: number;
  lineGap: number;
  align: TextAlign;
  fill?: string;
  role: string;
};

const CARD_OFFSET: Point = { x: -14, y: 16 };

function fail(message: string, sourceIds: Id[] = []): never {
  throw new FigureLayoutError([{ severity: 'error', code: 'layer-schedule', message, sourceIds }]);
}

function templateSlots(spec: FigureSpec): Record<string, Id | Id[]> {
  if (spec.layout.mode !== 'template' || spec.layout.template !== 'layer-schedule') {
    fail('layer-schedule layout requires layout.template = "layer-schedule"');
  }
  return spec.layout.slots;
}

function slot(spec: FigureSpec, name: string): Id {
  const value = templateSlots(spec)[name];
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) fail(`layer-schedule layout requires the "${name}" slot`);
  return id;
}

function groupOf(spec: FigureSpec, id: Id): GroupSpec {
  const group = spec.groups.find((candidate) => candidate.id === id);
  if (!group) fail(`Group "${id}" does not exist`, [id]);
  return group;
}

function nodeOf(spec: FigureSpec, id: Id): NodeSpec {
  const node = spec.nodes.find((candidate) => candidate.id === id);
  if (!node) fail(`Node "${id}" does not exist`, [id]);
  return node;
}

function textOf(node: NodeSpec): TextSpec {
  if (node.label) return node.label;
  if (node.kind === 'text') return node.data;
  if (node.kind === 'badge') return { spans: [{ text: node.data.value }] };
  if (node.kind === 'composite' || node.kind === 'operation') return { spans: [{ text: node.data.family }] };
  return { spans: [{ text: node.id }] };
}

function spansToLines(spans: TextSpec['spans']): TextSpec['spans'][] {
  const lines: TextSpec['spans'][] = [[]];
  for (const span of spans) {
    const pieces = span.text.split('\n');
    pieces.forEach((piece, index) => {
      if (index > 0) lines.push([]);
      if (piece.length > 0) lines[lines.length - 1].push({ ...span, text: piece });
    });
  }
  return lines.filter((line) => line.length > 0);
}

function splitText(spec: TextSpec): TextSpec[] {
  return spansToLines(spec.spans).map((spans) => ({ ...spec, spans }));
}

function annotationLines(content: Annotation['content']): TextSpec[] {
  return 'bullets' in content ? content.bullets.flatMap(splitText) : splitText(content);
}

function inverseSpans(spec: TextSpec): TextSpec {
  return { ...spec, spans: spec.spans.map((span) => ({ ...span, color: span.color ?? 'inverse' })) };
}

function addText(
  builder: SceneBuilder,
  id: Id,
  role: string,
  at: Point,
  spec: TextSpec,
  options: {
    size?: number;
    weight?: number;
    fill?: string;
    align?: TextAlign;
    lineGap?: number;
    family?: string;
    sourceId?: Id;
  } = {},
): void {
  const lines = splitText(spec);
  const size = options.size ?? 34;
  const lineGap = options.lineGap ?? Math.round(size * 1.22);
  lines.forEach((line, index) => {
    builder.text(
      lines.length === 1 ? id : `${id}-line-${index}`,
      role,
      { x: at.x, y: at.y + index * lineGap },
      line,
      {
        size,
        weight: options.weight ?? 400,
        fill: options.fill,
        align: options.align ?? line.align ?? 'start',
        family: options.family,
        sourceId: options.sourceId,
      },
    );
  });
}

function addPill(
  builder: SceneBuilder,
  spec: FigureSpec,
  id: Id,
  role: string,
  box: Box,
  text: TextSpec,
  options: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    radius?: number;
    size?: number;
    weight?: number;
    textFill?: string;
  } = {},
): void {
  const size = options.size ?? 34;
  builder.box(`${id}-box`, role, box, {
    fill: builder.solid(options.fill ?? '#FFFFFF'),
    stroke: builder.stroke(options.stroke ?? spec.theme.ink, options.strokeWidth ?? 5),
    radius: options.radius ?? 26,
    sourceId: id,
  });
  builder.text(`${id}-label`, `${role}-label`, { x: box.x + box.width / 2, y: box.y + box.height / 2 + size * 0.35 }, text, {
    size,
    weight: options.weight ?? 400,
    fill: options.textFill,
    align: 'center',
    sourceId: id,
  });
}

function addLeader(builder: SceneBuilder, id: Id, points: Point[]): void {
  builder.path(id, 'leader', points, {
    stroke: builder.stroke('#000000', 5, 'dotted'),
    arrow: 'none',
  });
}

function routeRole(edge: EdgeSpec): string {
  switch (edge.kind) {
    case 'residual': return 'residual-path';
    case 'feedback': return 'feedback-loop';
    case 'zoom': return 'zoom-leader';
    case 'leader': return 'leader';
    case 'route': return 'route-path';
    default: return 'flow-path';
  }
}

function sidePoint(box: Box, side: EdgeSpec['from']['side'] = 'center', offset = 0): Point {
  switch (side) {
    case 'top': return { x: box.x + box.width / 2 + offset, y: box.y };
    case 'right': return { x: box.x + box.width, y: box.y + box.height / 2 + offset };
    case 'bottom': return { x: box.x + box.width / 2 + offset, y: box.y + box.height };
    case 'left': return { x: box.x, y: box.y + box.height / 2 + offset };
    default: return { x: box.x + box.width / 2 + offset, y: box.y + box.height / 2 };
  }
}

function addEdge(
  builder: SceneBuilder,
  spec: FigureSpec,
  edge: EdgeSpec,
  boxes: Map<Id, Box>,
  routes: Record<Id, Point[]>,
): boolean {
  const points = routes[edge.id] ?? fallbackRoute(edge, boxes);
  if (points.length < 2) {
    builder.diagnostics.push({
      severity: 'warning',
      code: 'unrouted-edge',
      message: `Edge "${edge.id}" has no determinable route in the layer-schedule template`,
      sourceIds: [edge.id],
    });
    return false;
  }
  builder.path(edge.id, routeRole(edge), points, {
    stroke: builder.stroke(edge.style?.stroke ?? spec.theme.ink, edge.style?.width ?? 6, edge.style?.dash),
    arrow: edge.arrow ?? 'end',
    sourceId: edge.id,
  });
  return true;
}

function fallbackRoute(edge: EdgeSpec, boxes: Map<Id, Box>): Point[] {
  const from = boxes.get(edge.from.node);
  const to = boxes.get(edge.to.node);
  if (!from || !to) return [];
  return [sidePoint(from, edge.from.side, edge.from.offset), sidePoint(to, edge.to.side, edge.to.offset)];
}

function annotationLayout(spec: FigureSpec, annotation: Annotation): AnnotationLayout {
  const layouts: Record<Id, AnnotationLayout> = {
    vocabulary: { at: { x: 1930, y: 215 }, size: 34, weight: 700, lineGap: 42, align: 'start', role: 'annotation-vocabulary' },
    context: { at: { x: 640, y: 1955 }, size: 36, weight: 700, lineGap: 48, align: 'start', role: 'annotation-context' },
    'loop-arithmetic': { at: { x: 30, y: 880 }, size: 36, weight: 500, lineGap: 50, align: 'start', role: 'layer-arithmetic' },
    'loop-explainer': { at: { x: 30, y: 1015 }, size: 30, weight: 400, lineGap: 40, align: 'start', role: 'loop-explainer' },
    'second-pass-title': { at: { x: 30, y: 1290 }, size: 50, weight: 700, lineGap: 60, align: 'start', fill: spec.theme.accent, role: 'second-pass-title' },
    'second-pass': { at: { x: 30, y: 1360 }, size: 30, weight: 400, lineGap: 40, align: 'start', role: 'second-pass-note' },
    'dense-first': { at: { x: 570, y: 2590 }, size: 32, weight: 700, lineGap: 45, align: 'start', role: 'dense-first-note' },
    'embedding-dimension': { at: { x: 2020, y: 2600 }, size: 34, weight: 700, lineGap: 46, align: 'start', role: 'annotation-embedding-dimension' },
    'expert-dimensions': { at: { x: 2620, y: 1180 }, size: 40, weight: 700, lineGap: 52, align: 'start', role: 'annotation-expert-dimensions' },
    'base-model-title': { at: { x: 2480, y: 2385 }, size: 44, weight: 700, lineGap: 54, align: 'start', fill: spec.theme.accent, role: 'annotation-base-model-title' },
    'base-model': { at: { x: 2480, y: 2455 }, size: 34, weight: 400, lineGap: 44, align: 'start', role: 'annotation-base-model' },
  };
  const layout = layouts[annotation.id];
  if (!layout) return { at: { x: 30, y: 300 }, size: 32, weight: 400, lineGap: 40, align: 'start', role: `annotation-${annotation.id}` };
  return layout;
}

export function layoutGlmLayerSchedule(spec: FigureSpec, context: LayoutContext): Scene {
  const modelId = slot(spec, 'model');
  const middleId = slot(spec, 'middle');
  const ffnId = slot(spec, 'ffn');
  const moeInsetId = slot(spec, 'moe');
  const loopId = slot(spec, 'loop');
  const middleSource = groupOf(spec, middleId);
  const ffnSource = groupOf(spec, ffnId);
  const moeSource = groupOf(spec, moeInsetId);
  groupOf(spec, loopId);
  groupOf(spec, modelId);

  const repeatCount = middleSource.repeat?.count;
  if (!repeatCount) fail(`Group "${middleId}" must declare its repeated layer count`, [middleId]);

  const moeNode = nodeOf(spec, 'moe');
  const ffnNode = nodeOf(spec, 'ffn');
  if (moeNode.kind !== 'composite' || moeNode.data.family !== 'moe') fail('Node "moe" must carry typed MoE data', ['moe']);
  if (ffnNode.kind !== 'composite' || ffnNode.data.family !== 'ffn') fail('Node "ffn" must carry typed FFN data', ['ffn']);

  const builder = new SceneBuilder(spec.theme, context.metrics);
  const accent = spec.theme.accent;
  const cx = 1680;

  const modelBox: Box = { x: 1080, y: 300, width: 1100, height: 2180 };
  const middleBox: Box = { x: 1290, y: 880, width: 760, height: 1090 };
  const afterCardBox: Box = { x: 1400, y: 720, width: 560, height: 110 };
  const beforeCardBox: Box = { x: 1400, y: 2110, width: 560, height: 110 };
  const outputBox: Box = { x: 1475, y: 410, width: 410, height: 72 };
  const finalNormBox: Box = { x: 1485, y: 520, width: 390, height: 70 };
  const embeddingBox: Box = { x: 1475, y: 2270, width: 410, height: 74 };
  const tokenizedBox: Box = { x: 1475, y: 2530, width: 410, height: 72 };
  const moePillBox: Box = { x: 1515, y: 1075, width: 330, height: 72 };
  const rmsnorm2Box: Box = { x: 1530, y: 1240, width: 300, height: 70 };
  const attentionBox: Box = { x: 1460, y: 1520, width: 440, height: 270 };
  const rmsnorm1Box: Box = { x: 1520, y: 1840, width: 320, height: 70 };
  const ropeBox: Box = { x: 1100, y: 1580, width: 240, height: 72 };
  const ffnBox: Box = { x: 2490, y: 500, width: 790, height: 610 };
  const moeBox: Box = { x: 2330, y: 1330, width: 960, height: 970 };

  const boxes = new Map<Id, Box>([
    [modelId, modelBox],
    [middleId, middleBox],
    [ffnId, ffnBox],
    [moeInsetId, moeBox],
    ['loop-schedule', { x: 0, y: 280, width: 1050, height: 1520 }],
    ['linear-output', outputBox],
    ['final-rmsnorm', finalNormBox],
    ['token-embedding', embeddingBox],
    ['tokenized-text', tokenizedBox],
    ['moe', moePillBox],
    ['rmsnorm-2', rmsnorm2Box],
    ['attention', attentionBox],
    ['rmsnorm-1', rmsnorm1Box],
    ['partial-rope', ropeBox],
    ['layers-before', beforeCardBox],
    ['layers-after', afterCardBox],
    ['sample-input', { x: cx - 240, y: 2670, width: 480, height: 40 }],
  ]);

  const usedNodes = new Set<Id>();
  const usedGroups = new Set<Id>();
  const usedEdges = new Set<Id>();
  const usedAnnotations = new Set<Id>();
  const useNode = (id: Id): NodeSpec => {
    const node = nodeOf(spec, id);
    usedNodes.add(id);
    return node;
  };
  const useGroup = (group: GroupSpec): GroupSpec => {
    usedGroups.add(group.id);
    return group;
  };

  const modelGroup = useGroup(groupOf(spec, modelId));
  const middleGroup = useGroup(middleSource);
  const ffnGroup = useGroup(ffnSource);
  const moeGroup = useGroup(moeSource);
  const loopGroup = useGroup(groupOf(spec, loopId));

  builder.group(modelGroup.id, 'model-container', modelBox, [], {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 6),
    sourceId: modelGroup.id,
  });
  builder.group(middleGroup.id, 'middle-layers-block', middleBox, [], {
    fill: middleGroup.style?.fill?.kind === 'solid' ? builder.solid(middleGroup.style.fill.color) : builder.solid('#63A7EC'),
    stroke: builder.stroke(middleGroup.style?.stroke ?? spec.theme.ink, 6),
    sourceId: middleGroup.id,
  });
  builder.group(ffnGroup.id, 'ffn-inset', ffnBox, [], {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 10, 'dashed'),
    sourceId: ffnGroup.id,
  });
  builder.group(moeGroup.id, 'moe-inset', moeBox, [], {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke(accent, 10, 'dotted'),
    sourceId: moeGroup.id,
  });
  builder.group(loopGroup.id, 'loop-schedule', boxes.get(loopGroup.id) ?? { x: 0, y: 280, width: 1050, height: 1520 }, [], {
    sourceId: loopGroup.id,
  });

  builder.text('figure-title', 'title', { x: cx, y: 160 }, spec.title, {
    size: 104,
    weight: 900,
    fill: accent,
    align: 'center',
    family: "'Arial Black', Arial, sans-serif",
  });

  const routes: Record<Id, Point[]> = {
    'flow-sample-input': [{ x: cx, y: 2700 }, { x: cx, y: 2602 }],
    'flow-tokenized': [{ x: cx, y: 2530 }, { x: cx, y: 2344 }],
    'flow-embedding': [{ x: cx, y: 2270 }, { x: cx, y: 2216 }],
    'flow-before-loop': [{ x: cx, y: 2110 }, { x: cx, y: 1970 }],
    'flow-middle': [{ x: cx, y: 880 }, { x: cx, y: 830 }],
    'flow-after-loop': [{ x: cx, y: 720 }, { x: cx, y: 590 }],
    'flow-final-norm': [{ x: cx, y: 520 }, { x: cx, y: 482 }],
    'flow-output': [{ x: cx, y: 410 }, { x: cx, y: 235 }],
    'flow-rope': [{ x: 1340, y: 1616 }, { x: 1460, y: 1616 }],
    'flow-middle-in': [{ x: cx, y: 1970 }, { x: cx, y: 1910 }],
    'flow-rmsnorm-1': [{ x: cx, y: 1840 }, { x: cx, y: 1790 }],
    'flow-attention': [{ x: cx, y: 1520 }, { x: cx, y: 1478 }],
    'flow-plus-attention': [{ x: cx, y: 1422 }, { x: cx, y: 1310 }],
    'flow-rmsnorm-2': [{ x: cx, y: 1240 }, { x: cx, y: 1147 }],
    'flow-moe': [{ x: cx, y: 1075 }, { x: cx, y: 1013 }],
    'flow-plus-moe': [{ x: cx, y: 957 }, { x: cx, y: 880 }],
    'residual-attention': [{ x: cx, y: 1930 }, { x: 1955, y: 1930 }, { x: 1955, y: 1450 }, { x: 1710, y: 1450 }],
    'residual-moe': [{ x: cx, y: 1405 }, { x: 1955, y: 1405 }, { x: 1955, y: 985 }, { x: 1710, y: 985 }],
    'flow-pass-1': [{ x: 330, y: 622 }, { x: 375, y: 622 }],
    'flow-pass-2': [{ x: 515, y: 622 }, { x: 560, y: 622 }],
    'flow-pass-exit': [{ x: 700, y: 622 }, { x: 745, y: 622 }],
    'feedback-loop': [{ x: cx, y: 840 }, { x: 2240, y: 840 }, { x: 2240, y: 2050 }, { x: 1705, y: 2050 }],
    'moe-zoom': [{ x: 1845, y: 1111 }, { x: 2110, y: 1111 }, { x: 2330, y: 1330 }],
    'flow-ffn-input': [{ x: 2720, y: 940 }, { x: 2720, y: 866 }],
    'flow-ffn-gate': [{ x: 2720, y: 790 }, { x: 2720, y: 626 }],
    'flow-ffn-up': [{ x: 3090, y: 790 }, { x: 3090, y: 700 }, { x: 2720, y: 700 }, { x: 2720, y: 626 }],
    'flow-router-input': [{ x: 2815, y: 2200 }, { x: 2815, y: 2098 }],
    'route-router-shared': [{ x: 2790, y: 2020 }, { x: 2535, y: 1802 }],
    'route-router-routed': [{ x: 2840, y: 2020 }, { x: 3035, y: 1802 }],
    'route-router-plus': [{ x: 2815, y: 2020 }, { x: 2815, y: 1614 }],
    'flow-shared-plus': [{ x: 2535, y: 1730 }, { x: 2535, y: 1655 }, { x: 2788, y: 1580 }],
    'flow-routed-plus': [{ x: 3035, y: 1730 }, { x: 3035, y: 1655 }, { x: 2842, y: 1580 }],
    'flow-moe-out': [{ x: 2815, y: 1548 }, { x: 2815, y: 1420 }],
  };

  const backEdges = spec.edges.filter((edge) => edge.kind === 'flow' || edge.kind === 'residual' || edge.kind === 'route');
  for (const edge of backEdges) {
    if (addEdge(builder, spec, edge, boxes, routes)) usedEdges.add(edge.id);
  }

  addPill(builder, spec, 'linear-output', 'output-layer', outputBox, textOf(useNode('linear-output')));
  addPill(builder, spec, 'final-rmsnorm', 'norm', finalNormBox, textOf(useNode('final-rmsnorm')));
  addPill(builder, spec, 'token-embedding', 'embedding', embeddingBox, textOf(useNode('token-embedding')));
  addPill(builder, spec, 'tokenized-text', 'input', tokenizedBox, textOf(useNode('tokenized-text')));
  builder.text('sample-input', 'input-label', { x: cx, y: 2700 }, textOf(useNode('sample-input')), { size: 34, align: 'center' });

  addPill(builder, spec, 'moe', 'central-operation', moePillBox, textOf(useNode('moe')), { fill: spec.theme.surface, stroke: spec.theme.ink });
  addPill(builder, spec, 'rmsnorm-1', 'norm', rmsnorm1Box, textOf(useNode('rmsnorm-1')));
  addPill(builder, spec, 'rmsnorm-2', 'norm', rmsnorm2Box, textOf(useNode('rmsnorm-2')));
  addPill(builder, spec, 'partial-rope', 'side-pill', ropeBox, textOf(useNode('partial-rope')), { radius: 30 });

  builder.box('attention-box', 'attention-block', attentionBox, {
    fill: builder.solid('#595959'),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 34,
    sourceId: 'attention',
  });
  addText(builder, 'attention', 'attention-label', { x: attentionBox.x + attentionBox.width / 2, y: attentionBox.y + 58 }, inverseSpans(textOf(useNode('attention'))), {
    size: 34,
    weight: 400,
    align: 'center',
    lineGap: 44,
    sourceId: 'attention',
  });

  const plusAttention = useNode('residual-plus-attention');
  const plusMoe = useNode('residual-plus-moe');
  if (plusAttention.kind !== 'operator' || plusMoe.kind !== 'operator') fail('Residual junctions must be operator nodes');
  builder.glyph('residual-plus-attention', 'operator', { x: cx, y: 1450 }, plusAttention.data.operator, 58, { sourceId: 'residual-plus-attention' });
  builder.glyph('residual-plus-moe', 'operator', { x: cx, y: 985 }, plusMoe.data.operator, 58, { sourceId: 'residual-plus-moe' });

  const middleTitle = middleGroup.title;
  if (middleTitle) {
    addText(builder, 'middle-block-title', 'middle-block-title', { x: 1320, y: 940 }, middleTitle, {
      size: 36,
      weight: 700,
      lineGap: 44,
      sourceId: middleGroup.id,
    });
  }
  builder.text('middle-layer-count', 'middle-layer-count', { x: 1150, y: 1885 }, `${repeatCount}`, {
    size: 38,
    weight: 700,
    fill: accent,
    align: 'center',
    label: `${repeatCount}`,
  });
  builder.text('middle-layer-count-unit', 'middle-layer-count', { x: 1150, y: 1922 }, 'layers', {
    size: 30,
    weight: 700,
    fill: accent,
    align: 'center',
  });
  builder.path('middle-layer-brace', 'middle-layer-count', [
    { x: 1250, y: 1830 },
    { x: 1235, y: 1830 },
    { x: 1235, y: 1900 },
    { x: 1215, y: 1915 },
    { x: 1235, y: 1930 },
    { x: 1235, y: 1995 },
    { x: 1250, y: 1995 },
  ], {
    stroke: builder.stroke(accent, 5),
    arrow: 'none',
  });

  const addStackedCard = (nodeId: Id, box: Box, labelId: Id, rangeId: Id): void => {
    const stackNode = useNode(nodeId);
    if (stackNode.kind !== 'stack') fail(`Node "${nodeId}" must be a stack`, [nodeId]);
    const labelNode = useNode(labelId);
    const rangeNode = useNode(rangeId);
    builder.elements.push({
      id: `${nodeId}-stack`,
      sourceId: nodeId,
      role: 'loop-layer-stack',
      kind: 'stack',
      box,
      count: stackNode.data.count,
      offset: CARD_OFFSET,
      child: `${labelId}-label`,
    });
    builder.box(`${nodeId}-card`, 'loop-layer-card', box, {
      fill: builder.solid('#FFFFFF'),
      stroke: builder.stroke(spec.theme.ink, 5),
      radius: 24,
      sourceId: nodeId,
    });
    addText(builder, `${labelId}-label`, 'loop-layer-card-label', { x: box.x + box.width / 2, y: box.y + 44 }, textOf(labelNode), {
      size: 36,
      weight: 700,
      align: 'center',
      sourceId: labelId,
    });
    addText(builder, `${rangeId}-label`, 'loop-layer-card-range', { x: box.x + box.width / 2, y: box.y + 84 }, textOf(rangeNode), {
      size: 31,
      weight: 400,
      align: 'center',
      sourceId: rangeId,
    });
  };
  addStackedCard('layers-before', beforeCardBox, 'layers-before-label', 'layers-before-range');
  addStackedCard('layers-after', afterCardBox, 'layers-after-label', 'layers-after-range');

  const loopTitle = loopGroup.title;
  if (loopTitle) {
    addText(builder, 'loop-title', 'loop-title', { x: 30, y: 330 }, loopTitle, {
      size: 52,
      weight: 700,
      fill: accent,
      sourceId: loopGroup.id,
    });
  }

  builder.path('loop-same-bracket', 'loop-bracket', [{ x: 375, y: 540 }, { x: 375, y: 495 }, { x: 700, y: 495 }, { x: 700, y: 540 }], {
    stroke: builder.stroke(accent, 4),
    arrow: 'none',
  });
  builder.text('same-middle-label', 'loop-label', { x: 537, y: 470 }, textOf(useNode('same-middle-label')), {
    size: 32,
    weight: 700,
    align: 'center',
  });

  const addPassCard = (titleId: Id, subtitleId: Id, box: Box): void => {
    const title = useNode(titleId);
    const subtitle = useNode(subtitleId);
    builder.box(`${box.x}-card-box`, 'pass-layer-card', box, {
      fill: builder.solid('#FFFFFF'),
      stroke: builder.stroke(spec.theme.ink, 5),
      radius: 28,
      sourceId: titleId,
    });
    addText(builder, `${titleId}-label`, 'pass-layer-card-title', { x: box.x + box.width / 2, y: box.y + 48 }, textOf(title), {
      size: 32,
      weight: 700,
      align: 'center',
      sourceId: titleId,
    });
    addText(builder, `${subtitleId}-label`, 'pass-layer-card-subtitle', { x: box.x + box.width / 2, y: box.y + 90 }, textOf(subtitle), {
      size: 30,
      weight: 400,
      align: 'center',
      sourceId: subtitleId,
    });
  };
  addPassCard('before-card-title', 'before-card-subtitle', { x: 30, y: 560, width: 300, height: 120 });
  addPassCard('after-card-title', 'after-card-subtitle', { x: 745, y: 560, width: 300, height: 120 });

  const addPass = (id: Id, box: Box): void => {
    const node = useNode(id);
    builder.box(`${id}-box`, 'loop-pass', box, {
      fill: builder.solid('#A9D0FA'),
      stroke: builder.stroke(accent, 5),
      radius: 22,
      sourceId: id,
    });
    builder.text(`${id}-label`, 'loop-pass-label', { x: box.x + box.width / 2, y: box.y + box.height / 2 + 13 }, textOf(node), {
      size: 36,
      weight: 700,
      align: 'center',
      sourceId: id,
    });
  };
  addPass('pass-1', { x: 375, y: 565, width: 140, height: 115 });
  addPass('pass-2', { x: 560, y: 565, width: 140, height: 115 });

  builder.path('loop-run-once-bracket-left', 'loop-run-once-bracket', [{ x: 60, y: 690 }, { x: 60, y: 760 }, { x: 330, y: 760 }], {
    stroke: builder.stroke(spec.theme.muted, 4),
    arrow: 'none',
  });
  builder.path('loop-run-once-bracket-right', 'loop-run-once-bracket', [{ x: 990, y: 690 }, { x: 990, y: 760 }, { x: 720, y: 760 }], {
    stroke: builder.stroke(spec.theme.muted, 4),
    arrow: 'none',
  });
  builder.text('layers-once-label', 'loop-label', { x: 525, y: 790 }, textOf(useNode('layers-once-label')), {
    size: 32,
    weight: 700,
    align: 'center',
  });

  const ffnTitle = ffnGroup.title;
  if (ffnTitle) {
    addText(builder, 'ffn-inset-title', 'ffn-inset-title', { x: 2500, y: 476 }, ffnTitle, {
      size: 46,
      weight: 700,
      sourceId: ffnGroup.id,
    });
  }
  useNode('ffn');
  addPill(builder, spec, 'ffn-linear-top', 'ffn-operation', { x: 2570, y: 550, width: 300, height: 76 }, textOf(useNode('ffn-linear-top')));
  addPill(builder, spec, 'ffn-silu', 'ffn-operation', { x: 2570, y: 790, width: 300, height: 76 }, textOf(useNode('ffn-silu')));
  addPill(builder, spec, 'ffn-linear-right', 'ffn-operation', { x: 2940, y: 790, width: 300, height: 76 }, textOf(useNode('ffn-linear-right')));
  addPill(builder, spec, 'ffn-linear-bottom', 'ffn-operation', { x: 2570, y: 940, width: 300, height: 76 }, textOf(useNode('ffn-linear-bottom')));
  const multiply = useNode('ffn-multiply');
  if (multiply.kind !== 'operator') fail('Node "ffn-multiply" must be an operator', ['ffn-multiply']);
  builder.glyph('ffn-multiply', 'operator', { x: 2925, y: 700 }, multiply.data.operator, 56, { sourceId: 'ffn-multiply' });

  const moeTitle = moeGroup.title;
  if (moeTitle) {
    addText(builder, 'moe-inset-title', 'moe-inset-title', { x: 3240, y: 1500 }, moeTitle, {
      size: 48,
      weight: 700,
      align: 'end',
      sourceId: moeGroup.id,
    });
  }
  const moePlus = useNode('moe-plus');
  if (moePlus.kind !== 'operator') fail('Node "moe-plus" must be an operator', ['moe-plus']);
  builder.glyph('moe-plus', 'operator', { x: 2815, y: 1580 }, moePlus.data.operator, 64, { sourceId: 'moe-plus' });

  addPill(builder, spec, 'router', 'moe-router', { x: 2710, y: 2020, width: 210, height: 78 }, textOf(useNode('router')), {
    fill: spec.theme.background,
    stroke: accent,
    strokeWidth: 6,
  });
  addPill(builder, spec, 'expert-shared', 'moe-expert', { x: 2400, y: 1730, width: 270, height: 72 }, textOf(useNode('expert-shared')), {
    fill: spec.theme.surface,
    radius: 24,
  });
  addPill(builder, spec, 'expert-routed', 'moe-expert', { x: 2890, y: 1730, width: 290, height: 72 }, textOf(useNode('expert-routed')), {
    fill: spec.theme.surface,
    radius: 24,
  });

  const sharedBadge = useNode('expert-shared-badge');
  const routedBadge = useNode('expert-routed-badge');
  if (sharedBadge.kind !== 'badge' || routedBadge.kind !== 'badge') fail('Expert counts must be badge nodes');
  addPill(builder, spec, 'expert-shared-badge', 'moe-badge', { x: 2676, y: 1806, width: 76, height: 72 }, textOf(sharedBadge), {
    fill: '#595959',
    stroke: '#595959',
    radius: 18,
    size: 38,
    weight: 700,
    textFill: '#FFFFFF',
  });
  addPill(builder, spec, 'expert-routed-badge', 'moe-badge', { x: 3180, y: 1802, width: 88, height: 72 }, textOf(routedBadge), {
    fill: accent,
    stroke: accent,
    radius: 18,
    size: 36,
    weight: 700,
    textFill: '#FFFFFF',
  });
  useNode('expert-ellipsis');
  builder.glyph('expert-ellipsis', 'moe-ellipsis', { x: 2800, y: 1785 }, 'ellipsis', 72, { sourceId: 'expert-ellipsis' });

  const frontEdges = spec.edges.filter((edge) => edge.kind === 'feedback' || edge.kind === 'zoom' || edge.kind === 'leader');
  for (const edge of frontEdges) {
    if (!addEdge(builder, spec, edge, boxes, routes)) continue;
    usedEdges.add(edge.id);
    if (edge.kind === 'feedback' && edge.label) {
      builder.box('feedback-label-box', 'feedback-label-box', { x: 1975, y: 720, width: 500, height: 95 }, {
        fill: builder.solid(spec.theme.background),
        stroke: builder.stroke(accent, 5),
        radius: 24,
        sourceId: edge.id,
      });
      addText(builder, 'feedback-label', 'feedback-label', { x: 2225, y: 778 }, edge.label, {
        size: 34,
        weight: 700,
        fill: accent,
        align: 'center',
        sourceId: edge.id,
      });
    }
  }

  const leaders: Array<[Id, Point[]]> = [
    ['leader-vocabulary', [{ x: 1885, y: 446 }, { x: 1980, y: 255 }]],
    ['leader-context', [{ x: 740, y: 1935 }, { x: 1098, y: 1620 }]],
    ['leader-dense-first', [{ x: 700, y: 2570 }, { x: 1360, y: 2216 }]],
    ['leader-embedding', [{ x: 1975, y: 2307 }, { x: 2030, y: 2580 }]],
    ['leader-expert', [{ x: 2820, y: 1110 }, { x: 2760, y: 1120 }]],
    ['leader-moe', [{ x: 2540, y: 1310 }, { x: 2450, y: 1330 }]],
  ];
  for (const [id, points] of leaders) addLeader(builder, id, points);

  for (const annotation of spec.annotations ?? []) {
    const layout = annotationLayout(spec, annotation);
    const lines = annotationLines(annotation.content);
    lines.forEach((line, index) => {
      builder.text(`${annotation.id}-${index}`, layout.role, {
        x: layout.at.x,
        y: layout.at.y + index * layout.lineGap,
      }, line, {
        size: layout.size,
        weight: layout.weight,
        fill: layout.fill,
        align: layout.align,
        sourceId: annotation.id,
      });
    });
    usedAnnotations.add(annotation.id);
  }

  for (const node of spec.nodes) {
    if (!usedNodes.has(node.id)) {
      builder.diagnostics.push({
        severity: 'warning',
        code: 'unplaced-node',
        message: `Node "${node.id}" is not represented by the layer-schedule template`,
        sourceIds: [node.id],
      });
    }
  }
  for (const group of spec.groups) {
    if (!usedGroups.has(group.id)) {
      builder.diagnostics.push({
        severity: 'warning',
        code: 'unplaced-group',
        message: `Group "${group.id}" is not represented by the layer-schedule template`,
        sourceIds: [group.id],
      });
    }
  }
  for (const edge of spec.edges) {
    if (!usedEdges.has(edge.id)) {
      builder.diagnostics.push({
        severity: 'warning',
        code: 'unplaced-edge',
        message: `Edge "${edge.id}" is not represented by the layer-schedule template`,
        sourceIds: [edge.id],
      });
    }
  }
  for (const annotation of spec.annotations ?? []) {
    if (!usedAnnotations.has(annotation.id)) {
      builder.diagnostics.push({
        severity: 'warning',
        code: 'unplaced-annotation',
        message: `Annotation "${annotation.id}" is not represented by the layer-schedule template`,
        sourceIds: [annotation.id],
      });
    }
  }

  return builder.scene(spec);
}
