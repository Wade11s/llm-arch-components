import { TemplateScene, templateText as text, requireSlot as slot, requireGroup as groupOf, requireOperation as operation, annotationLines, templateFailure } from './templateScene';
import type { Box, FigureSpec, LayoutContext, NodeSpec, Scene, TextSpec } from '../types';

type OperationNode = Extract<NodeSpec, { kind: 'operation' | 'composite' }>;

function title(builder: TemplateScene, spec: FigureSpec): void {
  const splitAt = spec.layout.mode === 'template' && spec.layout.options?.titleLines === 2 ? spec.title.lastIndexOf(' (') : -1;
  if (splitAt > 0) {
    builder.text('figure-title', 'title', { x: 690, y: 112 }, spec.title.slice(0, splitAt), { size: 92, weight: 900, fill: spec.theme.accent, align: 'center', family: "'Arial Black', Arial, sans-serif" });
    builder.text('figure-title-2', 'title', { x: 690, y: 220 }, spec.title.slice(splitAt + 1), { size: 92, weight: 900, fill: spec.theme.accent, align: 'center', family: "'Arial Black', Arial, sans-serif" });
  } else {
    builder.text('figure-title', 'title', { x: 690, y: 140 }, spec.title, { size: 86, weight: 900, fill: spec.theme.accent, align: 'center', family: "'Arial Black', Arial, sans-serif" });
  }
}

function backbone(builder: TemplateScene, spec: FigureSpec, attention: OperationNode, sideNote: TextSpec[]): void {
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

  builder.flow('residual-attention', [{ x: cx, y: 1680 }, { x: 1245, y: 1680 }, { x: 1245, y: 1420 }, { x: 1025, y: 1420 }], { role: 'residual-path', junction: 'plus' });
  builder.flow('residual-moe', [{ x: cx, y: 1110 }, { x: 1245, y: 1110 }, { x: 1245, y: 700 }, { x: 1025, y: 700 }], { role: 'residual-path', junction: 'plus' });
  const rail: Array<[string, number, number]> = [
    ['input', 2670, 2590], ['embedding', 2435, 2285], ['pre-attention', 2100, 1888], ['attention', 1700, 1665],
    ['post-attention', 1500, 1270], ['moe', 1090, 1085], ['block-output', 970, 730], ['final-norm', 630, 585],
    ['output', 500, 340],
  ];
  rail.forEach(([id, from, to]) => builder.flow(`flow-${id}`, [{ x: cx, y: from }, { x: cx, y: to }]));

  builder.pill('output-layer', 'output-layer', { x: 800, y: 500, width: 380, height: 84 }, text('Linear output layer'));
  builder.pill('final-rmsnorm', 'norm', { x: 800, y: 640, width: 380, height: 84 }, text('Final RMSNorm'));
  builder.pill('moe', 'moe-block', { x: 800, y: 1000, width: 380, height: 84 }, text('MoE'), { fill: spec.theme.surface });
  builder.pill('rmsnorm-2', 'norm', { x: 800, y: 1180, width: 380, height: 84 }, text('RMSNorm 2'));

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
  builder.pill('rmsnorm-1', 'norm', { x: 800, y: 1800, width: 380, height: 84 }, text('RMSNorm 1'));
  builder.pill('embedding-layer', 'embedding', { x: 720, y: 2200, width: 540, height: 90 }, text('Token embedding layer'));
  builder.pill('tokenized-text', 'input', { x: 820, y: 2500, width: 340, height: 84 }, text('Tokenized text'));
  builder.text('sample-input', 'input-label', { x: cx, y: 2700 }, text('Sample input text'), { size: 48, align: 'center', family: spec.theme.monospaceFamily ?? 'monospace' });

  builder.box('side-note-box', 'side-note', { x: 330, y: 1440, width: 360, height: 140 }, { fill: builder.solid('#FFFFFF'), stroke: builder.stroke('#000000', 5), radius: 28 });
  sideNote.forEach((line, index) => {
    builder.text(`side-note-line-${index}`, 'side-note-label', { x: 510, y: 1490 + index * 42 }, line, { size: 30, align: 'center' });
  });
  builder.flow('side-note-flow', [{ x: 690, y: 1510 }, { x: 750, y: 1560 }]);
  builder.callout(spec, 'context', { x: 20, y: 1930 }, { size: 46, lineGap: 58, role: 'annotation-context', sourceId: null });

  builder.text('repeat-count', 'repeat-marker', { x: 470, y: 1905 }, `${repeatCount}`, { size: 58, weight: 700, fill: spec.theme.accent });
  builder.text('repeat-x', 'repeat-marker', { x: 555, y: 1905 }, '×', { size: 58, weight: 700, fill: spec.theme.accent });
  builder.glyph('repeat-brace', 'repeat-marker', { x: 665, y: 1870 }, 'brace', 150);
}

