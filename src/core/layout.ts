import { FigureLayoutError } from './errors';
import { systemTextMetrics } from './metrics';
import { SceneBuilder } from './sceneBuilder';
import { layoutQwenSparse } from './templates/qwenSparse';
import { layoutMixingDetail } from './templates/mixingDetail';
import { layoutXlstm } from './templates/xlstm';
import { layoutMotifMultiStream } from './templates/motifMultiStream';
import { layoutDeepSeekMultiTower } from './templates/deepSeekMultiTower';
import { layoutTencentHy4 } from './templates/tencentHy4';
import { layoutGlmLayerSchedule } from './templates/glmLayerSchedule';
import type {
  AnnotationSpec,
  Box,
  FigureSpec,
  GroupSpec,
  Id,
  LayoutContext,
  LayoutEngine,
  NodeSpec,
  Point,
  Scene,
  TextSpec,
} from './types';

type OperationNode = Extract<NodeSpec, { kind: 'operation' | 'composite' }>;

function isOperation(node: NodeSpec): node is OperationNode {
  return node.kind === 'operation' || node.kind === 'composite';
}

function groupOf(spec: FigureSpec, id: Id): GroupSpec {
  const group = spec.groups.find((candidate) => candidate.id === id);
  if (!group) throw new FigureLayoutError([{ severity: 'error', code: 'missing-group', message: `Group "${id}" does not exist`, sourceIds: [id] }]);
  return group;
}

function textOf(node: NodeSpec): TextSpec {
  if (node.label) return node.label;
  if (node.kind === 'text') return node.data;
  if (node.kind === 'badge') return { spans: [{ text: node.data.value }] };
  if (node.kind === 'operation' || node.kind === 'composite') return { spans: [{ text: node.data.family }] };
  return { spans: [{ text: node.id }] };
}

function annotationOf(spec: FigureSpec, id: Id): AnnotationSpec | undefined {
  return (spec.annotations ?? []).find((annotation) => annotation.id === id);
}

function addAnnotation(
  builder: SceneBuilder,
  spec: FigureSpec,
  id: Id,
  at: Point,
  options: { size?: number; align?: 'start' | 'center' | 'end'; weight?: number; bullets?: boolean; lineGap?: number; content?: TextSpec[] } = {},
): void {
  const annotation = annotationOf(spec, id);
  if (!annotation) return;
  const content = annotation.content;
  const texts = options.content ?? ('bullets' in content ? content.bullets : [content]);
  const lineGap = options.lineGap ?? Math.round((options.size ?? 56) * 1.16);
  let cursorY = at.y;
  texts.forEach((text, index) => {
    const role = id === 'resource-savings' ? 'resource-savings' : id === 'dense-first' ? 'dense-first-note' : `annotation-${id}`;
    const continuation = text.spans[0]?.text === '';
    const rendered = options.bullets ? { ...text, spans: [{ text: continuation ? '   ' : '• ' }, ...text.spans] } : text;
    builder.text(`${id}-${index}`, role, { x: at.x, y: cursorY }, rendered, {
      size: options.size ?? 56,
      weight: options.weight ?? 700,
      align: options.align ?? 'start',
      sourceId: annotation.id,
    });
    const last = builder.elements[builder.elements.length - 1];
    const lineCount = last.kind === 'text' ? last.lines.length : 1;
    cursorY += Math.max(1, lineCount) * lineGap;
  });
}

function addPill(
  builder: SceneBuilder,
  _spec: FigureSpec,
  id: Id,
  role: string,
  box: Box,
  text: TextSpec,
  options: { fill?: string; stroke?: string; radius?: number; size?: number; weight?: number; textFill?: string; secondaryText?: TextSpec } = {},
): void {
  builder.box(`${id}-box`, role, box, {
    sourceId: id,
    fill: options.fill ? builder.solid(options.fill) : undefined,
    stroke: options.stroke ? builder.stroke(options.stroke, 5) : undefined,
    radius: options.radius ?? 30,
  });
  if (options.secondaryText) {
    const size = options.size ?? 40;
    builder.text(`${id}-label-1`, `${role}-label`, {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2 - 4,
    }, text, {
      size,
      weight: options.weight ?? 500,
      fill: options.textFill,
      align: 'center',
      sourceId: id,
    });
    builder.text(`${id}-label-2`, `${role}-label`, {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2 + size * 1.1,
    }, options.secondaryText, {
      size,
      weight: options.weight ?? 500,
      fill: options.textFill,
      align: 'center',
      sourceId: id,
    });
    return;
  }
  builder.text(`${id}-label`, `${role}-label`, {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2 + (options.size ?? 40) * 0.35,
  }, text, {
    size: options.size ?? 40,
    weight: options.weight ?? 500,
    fill: options.textFill,
    align: 'center',
    sourceId: id,
  });
}

function addFlow(builder: SceneBuilder, id: Id, points: Point[], options: { stroke?: string; dash?: 'solid' | 'dashed' | 'dotted'; arrow?: 'none' | 'end' | 'both'; junction?: 'plus' | 'multiply' | 'gate'; role?: string } = {}): void {
  builder.path(id, options.role ?? 'flow-path', points, {
    stroke: builder.stroke(options.stroke ?? '#000000', 6, options.dash),
    arrow: options.arrow ?? 'end',
    junction: options.junction,
  });
}

