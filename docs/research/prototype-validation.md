# Issue #2 prototype validation

**Scope:** hand-authored React + SVG figures for DeepSeek-V3 (671B), Gemma 3 (27B), and gpt-oss (120B). This stage validates the rendering model only; it does not introduce a generic layout engine or a public component-library abstraction.

## Deliverables

| Figure | Source component | Standalone export | 50% comparison |
|---|---|---|---|
| DeepSeek-V3 (671B) | `fixtures/golden/figures/DeepSeekV3.tsx` | `artifacts/svg/deepseek-v3.svg` | `artifacts/review/deepseek-v3-comparison.png` |
| Gemma 3 (27B) | `fixtures/golden/figures/Gemma3.tsx` | `artifacts/svg/gemma-3-27b.svg` | `artifacts/review/gemma-3-27b-comparison.png` |
| gpt-oss (120B) | `fixtures/golden/figures/GptOss120b.tsx` | `artifacts/svg/gpt-oss-120b.svg` | `artifacts/review/gpt-oss-120b-comparison.png` |

The Gallery is in `src/App.tsx`; it displays the original reference and the React + SVG implementation side by side with 25% / 50% / 100% zoom controls.

## Verification commands

```bash
bun install
bun run build
bun run export
bun run verify
bun run review
```

- `build`: strict TypeScript checking and Vite production build.
- `export`: deterministic SSR via `renderToStaticMarkup` into standalone SVG files.
- `verify`: checks XML/SVG roots, viewBoxes, required structural groups, real text nodes, unique IDs, no embedded images/foreignObject/external resources, deterministic output, and Resvg rasterization.
- `review`: rasterizes each exported SVG and creates a 50% reference/implementation comparison.

## Automated results

| Figure | SVG text nodes | SVG bytes | Raster validation | Deterministic | Self-contained |
|---|---:|---:|---|---|---|
| DeepSeek-V3 | 44 | 14,676 | 800 × 782 | yes | yes |
| Gemma 3 | 32 | 13,098 | 800 × 829 | yes | yes |
| gpt-oss | 40 | 12,908 | 800 × 744 | yes | yes |

All three figures preserve their reference aspect ratios and contain the major backbone, nested repeated block, residual paths, operation nodes, detail insets, callouts, and labels listed in `docs/research/corpus-inventory.md` §6.

## Browser validation

Each standalone file was opened directly with `file://` in Chromium (Ego Lite). Results:

- DeepSeek-V3: document root `svg`, viewBox `0 0 2786 2725`, 44 text nodes, 0 image/foreignObject elements.
- Gemma 3: document root `svg`, viewBox `0 0 2593 2686`, 32 text nodes, 0 image/foreignObject elements.
- gpt-oss: document root `svg`, viewBox `0 0 2904 2699`, 40 text nodes, 0 image/foreignObject elements.

Browser screenshots are saved as `artifacts/review/*-browser.png`.

## Visual review at 50%

The generated comparison PNGs place the original reference on the left and the React + SVG result on the right at 50% of native width.

Observed outcomes:

1. **DeepSeek-V3:** coral repeated block, MLA, two residual merges, FFN and MoE insets, 61× brace, 128-head/embedding/context/resource annotations are present and positioned consistently with the reference.
2. **Gemma 3:** tan block, Pre/Post-RMSNorm pairs, sliding-window/GQA label, QK-Norm/RoPE side pills, FFN inset, 62× brace, and dimension/context annotations are present and aligned.
3. **gpt-oss:** purple block, GQA, MoE, FFN and expert insets, 36× brace, 64-head/embedding/context/resource annotations are present and aligned.

Differences accepted as non-structural:

- system-font glyph widths and font weight vary slightly by platform;
- dotted-line dash phase and hand-drawn brace paths differ by a few pixels;
- the faint source watermark/attribution is intentionally omitted;
- review images may differ in antialiasing because reference WebP and generated SVG use different rasterization paths.

During implementation, the prototypes were refined for label anchoring, backbone/inset placement, and brace/label sizing. The review compositor was also corrected to transcode reference WebP to PNG for side-by-side raster output; this affects review artifacts only, never the standalone architecture SVGs.

## Acceptance checklist

- [x] Three figures match their reference aspect ratios and include the required structures.
- [x] Labels are real SVG text; no original image is embedded in any exported figure.
- [x] Every figure exports as a self-contained standalone SVG and opens in a browser.
- [x] Side-by-side 50% comparisons are generated and visually reviewed; no obvious structural or labeling discrepancy remains.
- [x] Implementation stayed within the validation timebox; no generic layout engine was introduced.