function renderGatedGqa(builder: TemplateScene, box: Box): void {
  const x = box.x;
  const y = box.y;
  builder.pill('gqa-output', 'mixing-output', { x: x + 430, y: y + 55, width: 160, height: 70 }, text('Linear'));
  builder.glyph('gqa-multiply', 'operator', { x: x + 510, y: y + 185 }, 'multiply', 54);
  builder.pill('gqa-attention', 'mixing-operation', { x: x + 190, y: y + 280, width: 640, height: 85 }, text('Scaled dot-product attention'), { fill: '#FFF6BF', size: 32 });
  const lanes = [
    { id: 'q', label: 'Q', x: x + 230 },
    { id: 'k', label: 'K', x: x + 420 },
    { id: 'v', label: 'V', x: x + 610 },
  ];
  builder.text('gqa-qk-norm-label', 'mixing-note', { x: x + 120, y: y + 500 }, text('QK-Norm'), { size: 28, align: 'center' });
  lanes.forEach((lane) => {
    builder.text(`gqa-${lane.id}`, 'mixing-lane', { x: lane.x, y: y + 425 }, text(lane.label), { size: 38, weight: 700, align: 'center' });
    builder.flow(`gqa-${lane.id}-flow`, [{ x: lane.x, y: y + 565 }, { x: lane.x, y: y + 365 }], { role: 'mixing-flow' });
    builder.pill(`gqa-${lane.id}-linear`, 'mixing-linear', { x: lane.x - 70, y: y + 565, width: 140, height: 70 }, text('Linear'), { size: 28 });
    if (lane.id !== 'v') builder.pill(`gqa-${lane.id}-norm`, 'mixing-norm', { x: lane.x - 85, y: y + 465, width: 170, height: 70 }, text('RMSNorm'), { size: 26 });
  });
  builder.pill('gqa-gate-linear', 'mixing-linear', { x: x + 830, y: y + 565, width: 140, height: 70 }, text('Linear'), { size: 28 });
  builder.glyph('gqa-gate', 'operator', { x: x + 900, y: y + 330 }, 'sigmoid', 50);
  builder.text('gqa-gate-label', 'mixing-gate', { x: x + 950, y: y + 320 }, text('Sigmoid'), { size: 30 });
  builder.text('gqa-gate-label-2', 'mixing-gate', { x: x + 950, y: y + 360 }, text('Gate'), { size: 30 });
  builder.flow('gqa-attention-up', [{ x: x + 510, y: y + 280 }, { x: x + 510, y: y + 185 }], { role: 'mixing-flow' });
  builder.flow('gqa-output-up', [{ x: x + 510, y: y + 185 }, { x: x + 510, y: y + 125 }], { role: 'mixing-flow' });
  builder.flow('gqa-gate-flow', [{ x: x + 900, y: y + 565 }, { x: x + 900, y: y + 330 }, { x: x + 565, y: y + 185 }], { role: 'mixing-flow' });
}

