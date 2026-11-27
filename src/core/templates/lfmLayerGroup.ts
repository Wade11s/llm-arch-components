import { TemplateScene, templateText as text, createTemplateApi } from './templateScene';
import type { Box, FigureSpec, Id, LayoutContext, Scene } from '../types';

const { fail, slot, groupOf, operation } = createTemplateApi('LFM layer-group', 'layer-group');

function layerGroup(builder: TemplateScene, id: Id, box: Box, label: string, cards: Array<{ label: string; fill: string }>): void {
  builder.box(`${id}-box`, 'layer-group-box', box, {
    fill: builder.solid('#9A9A9A'),
    stroke: builder.stroke('#000000', 6),
    radius: 46,
    sourceId: id,
    label,
  });
  builder.text(`${id}-gutter`, 'repeat-gutter', { x: box.x - 110, y: box.y + box.height / 2 }, text(label), { size: 40, weight: 700 });
  const gap = 24;
  const cardHeight = Math.min(64, (box.height - 70 - gap * (cards.length - 1)) / cards.length);
  const total = cards.length * cardHeight + (cards.length - 1) * gap;
  const startY = box.y + (box.height - total) / 2;
  cards.forEach((card, index) => {
    builder.pill(`${id}-card-${index}`, 'layer-card', {
      x: box.x + 70,
      y: startY + index * (cardHeight + gap),
      width: box.width - 140,
      height: cardHeight,
    }, text(card.label), { fill: card.fill, size: 25 });
    if (index > 0) {
      const previousY = startY + (index - 1) * (cardHeight + gap) + cardHeight;
      builder.flow(`${id}-flow-${index}`, [{ x: box.x + box.width / 2, y: previousY }, { x: box.x + box.width / 2, y: startY + index * (cardHeight + gap) }], { role: 'layer-flow' });
    }
  });
}

function moeInset(builder: TemplateScene, spec: FigureSpec): void {
  builder.box('moe-inset', 'moe-inset', { x: 1460, y: 560, width: 940, height: 960 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 58,
  });
  builder.text('moe-title', 'moe-title', { x: 2080, y: 700 }, text('MoE layer'), { size: 50, weight: 800, align: 'center' });
  builder.glyph('moe-plus', 'operator', { x: 1930, y: 770 }, 'plus', 60);
  builder.pill('moe-left', 'moe-expert', { x: 1510, y: 970, width: 310, height: 80 }, text('Feed forward'), { fill: '#E8E8E8', size: 28 });
  builder.pill('moe-right', 'moe-expert', { x: 2180, y: 970, width: 310, height: 80 }, text('Feed forward'), { fill: '#E8E8E8', size: 28 });
  builder.glyph('moe-ellipsis', 'ellipsis', { x: 1930, y: 1000 }, 'ellipsis', 60);
  builder.pill('moe-badge-1', 'badge', { x: 1830, y: 1010, width: 65, height: 65 }, text('1'), { fill: '#000000', size: 32 });
  builder.pill('moe-badge-last', 'badge', { x: 2500, y: 1010, width: 85, height: 65 }, text('32'), { fill: spec.theme.muted, size: 32 });
  builder.pill('moe-router', 'router', { x: 1830, y: 1270, width: 200, height: 80 }, text('Router'), { fill: '#E8E8E8', size: 30 });
  builder.flow('moe-router-up', [{ x: 1930, y: 1270 }, { x: 1930, y: 1080 }], { role: 'moe-flow' });
  builder.flow('moe-router-left', [{ x: 1830, y: 1310 }, { x: 1665, y: 1050 }], { role: 'moe-flow' });
  builder.flow('moe-router-right', [{ x: 2030, y: 1310 }, { x: 2335, y: 1050 }], { role: 'moe-flow' });
  builder.flow('moe-left-up', [{ x: 1665, y: 970 }, { x: 1930, y: 770 }], { role: 'moe-flow' });
  builder.flow('moe-right-up', [{ x: 2335, y: 970 }, { x: 1930, y: 770 }], { role: 'moe-flow' });
  builder.callout(spec, 'moe-note', { x: 2080, y: 1190 }, { size: 40, lineGap: 52 });
}

function gqaInset(builder: TemplateScene, spec: FigureSpec): void {
  builder.box('gqa-inset', 'gqa-inset', { x: 1530, y: 1670, width: 780, height: 990 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 58,
  });
  builder.callout(spec, 'gqa-note', { x: 1580, y: 1730 }, { size: 34, lineGap: 50 });
  const q = [1610, 1720, 1870, 1980];
  const k = [1660, 1900];
  const v = [1660, 1900];
  q.forEach((x, index) => builder.pill(`gqa-q-${index}`, 'gqa-head-grid', { x, y: 2260, width: 90, height: 120 }, text('q'), { fill: '#D7EEF7', size: 36 }));
  k.forEach((x, index) => builder.pill(`gqa-k-${index}`, 'gqa-head-grid', { x, y: 2100, width: 90, height: 120 }, text('k'), { fill: '#F6D7D7', size: 36 }));
  v.forEach((x, index) => builder.pill(`gqa-v-${index}`, 'gqa-head-grid', { x, y: 1940, width: 90, height: 120 }, text('v'), { fill: '#FFF5DC', size: 36 }));
  q.forEach((x, index) => builder.text(`gqa-head-${index}`, 'head-label', { x: x + 45, y: 2420 }, text(`Head ${index + 1}`), { size: 24, align: 'center' }));
  builder.flow('gqa-k-left-flow', [{ x: 1705, y: 2220 }, { x: 1655, y: 2260 }], { role: 'head-flow', arrow: 'none' });
  builder.flow('gqa-k-left-flow-2', [{ x: 1705, y: 2220 }, { x: 1765, y: 2260 }], { role: 'head-flow', arrow: 'none' });
  builder.flow('gqa-k-right-flow', [{ x: 1945, y: 2220 }, { x: 1915, y: 2260 }], { role: 'head-flow', arrow: 'none' });
  builder.flow('gqa-k-right-flow-2', [{ x: 1945, y: 2220 }, { x: 2025, y: 2260 }], { role: 'head-flow', arrow: 'none' });
  builder.flow('gqa-v-left-flow', [{ x: 1705, y: 2060 }, { x: 1705, y: 2100 }], { role: 'head-flow' });
  builder.flow('gqa-v-right-flow', [{ x: 1945, y: 2060 }, { x: 1945, y: 2100 }], { role: 'head-flow' });
}

