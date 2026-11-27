# LLM Architecture Components

A TypeScript-first workspace for a component library that lets coding agents draw LLM architecture diagrams. The current implementation provides spec-driven rendering for 47 verified figures, with hand-authored prototypes preserved as golden fixtures and template adapters sharing an internal TemplateScene helper layer.

## Environment

- TypeScript: **Bun** (`bun`, `bunx`)
- Python: **uv**, Python **3.13**, project-local `.venv` (only for tasks Bun cannot reasonably handle)

## Public interface

```ts
import { renderFigure } from './src/index';
import { gemma3Spec } from './src/specs/gemma3';

const { scene, svg, diagnostics } = renderFigure(gemma3Spec);
```

The runtime export surface is intentionally limited to `renderFigure`, `renderFigureFromJson`, `SceneSvg`, and the two structured error classes. Template variants are declared as `layout.variant`; `layout.options.variant` is rejected. See `docs/design/implementation-status.md` for the frozen vocabulary and coverage plan.

## Prototype commands

```bash
bun install
bun run dev       # Vite Gallery with reference / implementation comparison
bun run test      # full Bun test suite and Scene snapshots
bun run build     # strict TypeScript + production build
bun run export    # standalone prototype SVGs into artifacts/svg/
bun run export:spec  # Spec-driven SVGs into artifacts/svg/
bun run verify    # deterministic/self-contained SVG + raster validation
bun run review    # 50% comparison images into artifacts/review/
bun run coverage  # regenerate docs/research/rendering-coverage.md
bun run render:spec examples/gemma3.spec.json artifacts/svg/gemma-3-27b-cli.svg
```

Golden hand-authored figures (kept only as visual fixtures):

- `fixtures/golden/figures/DeepSeekV3.tsx`
- `fixtures/golden/figures/Gemma3.tsx`
- `fixtures/golden/figures/GptOss120b.tsx`

Validation notes: `docs/research/prototype-validation.md`.

## Research

- Accepted interface design: `docs/design/figure-rendering-interface.md`
- Interface ADRs: `docs/adr/0001-figure-rendering-interface.md`, `docs/adr/0002-typed-layout-variants.md`
- Rendering research: `docs/research/react-svg-rendering.md`
- Full 132-figure inventory: `docs/research/corpus-inventory.md`
- Regenerate inventory: `bun scripts/build-corpus-inventory.ts`
- Rendering coverage: `docs/research/rendering-coverage.md`

The hand-authored prototype figures remain available as golden references. Gallery and CLI now use the accepted `FigureSpec → Scene → SVG` interface, with deterministic snapshots in `tests/__snapshots__/`.