function layoutBackbone(spec: FigureSpec, context: LayoutContext): Scene {
  if (spec.layout.mode !== 'template' || spec.layout.template !== 'backbone') {
    throw new FigureLayoutError([{ severity: 'error', code: 'wrong-template', message: 'backbone layout requires template backbone' }]);
  }
  if (spec.layout.variant === 'recurrent-detail') return layoutXlstm(spec, context);
  const blockId = spec.layout.slots.block;
  const insetId = Array.isArray(spec.layout.slots.inset) ? spec.layout.slots.inset[0] : spec.layout.slots.inset;
  if (!blockId || Array.isArray(blockId)) {
    throw new FigureLayoutError([{ severity: 'error', code: 'missing-slot', message: 'backbone layout requires a block slot' }]);
  }
  const block = groupOf(spec, blockId);
  const inset = insetId ? groupOf(spec, insetId) : undefined;
  const positionalId = Array.isArray(spec.layout.slots.positional) ? spec.layout.slots.positional[0] : spec.layout.slots.positional;
  const dropoutId = Array.isArray(spec.layout.slots.dropout) ? spec.layout.slots.dropout[0] : spec.layout.slots.dropout;
  const perLayerEmbeddingsId = Array.isArray(spec.layout.slots.perLayerEmbeddings) ? spec.layout.slots.perLayerEmbeddings[0] : spec.layout.slots.perLayerEmbeddings;
  const positionalNode = positionalId ? spec.nodes.find((node) => node.id === positionalId) : undefined;
  const dropoutNode = dropoutId ? spec.nodes.find((node) => node.id === dropoutId) : undefined;
  const perLayerEmbeddingsNode = perLayerEmbeddingsId ? spec.nodes.find((node) => node.id === perLayerEmbeddingsId) : undefined;
  const operations = spec.nodes.filter(isOperation);
  const gqa = operations.find((node) => node.data.family === 'gqa');
  const ffn = operations.find((node) => node.data.family === 'ffn');
  const gqaData = gqa?.data;
  const ffnData = ffn?.data;
  if (!gqaData || !ffnData || gqaData.family !== 'gqa' || ffnData.family !== 'ffn') {
    throw new FigureLayoutError([{ severity: 'error', code: 'missing-operation', message: 'backbone layout requires GQA and FFN nodes' }]);
  }
  const layoutOptions = spec.layout.options;
  const normLabels = layoutOptions?.normLabels;
  const showPostNorms = typeof layoutOptions?.showPostNorms === 'boolean'
    ? layoutOptions.showPostNorms
    : normLabels === undefined || normLabels === 'pre-post';
  const showPreNorms = layoutOptions?.showPreNorms !== false;
  const showQKNorm = layoutOptions?.showQKNorm !== false;
  const showRoPE = layoutOptions?.showRoPE !== false;
  const normStroke = layoutOptions?.normStroke === 'ink'
    ? spec.theme.ink
    : typeof layoutOptions?.normStroke === 'string' && layoutOptions.normStroke.startsWith('#')
      ? layoutOptions.normStroke
      : spec.theme.accent;

  const builder = new SceneBuilder(spec.theme, context.metrics);
  const cx = 1022;
  const repeatCount = block.repeat?.count ?? 0;
  const titleColor = layoutOptions?.titleColor;
  builder.text('figure-title', 'title', { x: 1068, y: 114 }, spec.title, {
    size: 112,
    weight: 900,
    fill: typeof titleColor === 'string' ? titleColor : spec.theme.accent,
    align: 'center',
    family: "'Arial Black', Arial, sans-serif",
  });

  builder.group('model', 'model-container', { x: 465, y: 328, width: 1097, height: 2053 }, [], {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 5),
    sourceId: 'model',
  });
  builder.box('repeat-block', 'repeat-block', { x: 641, y: 675, width: 778, height: 1212 }, {
    fill: builder.solid(block.style?.fill?.kind === 'solid' ? block.style.fill.color : '#DECBA3'),
    stroke: builder.stroke(block.style?.stroke ?? spec.theme.ink, 5),
    radius: 52,
    sourceId: block.id,
  });

  addFlow(builder, 'residual-attention', [{ x: cx, y: 1848 }, { x: 1265, y: 1848 }, { x: 1265, y: 1326 }, { x: 1054, y: 1326 }], { role: 'residual-path', junction: 'plus' });
  addFlow(builder, 'residual-ffn', [{ x: cx, y: 1260 }, { x: 1265, y: 1260 }, { x: 1265, y: 769 }, { x: 1054, y: 769 }], { role: 'residual-path', junction: 'plus' });

  const flows: Array<[string, number, number]> = [
    ['input', 2588, 2509], ['embedding', 2413, 2180], ['pre-attention', 2080, 1809], ['attention', 1719, 1661],
    ['post-attention', 1501, 1463], ['pre-ffn', 1372, 1361], ['ffn', 1292, 1202], ['post-ffn', 1110, 1057],
    ['block-output', 965, 921], ['final-norm', 828, 804], ['output', 735, 615], ['logits', 523, 474], ['end', 381, 238],
  ];
  flows.forEach(([id, from, to]) => addFlow(builder, `flow-${id}`, [{ x: cx, y: from }, { x: cx, y: to }]));

  builder.box('attention-box', 'attention-block', { x: 807, y: 1505, width: 430, height: 152 }, {
    fill: builder.solid('#5E5E5E'),
    stroke: builder.stroke(spec.theme.ink, 5),
    radius: 30,
    sourceId: 'attention',
  });
  if (gqaData.ratio && layoutOptions?.attentionLabelStyle === 'mha-sliding') {
    builder.text('attention-line-1', 'attention-label', { x: cx, y: 1558 }, { spans: [{ text: `${gqaData.ratio} (local:global) ` }, { text: 'sliding', color: 'accent' }] }, { size: 34, fill: '#FFFFFF', align: 'center', sourceId: 'attention' });
    builder.text('attention-line-2', 'attention-label', { x: cx, y: 1600 }, { spans: [{ text: 'window', color: 'accent' }, { text: ' multi-head', color: 'inverse' }] }, { size: 34, align: 'center', sourceId: 'attention' });
    builder.text('attention-line-3', 'attention-label', { x: cx, y: 1642 }, 'attention', { size: 34, fill: '#FFFFFF', align: 'center', sourceId: 'attention' });
  } else if (gqaData.ratio) {
    builder.text('attention-line-1', 'attention-label', { x: cx, y: 1558 }, `${gqaData.ratio} (local:global)`, { size: 42, fill: '#FFFFFF', align: 'center', sourceId: 'attention' });
    builder.text('attention-line-2', 'attention-label', { x: cx, y: 1600 }, { spans: [{ text: 'sliding window', color: 'accent' }, { text: ' and', color: 'inverse' }] }, { size: 42, align: 'center', sourceId: 'attention' });
    builder.text('attention-line-3', 'attention-label', { x: cx, y: 1642 }, 'GQA', { size: 42, fill: '#FFFFFF', align: 'center', sourceId: 'attention' });
  } else if (layoutOptions?.attentionLabelStyle === 'mha') {
    builder.text('attention-line-1', 'attention-label', { x: cx, y: 1580 }, { spans: [{ text: 'Multi-head attention' }] }, { size: 40, fill: '#FFFFFF', align: 'center', sourceId: 'attention' });
  } else {
    const attentionFirstLineAccent = layoutOptions?.attentionFirstLineAccent === true;
    const attentionSuffix = typeof layoutOptions?.attentionSuffix === 'string' ? layoutOptions.attentionSuffix : undefined;
    const labelSpans = gqa?.label?.spans ?? [{ text: 'Grouped-query' }, { text: 'attention' }];
    const split = labelSpans.length > 2 ? labelSpans.length - 1 : 1;
    const secondLineSpans = attentionSuffix
      ? [{ text: 'attention ', color: 'inverse' as const }, { text: attentionSuffix, color: 'accent' as const }]
      : labelSpans.slice(split);
    builder.text('attention-line-1', 'attention-label', { x: cx, y: 1558 }, { spans: labelSpans.slice(0, split) }, { size: 42, fill: attentionFirstLineAccent ? spec.theme.accent : '#FFFFFF', align: 'center', sourceId: 'attention' });
    builder.text('attention-line-2', 'attention-label', { x: cx, y: 1600 }, { spans: secondLineSpans }, { size: 42, fill: '#FFFFFF', align: 'center', sourceId: 'attention' });
  }
  addPill(builder, spec, 'ffn', 'feed-forward', { x: 848, y: 969, width: 350, height: 84 }, { spans: [{ text: 'Feed forward' }] }, { fill: spec.theme.surface, stroke: '#3A3A3A', radius: 26 });
  const normPrefix = normLabels === 'rmsnorm' ? 'RMSNorm' : normLabels === 'layernorm' ? 'LayerNorm' : 'Pre-RMSNorm';
  const dropoutLabel = dropoutNode ? textOf(dropoutNode) : { spans: [{ text: 'Dropout' }] };
  if (showPreNorms) addPill(builder, spec, 'pre-rmsnorm-1', 'norm', { x: 848, y: 1723, width: 348, height: 82 }, { spans: [{ text: `${normPrefix} 1` }] }, { stroke: normStroke, radius: 26 });
  if (showPostNorms) addPill(builder, spec, 'post-rmsnorm-1', 'norm', { x: 848, y: 1376, width: 348, height: 82 }, { spans: [{ text: 'Post-RMSNorm 1' }] }, { stroke: normStroke, radius: 26 });
  if (!showPostNorms && dropoutNode) addPill(builder, spec, 'dropout-attention', 'dropout', { x: 848, y: 1376, width: 348, height: 82 }, dropoutLabel, { stroke: normStroke, radius: 26 });
  if (showPreNorms) addPill(builder, spec, 'pre-rmsnorm-2', 'norm', { x: 852, y: 1114, width: 348, height: 84 }, { spans: [{ text: `${normPrefix} 2` }] }, { stroke: normStroke, radius: 26 });
  if (showPostNorms) addPill(builder, spec, 'post-rmsnorm-2', 'norm', { x: 852, y: 832, width: 348, height: 84 }, { spans: [{ text: 'Post-RMSNorm 2' }] }, { stroke: normStroke, radius: 26 });
  if (!showPostNorms && dropoutNode) addPill(builder, spec, 'dropout-ffn', 'dropout', { x: 852, y: 832, width: 348, height: 84 }, dropoutLabel, { stroke: normStroke, radius: 26 });
  addPill(builder, spec, 'final-rmsnorm', 'norm', { x: 852, y: 527, width: 348, height: 84 }, { spans: [{ text: normLabels === 'layernorm' ? 'Final LayerNorm' : 'Final RMSNorm' }] });
  addPill(builder, spec, 'output-layer', 'output-layer', { x: 840, y: 385, width: 372, height: 84 }, { spans: [{ text: 'Linear output layer' }] });
  if (perLayerEmbeddingsNode) {
    addPill(builder, spec, 'per-layer-embeddings', 'per-layer-embeddings', { x: 752, y: 650, width: 540, height: 70 }, textOf(perLayerEmbeddingsNode), { stroke: normStroke, radius: 26 });
  }
  const qkNormStroke = layoutOptions?.qkNormStroke;
  const ropeStroke = layoutOptions?.ropeStroke;
  if (showQKNorm) addPill(builder, spec, 'qk-norm', 'side-pill', { x: 400, y: 1368, width: 356, height: 80 }, { spans: [{ text: 'QK-Norm' }] }, {
    size: 38,
    stroke: typeof qkNormStroke === 'string' ? qkNormStroke : undefined,
  });
  const ropeLabel = layoutOptions?.ropeLabel;
  const ropeSecondaryLabel = layoutOptions?.ropeSecondaryLabel;
  const nopeLabel = layoutOptions?.nopeLabel;
  const hasCustomRope = typeof ropeLabel === 'string';
  const hasTwoLineRope = hasCustomRope && typeof ropeSecondaryLabel === 'string';
  if (showRoPE && typeof nopeLabel === 'string') {
    addPill(builder, spec, 'nope', 'side-pill', { x: 220, y: 1535, width: 170, height: 84 }, { spans: [{ text: nopeLabel }] });
    builder.text('nope-plus', 'operator', { x: 430, y: 1580 }, '+', { size: 44, align: 'center', sourceId: 'attention' });
    addPill(builder, spec, 'rope', 'side-pill', { x: 480, y: 1535, width: 260, height: 84 }, { spans: [{ text: hasCustomRope ? ropeLabel : 'RoPE' }] });
  } else if (showRoPE) {
    addPill(
      builder,
      spec,
      'rope',
      'side-pill',
      hasTwoLineRope ? { x: 353, y: 1527, width: 360, height: 100 } : { x: 420, y: 1535, width: 293, height: 84 },
      { spans: [{ text: hasCustomRope ? ropeLabel : 'RoPE' }] },
      {
        size: hasTwoLineRope ? 32 : 38,
        stroke: typeof ropeStroke === 'string' ? ropeStroke : undefined,
        secondaryText: hasTwoLineRope ? { spans: [{ text: ropeSecondaryLabel }] } : undefined,
      },
    );
  }
  if (showQKNorm) addFlow(builder, 'qk-norm-flow', [{ x: 756, y: 1428 }, { x: 829, y: 1488 }]);
  if (showRoPE) addFlow(builder, 'rope-flow', [{ x: typeof nopeLabel === 'string' ? 740 : 713, y: 1577 }, { x: 799, y: 1577 }]);
  addPill(builder, spec, 'embedding-layer', 'embedding', { x: 754, y: positionalNode ? 2240 : 2084, width: 536, height: 92 }, { spans: [{ text: 'Token embedding layer' }] });
  if (positionalNode) addPill(builder, spec, 'positional-embedding', 'embedding', { x: 754, y: 2084, width: 536, height: 92 }, textOf(positionalNode), { stroke: normStroke });
  if (dropoutNode) addPill(builder, spec, 'dropout-input', 'dropout', { x: 754, y: 1900, width: 536, height: 92 }, dropoutLabel, { stroke: normStroke });
  addPill(builder, spec, 'tokenized-text', 'input', { x: 847, y: 2417, width: 350, height: 86 }, { spans: [{ text: 'Tokenized text' }] });
  const sampleInputY = layoutOptions?.sampleInputY;
  const sampleInputText = layoutOptions?.sampleInputText;
  builder.text('sample-input', 'input-label', { x: cx, y: typeof sampleInputY === 'number' ? sampleInputY : 2646 }, typeof sampleInputText === 'string' ? sampleInputText : 'Sample input text', { size: 54, align: 'center' });

  builder.text('repeat-count', 'repeat-marker', { x: 478, y: 1912 }, `${repeatCount}`, { size: 58, weight: 700, fill: spec.theme.accent });
  builder.text('repeat-x', 'repeat-marker', { x: 560, y: 1908 }, '×', { size: 44, weight: 700, fill: spec.theme.accent });
  builder.glyph('repeat-brace', 'repeat-marker', { x: 665, y: 1870 }, 'brace', 150);

  if (inset) {
    const insetOffsetX = typeof layoutOptions?.insetOffsetX === 'number' ? layoutOptions.insetOffsetX : 0;
    const ix = (x: number): number => x + insetOffsetX;
    builder.box('ffn-inset', 'ffn-inset', { x: ix(1777), y: 575, width: 790, height: 608 }, {
      fill: builder.solid(spec.theme.surface),
      stroke: builder.stroke(spec.theme.ink, 10, 'dashed'),
      radius: 54,
      sourceId: inset.id,
    });
    if (inset.title) builder.text('ffn-inset-title', 'ffn-inset-title', { x: ix(2172), y: 550 }, inset.title, { size: 54, weight: 700, align: 'center', sourceId: inset.id });
    addFlow(builder, 'ffn-up-1', [{ x: ix(1994), y: 1020 }, { x: ix(1994), y: 937 }], { role: 'inset-flow' });
    addFlow(builder, 'ffn-up-2', [{ x: ix(1994), y: 826 }, { x: ix(1994), y: 736 }], { role: 'inset-flow' });
    addFlow(builder, 'ffn-side-a', [{ x: ix(1994), y: 780 }, { x: ix(2157), y: 780 }], { role: 'inset-flow', arrow: 'none' });
    addFlow(builder, 'ffn-side-b', [{ x: ix(2209), y: 780 }, { x: ix(2245), y: 780 }, { x: ix(2245), y: 827 }], { role: 'inset-flow', arrow: 'none' });
    addPill(builder, spec, 'ffn-linear-bottom', 'inset-operation', { x: ix(1828), y: 1024, width: 333, height: 104 }, { spans: [{ text: 'Linear layer' }] }, { radius: 28 });
    addPill(builder, spec, 'ffn-activation', 'inset-operation', { x: ix(1828), y: 830, width: 333, height: 103 }, { spans: [{ text: `${ffnData.activation} activation` }] }, { radius: 28 });
    addPill(builder, spec, 'ffn-linear-top', 'inset-operation', { x: ix(1828), y: 628, width: 333, height: 104 }, { spans: [{ text: 'Linear layer' }] }, { radius: 28 });
    addPill(builder, spec, 'ffn-linear-side', 'inset-operation', { x: ix(2180), y: 831, width: 343, height: 98 }, { spans: [{ text: 'Linear layer' }] }, { radius: 28 });
    builder.glyph('ffn-multiply', 'operator', { x: ix(2183), y: 780 }, 'multiply', 54);
  }

  if (layoutOptions?.repeatOnceWithSameWeights) {
    const repeatLoopLabel = typeof layoutOptions?.repeatLoopLabel === 'string'
      ? layoutOptions.repeatLoopLabel
      : 'Repeat once with same weights';
    const repeatLoopSecondaryLabel = typeof layoutOptions?.repeatLoopSecondaryLabel === 'string'
      ? layoutOptions.repeatLoopSecondaryLabel
      : undefined;
    addFlow(builder, 'repeat-loop', [{ x: 1210, y: 480 }, { x: 1560, y: 480 }, { x: 1560, y: 1480 }, { x: 1210, y: 1480 }], { role: 'repeat-loop', stroke: spec.theme.accent });
    addPill(builder, spec, 'repeat-loop-label', 'repeat-loop-label', { x: 1260, y: 410, width: 560, height: 100 }, { spans: [{ text: repeatLoopLabel }] }, { stroke: spec.theme.accent, radius: 26, secondaryText: repeatLoopSecondaryLabel ? { spans: [{ text: repeatLoopSecondaryLabel }] } : undefined });
  }

  if (annotationOf(spec, 'nope')) {
    addFlow(builder, 'leader-nope', [{ x: 250, y: 960 }, { x: 260, y: 1535 }], { role: 'leader', dash: 'dotted', arrow: 'none' });
    addAnnotation(builder, spec, 'nope', { x: 25, y: 920 });
  }
  if (annotationOf(spec, 'window-size')) {
    addFlow(builder, 'leader-window-size', [{ x: 1237, y: 1639 }, { x: 1760, y: 1280 }], { role: 'leader', dash: 'dotted', arrow: 'none' });
    addAnnotation(builder, spec, 'window-size', { x: 1760, y: 1280 });
  }
  if (annotationOf(spec, 'repeat-note')) {
    addFlow(builder, 'leader-repeat-note', [{ x: 420, y: 2240 }, { x: 620, y: 1980 }], { role: 'leader', dash: 'dotted', arrow: 'none' });
    addAnnotation(builder, spec, 'repeat-note', { x: 20, y: 2300 });
  }

  if (annotationOf(spec, 'positions')) {
    const positionsX = layoutOptions?.positionsAnnotationX;
    const positionsY = layoutOptions?.positionsAnnotationY;
    addFlow(builder, 'leader-positions', [
      positionalNode ? { x: 1290, y: 2130 } : { x: 1237, y: 1639 },
      {
        x: typeof positionsX === 'number' ? positionsX : 1600,
        y: typeof positionsY === 'number' ? positionsY : 1970,
      },
    ], { role: 'leader', dash: 'dotted', arrow: 'none' });
  }

  const leaders: Array<[string, Point[]]> = [
    ['leader-vocabulary', [{ x: 1218, y: 396 }, { x: 1350, y: 258 }]],
    ['leader-attention', [{ x: 1237, y: 1639 }, {
      x: typeof layoutOptions?.headsLeaderEndX === 'number' ? layoutOptions.headsLeaderEndX : 1882,
      y: typeof layoutOptions?.headsLeaderEndY === 'number' ? layoutOptions.headsLeaderEndY : 1889,
    }]],
    ['leader-ffn', [{ x: 1200, y: 1006 }, { x: typeof layoutOptions?.insetOffsetX === 'number' ? 1772 + layoutOptions.insetOffsetX : 1772, y: 876 }]],
    ['leader-embedding', [{ x: 1290, y: positionalNode ? 2288 : 2132 }, { x: 1598, y: 2244 }]],
    ['leader-context', [{
      x: typeof layoutOptions?.contextLeaderStartX === 'number' ? layoutOptions.contextLeaderStartX : 320,
      y: typeof layoutOptions?.contextLeaderStartY === 'number' ? layoutOptions.contextLeaderStartY : 1845,
    }, {
      x: typeof layoutOptions?.contextLeaderEndX === 'number' ? layoutOptions.contextLeaderEndX : 420,
      y: typeof layoutOptions?.contextLeaderEndY === 'number' ? layoutOptions.contextLeaderEndY : 1624,
    }]],
    ['leader-hidden', [{
      x: typeof layoutOptions?.hiddenLeaderX === 'number' ? layoutOptions.hiddenLeaderX : 2010,
      y: 1184,
    }, {
      x: typeof layoutOptions?.hiddenLeaderX === 'number' ? layoutOptions.hiddenLeaderX : 2010,
      y: 1388,
    }]],
  ];
  leaders
    .filter(([id]) => (id === 'leader-attention' ? Boolean(annotationOf(spec, 'heads')) : true))
    .filter(([id]) => (id === 'leader-context' ? Boolean(annotationOf(spec, 'context')) : true))
    .forEach(([id, points]) => addFlow(builder, id, points, { role: 'leader', dash: 'dotted', arrow: 'none' }));

  addAnnotation(builder, spec, 'vocabulary', { x: 1352, y: 254 });
  addAnnotation(builder, spec, 'context', { x: 20, y: 1893 });
  const headsAnnotationX = layoutOptions?.headsAnnotationX;
  const headsAnnotationY = layoutOptions?.headsAnnotationY;
  addAnnotation(builder, spec, 'heads', {
    x: typeof headsAnnotationX === 'number' ? headsAnnotationX : 1938,
    y: typeof headsAnnotationY === 'number' ? headsAnnotationY : 1905,
  });
  const positionsAnnotation = annotationOf(spec, 'positions');
  if (positionsAnnotation) {
    const positionsX = layoutOptions?.positionsAnnotationX;
    const positionsY = layoutOptions?.positionsAnnotationY;
    addAnnotation(builder, spec, 'positions', {
      x: typeof positionsX === 'number' ? positionsX : 1600,
      y: typeof positionsY === 'number' ? positionsY : 1970,
    });
  }
  addAnnotation(builder, spec, 'embedding-dimension', { x: 1608, y: 2242 });
  const hiddenAnnotationX = layoutOptions?.hiddenAnnotationX;
  addAnnotation(builder, spec, 'hidden-dimension', { x: typeof hiddenAnnotationX === 'number' ? hiddenAnnotationX : 1926, y: 1482 });

  return builder.scene(spec);
}