export function layoutLfmLayerGroup(spec: FigureSpec, context: LayoutContext): Scene {
  if (spec.layout.mode !== 'template' || spec.layout.template !== 'layer-schedule') fail('LFM requires layer-schedule template');
  groupOf(spec, slot(spec, 'block'));
  groupOf(spec, slot(spec, 'moe'));
  groupOf(spec, slot(spec, 'gqa'));
  operation(spec, 'gqa');
  operation(spec, 'moe');
  operation(spec, 'ffn');

  const builder = new TemplateScene(spec.theme, context.metrics, { pillRadius: 22, pillSize: 30, calloutLineGap: 55, calloutSourceId: null, calloutSize: 40 });
  const block = spec.groups.find((group) => group.kind === 'repeat-block');
  builder.text('figure-title', 'title', { x: 260, y: 90 }, spec.title, { size: 92, weight: 800, fill: '#5E5E5E', family: "'Arial Black', Arial, sans-serif" });
  builder.group('model', 'model-container', { x: 140, y: 380, width: 1100, height: 2070 }, [], {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 6),
    sourceId: 'model',
  });
  builder.box('repeat-block', 'repeat-block', { x: 300, y: 750, width: 780, height: 1470 }, {
    fill: builder.solid('#8C8C8C'),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 64,
    sourceId: block?.id,
  });
  const green = '#9ACD32';
  const red = '#FF7F7F';
  layerGroup(builder, 'group-2x', { x: 460, y: 840, width: 520, height: 380 }, '2×', [
    { label: 'LIV Convolution + MoE', fill: green },
    { label: 'LIV Convolution + MoE', fill: green },
    { label: 'Attention (GQA) + MoE', fill: red },
  ]);
  layerGroup(builder, 'group-4x', { x: 460, y: 1310, width: 520, height: 500 }, '4×', [
    { label: 'LIV Convolution + MoE', fill: green },
    { label: 'LIV Convolution + MoE', fill: green },
    { label: 'LIV Convolution + MoE', fill: green },
    { label: 'Attention (GQA) + MoE', fill: red },
  ]);
  layerGroup(builder, 'group-1x', { x: 460, y: 1940, width: 520, height: 270 }, '1×', [
    { label: 'LIV Convolution + FFN', fill: green },
    { label: 'LIV Convolution + FFN', fill: green },
  ]);
  builder.pill('output-layer', 'output-layer', { x: 510, y: 460, width: 360, height: 80 }, text('Linear output layer'), { size: 30 });
  builder.pill('final-rmsnorm', 'norm', { x: 520, y: 590, width: 340, height: 80 }, text('Final RMSNorm'), { size: 30 });
  builder.pill('embedding-layer', 'embedding', { x: 420, y: 2300, width: 520, height: 90 }, text('Token embedding layer'), { size: 30 });
  builder.pill('tokenized-text', 'input', { x: 530, y: 2500, width: 340, height: 80 }, text('Tokenized text'), { size: 30 });
  builder.text('sample-input', 'input-label', { x: 700, y: 2680 }, text('Sample input text'), { size: 42, align: 'center' });
  builder.flow('flow-input', [{ x: 700, y: 2650 }, { x: 700, y: 2580 }]);
  builder.flow('flow-embedding', [{ x: 700, y: 2500 }, { x: 700, y: 2390 }]);
  builder.flow('flow-groups', [{ x: 700, y: 2300 }, { x: 700, y: 2210 }]);
  builder.flow('flow-group-up-1', [{ x: 700, y: 1940 }, { x: 700, y: 1810 }]);
  builder.flow('flow-group-up-2', [{ x: 700, y: 1310 }, { x: 700, y: 1220 }]);
  builder.flow('flow-output', [{ x: 700, y: 750 }, { x: 700, y: 670 }]);
  builder.flow('flow-final', [{ x: 700, y: 590 }, { x: 700, y: 540 }]);
  builder.flow('flow-end', [{ x: 700, y: 460 }, { x: 700, y: 290 }]);
  builder.text('repeat-count', 'repeat-marker', { x: 170, y: 2200 }, '24 ×', { size: 40, weight: 700 });
  builder.text('repeat-label', 'repeat-marker', { x: 170, y: 2250 }, 'Layers', { size: 40, weight: 700 });
  builder.glyph('repeat-brace', 'repeat-marker', { x: 300, y: 2180 }, 'brace', 150);
  builder.callout(spec, 'vocabulary', { x: 730, y: 340 }, { size: 40 });
  builder.callout(spec, 'context', { x: 20, y: 2600 }, { size: 40 });
  builder.callout(spec, 'embedding-dimension', { x: 1060, y: 2600 }, { size: 40 });
  moeInset(builder, spec);
  gqaInset(builder, spec);
  builder.flow('moe-zoom', [{ x: 980, y: 1130 }, { x: 1460, y: 650 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  builder.flow('gqa-zoom', [{ x: 980, y: 1680 }, { x: 1530, y: 1850 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  return builder.scene(spec);
}
