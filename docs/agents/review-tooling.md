# Review tooling

## Reference-image crops

Use the project crop command instead of writing a temporary Sharp script:

```bash
bun run image:crop -- \
  --source images/tencent-hy4-770b-a49b.webp \
  --left 1350 --top 450 --width 900 --height 2000 \
  --resize-width 700 \
  --out /tmp/tencent-crop.png
```

The command validates integer geometry, checks the crop against the source dimensions, creates the output directory, and writes PNG. Add `--resize-height <px>` when both output dimensions must be explicit. When both resize dimensions are set, it uses `fit: 'fill'` so no cropped pixels are discarded; this scales axes independently and can change proportions.

## Sharp input under Bun

Sharp must receive a Buffer under Bun:

```ts
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const image = sharp(await readFile(path));
```

Use `sharpFromFile(path)` from `scripts/lib/image.ts` in project scripts. Do not pass a file path directly to `sharp(path)`: with Bun 1.4.5 in this environment, path input hung before even `metadata()` returned, while Buffer input completed the same crop in about 0.2 seconds.

## Single-figure visual review

Export the Spec SVG first, then build only one comparison:

```bash
bun run export:spec
bun run review -- --figure tencent-hy4-770b-a49b
```

For the three golden hand-authored figures, export their SVGs with `bun run export` before selecting `deepseek-v3`, `gemma-3-27b`, or `gpt-oss-120b`.

`--figure` accepts the base slug for Spec-driven figures or the exact artifact slug (for example `tencent-hy4-770b-a49b-spec`). An unknown slug fails with an error. Use `--out-dir <directory>` to isolate generated artifacts.

For the example above, the selected artifacts are written under `artifacts/review/`:

- `tencent-hy4-770b-a49b-spec-render.png`
- `tencent-hy4-770b-a49b-spec-comparison.svg`
- `tencent-hy4-770b-a49b-spec-comparison.png`
- `index.html` containing only the selected figure

Use `bun run review` without `--figure` for the full review set.

## Reference Verification

Use the unified Reference Verification command when a figure needs recorded evidence against its reference image:

```bash
bun run verify:reference -- tencent-hy4-770b-a49b
```

The command exports the Spec SVG, generates a 50% comparison, six overlapping 100% crops, `pixelDiffMean` / `edgeDiffMean`, a Markdown report, and a manifest entry under `docs/verification/reference-verification.json`.

A reviewer can record a signed result after inspecting the artifacts:

```bash
bun run verify:reference -- tencent-hy4-770b-a49b \
  --status accepted-difference \
  --reviewer "agent-name (agent, not human approval)" \
  --accepted-difference "Describe the accepted non-structural difference."
```

Use `--out-dir <directory>` and `--manifest <file>` to isolate test or scratch output. `pixelDiffMean` and `edgeDiffMean` are advisory metrics; hard gates are structural, textual, connector, canvas, and crop-review checks. Reruns compare metrics with the figure's recorded baseline and emit `metric-drift` warnings instead of failing automatically.
