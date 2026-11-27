import { FigureLayoutError } from '../errors';
import { SceneBuilder } from '../sceneBuilder';
import type { Box, FigureSpec, GroupSpec, Id, LayoutContext, NodeSpec, Point, Scene, TextSpec } from '../types';

type OperationNode = Extract<NodeSpec, { kind: 'operation' | 'composite' }>;

function text(value: string): TextSpec {
  return { spans: [{ text: value }] };
}

function fail(message: string): never {
  throw new FigureLayoutError([{ severity: 'error', code: 'multi-tower', message }]);
}

function slot(spec: FigureSpec, name: string): Id {
  if (spec.layout.mode !== 'template') fail('DeepSeek multi-tower requires template layout');
  const value = spec.layout.slots[name];
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) fail(`DeepSeek multi-tower requires a "${name}" slot`);
  return id;
}

function groupOf(spec: FigureSpec, id: Id): GroupSpec {
  const group = spec.groups.find((candidate) => candidate.id === id);
  if (!group) fail(`Group "${id}" does not exist`);
  return group;
}

function operation(spec: FigureSpec, family: 'gqa' | 'moe' | 'ffn' | 'gated-residual'): OperationNode {
  const node = spec.nodes.find((candidate): candidate is OperationNode =>
    (candidate.kind === 'operation' || candidate.kind === 'composite') && candidate.data.family === family);
  if (!node) fail(`DeepSeek multi-tower requires a ${family} operation`);
  return node;
}

function annotationLines(spec: FigureSpec, id: Id): TextSpec[] {
  const annotation = (spec.annotations ?? []).find((candidate) => candidate.id === id);
  if (!annotation) return [];
  return 'bullets' in annotation.content ? annotation.content.bullets : [annotation.content];
}

function callout(builder: SceneBuilder, spec: FigureSpec, id: Id, at: Point, options: { size?: number; lineGap?: number; role?: string } = {}): void {
  annotationLines(spec, id).forEach((line, index) => {
    builder.text(`${id}-${index}`, options.role ?? `annotation-${id}`, { x: at.x, y: at.y + index * (options.lineGap ?? 52) }, line, {
      size: options.size ?? 38,
      weight: 700,
    });
  });
}

function flow(builder: SceneBuilder, id: Id, points: Point[], options: { role?: string; stroke?: string; width?: number; dash?: 'solid' | 'dashed' | 'dotted'; arrow?: 'none' | 'end' | 'both'; junction?: 'plus' } = {}): void {
  builder.path(id, options.role ?? 'flow-path', points, {
    stroke: builder.stroke(options.stroke ?? '#000000', options.width ?? 6, options.dash),
    arrow: options.arrow ?? 'end',
    junction: options.junction,
  });
}

function pill(builder: SceneBuilder, id: Id, role: string, box: Box, content: TextSpec, options: { fill?: string; stroke?: string; size?: number } = {}): void {
  builder.box(`${id}-box`, role, box, {
    fill: builder.solid(options.fill ?? '#FFFFFF'),
    stroke: builder.stroke(options.stroke ?? '#000000', 5),
    radius: 22,
  });
  builder.text(`${id}-label`, `${role}-label`, { x: box.x + box.width / 2, y: box.y + box.height / 2 + (options.size ?? 30) * 0.36 }, content, {
    size: options.size ?? 30,
    weight: 500,
    align: 'center',
  });
}

function multilinePill(builder: SceneBuilder, id: Id, role: string, box: Box, lines: TextSpec[], options: { fill?: string; size?: number } = {}): void {
  builder.box(`${id}-box`, role, box, {
    fill: builder.solid(options.fill ?? '#FFFFFF'),
    stroke: builder.stroke('#000000', 5),
    radius: 22,
  });
  const size = options.size ?? 28;
  const startY = box.y + box.height / 2 - ((lines.length - 1) * size * 1.35) / 2 + size * 0.36;
  lines.forEach((line, index) => {
    builder.text(`${id}-label-${index}`, `${role}-label`, { x: box.x + box.width / 2, y: startY + index * size * 1.35 }, line, { size, weight: 500, align: 'center' });
  });
}