function layoutMoe(spec: FigureSpec, context: LayoutContext): Scene {
  if (spec.layout.mode !== 'template' || spec.layout.template !== 'moe') {
    throw new FigureLayoutError([{ severity: 'error', code: 'wrong-template', message: 'moe layout requires template moe' }]);
  }
  if (spec.layout.variant === 'mixing-detail') return layoutMixingDetail(spec, context);
  if (spec.layout.variant === 'multi-stream-residual') return layoutMotifMultiStream(spec, context);
  const blockId = spec.layout.slots.block;
  const ffnInsetId = spec.layout.slots.ffn;
  const moeInsetId = spec.layout.slots.moe;
  if (!blockId || Array.isArray(blockId) || !ffnInsetId || Array.isArray(ffnInsetId) || !moeInsetId || Array.isArray(moeInsetId)) {
    throw new FigureLayoutError([{ severity: 'error', code: 'missing-slot', message: 'moe layout requires block, ffn, and moe slots' }]);
  }
  const block = groupOf(spec, blockId);
  const ffnInset = groupOf(spec, ffnInsetId);
  const moeInset = groupOf(spec, moeInsetId);
  const operations = spec.nodes.filter(isOperation);
  const attention = operations.find((node) => node.data.family === 'gqa' || node.data.family === 'mla');
  const ffn = operations.find((node) => node.data.family === 'ffn');
  const moe = operations.find((node) => node.data.family === 'moe');
  const attentionData = attention?.data;
  const ffnData = ffn?.data;
  const moeData = moe?.data;
  if (!attentionData || (attentionData.family !== 'gqa' && attentionData.family !== 'mla') || !ffnData || ffnData.family !== 'ffn' || !moeData || moeData.family !== 'moe') {
    throw new FigureLayoutError([{ severity: 'error', code: 'missing-operation', message: 'moe layout requires attention, FFN, and MoE nodes' }]);
  }

  const builder = new SceneBuilder(spec.theme, context.metrics);
  const layoutOptions = spec.layout.options;
  const showQKNorm = layoutOptions?.showQKNorm === true;
  const ropeLabel = typeof layoutOptions?.ropeLabel === 'string' ? layoutOptions.ropeLabel : undefined;
  const firstBadgeFill = typeof layoutOptions?.firstBadgeFill === 'string' ? layoutOptions.firstBadgeFill : '#000000';
  const lastBadgeFill = typeof layoutOptions?.lastBadgeFill === 'string' ? layoutOptions.lastBadgeFill : spec.theme.accent;
  const titleColor = typeof layoutOptions?.titleColor === 'string' ? layoutOptions.titleColor : spec.theme.accent;
  const activeExpertLabel = typeof layoutOptions?.activeExpertLabel === 'string' ? layoutOptions.activeExpertLabel : undefined;
  const denseFirstLeader = layoutOptions?.denseFirstLeader === true;
  const attentionLabelStyle = typeof layoutOptions?.attentionLabelStyle === 'string' ? layoutOptions.attentionLabelStyle : undefined;
  const showHeadsAnnotation = layoutOptions?.showHeadsAnnotation !== false;
  const attentionBoxY = typeof layoutOptions?.attentionBoxY === 'number' ? layoutOptions.attentionBoxY : 1431;
  const attentionBoxHeight = typeof layoutOptions?.attentionBoxHeight === 'number' ? layoutOptions.attentionBoxHeight : 152;
  const ffnInsetWidth = typeof layoutOptions?.ffnInsetWidth === 'number' ? layoutOptions.ffnInsetWidth : 791;
  const ffnInsetHeight = typeof layoutOptions?.ffnInsetHeight === 'number' ? layoutOptions.ffnInsetHeight : 610;
  const ffnInsetTitleX = typeof layoutOptions?.ffnInsetTitleX === 'number' ? layoutOptions.ffnInsetTitleX : 2272;
  const moeInsetWidth = typeof layoutOptions?.moeInsetWidth === 'number' ? layoutOptions.moeInsetWidth : 968;
  const moeInsetTitleX = typeof layoutOptions?.moeInsetTitleX === 'number' ? layoutOptions.moeInsetTitleX : 2630;
  const lastBadgeX = typeof layoutOptions?.lastBadgeX === 'number' ? layoutOptions.lastBadgeX : 2820;
  const dimensionLeaderEndY = typeof layoutOptions?.dimensionLeaderEndY === 'number' ? layoutOptions.dimensionLeaderEndY : 1015;
  const expertAnnotationY = typeof layoutOptions?.expertAnnotationY === 'number' ? layoutOptions.expertAnnotationY : 1054;
  const resourceMaxWidth = typeof layoutOptions?.resourceMaxWidth === 'number' ? layoutOptions.resourceMaxWidth : 780;
  const cx = 1016;
  const repeatCount = block.repeat?.count ?? 0;
  builder.text('figure-title', 'title', { x: 590, y: 136 }, spec.title, { size: 136, weight: 700, fill: titleColor, align: 'start' });
  builder.group('model', 'model-container', { x: 450, y: 331, width: 1100, height: 2054 }, [], {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 6),
    sourceId: 'model',
  });
  builder.box('repeat-block', 'repeat-block', { x: 626, y: 672, width: 779, height: 1228 }, {
    fill: builder.solid(block.style?.fill?.kind === 'solid' ? block.style.fill.color : spec.theme.accent),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 70,
    sourceId: block.id,
  });

  addFlow(builder, 'residual-attention', [{ x: cx, y: 1805 }, { x: 1250, y: 1805 }, { x: 1250, y: 1500 }, { x: 1038, y: 1500 }], { role: 'residual-path', junction: 'plus' });
  addFlow(builder, 'residual-moe', [{ x: cx, y: 1260 }, { x: 1250, y: 1260 }, { x: 1250, y: 764 }, { x: 1038, y: 764 }], { role: 'residual-path', junction: 'plus' });
  const flows: Array<[string, number, number]> = [
    ['input', 2574, 2507], ['embedding', 2397, 2185], ['pre-attention', 2079, 1776], ['attention', 1654, attentionBoxY + attentionBoxHeight],
    ['post-attention', attentionBoxY - 3, 1356], ['pre-moe', 1276, 1199], ['moe', 1077, 995], ['post-moe', 899, 850],
    ['block-output', 671, 618], ['final-norm', 534, 486], ['output', 391, 237],
  ];
  flows.forEach(([id, from, to]) => addFlow(builder, `flow-${id}`, [{ x: cx, y: from }, { x: cx, y: to }]));

  addPill(builder, spec, 'output-layer', 'output-layer', { x: 832, y: 392, width: 354, height: 85 }, { spans: [{ text: 'Linear output layer' }] });
  addPill(builder, spec, 'final-rmsnorm', 'norm', { x: 837, y: 536, width: 344, height: 83 }, { spans: [{ text: 'Final RMSNorm' }] });
  addPill(builder, spec, 'moe', 'moe-block', { x: 834, y: 902, width: 344, height: 84 }, { spans: [{ text: 'MoE' }] }, { fill: spec.theme.surface });
  addPill(builder, spec, 'rmsnorm-2', 'norm', { x: 833, y: 1078, width: 346, height: 84 }, { spans: [{ text: 'RMSNorm 2' }] });
  builder.box('attention-box', 'attention-block', { x: 766, y: attentionBoxY, width: 414, height: attentionBoxHeight }, {
    fill: builder.solid('#5E5E5E'),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 30,
    sourceId: 'attention',
  });
  if (attentionData.family === 'mla' && attentionLabelStyle === 'mla-dsa') {
    addComposedCenteredLine(builder, context, 'attention-mla-line-1', 973, attentionBoxY + 70, 30, [
      { text: 'Multi-head ', fill: '#FFFFFF' },
      { text: 'latent', fill: '#FF968D' },
      { text: ' attention', fill: '#FFFFFF' },
    ]);
    builder.text('attention-mla-line-2', 'attention-label', { x: 973, y: attentionBoxY + 106 }, '(MLA)', { size: 30, fill: '#FFFFFF', align: 'center', sourceId: 'attention' });
    builder.text('attention-mla-line-3', 'attention-label', { x: 973, y: attentionBoxY + 142 }, '+', { size: 30, fill: '#FFFFFF', align: 'center', sourceId: 'attention' });
    addComposedCenteredLine(builder, context, 'attention-mla-line-4', 973, attentionBoxY + 178, 30, [
      { text: 'DeepSeek ', fill: '#FFFFFF' },
      { text: 'Sparse', fill: '#FF968D' },
    ]);
    builder.text('attention-mla-line-5', 'attention-label', { x: 973, y: attentionBoxY + 214 }, 'Attention (DSA)', { size: 30, fill: '#FFFFFF', align: 'center', sourceId: 'attention' });
  } else if (attentionData.family === 'mla') {
    builder.text('attention-first-line', 'attention-label', { x: 970, y: 1510 }, { spans: [{ text: 'Multi-head ', color: 'inverse' }, { text: 'latent', color: 'accent', emphasis: 'italic' }] }, { size: 40, align: 'center', sourceId: 'attention' });
    builder.text('attention-second-line', 'attention-label', { x: 970, y: 1565 }, 'attention', { size: 40, fill: '#FFFFFF', align: 'center', sourceId: 'attention' });
  } else {
    builder.text('attention-first-line', 'attention-label', { x: 970, y: 1521 }, 'Grouped-query', { size: 40, fill: '#FFFFFF', align: 'center', sourceId: 'attention' });
    builder.text('attention-second-line', 'attention-label', { x: 970, y: 1575 }, 'attention', { size: 40, fill: '#FFFFFF', align: 'center', sourceId: 'attention' });
  }
  addPill(builder, spec, 'rmsnorm-1', 'norm', { x: 831, y: 1676, width: 346, height: 84 }, { spans: [{ text: 'RMSNorm 1' }] });
  addPill(builder, spec, 'embedding-layer', 'embedding', { x: 743, y: 2090, width: 529, height: 84 }, { spans: [{ text: 'Token embedding layer' }] });
  addPill(builder, spec, 'tokenized-text', 'input', { x: 833, y: 2443, width: 343, height: 83 }, { spans: [{ text: 'Tokenized text' }] });
  builder.text('sample-input', 'input-label', { x: 1010, y: 2648 }, 'Sample input text', { size: 44, align: 'center', family: spec.theme.monospaceFamily ?? 'monospace' });
  if (showQKNorm) {
    addPill(builder, spec, 'qk-norm', 'side-pill', { x: 372, y: 1368, width: 300, height: 84 }, { spans: [{ text: 'QK-Norm' }] }, { size: 40 });
    addFlow(builder, 'qk-norm-flow', [{ x: 672, y: 1410 }, { x: 758, y: 1472 }]);
  }
  const ropeY = showQKNorm ? 1510 : 1455;
  addPill(builder, spec, 'rope', 'side-pill', { x: 372, y: ropeY, width: 300, height: 84 }, { spans: [{ text: ropeLabel ?? (attentionData.family === 'mla' ? 'Partial RoPE' : 'RoPE') }] }, { size: 40 });
  addFlow(builder, 'rope-flow', [{ x: 672, y: ropeY + 42 }, { x: 758, y: ropeY + 42 }]);

  builder.text('repeat-count', 'repeat-marker', { x: 468, y: 1908 }, `${repeatCount}`, { size: 60, weight: 700, fill: spec.theme.accent });
  builder.text('repeat-x', 'repeat-marker', { x: 558, y: 1908 }, '×', { size: 60, weight: 700, fill: spec.theme.accent });
  builder.glyph('repeat-brace', 'repeat-marker', { x: 665, y: 1870 }, 'brace', 150);

  builder.box('ffn-inset', 'ffn-inset', { x: 1877, y: 340, width: ffnInsetWidth, height: ffnInsetHeight }, {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 7, 'dotted'),
    radius: 44,
    sourceId: ffnInset.id,
  });
  if (ffnInset.title) builder.text('ffn-inset-title', 'ffn-inset-title', { x: ffnInsetTitleX, y: 315 }, ffnInset.title, { size: 54, weight: 700, align: 'center', sourceId: ffnInset.id });
  addFlow(builder, 'ffn-up-1', [{ x: 2077, y: 935 }, { x: 2077, y: 844 }], { role: 'inset-flow' });
  addFlow(builder, 'ffn-up-2', [{ x: 2077, y: 742 }, { x: 2077, y: 640 }], { role: 'inset-flow' });
  addFlow(builder, 'ffn-side-a', [{ x: 2077, y: 740 }, { x: 2227, y: 740 }], { role: 'inset-flow', arrow: 'none' });
  addFlow(builder, 'ffn-side-b', [{ x: 2255, y: 740 }, { x: 2390, y: 740 }, { x: 2390, y: 835 }], { role: 'inset-flow', arrow: 'none' });
  addPill(builder, spec, 'ffn-linear-bottom', 'inset-operation', { x: 1925, y: 935, width: 305, height: 104 }, { spans: [{ text: 'Linear layer' }] });
  addPill(builder, spec, 'ffn-activation', 'inset-operation', { x: 1925, y: 741, width: 305, height: 103 }, { spans: [{ text: `${ffnData.activation} activation` }] });
  addPill(builder, spec, 'ffn-linear-top', 'inset-operation', { x: 1925, y: 400, width: 305, height: 104 }, { spans: [{ text: 'Linear layer' }] });
  addPill(builder, spec, 'ffn-linear-side', 'inset-operation', { x: 2390, y: 835, width: 343, height: 98 }, { spans: [{ text: 'Linear layer' }] });
  builder.glyph('ffn-multiply', 'operator', { x: 2240, y: 740 }, 'multiply', 54);

  builder.box('moe-inset', 'moe-inset', { x: 1729, y: 1213, width: moeInsetWidth, height: 935 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke(spec.theme.accent, 8, 'dotted'),
    radius: 58,
    sourceId: moeInset.id,
  });
  if (moeInset.title) builder.text('moe-inset-title', 'moe-inset-title', { x: moeInsetTitleX, y: 1302 }, moeInset.title, { size: 54, weight: 700, align: 'end', sourceId: moeInset.id });
  addPill(builder, spec, 'router', 'router', { x: 2113, y: 1935, width: 200, height: 84 }, { spans: [{ text: 'Router' }] }, { stroke: spec.theme.accent, size: 40 });
  addPill(builder, spec, 'expert-left', 'expert', { x: 1790, y: 1640, width: 390, height: 88 }, { spans: [{ text: 'Feed forward' }] }, { size: 36 });
  addPill(builder, spec, 'expert-right', 'expert', { x: 2500, y: 1640, width: 390, height: 88 }, { spans: [{ text: 'Feed forward' }] }, { size: 36 });
  addFlow(builder, 'router-up', [{ x: 2213, y: 2018 }, { x: 2213, y: 1860 }], { role: 'moe-flow' });
  addFlow(builder, 'router-left', [{ x: 2213, y: 1935 }, { x: 1950, y: 1730 }], { role: 'moe-flow' });
  addFlow(builder, 'router-right', [{ x: 2213, y: 1935 }, { x: 2680, y: 1730 }], { role: 'moe-flow' });
  addFlow(builder, 'expert-left-up', [{ x: 1985, y: 1640 }, { x: 2213, y: 1480 }], { role: 'moe-flow' });
  addFlow(builder, 'expert-right-up', [{ x: 2695, y: 1640 }, { x: 2213, y: 1480 }], { role: 'moe-flow' });
  addFlow(builder, 'expert-center-up', [{ x: 2213, y: 1728 }, { x: 2213, y: 1480 }], { role: 'moe-flow' });
  builder.glyph('moe-plus', 'operator', { x: 2213, y: 1410 }, 'plus', 60);
  builder.glyph('expert-ellipsis', 'ellipsis', { x: 2213, y: 1685 }, 'ellipsis', 70);
  addPill(builder, spec, 'badge-1', 'badge', { x: 2100, y: 1680, width: 65, height: 65 }, { spans: [{ text: '1' }] }, { fill: firstBadgeFill, textFill: '#FFFFFF', size: 42, radius: 10 });
  addPill(builder, spec, 'badge-last', 'badge', { x: lastBadgeX, y: 1680, width: 85, height: 65 }, { spans: [{ text: `${moeData.experts}` }] }, { fill: lastBadgeFill, textFill: '#FFFFFF', size: 42, radius: 10 });
  addFlow(builder, 'moe-output', [{ x: 2213, y: 1380 }, { x: 2213, y: 1325 }], { role: 'moe-flow' });

  const leaderLines: Array<[string, Point[], string?]> = [
    ['vocabulary-leader', [{ x: 1320, y: 238 }, { x: 1186, y: 392 }]],
    ['context-leader', [{ x: 300, y: 1812 }, { x: 378, y: 1598 }]],
    ['attention-leader', [{ x: 1198, y: 1590 }, { x: 1600, y: 2340 }]],
    ['embedding-leader', [{ x: 1276, y: 2181 }, { x: 1352, y: 2545 }]],
    ['ffn-leader', [{ x: 1955, y: 340 + ffnInsetHeight }, { x: 1810, y: 1601 }]],
    ['dimension-leader', [{ x: 2215, y: 340 + ffnInsetHeight }, { x: 2272, y: dimensionLeaderEndY }]],
  ];
  leaderLines
    .filter(([id]) => (id === 'attention-leader' ? showHeadsAnnotation : true))
    .forEach(([id, points, stroke]) => addFlow(builder, id, points, { role: 'leader', dash: 'dotted', arrow: 'none', stroke }));
  addFlow(builder, 'moe-zoom', [{ x: 1182, y: 944 }, { x: 1736, y: 1290 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none', stroke: spec.theme.accent });

  addAnnotation(builder, spec, 'vocabulary', { x: 1240, y: 185 });
  addAnnotation(builder, spec, 'context', { x: 25, y: 1934 }, { size: 54 });
  if (showHeadsAnnotation) {
    addAnnotation(builder, spec, 'heads', { x: 1592, y: 2408 }, {
      size: 52,
      content: [{ spans: [{ text: `${attentionData.heads}`, color: 'accent' }, { text: ' heads' }] }],
    });
  }
  addAnnotation(builder, spec, 'embedding-dimension', { x: 1365, y: 2602 }, { size: 53 });
  addAnnotation(builder, spec, 'expert-dimensions', { x: 2025, y: expertAnnotationY }, { size: 48 });
  addAnnotation(builder, spec, 'resource-savings-title', { x: 1955, y: 2252 }, { size: 56 });
  const resource = annotationOf(spec, 'resource-savings');
  const resourceBullets = resource && 'bullets' in resource.content ? [...resource.content.bullets] : [];
  const activeLabel = activeExpertLabel ?? (moeData.sharedExperts && moeData.sharedExperts > 0
    ? `${moeData.sharedExperts} (shared) + ${moeData.activeExperts} experts`
    : `${moeData.activeExperts} experts`);
  const activeIndex = resourceBullets.findIndex((bullet) => bullet.spans.some((span) => span.text.includes('expert')));
  if (activeIndex >= 0) {
    resourceBullets[activeIndex] = { maxWidth: 780, spans: [{ text: 'but only ' }, { text: activeLabel, color: 'accent' }, { text: ' active per token' }] };
  }
  const resourceLineGap = typeof layoutOptions?.resourceLineGap === 'number' ? layoutOptions.resourceLineGap : resourceBullets.length > 4 ? 62 : 82;
  addAnnotation(builder, spec, 'resource-savings', { x: 1955, y: 2326 }, {
    size: 48,
    bullets: true,
    lineGap: resourceLineGap,
    content: resourceBullets.map((bullet) => ({ ...bullet, maxWidth: bullet.maxWidth ?? resourceMaxWidth })),
  });
  if (denseFirstLeader && annotationOf(spec, 'dense-first')) {
    addFlow(builder, 'dense-first-leader', [{ x: 420, y: 2330 }, { x: 620, y: 1980 }], { role: 'leader', dash: 'dotted', arrow: 'none' });
  }
  addAnnotation(builder, spec, 'dense-first', { x: 20, y: 2390 }, { size: 44 });

  return scaleScene(builder.scene(spec), 2904, 2699);
}

function addComposedCenteredLine(
  builder: SceneBuilder,
  context: LayoutContext,
  id: string,
  centerX: number,
  y: number,
  size: number,
  pieces: Array<{ text: string; fill: string }>,
): void {
  const widths = pieces.map((piece) => context.metrics.measure({ text: piece.text }, { size, weight: 400, family: 'sans-serif' }));
  let cursor = centerX - widths.reduce((sum, width) => sum + width, 0) / 2;
  pieces.forEach((piece, index) => {
    builder.text(`${id}-${index}`, 'attention-label', { x: cursor, y }, piece.text, {
      size,
      fill: piece.fill,
      align: 'start',
      sourceId: 'attention',
    });
    cursor += widths[index];
  });
}

function scaleScene(scene: Scene, baseWidth: number, baseHeight: number): Scene {
  const sx = scene.canvas.width / baseWidth;
  const sy = scene.canvas.height / baseHeight;
  const ss = Math.min(sx, sy);
  const scaleBox = (box: Box): Box => ({ x: box.x * sx, y: box.y * sy, width: box.width * sx, height: box.height * sy });
  const scalePoint = (point: Point): Point => ({ x: point.x * sx, y: point.y * sy });
  return {
    ...scene,
    elements: scene.elements.map((element) => {
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

function layoutManual(spec: FigureSpec, context: LayoutContext): Scene {
  if (spec.layout.mode !== 'manual') {
    throw new FigureLayoutError([{ severity: 'error', code: 'wrong-layout', message: 'manual layout requires manual placements' }]);
  }
  const builder = new SceneBuilder(spec.theme, context.metrics);
  const manualLayout = spec.layout;
  const placements = manualLayout.placements;
  const content = new Map<Id, Box>();

  spec.groups.forEach((group) => {
    const box = placements[group.id];
    if (!box) return;
    content.set(group.id, box);
    builder.group(group.id, `manual-group-${group.kind}`, box, group.children, {
      fill: group.style?.fill,
      stroke: group.style?.stroke ? builder.stroke(group.style.stroke, 5, group.style.strokeStyle) : undefined,
      sourceId: group.id,
    });
  });

  spec.nodes.forEach((node) => {
    const box = placements[node.id];
    if (!box) return;
    content.set(node.id, box);
    builder.box(node.id, `manual-node-${node.kind}`, box, {
      fill: node.style?.fill,
      stroke: node.style?.stroke ? builder.stroke(node.style.stroke, 5) : undefined,
      radius: 24,
      sourceId: node.id,
    });
    if (node.kind === 'operator') {
      builder.glyph(`${node.id}-glyph`, 'operator', { x: box.x + box.width / 2, y: box.y + box.height / 2 }, node.data.operator, Math.min(box.width, box.height) * 0.45, { sourceId: node.id });
    } else {
      builder.text(`${node.id}-label`, 'manual-label', { x: box.x + box.width / 2, y: box.y + box.height / 2 + 12 }, textOf(node), {
        size: 32,
        align: 'center',
        sourceId: node.id,
      });
    }
  });

  spec.edges.forEach((edge) => {
    const route = manualLayout.routes?.[edge.id];
    const points = route ?? [center(content.get(edge.from.node)), center(content.get(edge.to.node))].filter((point): point is Point => Boolean(point));
    if (points.length >= 2) {
      addFlow(builder, edge.id, points, {
        role: edge.kind === 'residual' ? 'residual-path' : edge.kind,
        stroke: edge.style?.stroke,
        dash: edge.style?.dash,
        arrow: edge.arrow,
        junction: edge.junction === 'plus' || edge.junction === 'multiply' ? edge.junction : undefined,
      });
    }
  });

  return builder.scene(spec);
}

function center(box?: Box): Point | undefined {
  return box ? { x: box.x + box.width / 2, y: box.y + box.height / 2 } : undefined;
}

export const templateLayoutEngine: LayoutEngine = {
  id: 'template-v1',
  layout(spec, context): Scene {
    switch (spec.layout.mode === 'template' ? spec.layout.template : 'manual') {
      case 'backbone':
        return layoutBackbone(spec, context);
      case 'moe':
        return layoutMoe(spec, context);
      case 'attention-mask':
        return spec.layout.mode === 'template' && spec.layout.variant === 'ihc-pipeline'
          ? layoutTencentHy4(spec, context)
          : layoutQwenSparse(spec, context);
      case 'multi-tower':
        return layoutDeepSeekMultiTower(spec, context);
      case 'layer-schedule':
        return layoutGlmLayerSchedule(spec, context);
      case 'manual':
        return layoutManual(spec, context);
      default:
        throw new FigureLayoutError([{
          severity: 'error',
          code: 'unsupported-template',
          message: `Template "${spec.layout.mode === 'template' ? spec.layout.template : 'manual'}" is not implemented`,
        }]);
    }
  },
};

export const defaultLayoutContext: LayoutContext = {
  theme: {
    accent: '#000000',
    surface: '#D5D5D5',
    ink: '#000000',
    muted: '#666666',
    background: '#FFFFFF',
    fontFamily: 'Arial, sans-serif',
  },
  metrics: systemTextMetrics,
};