function renderMla(builder: TemplateScene, box: Box): void {
  const x = box.x;
  const y = box.y;
  builder.pill('mla-output', 'mixing-output', { x: x + 410, y: y + 55, width: 200, height: 70 }, text('Output proj.'), { size: 30 });
  builder.pill('mla-attention', 'mixing-operation', { x: x + 120, y: y + 230, width: 800, height: 85 }, text('Multi-head latent attention'), { fill: '#F59ECB', size: 34 });
  builder.pill('mla-q-projection', 'mixing-linear', { x: x + 70, y: y + 650, width: 220, height: 75 }, text('Q projection'), { size: 30 });
  builder.pill('mla-k-up', 'mixing-linear', { x: x + 330, y: y + 400, width: 210, height: 75 }, text('K up-proj.'), { size: 30 });
  builder.pill('mla-v-up', 'mixing-linear', { x: x + 690, y: y + 400, width: 210, height: 75 }, text('V up-proj.'), { size: 30 });
  builder.pill('mla-latent-norm', 'mixing-norm', { x: x + 420, y: y + 535, width: 260, height: 75 }, text('Latent RMSNorm'), { size: 28 });
  builder.pill('mla-kv-down', 'mixing-linear', { x: x + 440, y: y + 650, width: 230, height: 75 }, text('KV down-proj.'), { size: 30 });
  builder.text('mla-q-label', 'mixing-lane', { x: x + 180, y: y + 210 }, text('Q'), { size: 38, weight: 700, align: 'center' });
  builder.text('mla-k-label', 'mixing-lane', { x: x + 430, y: y + 210 }, text('K'), { size: 38, weight: 700, align: 'center' });
  builder.text('mla-v-label', 'mixing-lane', { x: x + 790, y: y + 210 }, text('V'), { size: 38, weight: 700, align: 'center' });
  builder.text('mla-key-size', 'mixing-note', { x: x + 330, y: y + 560 }, { spans: [{ text: '64-d' }] }, { size: 28, align: 'center' });
  builder.text('mla-key-size-2', 'mixing-note', { x: x + 330, y: y + 595 }, { spans: [{ text: 'key' }] }, { size: 28, align: 'center' });
  builder.flow('mla-q-flow', [{ x: x + 180, y: y + 650 }, { x: x + 180, y: y + 315 }], { role: 'mixing-flow' });
  builder.flow('mla-kv-down-flow', [{ x: x + 555, y: y + 650 }, { x: x + 555, y: y + 610 }], { role: 'mixing-flow' });
  builder.flow('mla-latent-flow', [{ x: x + 555, y: y + 535 }, { x: x + 555, y: y + 315 }], { role: 'mixing-flow' });
  builder.flow('mla-k-flow', [{ x: x + 435, y: y + 400 }, { x: x + 435, y: y + 315 }], { role: 'mixing-flow' });
  builder.flow('mla-v-flow', [{ x: x + 795, y: y + 400 }, { x: x + 795, y: y + 315 }], { role: 'mixing-flow' });
  builder.flow('mla-output-flow', [{ x: x + 510, y: y + 230 }, { x: x + 510, y: y + 125 }], { role: 'mixing-flow' });
  builder.flow('mla-key-branch', [{ x: x + 555, y: y + 610 }, { x: x + 435, y: y + 610 }, { x: x + 435, y: y + 475 }], { role: 'mixing-flow', arrow: 'none' });
  builder.flow('mla-value-branch', [{ x: x + 555, y: y + 610 }, { x: x + 795, y: y + 610 }, { x: x + 795, y: y + 475 }], { role: 'mixing-flow', arrow: 'none' });
}

function renderDelta(builder: TemplateScene, box: Box, gateLabel: string): void {
  const x = box.x;
  const y = box.y;
  builder.pill('delta-output', 'mixing-output', { x: x + 430, y: y + 60, width: 160, height: 70 }, text('Linear'), { size: 30 });
  builder.glyph('delta-multiply', 'operator', { x: x + 510, y: y + 190 }, 'multiply', 54);
  builder.pill('delta-rmsnorm', 'mixing-norm', { x: x + 420, y: y + 270, width: 180, height: 70 }, text('RMSNorm'), { size: 28 });
  builder.pill('delta-rule', 'mixing-operation', { x: x + 190, y: y + 400, width: 680, height: 85 }, text('Gated Delta Rule'), { fill: '#FFF6BF', size: 34 });
  const labels: Array<[string, string, number]> = [
    ['q', 'Q', x + 230], ['k', 'K', x + 310], ['v', 'V', x + 470], ['alpha', 'α', x + 650], ['beta', 'β', x + 730],
  ];
  labels.forEach(([id, label, lx]) => builder.text(`delta-${id}`, 'mixing-lane', { x: lx, y: y + 545 }, text(label), { size: 38, weight: 700, align: 'center' }));
  builder.pill('delta-l2', 'mixing-norm', { x: x + 185, y: y + 605, width: 180, height: 70 }, text('L2 Norm'), { fill: '#F8D76B', size: 30 });
  builder.glyph('delta-q-sigmoid', 'operator', { x: x + 230, y: y + 710 }, 'sigmoid', 44);
  builder.glyph('delta-k-sigmoid', 'operator', { x: x + 310, y: y + 710 }, 'sigmoid', 44);
  builder.glyph('delta-v-sigmoid', 'operator', { x: x + 470, y: y + 710 }, 'sigmoid', 44);
  builder.glyph('delta-alpha-sigmoid', 'operator', { x: x + 650, y: y + 710 }, 'sigmoid', 44);
  builder.glyph('delta-beta-sigmoid', 'operator', { x: x + 730, y: y + 710 }, 'sigmoid', 44);
  builder.pill('delta-qk-conv', 'mixing-conv', { x: x + 180, y: y + 790, width: 190, height: 75 }, text('Conv'), { fill: '#F59A8A', size: 32 });
  builder.pill('delta-v-conv', 'mixing-conv', { x: x + 420, y: y + 790, width: 160, height: 75 }, text('Conv'), { fill: '#F59A8A', size: 32 });
  builder.pill('delta-qk-linear', 'mixing-linear', { x: x + 190, y: y + 930, width: 170, height: 70 }, text('Linear'), { size: 28 });
  builder.pill('delta-v-linear', 'mixing-linear', { x: x + 420, y: y + 930, width: 160, height: 70 }, text('Linear'), { size: 28 });
  builder.pill('delta-ab-linear', 'mixing-linear', { x: x + 620, y: y + 930, width: 170, height: 70 }, text('Linear'), { size: 28 });
  builder.pill('delta-gate-linear', 'mixing-linear', { x: x + 850, y: y + 930, width: 170, height: 70 }, text('Linear'), { size: 28 });
  builder.glyph('delta-gate', 'operator', { x: x + 935, y: y + 590 }, 'sigmoid', 50);
  builder.text('delta-gate-label', 'mixing-gate', { x: x + 985, y: y + 580 }, text(gateLabel), { size: 28 });
  builder.text('delta-gate-label-2', 'mixing-gate', { x: x + 985, y: y + 618 }, text('Gate'), { size: 28 });
  builder.flow('delta-rule-up', [{ x: x + 510, y: y + 400 }, { x: x + 510, y: y + 340 }], { role: 'mixing-flow' });
  builder.flow('delta-output-up', [{ x: x + 510, y: y + 270 }, { x: x + 510, y: y + 190 }], { role: 'mixing-flow' });
  builder.flow('delta-output-top', [{ x: x + 510, y: y + 190 }, { x: x + 510, y: y + 130 }], { role: 'mixing-flow' });
  builder.flow('delta-q-flow', [{ x: x + 275, y: y + 930 }, { x: x + 275, y: y + 865 }, { x: x + 230, y: y + 865 }, { x: x + 230, y: y + 675 }], { role: 'mixing-flow' });
  builder.flow('delta-k-flow', [{ x: x + 275, y: y + 930 }, { x: x + 275, y: y + 675 }, { x: x + 310, y: y + 675 }], { role: 'mixing-flow' });
  builder.flow('delta-v-flow', [{ x: x + 500, y: y + 930 }, { x: x + 500, y: y + 865 }, { x: x + 470, y: y + 865 }, { x: x + 470, y: y + 485 }], { role: 'mixing-flow' });
  builder.flow('delta-ab-flow', [{ x: x + 705, y: y + 930 }, { x: x + 705, y: y + 485 }], { role: 'mixing-flow' });
  builder.flow('delta-gate-flow', [{ x: x + 935, y: y + 930 }, { x: x + 935, y: y + 590 }, { x: x + 565, y: y + 190 }], { role: 'mixing-flow' });
}