function repeatFrame(builder: SceneBuilder, id: Id, box: Box, count: string): void {
  builder.box(`${id}-frame`, 'nested-repeat-frame', box, {
    fill: builder.solid('#FFFFFF00'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 34,
  });
  builder.text(`${id}-count`, 'nested-repeat-count', { x: box.x + box.width + 35, y: box.y + box.height / 2 }, text(count), { size: 32, weight: 700 });
}

function towers(builder: SceneBuilder, spec: FigureSpec): void {
  builder.group('model', 'model-container', { x: 780, y: 400, width: 1600, height: 2900 }, [], {
    fill: builder.solid(spec.theme.surface),
    stroke: builder.stroke(spec.theme.ink, 6),
    sourceId: 'model',
  });
  builder.box('encoder-tower', 'encoder-tower', { x: 830, y: 900, width: 650, height: 1900 }, {
    fill: builder.solid('#75A9D8'),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 28,
    sourceId: 'encoder',
  });
  builder.box('decoder-tower', 'decoder-tower', { x: 2100, y: 900, width: 650, height: 1900 }, {
    fill: builder.solid('#75A9D8'),
    stroke: builder.stroke(spec.theme.ink, 6),
    radius: 28,
    sourceId: 'decoder',
  });
  builder.text('encoder-title', 'tower-title', { x: 1370, y: 960 }, text('Causal encoder'), { size: 38, weight: 800 });
  builder.text('encoder-layers', 'tower-title', { x: 1370, y: 1030 }, text('20 layers'), { size: 32, weight: 700 });
  builder.text('decoder-title', 'tower-title', { x: 2170, y: 960 }, text('Decoder'), { size: 38, weight: 800 });
  builder.text('decoder-layers', 'tower-title', { x: 2170, y: 1030 }, text('20 layers'), { size: 32, weight: 700 });

  pill(builder, 'encoder-final', 'tower-output', { x: 900, y: 780, width: 430, height: 80 }, text('Final encoder hidden states'), { size: 28 });
  pill(builder, 'decoder-premix', 'tower-output', { x: 2210, y: 740, width: 430, height: 80 }, text('Final pre-mix (4 to 1)'), { size: 28 });
  pill(builder, 'decoder-final-norm', 'norm', { x: 2220, y: 620, width: 410, height: 80 }, text('Final RMSNorm'), { size: 28 });
  pill(builder, 'decoder-output', 'output-layer', { x: 2300, y: 500, width: 380, height: 80 }, text('Linear output layer'), { size: 28 });

  repeatFrame(builder, 'encoder-reuse', { x: 880, y: 1100, width: 550, height: 300 }, '×5');
  pill(builder, 'encoder-reuse-moe', 'moe-block', { x: 940, y: 1050, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  pill(builder, 'encoder-reuse-attention', 'attention-node', { x: 940, y: 1200, width: 430, height: 80 }, text('CSA2(2, Reuse)'), { fill: '#E8E8E8', size: 28 });
  repeatFrame(builder, 'encoder-full', { x: 880, y: 1450, width: 550, height: 700 }, '×3');
  pill(builder, 'encoder-full-moe-1', 'moe-block', { x: 940, y: 1700, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  pill(builder, 'encoder-full-moe-2', 'moe-block', { x: 940, y: 1800, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  multilinePill(builder, 'encoder-full-attention', 'attention-node', { x: 940, y: 1900, width: 430, height: 100 }, [text('Compressed Sparse Attention 2'), text('CSA2(2, Full)')], { fill: '#E8E8E8', size: 28 });
  repeatFrame(builder, 'encoder-swa', { x: 880, y: 2150, width: 550, height: 350 }, '×2');
  pill(builder, 'encoder-swa-moe', 'moe-block', { x: 940, y: 2250, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  multilinePill(builder, 'encoder-swa-attention', 'attention-node', { x: 940, y: 2400, width: 430, height: 90 }, [text('Sliding window attention'), text('(SWA)')], { fill: '#E8E8E8', size: 28 });

  repeatFrame(builder, 'decoder-reuse-top', { x: 2160, y: 1100, width: 550, height: 300 }, '×3');
  pill(builder, 'decoder-reuse-top-moe', 'moe-block', { x: 2220, y: 1050, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  pill(builder, 'decoder-reuse-top-attention', 'attention-node', { x: 2220, y: 1200, width: 430, height: 80 }, text('CSA2(1, Reuse)'), { fill: '#E8E8E8', size: 28 });
  repeatFrame(builder, 'decoder-reindex', { x: 2160, y: 1500, width: 550, height: 400 }, '×4');
  pill(builder, 'decoder-reindex-moe', 'moe-block', { x: 2220, y: 1600, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  pill(builder, 'decoder-reindex-attention', 'attention-node', { x: 2220, y: 1750, width: 430, height: 80 }, text('CSA2(1, Reindex)'), { fill: '#E8E8E8', size: 28 });
  repeatFrame(builder, 'decoder-reuse-bottom', { x: 2160, y: 2000, width: 550, height: 450 }, '×3');
  pill(builder, 'decoder-reuse-bottom-moe', 'moe-block', { x: 2220, y: 2100, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  pill(builder, 'decoder-reuse-bottom-attention', 'attention-node', { x: 2220, y: 2250, width: 430, height: 80 }, text('CSA2(1, Reuse)'), { fill: '#E8E8E8', size: 28 });
  pill(builder, 'decoder-full-attention', 'attention-node', { x: 2220, y: 2600, width: 430, height: 80 }, text('CSA2(1, Full)'), { fill: '#E8E8E8', size: 28 });

  const encoderRail = 1155;
  const decoderRail = 2435;
  [
    ['encoder-flow-1', encoderRail, 2500, 2330], ['encoder-flow-2', encoderRail, 2250, 2080], ['encoder-flow-3', encoderRail, 1900, 1780], ['encoder-flow-4', encoderRail, 1700, 1280], ['encoder-flow-5', encoderRail, 1200, 860],
  ].forEach(([id, x, from, to]) => flow(builder, id as string, [{ x: x as number, y: from as number }, { x: x as number, y: to as number }]));
  [
    ['decoder-flow-1', decoderRail, 2680, 2530], ['decoder-flow-2', decoderRail, 2600, 2330], ['decoder-flow-3', decoderRail, 2250, 1830], ['decoder-flow-4', decoderRail, 1750, 1280], ['decoder-flow-5', decoderRail, 1200, 820],
  ].forEach(([id, x, from, to]) => flow(builder, id as string, [{ x: x as number, y: from as number }, { x: x as number, y: to as number }]));

  multilinePill(builder, 'ced-global-kv', 'cross-tower-link', { x: 1650, y: 1750, width: 220, height: 120 }, [text('CED'), text('Global KV')], { fill: '#FFFFFF', size: 28 });
  flow(builder, 'ced-left', [{ x: 1480, y: 1810 }, { x: 1650, y: 1810 }], { role: 'cross-tower-link' });
  flow(builder, 'ced-right', [{ x: 1870, y: 1810 }, { x: 2100, y: 1810 }], { role: 'cross-tower-link' });
  builder.text('indexer-label', 'hierarchical-indexer', { x: 2200, y: 2890 }, text('Hierarchical sparse indexer'), { size: 30, weight: 700 });
  pill(builder, 'candidate-pool', 'candidate-pool', { x: 2200, y: 2950, width: 450, height: 80 }, text('Candidate pool'), { fill: '#E8E8E8', size: 28 });
  flow(builder, 'candidate-link', [{ x: 2650, y: 1790 }, { x: 2750, y: 1790 }, { x: 2750, y: 2990 }, { x: 2650, y: 2990 }], { role: 'cross-tower-link' });

  pill(builder, 'token-embedding', 'embedding', { x: 950, y: 2870, width: 430, height: 80 }, text('Token embedding layer'), { size: 28 });
  pill(builder, 'tokenized-text', 'input', { x: 980, y: 3090, width: 360, height: 80 }, text('Tokenized text'), { size: 28 });
  builder.text('sample-input', 'input-label', { x: encoderRail, y: 3250 }, text('Sample input text'), { size: 40, align: 'center' });
  flow(builder, 'embedding-flow', [{ x: encoderRail, y: 3050 }, { x: encoderRail, y: 2950 }]);
}

function ffnInset(builder: SceneBuilder, spec: FigureSpec): void {
  builder.text('ffn-title', 'ffn-title', { x: 3270, y: 410 }, text('Feed forward (SwiGLU) module'), { size: 42, weight: 800 });
  builder.box('ffn-inset', 'ffn-inset', { x: 3270, y: 450, width: 800, height: 620 }, {
    fill: builder.solid('#F3F3F3'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 54,
  });
  pill(builder, 'ffn-linear-top', 'inset-operation', { x: 3330, y: 510, width: 230, height: 80 }, text('Linear layer'), { size: 28 });
  pill(builder, 'ffn-activation', 'inset-operation', { x: 3330, y: 710, width: 230, height: 80 }, text('SiLU activation'), { size: 28 });
  pill(builder, 'ffn-linear-bottom', 'inset-operation', { x: 3330, y: 910, width: 230, height: 80 }, text('Linear layer'), { size: 28 });
  pill(builder, 'ffn-linear-side', 'inset-operation', { x: 3750, y: 710, width: 230, height: 80 }, text('Linear layer'), { size: 28 });
  builder.glyph('ffn-multiply', 'operator', { x: 3720, y: 610 }, 'multiply', 54);
  flow(builder, 'ffn-up-1', [{ x: 3445, y: 910 }, { x: 3445, y: 790 }], { role: 'inset-flow' });
  flow(builder, 'ffn-up-2', [{ x: 3445, y: 710 }, { x: 3445, y: 590 }], { role: 'inset-flow' });
  flow(builder, 'ffn-side-a', [{ x: 3445, y: 610 }, { x: 3720, y: 610 }], { role: 'inset-flow', arrow: 'none' });
  flow(builder, 'ffn-side-b', [{ x: 3750, y: 610 }, { x: 3865, y: 610 }, { x: 3865, y: 710 }], { role: 'inset-flow', arrow: 'none' });
  callout(builder, spec, 'ffn-dimensions', { x: 3400, y: 1150 }, { size: 38, lineGap: 52 });
}

function moeInset(builder: SceneBuilder, spec: FigureSpec): void {
  builder.box('moe-inset', 'moe-inset', { x: 3200, y: 1510, width: 1000, height: 900 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 58,
  });
  builder.text('moe-title', 'moe-title', { x: 3570, y: 1620 }, text('MoE layer'), { size: 50, weight: 800, align: 'center' });
  builder.glyph('moe-plus', 'operator', { x: 3680, y: 1700 }, 'plus', 60);
  pill(builder, 'moe-left', 'moe-expert', { x: 3250, y: 1880, width: 310, height: 80 }, text('Feed forward'), { fill: '#E8E8E8', size: 28 });
  pill(builder, 'moe-right', 'moe-expert', { x: 3810, y: 1880, width: 310, height: 80 }, text('Feed forward'), { fill: '#E8E8E8', size: 28 });
  builder.glyph('moe-ellipsis', 'ellipsis', { x: 3680, y: 1910 }, 'ellipsis', 60);
  pill(builder, 'moe-badge-1', 'badge', { x: 3530, y: 1920, width: 65, height: 65 }, text('1'), { fill: '#000000', size: 32 });
  pill(builder, 'moe-badge-last', 'badge', { x: 4010, y: 1920, width: 85, height: 65 }, text('384'), { fill: spec.theme.accent, size: 32 });
  pill(builder, 'moe-router', 'router', { x: 3580, y: 2200, width: 200, height: 80 }, text('Router'), { fill: '#E8E8E8', size: 30 });
  flow(builder, 'moe-router-up', [{ x: 3680, y: 2200 }, { x: 3680, y: 1990 }], { role: 'moe-flow' });
  flow(builder, 'moe-router-left', [{ x: 3580, y: 2240 }, { x: 3405, y: 1960 }], { role: 'moe-flow' });
  flow(builder, 'moe-router-right', [{ x: 3780, y: 2240 }, { x: 3965, y: 1960 }], { role: 'moe-flow' });
  flow(builder, 'moe-left-up', [{ x: 3405, y: 1880 }, { x: 3680, y: 1700 }], { role: 'moe-flow' });
  flow(builder, 'moe-right-up', [{ x: 3965, y: 1880 }, { x: 3680, y: 1700 }], { role: 'moe-flow' });
  callout(builder, spec, 'resource', { x: 4200, y: 1780 }, { size: 36, lineGap: 50 });
}

function mhcInset(builder: SceneBuilder): void {
  builder.box('mhc-inset', 'mhc-inset', { x: 3180, y: 2550, width: 1800, height: 900 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 58,
  });
  builder.text('mhc-title', 'mhc-title', { x: 3400, y: 2630 }, { spans: [{ text: 'Single-Pass mHC', color: 'accent' }] }, { size: 38, weight: 800 });
  [2740, 2760, 2780, 2800].forEach((y, index) => {
    flow(builder, `mhc-stream-${index + 1}`, [{ x: 3220, y }, { x: 4600, y }], { role: 'residual-stream', arrow: 'none', width: 4 });
  });
  pill(builder, 'mhc-res', 'mhc-res', { x: 3770, y: 2670, width: 220, height: 60 }, text('mHC res'), { fill: '#E8E8E8', size: 28 });
  multilinePill(builder, 'mhc-pre', 'mhc-pre', { x: 3400, y: 2820, width: 300, height: 160 }, [text('Previous'), text('pre-mix'), text('(4 to 1)')], { fill: '#E8E8E8', size: 28 });
  multilinePill(builder, 'mhc-sublayer', 'mhc-sublayer', { x: 3820, y: 2820, width: 330, height: 160 }, [text('RMSNorm +'), text('sublayer'), text('(attention or MoE)')], { fill: '#E8E8E8', size: 28 });
  multilinePill(builder, 'mhc-post', 'mhc-post', { x: 4280, y: 2820, width: 300, height: 160 }, [text('mHC post'), text('+ residual')], { fill: '#E8E8E8', size: 28 });
  flow(builder, 'mhc-flow-1', [{ x: 3700, y: 2900 }, { x: 3820, y: 2900 }], { role: 'mhc-flow' });
  flow(builder, 'mhc-flow-2', [{ x: 4150, y: 2900 }, { x: 4280, y: 2900 }], { role: 'mhc-flow' });
  builder.text('mhc-note', 'mhc-note', { x: 3400, y: 3100 }, { spans: [{ text: 'with ' }, { text: '4', color: 'accent' }, { text: ' parallel residual streams' }] }, { size: 38, weight: 800 });
  builder.text('mhc-note-2', 'mhc-note', { x: 3400, y: 3260 }, text('Each sublayer computes pre-mix weights for the next sublayer'), { size: 30, weight: 500 });
  builder.text('mhc-note-3', 'mhc-note', { x: 3400, y: 3410 }, text('Single-Pass mHC surrounds every attention (SWA or CSA2) sublayer and every MoE sublayer'), { size: 30, weight: 500 });
}

function legend(builder: SceneBuilder, spec: FigureSpec): void {
  callout(builder, spec, 'csa-legend', { x: 20, y: 650 }, { size: 32, lineGap: 44 });
  pill(builder, 'engram', 'engram', { x: 50, y: 2080, width: 250, height: 80 }, text('Engram'), { fill: '#E8E8E8', size: 30 });
  callout(builder, spec, 'engram-note', { x: 20, y: 2230 }, { size: 32, lineGap: 44 });
  flow(builder, 'engram-feed-1', [{ x: 300, y: 2120 }, { x: 880, y: 1700 }], { role: 'engram-link', arrow: 'none' });
  flow(builder, 'engram-feed-2', [{ x: 300, y: 2120 }, { x: 880, y: 1000 }], { role: 'engram-link', arrow: 'none' });
  pill(builder, 'partial-rope', 'side-pill', { x: 100, y: 2700, width: 260, height: 70 }, text('Partial RoPE'), { size: 28 });
  callout(builder, spec, 'context', { x: 90, y: 2940 }, { size: 36, lineGap: 48 });
  callout(builder, spec, 'vocabulary', { x: 1600, y: 740 }, { size: 38, lineGap: 52 });
  callout(builder, spec, 'embedding-dimension', { x: 1400, y: 3170 }, { size: 38, lineGap: 52 });
}

export function layoutDeepSeekMultiTower(spec: FigureSpec, context: LayoutContext): Scene {
  if (spec.layout.mode !== 'template' || spec.layout.template !== 'multi-tower') fail('DeepSeek requires multi-tower template');
  groupOf(spec, slot(spec, 'encoder'));
  groupOf(spec, slot(spec, 'decoder'));
  groupOf(spec, slot(spec, 'ffn'));
  groupOf(spec, slot(spec, 'moe'));
  groupOf(spec, slot(spec, 'mhc'));
  operation(spec, 'gqa');
  operation(spec, 'moe');
  operation(spec, 'ffn');
  operation(spec, 'gated-residual');
  const builder = new SceneBuilder(spec.theme, context.metrics);
  builder.text('figure-title', 'title', { x: 1560, y: 90 }, spec.title, { size: 96, weight: 900, fill: spec.theme.accent, family: "'Arial Black', Arial, sans-serif" });
  builder.text('figure-subtitle', 'subtitle', { x: 1700, y: 180 }, 'Text backbone shown. Vision encoder and DSpark speculative decoding modules omitted.', { size: 34, fill: '#666666' });
  towers(builder, spec);
  ffnInset(builder, spec);
  moeInset(builder, spec);
  mhcInset(builder);
  legend(builder, spec);
  flow(builder, 'ffn-zoom', [{ x: 2650, y: 1100 }, { x: 3270, y: 700 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  flow(builder, 'moe-zoom', [{ x: 2750, y: 1100 }, { x: 3200, y: 1700 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  return builder.scene(spec);
}
