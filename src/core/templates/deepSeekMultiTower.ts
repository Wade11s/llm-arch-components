import { TemplateScene, templateText as text, createTemplateApi } from './templateScene';
import type { FigureSpec, LayoutContext, Scene } from '../types';

const { fail, slot, groupOf, operation } = createTemplateApi('DeepSeek multi-tower', 'multi-tower');

function towers(builder: TemplateScene, spec: FigureSpec): void {
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

  builder.pill('encoder-final', 'tower-output', { x: 900, y: 780, width: 430, height: 80 }, text('Final encoder hidden states'), { size: 28 });
  builder.pill('decoder-premix', 'tower-output', { x: 2210, y: 740, width: 430, height: 80 }, text('Final pre-mix (4 to 1)'), { size: 28 });
  builder.pill('decoder-final-norm', 'norm', { x: 2220, y: 620, width: 410, height: 80 }, text('Final RMSNorm'), { size: 28 });
  builder.pill('decoder-output', 'output-layer', { x: 2300, y: 500, width: 380, height: 80 }, text('Linear output layer'), { size: 28 });

  builder.repeatFrame('encoder-reuse', { x: 880, y: 1100, width: 550, height: 300 }, '×5');
  builder.pill('encoder-reuse-moe', 'moe-block', { x: 940, y: 1050, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  builder.pill('encoder-reuse-attention', 'attention-node', { x: 940, y: 1200, width: 430, height: 80 }, text('CSA2(2, Reuse)'), { fill: '#E8E8E8', size: 28 });
  builder.repeatFrame('encoder-full', { x: 880, y: 1450, width: 550, height: 700 }, '×3');
  builder.pill('encoder-full-moe-1', 'moe-block', { x: 940, y: 1700, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  builder.pill('encoder-full-moe-2', 'moe-block', { x: 940, y: 1800, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  builder.multilinePill('encoder-full-attention', 'attention-node', { x: 940, y: 1900, width: 430, height: 100 }, [text('Compressed Sparse Attention 2'), text('CSA2(2, Full)')], { fill: '#E8E8E8', size: 28 });
  builder.repeatFrame('encoder-swa', { x: 880, y: 2150, width: 550, height: 350 }, '×2');
  builder.pill('encoder-swa-moe', 'moe-block', { x: 940, y: 2250, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  builder.multilinePill('encoder-swa-attention', 'attention-node', { x: 940, y: 2400, width: 430, height: 90 }, [text('Sliding window attention'), text('(SWA)')], { fill: '#E8E8E8', size: 28 });

  builder.repeatFrame('decoder-reuse-top', { x: 2160, y: 1100, width: 550, height: 300 }, '×3');
  builder.pill('decoder-reuse-top-moe', 'moe-block', { x: 2220, y: 1050, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  builder.pill('decoder-reuse-top-attention', 'attention-node', { x: 2220, y: 1200, width: 430, height: 80 }, text('CSA2(1, Reuse)'), { fill: '#E8E8E8', size: 28 });
  builder.repeatFrame('decoder-reindex', { x: 2160, y: 1500, width: 550, height: 400 }, '×4');
  builder.pill('decoder-reindex-moe', 'moe-block', { x: 2220, y: 1600, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  builder.pill('decoder-reindex-attention', 'attention-node', { x: 2220, y: 1750, width: 430, height: 80 }, text('CSA2(1, Reindex)'), { fill: '#E8E8E8', size: 28 });
  builder.repeatFrame('decoder-reuse-bottom', { x: 2160, y: 2000, width: 550, height: 450 }, '×3');
  builder.pill('decoder-reuse-bottom-moe', 'moe-block', { x: 2220, y: 2100, width: 430, height: 80 }, text('MoE'), { fill: '#E8E8E8', size: 28 });
  builder.pill('decoder-reuse-bottom-attention', 'attention-node', { x: 2220, y: 2250, width: 430, height: 80 }, text('CSA2(1, Reuse)'), { fill: '#E8E8E8', size: 28 });
  builder.pill('decoder-full-attention', 'attention-node', { x: 2220, y: 2600, width: 430, height: 80 }, text('CSA2(1, Full)'), { fill: '#E8E8E8', size: 28 });

  const encoderRail = 1155;
  const decoderRail = 2435;
  [
    ['encoder-flow-1', encoderRail, 2500, 2330], ['encoder-flow-2', encoderRail, 2250, 2080], ['encoder-flow-3', encoderRail, 1900, 1780], ['encoder-flow-4', encoderRail, 1700, 1280], ['encoder-flow-5', encoderRail, 1200, 860],
  ].forEach(([id, x, from, to]) => builder.flow(id as string, [{ x: x as number, y: from as number }, { x: x as number, y: to as number }]));
  [
    ['decoder-flow-1', decoderRail, 2680, 2530], ['decoder-flow-2', decoderRail, 2600, 2330], ['decoder-flow-3', decoderRail, 2250, 1830], ['decoder-flow-4', decoderRail, 1750, 1280], ['decoder-flow-5', decoderRail, 1200, 820],
  ].forEach(([id, x, from, to]) => builder.flow(id as string, [{ x: x as number, y: from as number }, { x: x as number, y: to as number }]));

  builder.multilinePill('ced-global-kv', 'cross-tower-link', { x: 1650, y: 1750, width: 220, height: 120 }, [text('CED'), text('Global KV')], { fill: '#FFFFFF', size: 28 });
  builder.flow('ced-left', [{ x: 1480, y: 1810 }, { x: 1650, y: 1810 }], { role: 'cross-tower-link' });
  builder.flow('ced-right', [{ x: 1870, y: 1810 }, { x: 2100, y: 1810 }], { role: 'cross-tower-link' });
  builder.text('indexer-label', 'hierarchical-indexer', { x: 2200, y: 2890 }, text('Hierarchical sparse indexer'), { size: 30, weight: 700 });
  builder.pill('candidate-pool', 'candidate-pool', { x: 2200, y: 2950, width: 450, height: 80 }, text('Candidate pool'), { fill: '#E8E8E8', size: 28 });
  builder.flow('candidate-link', [{ x: 2650, y: 1790 }, { x: 2750, y: 1790 }, { x: 2750, y: 2990 }, { x: 2650, y: 2990 }], { role: 'cross-tower-link' });

  builder.pill('token-embedding', 'embedding', { x: 950, y: 2870, width: 430, height: 80 }, text('Token embedding layer'), { size: 28 });
  builder.pill('tokenized-text', 'input', { x: 980, y: 3090, width: 360, height: 80 }, text('Tokenized text'), { size: 28 });
  builder.text('sample-input', 'input-label', { x: encoderRail, y: 3250 }, text('Sample input text'), { size: 40, align: 'center' });
  builder.flow('embedding-flow', [{ x: encoderRail, y: 3050 }, { x: encoderRail, y: 2950 }]);
}

function ffnInset(builder: TemplateScene, spec: FigureSpec): void {
  builder.text('ffn-title', 'ffn-title', { x: 3270, y: 410 }, text('Feed forward (SwiGLU) module'), { size: 42, weight: 800 });
  builder.box('ffn-inset', 'ffn-inset', { x: 3270, y: 450, width: 800, height: 620 }, {
    fill: builder.solid('#F3F3F3'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 54,
  });
  builder.pill('ffn-linear-top', 'inset-operation', { x: 3330, y: 510, width: 230, height: 80 }, text('Linear layer'), { size: 28 });
  builder.pill('ffn-activation', 'inset-operation', { x: 3330, y: 710, width: 230, height: 80 }, text('SiLU activation'), { size: 28 });
  builder.pill('ffn-linear-bottom', 'inset-operation', { x: 3330, y: 910, width: 230, height: 80 }, text('Linear layer'), { size: 28 });
  builder.pill('ffn-linear-side', 'inset-operation', { x: 3750, y: 710, width: 230, height: 80 }, text('Linear layer'), { size: 28 });
  builder.glyph('ffn-multiply', 'operator', { x: 3720, y: 610 }, 'multiply', 54);
  builder.flow('ffn-up-1', [{ x: 3445, y: 910 }, { x: 3445, y: 790 }], { role: 'inset-flow' });
  builder.flow('ffn-up-2', [{ x: 3445, y: 710 }, { x: 3445, y: 590 }], { role: 'inset-flow' });
  builder.flow('ffn-side-a', [{ x: 3445, y: 610 }, { x: 3720, y: 610 }], { role: 'inset-flow', arrow: 'none' });
  builder.flow('ffn-side-b', [{ x: 3750, y: 610 }, { x: 3865, y: 610 }, { x: 3865, y: 710 }], { role: 'inset-flow', arrow: 'none' });
  builder.callout(spec, 'ffn-dimensions', { x: 3400, y: 1150 }, { size: 38, lineGap: 52 });
}

function moeInset(builder: TemplateScene, spec: FigureSpec): void {
  builder.box('moe-inset', 'moe-inset', { x: 3200, y: 1510, width: 1000, height: 900 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 58,
  });
  builder.text('moe-title', 'moe-title', { x: 3570, y: 1620 }, text('MoE layer'), { size: 50, weight: 800, align: 'center' });
  builder.glyph('moe-plus', 'operator', { x: 3680, y: 1700 }, 'plus', 60);
  builder.pill('moe-left', 'moe-expert', { x: 3250, y: 1880, width: 310, height: 80 }, text('Feed forward'), { fill: '#E8E8E8', size: 28 });
  builder.pill('moe-right', 'moe-expert', { x: 3810, y: 1880, width: 310, height: 80 }, text('Feed forward'), { fill: '#E8E8E8', size: 28 });
  builder.glyph('moe-ellipsis', 'ellipsis', { x: 3680, y: 1910 }, 'ellipsis', 60);
  builder.pill('moe-badge-1', 'badge', { x: 3530, y: 1920, width: 65, height: 65 }, text('1'), { fill: '#000000', size: 32 });
  builder.pill('moe-badge-last', 'badge', { x: 4010, y: 1920, width: 85, height: 65 }, text('384'), { fill: spec.theme.accent, size: 32 });
  builder.pill('moe-router', 'router', { x: 3580, y: 2200, width: 200, height: 80 }, text('Router'), { fill: '#E8E8E8', size: 30 });
  builder.flow('moe-router-up', [{ x: 3680, y: 2200 }, { x: 3680, y: 1990 }], { role: 'moe-flow' });
  builder.flow('moe-router-left', [{ x: 3580, y: 2240 }, { x: 3405, y: 1960 }], { role: 'moe-flow' });
  builder.flow('moe-router-right', [{ x: 3780, y: 2240 }, { x: 3965, y: 1960 }], { role: 'moe-flow' });
  builder.flow('moe-left-up', [{ x: 3405, y: 1880 }, { x: 3680, y: 1700 }], { role: 'moe-flow' });
  builder.flow('moe-right-up', [{ x: 3965, y: 1880 }, { x: 3680, y: 1700 }], { role: 'moe-flow' });
  builder.callout(spec, 'resource', { x: 4200, y: 1780 }, { size: 36, lineGap: 50 });
}

function mhcInset(builder: TemplateScene): void {
  builder.box('mhc-inset', 'mhc-inset', { x: 3180, y: 2550, width: 1800, height: 900 }, {
    fill: builder.solid('#FFFFFF'),
    stroke: builder.stroke('#000000', 8, 'dotted'),
    radius: 58,
  });
  builder.text('mhc-title', 'mhc-title', { x: 3400, y: 2630 }, { spans: [{ text: 'Single-Pass mHC', color: 'accent' }] }, { size: 38, weight: 800 });
  [2740, 2760, 2780, 2800].forEach((y, index) => {
    builder.flow(`mhc-stream-${index + 1}`, [{ x: 3220, y }, { x: 4600, y }], { role: 'residual-stream', arrow: 'none', width: 4 });
  });
  builder.pill('mhc-res', 'mhc-res', { x: 3770, y: 2670, width: 220, height: 60 }, text('mHC res'), { fill: '#E8E8E8', size: 28 });
  builder.multilinePill('mhc-pre', 'mhc-pre', { x: 3400, y: 2820, width: 300, height: 160 }, [text('Previous'), text('pre-mix'), text('(4 to 1)')], { fill: '#E8E8E8', size: 28 });
  builder.multilinePill('mhc-sublayer', 'mhc-sublayer', { x: 3820, y: 2820, width: 330, height: 160 }, [text('RMSNorm +'), text('sublayer'), text('(attention or MoE)')], { fill: '#E8E8E8', size: 28 });
  builder.multilinePill('mhc-post', 'mhc-post', { x: 4280, y: 2820, width: 300, height: 160 }, [text('mHC post'), text('+ residual')], { fill: '#E8E8E8', size: 28 });
  builder.flow('mhc-flow-1', [{ x: 3700, y: 2900 }, { x: 3820, y: 2900 }], { role: 'mhc-flow' });
  builder.flow('mhc-flow-2', [{ x: 4150, y: 2900 }, { x: 4280, y: 2900 }], { role: 'mhc-flow' });
  builder.text('mhc-note', 'mhc-note', { x: 3400, y: 3100 }, { spans: [{ text: 'with ' }, { text: '4', color: 'accent' }, { text: ' parallel residual streams' }] }, { size: 38, weight: 800 });
  builder.text('mhc-note-2', 'mhc-note', { x: 3400, y: 3260 }, text('Each sublayer computes pre-mix weights for the next sublayer'), { size: 30, weight: 500 });
  builder.text('mhc-note-3', 'mhc-note', { x: 3400, y: 3410 }, text('Single-Pass mHC surrounds every attention (SWA or CSA2) sublayer and every MoE sublayer'), { size: 30, weight: 500 });
}

function legend(builder: TemplateScene, spec: FigureSpec): void {
  builder.callout(spec, 'csa-legend', { x: 20, y: 650 }, { size: 32, lineGap: 44 });
  builder.pill('engram', 'engram', { x: 50, y: 2080, width: 250, height: 80 }, text('Engram'), { fill: '#E8E8E8', size: 30 });
  builder.callout(spec, 'engram-note', { x: 20, y: 2230 }, { size: 32, lineGap: 44 });
  builder.flow('engram-feed-1', [{ x: 300, y: 2120 }, { x: 880, y: 1700 }], { role: 'engram-link', arrow: 'none' });
  builder.flow('engram-feed-2', [{ x: 300, y: 2120 }, { x: 880, y: 1000 }], { role: 'engram-link', arrow: 'none' });
  builder.pill('partial-rope', 'side-pill', { x: 100, y: 2700, width: 260, height: 70 }, text('Partial RoPE'), { size: 28 });
  builder.callout(spec, 'context', { x: 90, y: 2940 }, { size: 36, lineGap: 48 });
  builder.callout(spec, 'vocabulary', { x: 1600, y: 740 }, { size: 38, lineGap: 52 });
  builder.callout(spec, 'embedding-dimension', { x: 1400, y: 3170 }, { size: 38, lineGap: 52 });
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
  const builder = new TemplateScene(spec.theme, context.metrics, { pillRadius: 22, pillSize: 30, calloutLineGap: 52, calloutSourceId: null });
  builder.text('figure-title', 'title', { x: 1560, y: 90 }, spec.title, { size: 96, weight: 900, fill: spec.theme.accent, family: "'Arial Black', Arial, sans-serif" });
  builder.text('figure-subtitle', 'subtitle', { x: 1700, y: 180 }, 'Text backbone shown. Vision encoder and DSpark speculative decoding modules omitted.', { size: 34, fill: '#666666' });
  towers(builder, spec);
  ffnInset(builder, spec);
  moeInset(builder, spec);
  mhcInset(builder);
  legend(builder, spec);
  builder.flow('ffn-zoom', [{ x: 2650, y: 1100 }, { x: 3270, y: 700 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  builder.flow('moe-zoom', [{ x: 2750, y: 1100 }, { x: 3200, y: 1700 }], { role: 'zoom-leader', dash: 'dotted', arrow: 'none' });
  return builder.scene(spec);
}
