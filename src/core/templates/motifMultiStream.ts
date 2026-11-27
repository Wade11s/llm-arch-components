import { TemplateScene, templateText as text, createTemplateApi } from './templateScene';
import type { FigureSpec, Id, LayoutContext, NodeSpec, Scene } from '../types';

type OperationNode = Extract<NodeSpec, { kind: 'operation' | 'composite' }>;

const { fail, slot, groupOf, operation } = createTemplateApi('Motif', 'multi-stream-residual');

function mhcMixer(builder: TemplateScene, id: Id, y: number): void {
  builder.pill(id, 'mhc-mixer', { x: 980, y, width: 320, height: 70 }, { spans: [{ text: 'mHC mixer', color: 'accent' }] }, { size: 28 });
  [0, 1, 2, 3].forEach((index) => {
    builder.flow(`${id}-stub-${index}`, [{ x: 1300, y: y + 18 + index * 12 }, { x: 1380 + index * 20, y: y + 18 + index * 12 }], { role: 'mhc-terminal', arrow: 'none' });
  });
}

function backbone(builder: TemplateScene, spec: FigureSpec, attention: OperationNode): void {
  const cx = 1140;
  const block = spec.groups.find((group) => group.kind === 'repeat-block');
  builder.group('model', 'model-container', { x: 570, y: 360, width: 1100, height: 2050 }, [], {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 6),
    sourceId: 'model',
  });
  builder.box('repeat-block', 'repeat-block', { x: 750, y: 700, width: 780, height: 1500 }, {
    fill: builder.solid(block?.style?.fill?.kind === 'solid' ? block.style.fill.color : spec.theme.accent),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 64,
    sourceId: block?.id,
  });
  [1380, 1400, 1420, 1440].forEach((x, index) => {
    builder.flow(`residual-stream-${index + 1}`, [{ x, y: 840 }, { x, y: 2050 }], { role: 'residual-stream', arrow: 'none', width: 4 });
  });
  builder.flow('residual-attention', [{ x: cx, y: 1920 }, { x: 1380, y: 1920 }, { x: 1380, y: 1450 }, { x: 1170, y: 1450 }], { role: 'residual-path', junction: 'plus' });
  builder.flow('residual-moe', [{ x: cx, y: 1450 }, { x: 1380, y: 1450 }, { x: 1380, y: 820 }, { x: 1170, y: 820 }], { role: 'residual-path', junction: 'plus' });
  const rail: Array<[string, number, number]> = [
    ['input', 2640, 2540], ['embedding', 2430, 2260], ['pre-attention', 2100, 2070], ['attention', 1700, 1620],
    ['post-attention', 1370, 1330], ['moe', 1040, 1070], ['block-output', 900, 650], ['final-norm', 570, 520], ['output', 450, 280],
  ];
  rail.forEach(([id, from, to]) => builder.flow(`flow-${id}`, [{ x: cx, y: from }, { x: cx, y: to }]));
  builder.pill('output-layer', 'output-layer', { x: 950, y: 450, width: 380, height: 80 }, text('Linear output layer'), { size: 30 });
  builder.pill('final-rmsnorm', 'norm', { x: 960, y: 580, width: 360, height: 80 }, text('Final RMSNorm'), { size: 30 });
  mhcMixer(builder, 'mhc-top', 800);
  builder.pill('moe', 'moe-block', { x: 960, y: 990, width: 360, height: 80 }, text('MoE'), { fill: spec.theme.surface, size: 30 });
  mhcMixer(builder, 'mhc-middle', 1160);
  builder.pill('rmsnorm-2', 'norm', { x: 960, y: 1300, width: 360, height: 80 }, text('RMSNorm 2'), { size: 30 });
  mhcMixer(builder, 'mhc-lower', 1550);
  builder.box('attention-box', 'attention-block', { x: 880, y: 1700, width: 520, height: 220 }, {
    fill: builder.solid('#5E5E5E'),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 28,
    sourceId: attention.id,
  });
  const spans = attention.label?.spans ?? [{ text: 'Grouped Differential Latent Attention' }, { text: '(GDLA); 39 sliding-window + 14 full-attention layers' }];
  builder.text('attention-line-1', 'attention-label', { x: cx, y: 1770 }, { spans: spans.slice(0, 1) }, { size: 28, fill: '#FFFFFF', align: 'center', sourceId: attention.id });
  builder.text('attention-line-2', 'attention-label', { x: cx, y: 1820 }, { spans: spans.slice(1) }, { size: 28, fill: '#FFFFFF', align: 'center', sourceId: attention.id });
  mhcMixer(builder, 'mhc-input', 2000);
  builder.pill('rmsnorm-1', 'norm', { x: 960, y: 2130, width: 360, height: 80 }, text('RMSNorm 1'), { size: 30 });
  builder.pill('partial-rope', 'side-pill', { x: 510, y: 1760, width: 320, height: 80 }, text('Partial RoPE'), { size: 30 });
  builder.flow('rope-flow', [{ x: 830, y: 1800 }, { x: 880, y: 1800 }]);
  builder.pill('embedding-layer', 'embedding', { x: 870, y: 2350, width: 540, height: 80 }, text('Token embedding layer'), { size: 30 });
  builder.pill('tokenized-text', 'input', { x: 960, y: 2520, width: 360, height: 80 }, text('Tokenized text'), { size: 30 });
  builder.text('sample-input', 'input-label', { x: cx, y: 2650 }, text('Sample input text'), { size: 44, align: 'center' });
  builder.text('repeat-count', 'repeat-marker', { x: 610, y: 2290 }, '53', { size: 50, weight: 700, fill: spec.theme.accent });
  builder.text('repeat-x', 'repeat-marker', { x: 680, y: 2290 }, '×', { size: 50, weight: 700, fill: spec.theme.accent });
  builder.glyph('repeat-brace', 'repeat-marker', { x: 760, y: 2250 }, 'brace', 150);
}

