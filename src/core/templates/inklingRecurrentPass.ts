import { TemplateScene, templateText as text, createTemplateApi } from './templateScene';
import type { FigureSpec, LayoutContext, NodeSpec, Scene } from '../types';

type OperationNode = Extract<NodeSpec, { kind: 'operation' | 'composite' }>;

const { fail, slot, groupOf, operation } = createTemplateApi('Inkling', 'recurrent-pass');

function passStrip(builder: TemplateScene, spec: FigureSpec): void {
  builder.text('pass-heading', 'pass-heading', { x: 20, y: 120 }, text('One token through the decoder'), { size: 40, weight: 800, fill: spec.theme.accent });
  builder.text('pass-summary', 'pass-heading', { x: 730, y: 180 }, text('24 distinct layers, 48 layer applications per token'), { size: 36, weight: 700 });
  builder.text('pass-middle-label', 'pass-heading', { x: 390, y: 230 }, text('Same 12 middle layers'), { size: 30, weight: 700 });
  builder.pill('pass-before', 'pass-strip', { x: 20, y: 360, width: 310, height: 100 }, { spans: [{ text: '6 layers before the loop' }] }, { fill: '#FFF2E4', size: 24 });
  builder.pill('pass-1', 'pass-strip', { x: 350, y: 360, width: 140, height: 100 }, text('Pass 1'), { fill: '#FFE5C4', size: 28 });
  builder.pill('pass-2', 'pass-strip', { x: 520, y: 360, width: 140, height: 100 }, text('Pass 2'), { fill: '#FFE5C4', size: 28 });
  builder.pill('pass-3', 'pass-strip', { x: 690, y: 360, width: 140, height: 100 }, text('Pass 3'), { fill: '#FFE5C4', size: 28 });
  builder.pill('pass-after', 'pass-strip', { x: 950, y: 360, width: 310, height: 100 }, { spans: [{ text: '6 layers after the loop' }] }, { fill: '#FFF2E4', size: 24 });
  builder.flow('pass-arrow-before', [{ x: 270, y: 410 }, { x: 350, y: 410 }], { role: 'pass-flow' });
  builder.flow('pass-arrow-1', [{ x: 490, y: 410 }, { x: 520, y: 410 }], { role: 'pass-flow' });
  builder.flow('pass-arrow-2', [{ x: 660, y: 410 }, { x: 690, y: 410 }], { role: 'pass-flow' });
  builder.flow('pass-arrow-3', [{ x: 830, y: 410 }, { x: 950, y: 410 }], { role: 'pass-flow' });
  builder.flow('pass-bracket', [{ x: 420, y: 320 }, { x: 420, y: 280 }, { x: 760, y: 280 }, { x: 760, y: 320 }], { role: 'pass-bracket', arrow: 'none' });
  builder.text('pass-depth-1', 'depth-arithmetic', { x: 20, y: 560 }, text('6 + 12 + 6 = 24 distinct layers'), { size: 34, weight: 700 });
  builder.text('pass-depth-2', 'depth-arithmetic', { x: 20, y: 610 }, text('6 + 12 + 12 + 12 + 6 = 48 layer applications'), { size: 34, weight: 700 });
  builder.callout(spec, 'pass-note', { x: 20, y: 680 }, { size: 30, lineGap: 42 });
}

