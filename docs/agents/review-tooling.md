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

The command validates integer geometry, checks the crop against the source dimensions, creates the output directory, and writes PNG.

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

`--figure` accepts the base slug for Spec-driven figures or the exact artifact slug (for example `tencent-hy4-770b-a49b-spec`). An unknown slug fails with an error.

The selected artifacts are written under `artifacts/review/`:

- `<slug>-spec-render.png`
- `<slug>-spec-comparison.svg`
- `<slug>-spec-comparison.png`
- `index.html` containing only the selected figure

Use `bun run review` without `--figure` for the full review set.
