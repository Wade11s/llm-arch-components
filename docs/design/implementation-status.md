# Public interface and coverage status

**Status:** accepted after issues #10–#19  
**Design:** `figure-rendering-interface.md`  
**ADR:** `../adr/0001-figure-rendering-interface.md`

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

Seventeen figures have deterministic Scene snapshots, self-contained SVG exports, and completed 50% comparisons:

| Figure | Validated structures |
|---|---|
| Gemma 3 (27B) | Backbone, 62× repeat, Pre/Post-RMSNorm, sliding-window GQA, FFN inset, side pills, callouts. |
| GPT-OSS (120B) | MoE, FFN inset, badges, ellipsis, resource notes, 36× repeat. |
| DeepSeek-V3 (671B) | MLA, dense-first note, Partial RoPE, 256 experts, shared/active experts. |
| Qwen3.8-Flash-Next | Sparse-attention Mask Matrix, GR Read/Write, 4 residual streams. |
| GLM-5.4 | Layer cards, pass strip, 28-layer recurrence loop, 78/106 arithmetic. |
| Llama 3 (8B) | Masked grouped-query attention, 32× repeat, SiLU FFN. |
| Qwen3 (8B) | QK-Norm/RoPE, 36× repeat, YaRN context, SiLU FFN. |
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

Variant names are validated during Spec validation. Unknown variants fail instead of silently selecting another layout.

## Known non-structural limitations

- System-font metrics and raster antialiasing vary by platform.
- The shared SVG marker currently uses a single arrow color.
- Some braces are simplified paths.
- Mask column headers and GR labels use current text primitives; rotation/subscripts are not yet implemented.
- Several recurrent and composite adapters still contain figure-specific visual constants; shared helper extraction is complete, but visual constant parameterization remains future work.
- Some adapters consume typed node/group data but do not yet preserve every Spec edge as a separate Scene path.

## Pilot completion and next coverage work

The 12-figure pilot defined in #11–#19 is complete: 17 figures are now verified (five from #4–#10 plus 12 pilot figures).

Next steps:

1. Parameterize additional canonical dense/GQA and MoE families using the existing adapters.
2. Reduce remaining visual constants and preserve Spec edge provenance where an adapter emits a simplified composite path.
3. Continue reviewing medium-confidence inventory entries before promoting new figures to verified rendering.
4. Add typed layout variants only after a new family proves the current option surface insufficient.

Coverage is reported as verified rendering, not merely structural expressiveness.