function mainModel(builder: TemplateScene, spec: FigureSpec, gqa: OperationNode): void {
  const cx = 1880;
  const block = spec.groups.find((group) => group.kind === 'repeat-block');
  builder.group('model', 'model-container', { x: 1330, y: 380, width: 1100, height: 2700 }, [], {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 6),
    sourceId: 'model',
  });
  builder.box('repeat-block', 'repeat-block', { x: 1510, y: 1100, width: 790, height: 1370 }, {
    fill: builder.solid(block?.style?.fill?.kind === 'solid' ? block.style.fill.color : spec.theme.accent),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 64,
    sourceId: block?.id,
  });
  builder.pill('logit-softcap', 'output-layer', { x: 1710, y: 430, width: 340, height: 70 }, text('Logit softcap (30)'), { size: 28 });
  builder.pill('output-layer', 'output-layer', { x: 1710, y: 520, width: 340, height: 70 }, text('Linear output layer'), { size: 28 });
  builder.pill('final-rmsnorm', 'norm', { x: 1710, y: 650, width: 340, height: 70 }, text('Final RMSNorm'), { size: 28 });
  builder.pill('final-attnres', 'attnres', { x: 1660, y: 800, width: 440, height: 70 }, text('Final Block AttnRes'), { fill: '#FFF2E4', size: 28 });
  builder.pill('after-loop', 'layer-card', { x: 1600, y: 900, width: 560, height: 110 }, text('Layers after the loop'), { size: 28 });
  builder.text('after-loop-subtitle', 'layer-card-label', { x: cx, y: 1010 }, text('19–24 run once after pass 3'), { size: 26, align: 'center' });
  builder.pill('moe', 'moe-block', { x: 1710, y: 1170, width: 340, height: 70 }, text('MoE'), { fill: spec.theme.surface, size: 28 });
  builder.pill('short-conv-top', 'conv', { x: 1710, y: 1300, width: 340, height: 70 }, text('Short conv (kernel 4)'), { size: 28 });
  builder.pill('rmsnorm-2', 'norm', { x: 1710, y: 1450, width: 340, height: 70 }, text('RMSNorm 2'), { size: 28 });
  builder.pill('short-conv-bottom', 'conv', { x: 1710, y: 1720, width: 340, height: 70 }, text('Short conv (kernel 4)'), { size: 28 });
  builder.box('attention-box', 'attention-block', { x: 1660, y: 1830, width: 440, height: 220 }, {
    fill: builder.solid('#5E5E5E'),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 28,
    sourceId: gqa.id,
  });
  const spans = gqa.label?.spans ?? [{ text: 'Gated grouped-query attention (GQA)' }, { text: '5 local layers, then' }, { text: '1 global layer' }];
  builder.text('attention-line-1', 'attention-label', { x: cx, y: 1890 }, { spans: spans.slice(0, 1) }, { size: 30, fill: '#FFFFFF', align: 'center', sourceId: gqa.id });
  builder.text('attention-line-2', 'attention-label', { x: cx, y: 1940 }, { spans: spans.slice(1, 2) }, { size: 30, fill: '#FFFFFF', align: 'center', sourceId: gqa.id });
  builder.text('attention-line-3', 'attention-label', { x: cx, y: 1990 }, { spans: spans.slice(2) }, { size: 30, fill: '#FFFFFF', align: 'center', sourceId: gqa.id });
  builder.pill('rmsnorm-1', 'norm', { x: 1710, y: 2170, width: 340, height: 70 }, text('RMSNorm 1'), { size: 28 });
  builder.pill('before-loop', 'layer-card', { x: 1600, y: 2500, width: 560, height: 110 }, text('Layers before the loop'), { size: 28 });
  builder.text('before-loop-subtitle', 'layer-card-label', { x: cx, y: 2620 }, text('1–6 feed all three passes'), { size: 26, align: 'center' });
  builder.pill('embedding-rmsnorm', 'norm', { x: 1660, y: 2750, width: 440, height: 70 }, text('Embedding RMSNorm'), { size: 28 });
  builder.pill('embedding-layer', 'embedding', { x: 1630, y: 2980, width: 500, height: 70 }, text('Token embedding layer'), { size: 28 });
  builder.pill('tokenized-text', 'input', { x: 1710, y: 3220, width: 340, height: 70 }, text('Tokenized text'), { size: 28 });
  builder.text('sample-input', 'input-label', { x: cx, y: 3370 }, text('Sample input text'), { size: 42, align: 'center' });
  builder.flow('residual-attention', [{ x: cx, y: 2050 }, { x: 2140, y: 2050 }, { x: 2140, y: 1650 }, { x: 1910, y: 1650 }], { role: 'residual-path', junction: 'plus' });
  builder.flow('residual-moe', [{ x: cx, y: 1520 }, { x: 2140, y: 1520 }, { x: 2140, y: 1070 }, { x: 1910, y: 1070 }], { role: 'residual-path', junction: 'plus' });
  const rail: Array<[string, number, number]> = [
    ['input', 3340, 3290], ['embedding', 3150, 3050], ['embedding-norm', 2910, 2820], ['before-loop', 2680, 2610],
    ['pre-attention', 2430, 2240], ['attention', 2100, 2050], ['post-attention', 1830, 1790], ['rmsnorm-2', 1650, 1520],
    ['moe', 1300, 1240], ['after-loop', 1010, 970], ['attnres', 870, 720], ['final-norm', 650, 590], ['output', 520, 500], ['softcap', 430, 330],
  ];
  rail.forEach(([id, from, to]) => builder.flow(`flow-${id}`, [{ x: cx, y: from }, { x: cx, y: to }]));
  builder.text('repeat-count', 'repeat-marker', { x: 1370, y: 2260 }, '12 ×', { size: 48, weight: 700, fill: spec.theme.accent });
  builder.text('repeat-label', 'repeat-marker', { x: 1370, y: 2310 }, 'per pass', { size: 36, weight: 700 });
  builder.glyph('repeat-brace', 'repeat-marker', { x: 1480, y: 2220 }, 'brace', 150);
}

