# Public interface and coverage status

**Status:** accepted after issues #10–#19  
**Design:** `figure-rendering-interface.md`  
**ADRs:** `../adr/0001-figure-rendering-interface.md`, `../adr/0002-typed-layout-variants.md`

## Public surface

The package entry point is `src/index.ts`. Runtime exports are intentionally limited to:

- `renderFigure`
- `renderFigureFromJson`
- `SceneSvg`
- `FigureValidationError`
- `FigureLayoutError`

Type exports are limited to the accepted contracts: `FigureSpec`, `Scene`, `LayoutEngine`, `LayoutContext`, `TextMetrics`, `RenderFigureOptions`, `RenderedFigure`, and `Diagnostic`.

The 17 primitive and 9 composite-template categories remain internal capabilities. They are not individually exported.

## Internal module responsibilities

| Module | Responsibility |
|---|---|
| Spec validation | Reject malformed, unsafe, dangling, or unsupported FigureSpec input, including unsupported typed variants. |
| LayoutEngine | Convert a normalized Spec into a deterministic positioned Scene. |
| Template adapters | Implement backbone, MoE, attention-mask, layer-schedule, multi-tower, and manual grammars. |
| TemplateScene | Share internal pill/flow/callout/inset/repeat helpers across template adapters without entering the public export surface. |
| SceneBuilder | Construct serializable boxes, paths, text, glyphs, stacks, and grids. |
| SceneSvg / SVG renderer | Convert Scene to accessible, self-contained SVG without measuring the DOM. |
| Export/CLI adapters | Render typed or JSON Specs to standalone SVG. |
| Golden fixtures | Preserve the hand-authored issue #2 figures as visual references. |
| Coverage script | Generate Spec covered / Render covered / Verified rendering separately; only completed 50% reviews count as verified. |

## Validated structures

Twenty-nine figures have deterministic Scene snapshots, self-contained SVG exports, and completed 50% comparisons:

| Figure | Validated structures |
|---|---|
| Gemma 3 (270M) | Backbone, 18× repeat, multi-query attention, 640/2,048 dimensions, side pills, callouts. |
| Gemma 3 (27B) | Backbone, 62× repeat, Pre/Post-RMSNorm, sliding-window GQA, FFN inset, side pills, callouts. |
| Gemma 4 (12B) | Backbone, 48× repeat, Partial/Full RoPE, local/global heads, 3,840/15,360 dimensions. |
| Gemma 4 (31B) | Backbone, 60× repeat, Partial/Full RoPE, 32-head local/global attention, 5,376/21,504 dimensions. |
| GPT-OSS (120B) | MoE, FFN inset, badges, ellipsis, resource notes, 36× repeat. |
| DeepSeek-V3 (671B) | MLA, dense-first note, Partial RoPE, 256 experts, shared/active experts. |
| Qwen3.8-Flash-Next | Sparse-attention Mask Matrix, GR Read/Write, 4 residual streams. |
| GLM-5.4 | Layer cards, pass strip, 28-layer recurrence loop, 78/106 arithmetic. |
| Llama 3.2 (1B) | Masked GQA, 16× repeat, 32 heads, 2,048/8,192 dimensions, Llama 3 RoPE. |
| Llama 3.2 (3B) | Masked GQA, 28× repeat, 24 heads, 3,072/8,192 dimensions. |
| Llama 3 (8B) | Masked grouped-query attention, 32× repeat, SiLU FFN. |
| Qwen3 (0.6B) | Masked GQA, 28× repeat, 16 heads, 1,024/3,072 dimensions, QK-Norm/RoPE. |
| Qwen3 (4B) | Masked GQA, 36× repeat, 32 heads, 2,560/9,728 dimensions, YaRN context. |
| Qwen3 (8B) | QK-Norm/RoPE, 36× repeat, YaRN context, SiLU FFN. |
| Qwen3 (32B) | Pre-RMSNorm, 64× repeat, 64/8 heads, 5,120/25,600 dimensions. |
| Phi-4 (14B) | GQA, 40× repeat, 40/10 heads, 5,120/17,920 dimensions. |
| Domyn Edge (3.93B) | Pre/Post-RMSNorm, 36× repeat, Local RoPE/Global NoPE, tied weights, 2,560/9,728 dimensions. |
| Granite 4.1 (30B) | Pre-RMSNorm, 64× repeat, 32/8 heads, 4,096/32,768 dimensions. |
| GPT-2 XL (1.5B) | LayerNorm/dropout, 48× repeat, learned absolute positions, 25 heads, 1,600/6,400 dimensions. |
| Qwen3 (30B-A3B) | MoE template, 128 experts, 8 active experts, resource notes. |
| MiniMax-M2 (230B) | Partial RoPE, 256 experts, resource annotations, themed MoE inset. |
| Qwen3-Next (80B-A3B) | `moe` `mixing-detail` variant: Gated GQA, Gated DeltaNet, 3:1 schedule. |
| Kimi Linear (48B-A3B) | `mixing-detail` variant: MLA, KDA, Q/K/V lanes, monospaced layer split. |
| xLSTM (7B) | `backbone` `recurrent-detail` variant: matrix memory, mLSTM inset, Q/K/V/f/i gates. |
| LFM2.5 (8B-A1B) | `layer-schedule` `layer-group` variant: 2×/4×/1× groups, repeat gutter, MoE, GQA head grid. |
| Inkling 2 Mini (26.4B) | `layer-schedule` `recurrent-pass` variant: pass strip, before/after-loop cards, feedback loop. |
| Motif-3-Beta (314B-A13B) | `moe` `multi-stream-residual` variant: four mHC-mixed streams, PolyNorm FFN, MoE. |
| DeepSeek-V4.1-Flash (552B) | `multi-tower`: encoder/decoder towers, CED link, Engram, candidate pool, Single-Pass mHC. |
| Tencent Hy4 (770B-A49B) | `attention-mask` `ihc-pipeline` variant: 6×6 DSA mask, highlight, iHC Read/Write pipeline. |

Variants are declared as typed `layout.variant` values. TypeScript checks template-specific combinations, JSON runtime validation uses the same `templateVariants` definition, and `layout.options.variant` is rejected with a targeted diagnostic. Unknown variants fail instead of silently selecting another layout.

## Known non-structural limitations

- System-font metrics and raster antialiasing vary by platform.
- The shared SVG marker currently uses a single arrow color.
- Some braces are simplified paths.
- Mask column headers and GR labels use current text primitives; rotation/subscripts are not yet implemented.
- Several recurrent and composite adapters still contain figure-specific visual constants; shared helper extraction is complete, but visual constant parameterization remains future work.
- Some adapters consume typed node/group data but do not yet preserve every Spec edge as a separate Scene path.

## Pilot completion and next coverage work

The 12-figure pilot defined in #11–#19 is complete, the Gemma dense family from #25 is verified, the dense batches from #26–#27 are verified, the second MoE family batch from #31 is verified, the standard MoE variants from #33 are verified, the simple dense family from #35 is verified, the structure-expansion batch from #37 is verified, and the large MoE/MLA family batch from #39 is verified: 58 figures are now verified.

Next steps:

1. Parameterize additional canonical dense/GQA and MoE families using the existing adapters.
2. Reduce remaining visual constants and preserve Spec edge provenance where an adapter emits a simplified composite path.
3. Continue reviewing medium-confidence inventory entries before promoting new figures to verified rendering.
4. Add the next coverage batch using the typed `layout.variant` interface.

Coverage is reported as verified rendering, not merely structural expressiveness.