function schedule(builder: TemplateScene, spec: FigureSpec): void {
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
  if (spec.layout.mode === 'template' && spec.layout.options?.scheduleRule === true) {
    builder.flow('schedule-underline', [{ x, y: y + 35 }, { x: x + 800, y: y + 35 }], { role: 'layer-schedule-rule', arrow: 'none' });
  }
}

export function layoutMixingDetail(spec: FigureSpec, context: LayoutContext): Scene {
  if (spec.layout.mode !== 'template' || spec.layout.template !== 'moe') {
    templateFailure('wrong-template', 'mixing-detail is an moe template variant');
  }
  slot(spec, 'block');
  const attentionInset = groupOf(spec, slot(spec, 'attention'));
  const deltaInset = groupOf(spec, slot(spec, 'delta'));
  const attention = operation(spec, (node) => node.data.family === 'gqa' || node.data.family === 'mla');
  operation(spec, (node) => node.data.family === 'gated-delta-net');
  operation(spec, (node) => node.data.family === 'moe');

  const builder = new TemplateScene(spec.theme, context.metrics);
  title(builder, spec);
  backbone(builder, spec, attention, annotationLines(spec, 'side-note'));

  const attentionBox = { x: 1800, y: 180, width: 1100, height: 850 };
  const deltaBox = { x: 1800, y: 1150, width: 1100, height: 1000 };
  builder.insetFrame('attention-inset', 'mixing-attention-inset', attentionBox, attentionInset.title ?? text('Attention'));
  builder.insetFrame('delta-inset', 'mixing-delta-inset', deltaBox, deltaInset.title ?? text('Delta attention'));

  if (attention.data.family === 'mla') renderMla(builder, attentionBox);
  else renderGatedGqa(builder, attentionBox);
  renderDelta(builder, deltaBox, attention.data.family === 'mla' ? 'Sigmoid' : 'SiLU');
  schedule(builder, spec);

  builder.flow('attention-zoom', [{ x: 1230, y: 1550 }, { x: 1800, y: 500 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  builder.flow('delta-zoom', [{ x: 1230, y: 1600 }, { x: 1800, y: 1750 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });

  return builder.scene(spec);
}