function ffnInset(builder: TemplateScene, spec: FigureSpec): void {
  builder.text('ffn-title', 'ffn-title', { x: 2750, y: 680 }, text('Feed forward (SwiGLU) module'), { size: 42, weight: 800 });
  builder.box('ffn-inset', 'ffn-inset', { x: 2750, y: 730, width: 850, height: 700 }, {
    fill: builder.solid('#F3F3F3'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 54,
  });
  builder.pill('ffn-linear-top', 'inset-operation', { x: 2820, y: 790, width: 230, height: 80 }, text('Linear layer'), { size: 28 });
  builder.pill('ffn-activation', 'inset-operation', { x: 2820, y: 990, width: 230, height: 80 }, text('Softcapped SiLU'), { size: 28 });
  builder.pill('ffn-linear-bottom', 'inset-operation', { x: 2820, y: 1190, width: 230, height: 80 }, text('Linear layer'), { size: 28 });
  builder.pill('ffn-linear-side', 'inset-operation', { x: 3170, y: 990, width: 230, height: 80 }, text('Linear + softcap'), { size: 28 });
  builder.glyph('ffn-multiply', 'operator', { x: 3150, y: 890 }, 'multiply', 54);
  builder.flow('ffn-up-1', [{ x: 2935, y: 1190 }, { x: 2935, y: 1070 }], { role: 'inset-flow' });
  builder.flow('ffn-up-2', [{ x: 2935, y: 990 }, { x: 2935, y: 870 }], { role: 'inset-flow' });
  builder.flow('ffn-side-a', [{ x: 2935, y: 890 }, { x: 3150, y: 890 }], { role: 'inset-flow', arrow: 'none' });
  builder.flow('ffn-side-b', [{ x: 3170, y: 890 }, { x: 3285, y: 890 }, { x: 3285, y: 990 }], { role: 'inset-flow', arrow: 'none' });
  builder.callout(spec, 'ffn-width', { x: 3030, y: 1470 }, { size: 38, lineGap: 50 });
}

function moeInset(builder: TemplateScene, spec: FigureSpec): void {
  builder.box('moe-inset', 'moe-inset', { x: 2620, y: 1550, width: 1000, height: 1100 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke(spec.theme.accent, 8, 'dotted'),
    radius: 58,
  });
  builder.text('moe-title', 'moe-title', { x: 3230, y: 1680 }, text('MoE layer'), { size: 50, weight: 800, align: 'center' });
  builder.glyph('moe-plus', 'operator', { x: 3070, y: 1760 }, 'plus', 60);
  builder.pill('moe-left', 'moe-expert', { x: 2640, y: 1940, width: 310, height: 80 }, text('Feed forward'), { fill: '#E8E8E8', size: 28 });
  builder.pill('moe-right', 'moe-expert', { x: 3170, y: 1940, width: 310, height: 80 }, text('Feed forward'), { fill: '#E8E8E8', size: 28 });
  builder.glyph('moe-ellipsis', 'ellipsis', { x: 3070, y: 1970 }, 'ellipsis', 60);
  builder.pill('moe-badge-1', 'badge', { x: 2940, y: 1980, width: 65, height: 65 }, text('1'), { fill: '#000000', size: 32 });
  builder.pill('moe-badge-last', 'badge', { x: 3410, y: 1980, width: 85, height: 65 }, text('128'), { fill: spec.theme.accent, size: 32 });
  builder.pill('moe-router', 'router', { x: 2970, y: 2240, width: 200, height: 80 }, text('Router'), { fill: '#E8E8E8', size: 30 });
  builder.flow('moe-router-up', [{ x: 3070, y: 2240 }, { x: 3070, y: 2050 }], { role: 'moe-flow' });
  builder.flow('moe-router-left', [{ x: 2970, y: 2280 }, { x: 2795, y: 2020 }], { role: 'moe-flow' });
  builder.flow('moe-router-right', [{ x: 3170, y: 2280 }, { x: 3325, y: 2020 }], { role: 'moe-flow' });
  builder.flow('moe-left-up', [{ x: 2795, y: 1940 }, { x: 3070, y: 1760 }], { role: 'moe-flow' });
  builder.flow('moe-right-up', [{ x: 3325, y: 1940 }, { x: 3070, y: 1760 }], { role: 'moe-flow' });
  builder.callout(spec, 'moe-note', { x: 2880, y: 2700 }, { size: 34, lineGap: 48 });
}

function sideNotes(builder: TemplateScene, spec: FigureSpec): void {
  builder.text('depth-title', 'depth-title', { x: 760, y: 1120 }, text('Block attention residuals'), { size: 38, weight: 800 });
  builder.box('depth-panel', 'depth-panel', { x: 760, y: 1200, width: 500, height: 300 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke('#000000', 6),
    radius: 40,
  });
  builder.text('depth-sources', 'depth-title', { x: 820, y: 1260 }, text('Depth sources'), { size: 36, weight: 800 });
  builder.pill('depth-token', 'depth-source', { x: 800, y: 1310, width: 390, height: 70 }, text('Token embeddings'), { fill: '#FFF2E4', size: 28 });
  builder.pill('depth-sums', 'depth-source', { x: 800, y: 1400, width: 390, height: 70 }, text('Earlier block sums'), { fill: '#FFF2E4', size: 28 });
  builder.callout(spec, 'context', { x: 870, y: 2400 }, { size: 40, lineGap: 54 });
  builder.callout(spec, 'middle-note', { x: 760, y: 2670 }, { size: 32, lineGap: 44 });
  builder.callout(spec, 'attnres-note', { x: 760, y: 2920 }, { size: 32, lineGap: 44 });
  builder.callout(spec, 'heads', { x: 2480, y: 2700 }, { size: 36, lineGap: 50 });
  builder.callout(spec, 'embedding-width', { x: 2250, y: 3330 }, { size: 40 });
}

export function layoutInklingRecurrentPass(spec: FigureSpec, context: LayoutContext): Scene {
  if (spec.layout.mode !== 'template' || spec.layout.template !== 'layer-schedule') fail('Inkling requires layer-schedule template');
  groupOf(spec, slot(spec, 'model'));
  groupOf(spec, slot(spec, 'block'));
  groupOf(spec, slot(spec, 'ffn'));
  groupOf(spec, slot(spec, 'moe'));
  const gqa = operation(spec, 'gqa');
  operation(spec, 'moe');
  operation(spec, 'ffn');
  const builder = new TemplateScene(spec.theme, context.metrics, { pillRadius: 22, pillSize: 30, calloutLineGap: 52, calloutSourceId: null, calloutSize: 38 });
  builder.text('figure-title', 'title', { x: 1000, y: 100 }, spec.title, { size: 100, weight: 900, fill: spec.theme.accent, family: "'Arial Black', Arial, sans-serif" });
  passStrip(builder, spec);
  mainModel(builder, spec, gqa);
  ffnInset(builder, spec);
  moeInset(builder, spec);
  sideNotes(builder, spec);
  builder.callout(spec, 'vocabulary', { x: 2150, y: 330 }, { size: 36 });
  builder.flow('recurrent-feedback', [{ x: 2100, y: 950 }, { x: 2380, y: 950 }, { x: 2380, y: 2130 }, { x: 2300, y: 2130 }], { role: 'feedback-loop', stroke: spec.theme.accent, width: 12 });
  builder.text('feedback-label', 'feedback-label', { x: 2200, y: 1020 }, text('Same 12 layers, 3 passes'), { size: 34, weight: 800, fill: spec.theme.accent });
  builder.text('feedback-label-2', 'feedback-label', { x: 2200, y: 1065 }, text('Gated message on passes 2–3'), { size: 28, weight: 700, fill: spec.theme.accent });
  builder.flow('ffn-zoom', [{ x: 2050, y: 1210 }, { x: 2750, y: 900 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  builder.flow('moe-zoom', [{ x: 2050, y: 1210 }, { x: 2620, y: 1750 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  return builder.scene(spec);
}
