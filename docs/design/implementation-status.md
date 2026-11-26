# Public interface and coverage status

**Status:** accepted after issue #10  
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
| Spec validation | Reject malformed, unsafe, or dangling FigureSpec input. |
| LayoutEngine | Convert a normalized Spec into a deterministic positioned Scene. |
| Template adapters | Implement backbone, MoE, attention-mask, layer-schedule, and manual grammars. |
| SceneBuilder | Construct serializable boxes, paths, text, glyphs, stacks, and grids. |
| SceneSvg / SVG renderer | Convert Scene to accessible, self-contained SVG without measuring the DOM. |
| Export/CLI adapters | Render typed or JSON Specs to standalone SVG. |
| Golden fixtures | Preserve the hand-authored issue #2 figures as visual references. |

## Validated structures

| Figure | Validated structures |
|---|---|
| Gemma 3 (27B) | Backbone template, 62× repeat, Pre/Post-RMSNorm, GQA/sliding-window text, FFN inset, side pills, and callouts. |
| GPT-OSS (120B) | MoE inset, FFN inset, badges, ellipsis, resource notes, 36× repeat, purple theme. |
| DeepSeek-V3 (671B) | MLA variant, dense-first note, Partial RoPE, 256 experts, shared/active expert notes, coral theme. |
| Qwen3.8-Flash-Next | Sparse-attention Mask Matrix, GR Read/Write, 4 residual streams, block highlights, typed QSA/Gated DeltaNet data. |
| GLM-5.4 | Layer cards, pass-1/pass-2 schematic, 28-layer recurrence loop, 78/106 layer arithmetic, MoE and FFN insets. |

## Known non-structural limitations

- System-font metrics and raster antialiasing vary by platform.
- The shared SVG marker currently uses a single arrow color.
- Some braces are simplified paths.
- Mask column headers and GR labels use the current text primitives; rotation/subscripts are not yet implemented.
- Visual review covers the five validated figures, not all 132 references.

## Batch coverage plan

1. Parameterize the remaining canonical dense/GQA figures using the `backbone` adapter.
2. Parameterize the remaining MoE figures using the `moe` adapter, recording typed variants where labels differ.
3. Add targeted adapters for the remaining recurrent, multi-tower, and hybrid families from the corpus inventory.
4. For each batch, add a Spec fixture, Scene snapshot, standalone SVG, and 50% visual comparison.
5. Review the 11 medium-confidence inventory entries before using them as public golden contracts.

Coverage should be reported as verified rendering, not merely structural expressiveness.
