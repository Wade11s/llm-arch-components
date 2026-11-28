# Reference Verification

Status: accepted

**Verified Rendering** remains the existing coverage level: a valid **FigureSpec** produces deterministic, self-contained SVG and passes a 50% side-by-side review. We add **Reference Verification** as a stricter evidence layer for whether a **Figure** matches its reference image in structure, text, connections, and visual hierarchy, without requiring pixel parity.

Reference Verification has three layers: automated contract checks, measured visual comparison, and structured visual review. We rejected raw pixel equality and a global pixel-diff threshold because fonts, antialiasing, WebP compression, watermark omission, and hand-drawn curves produce expected differences. Visual metrics such as `pixelDiffMean` and `edgeDiffMean` are recorded as advisory evidence; hard gates remain structural, textual, connector, canvas, and crop-review checks. Each figure establishes its own metric baseline, and later increases produce drift warnings rather than automatic failures.

## Consequences

Reference Verification uses a 50% full-figure comparison plus 100% targeted crops for labels, connectors, and insets. Evidence is recorded in a tracked `docs/verification/reference-verification.json` manifest with status (`pending`, `pass`, `accepted-difference`, or `fail`), hashes, metrics, reviewer, date, and artifact paths; review images remain under `artifacts/review/`. The `bun run verify:reference -- <slug>` command becomes the unified entry point, and the first pilot covers Tencent Hy4, GLM-5 (744B), and Gemma 3 (27B). Existing 58 verified figures keep their coverage count while they are backfilled by risk; failures create fix issues instead of reducing Verified Rendering coverage.