function ffnInset(builder: TemplateScene): void {
  builder.text('ffn-title', 'ffn-title', { x: 2000, y: 320 }, text('Feed forward (PolyNorm) module'), { size: 42, weight: 800 });
  builder.box('ffn-inset', 'ffn-inset', { x: 2000, y: 370, width: 800, height: 620 }, {
    fill: builder.solid('#F3F3F3'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 54,
  });
  builder.pill('ffn-linear-top', 'inset-operation', { x: 2050, y: 430, width: 230, height: 80 }, text('Linear layer'), { size: 28 });
  builder.pill('ffn-activation', 'inset-operation', { x: 2050, y: 630, width: 260, height: 80 }, text('Grouped PolyNorm'), { size: 28 });
  builder.pill('ffn-linear-bottom', 'inset-operation', { x: 2050, y: 830, width: 230, height: 80 }, text('Linear layer'), { size: 28 });
  builder.pill('ffn-linear-side', 'inset-operation', { x: 2470, y: 630, width: 230, height: 80 }, text('Linear layer'), { size: 28 });
  builder.glyph('ffn-multiply', 'operator', { x: 2440, y: 530 }, 'multiply', 54);
  builder.flow('ffn-up-1', [{ x: 2165, y: 830 }, { x: 2165, y: 710 }], { role: 'inset-flow' });
  builder.flow('ffn-up-2', [{ x: 2165, y: 630 }, { x: 2165, y: 510 }], { role: 'inset-flow' });
  builder.flow('ffn-side-a', [{ x: 2165, y: 530 }, { x: 2440, y: 530 }], { role: 'inset-flow', arrow: 'none' });
  builder.flow('ffn-side-b', [{ x: 2470, y: 530 }, { x: 2585, y: 530 }, { x: 2585, y: 630 }], { role: 'inset-flow', arrow: 'none' });
}

function moeInset(builder: TemplateScene, spec: FigureSpec): void {
  builder.box('moe-inset', 'moe-inset', { x: 1840, y: 1250, width: 1000, height: 900 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 58,
  });
  builder.text('moe-title', 'moe-title', { x: 2450, y: 1370 }, text('MoE layer'), { size: 50, weight: 800, align: 'center' });
  builder.glyph('moe-plus', 'operator', { x: 2320, y: 1450 }, 'plus', 60);
  builder.pill('moe-left', 'moe-expert', { x: 1880, y: 1630, width: 310, height: 80 }, text('Feed forward'), { fill: '#E8E8E8', size: 28 });
  builder.pill('moe-right', 'moe-expert', { x: 2440, y: 1630, width: 310, height: 80 }, text('Feed forward'), { fill: '#E8E8E8', size: 28 });
  builder.glyph('moe-ellipsis', 'ellipsis', { x: 2320, y: 1660 }, 'ellipsis', 60);
  builder.pill('moe-badge-1', 'badge', { x: 2170, y: 1670, width: 65, height: 65 }, text('1'), { fill: '#000000', size: 32 });
  builder.pill('moe-badge-last', 'badge', { x: 2640, y: 1670, width: 85, height: 65 }, text('384'), { fill: spec.theme.accent, size: 32 });
  builder.pill('moe-router', 'router', { x: 2220, y: 1950, width: 200, height: 80 }, text('Router'), { fill: '#E8E8E8', size: 30 });
  builder.flow('moe-router-up', [{ x: 2320, y: 1950 }, { x: 2320, y: 1740 }], { role: 'moe-flow' });
  builder.flow('moe-router-left', [{ x: 2220, y: 1990 }, { x: 2035, y: 1710 }], { role: 'moe-flow' });
  builder.flow('moe-router-right', [{ x: 2420, y: 1990 }, { x: 2595, y: 1710 }], { role: 'moe-flow' });
  builder.flow('moe-left-up', [{ x: 2035, y: 1630 }, { x: 2320, y: 1450 }], { role: 'moe-flow' });
  builder.flow('moe-right-up', [{ x: 2595, y: 1630 }, { x: 2320, y: 1450 }], { role: 'moe-flow' });
  builder.callout(spec, 'resource', { x: 2860, y: 1330 }, { size: 34, lineGap: 50 });
}

function mhcDetail(builder: TemplateScene): void {
  builder.box('mhc-detail', 'mhc-detail', { x: 1840, y: 2300, width: 1800, height: 700 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 58,
  });
  builder.text('mhc-detail-title', 'mhc-detail-title', { x: 1960, y: 2410 }, { spans: [{ text: 'mHC (manifold-constrained hyper-connections)', color: 'accent' }] }, { size: 38, weight: 800 });
  builder.box('mhc-read', 'mhc-read', { x: 2020, y: 2500, width: 260, height: 180 }, { fill: builder.solid('#FFFFFF'), stroke: builder.stroke('#000000', 5), radius: 24 });
  builder.text('mhc-read-label-1', 'mhc-read-label', { x: 2150, y: 2570 }, { spans: [{ text: 'mHC mixer', color: 'accent' }] }, { size: 28, align: 'center' });
  builder.text('mhc-read-label-2', 'mhc-read-label', { x: 2150, y: 2615 }, text('(constrained mixing)'), { size: 24, align: 'center' });
  builder.box('mhc-sublayer', 'mhc-sublayer', { x: 2390, y: 2500, width: 300, height: 180 }, { fill: builder.solid('#E8E8E8'), stroke: builder.stroke('#000000', 5), radius: 24 });
  builder.text('mhc-sublayer-label-1', 'mhc-sublayer-label', { x: 2540, y: 2570 }, text('Sublayer'), { size: 28, align: 'center' });
  builder.text('mhc-sublayer-label-2', 'mhc-sublayer-label', { x: 2540, y: 2615 }, text('(attention or MoE)'), { size: 24, align: 'center' });
  builder.box('mhc-write', 'mhc-write', { x: 2840, y: 2500, width: 260, height: 180 }, { fill: builder.solid('#FFFFFF'), stroke: builder.stroke('#000000', 5), radius: 24 });
  builder.text('mhc-write-label-1', 'mhc-write-label', { x: 2970, y: 2570 }, { spans: [{ text: 'mHC mixer', color: 'accent' }] }, { size: 28, align: 'center' });
  builder.text('mhc-write-label-2', 'mhc-write-label', { x: 2970, y: 2615 }, text('(constrained mixing)'), { size: 24, align: 'center' });
  [0, 1, 2, 3].forEach((index) => {
    const y = 2530 + index * 40;
    builder.flow(`mhc-read-terminal-${index}`, [{ x: 1900, y }, { x: 2020, y }], { role: 'mhc-terminal', arrow: 'none' });
    builder.flow(`mhc-write-terminal-${index}`, [{ x: 3100, y }, { x: 3220, y }], { role: 'mhc-terminal', arrow: 'none' });
  });
  builder.flow('mhc-flow-1', [{ x: 2280, y: 2590 }, { x: 2390, y: 2590 }], { role: 'mhc-flow' });
  builder.flow('mhc-flow-2', [{ x: 2690, y: 2590 }, { x: 2840, y: 2590 }], { role: 'mhc-flow' });
  builder.text('mhc-note', 'mhc-note', { x: 1900, y: 2780 }, { spans: [{ text: 'with ' }, { text: '4', color: 'accent' }, { text: ' parallel residual streams' }] }, { size: 38, weight: 800 });
  builder.text('mhc-note-2', 'mhc-note', { x: 1900, y: 2840 }, text('(replaces plain residual x + F(x) with constrained multi-stream mixing)'), { size: 30, weight: 500 });
}

export function layoutMotifMultiStream(spec: FigureSpec, context: LayoutContext): Scene {
  if (spec.layout.mode !== 'template' || spec.layout.template !== 'moe') fail('Motif requires moe template');
  groupOf(spec, slot(spec, 'block'));
  groupOf(spec, slot(spec, 'ffn'));
  groupOf(spec, slot(spec, 'moe'));
  groupOf(spec, slot(spec, 'mhc'));
  const attention = operation(spec, 'gqa');
  operation(spec, 'moe');
  operation(spec, 'ffn');
  operation(spec, 'gated-residual');
  const builder = new TemplateScene(spec.theme, context.metrics, { pillRadius: 24, pillSize: 30, calloutLineGap: 52, calloutSourceId: null, calloutSize: 38 });
  builder.text('figure-title', 'title', { x: 200, y: 100 }, spec.title, { size: 96, weight: 900, fill: spec.theme.accent, family: "'Arial Black', Arial, sans-serif" });
  backbone(builder, spec, attention);
  ffnInset(builder);
  moeInset(builder, spec);
  mhcDetail(builder);
  builder.callout(spec, 'vocabulary', { x: 20, y: 550 }, { size: 38 });
  builder.callout(spec, 'heads', { x: 20, y: 1300 }, { size: 38 });
  builder.callout(spec, 'context', { x: 20, y: 1870 }, { size: 38 });
  builder.callout(spec, 'dense-first', { x: 130, y: 2470 }, { size: 38 });
  builder.callout(spec, 'embedding-dimension', { x: 370, y: 2780 }, { size: 38 });
  builder.callout(spec, 'ffn-dimension', { x: 2250, y: 1050 }, { size: 38 });
  builder.flow('ffn-zoom', [{ x: 1300, y: 1030 }, { x: 2000, y: 700 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  builder.flow('moe-zoom', [{ x: 1300, y: 1030 }, { x: 1840, y: 1450 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  builder.flow('mhc-zoom', [{ x: 1380, y: 2020 }, { x: 1840, y: 2500 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  return builder.scene(spec);
}
