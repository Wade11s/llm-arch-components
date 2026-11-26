# Rendering model for an LLM-architecture diagram component library

**Status:** research / pre-implementation decision record
**Date:** 2026-11-27
**Scope:** choose the primary rendering approach for a TypeScript-first component library that lets coding agents recreate the LLM architecture figures in `images/`.
**Method:** primary sources only (specs, official docs, source repositories, npm registry metadata) plus a small amount of local measurement. No implementation was written. Every material claim carries an inline source; claims that need local benchmarking are marked **[benchmark]**.

---

## 1. Executive recommendation

**Use React + declarative SVG as the primary rendering model, with a pure, pre-computed layout stage and a serializable scene IR between the spec and the renderer. Do not use D3 for DOM ownership, and do not use React Flow, Canvas/WebGL, or Mermaid as the primary path.**

Five decisions, in priority order:

1. **Renderer: React 19 + inline SVG.** One `<svg viewBox>` root per figure, React components emit `<rect>`, `<path>`, `<text>`, `<g>`, `<marker>`. SVG is the only option that simultaneously gives absolute-position fidelity, real text (selectable, styleable, localizable), a DOM the tests and screen readers can inspect, and a lossless vector export. See §4.2.
2. **Geometry is computed before render; never measured during render.** The corpus is a *template family*, not an arbitrary graph: 10 unique figures out of 132 share one skeleton, with variants (backbone column, repeat bracket, residual ⊕ paths, FFN inset, MoE detail panel, margin callouts). A deterministic `layout(spec) → Scene` function reproduces that grammar exactly; measurement-driven layout (the React Flow / auto-layout model) reintroduces nondeterminism for no fidelity gain. See §4.1, §4.5.
3. **D3 is a math library, not a rendering layer.** Admit `d3-shape`/`d3-scale` for path and scale math (4.2 kB gzip measured for a 4-export subset), reject `d3-selection`/`join` as a DOM owner. This is the same split Airbnb's visx documents ("visx is using d3 for the calculations and math"; "mixing two mental models for updating the DOM is never a good time"). See §4.4.
4. **Layout is a swappable seam with a deterministic default.** Default: explicit/template layout. Optional peers: ELK layered (compound graphs, cross-hierarchy edges, orthogonal routing, ports — the only engine whose documented feature set covers nested blocks with residual edges) and `@dagrejs/dagre` for simple trees. Both are opt-in because of size and license (ELK: 450.7 kB gzip, EPL-2.0). See §4.5, §5, §7.
5. **Export is a first-class module, and the design must not depend on the browser to produce geometry.** `renderToStaticMarkup` produces the `.svg` string in Node; PNG is a rasterization step (browser canvas or `resvg`). This only works if no component measures the DOM — which is decision 2. See §4.8.

**Confidence:** high on the rendering model and the D3 ownership split; high on rejecting React Flow/Mermaid as the *primary* model; medium on the exact layout-engine choice for the "graph mode" (needs the Spike 3 comparison in §8).

**What would change this recommendation:** if the product becomes an interactive node editor (drag/connect), React Flow's interaction layer or a custom editor over the same scene IR becomes attractive; if a single figure ever exceeds ~10k primitives with 60 fps animation, a canvas renderer behind the same IR is the escape hatch; if layouts must be generated for model families nobody has hand-tuned, algorithmic layout stops being optional and becomes the default with acceptance thresholds.

---

## 2. What was examined

| Artifact | Detail |
|---|---|
| Corpus | `images/` — 132 `.webp` figures, median aspect ratio **1.024** (min 0.855, max 1.462), most common raster size 2927×2744. Figures are near-square, high-DPI exports consistent with a vector original. |
| Sampled figures | 10 unique figures of 132 (13 inspections across two passes): `deepseek-v3`, `kimi-k2`, `mistral-large-3`, `gpt-oss-120b`, `gemma-3-27b`, `llama-3-8b`, `qwen3-next-80b-a3b`, `xlstm-7b`, `kimi-linear-48b-a3b`, `lfm2-5-8b-a1b`. |
| Repo state | No `package.json`, no source; `AGENTS.md` + `docs/agents/*` only. This report is the first technical artifact, so MVP dependency choices below are proposals, not constraints. |
| Versions verified on 2026-11-27 | react/react-dom 19.3.1 · @xyflow/react 13.0.3 · elkjs 0.12.2 (repo `master` 0.13.0) · @dagrejs/dagre 3.1.4 · dagre 0.8.5 · d3-shape 3.2.1 · d3-selection 3.0.1 · d3-force 3.0.1 · mermaid 12.3.0 · pixi.js 8.23.0 · @resvg/resvg-js 2.6.2 · vitest 5.1.2 · @playwright/test 1.65.1 |

---

## 3. Evaluation criteria

Weights reflect this product's actual job: an *agent* writes a spec, a *deterministic* renderer turns it into a figure that must look like a human-designed infographic.

| # | Criterion | Weight | Why it dominates (or doesn't) |
|---|---|---|---|
| C1 | Fidelity to the hand-composed figure grammar | 20% | The value of the library is looking like the originals: nested rounded containers, dashed borders, dotted leader lines, braces, ⊕ merge nodes, mixed-weight/colour inline text, inset detail panels. |
| C2 | Determinism / reproducibility | 15% | Agents iterate: same spec must yield the same picture, or diffing and review are impossible. |
| C3 | Agent authorability | 15% | The spec surface must be small, typed, and fail loudly; agents are good at topology, bad at absolute coordinates. |
| C4 | Lossless vector export (SVG/PDF) | 12% | Figures ship in docs, slides, papers; rasterizing text is a quality and accessibility regression. |
| C5 | Accessibility | 10% | Static figures still need names, descriptions, and real text. |
| C6 | Themeability | 8% | The corpus varies only by accent colour + labels; theming is a config problem, not a redesign. |
| C7 | Runtime performance / scale | 8% | Figures are static; a few thousand primitives is the realistic ceiling, not 100k. |
| C8 | Dependency, bundle, maintenance risk | 7% | A component library inherits its deps' licenses and bug surface. |
| C9 | Testability / visual regression | 5% | Geometry must be assertable, not just screenshot-able. |

---

## 4. Findings

### 4.1 The corpus is a template family, and that changes the layout question

The ten sampled figures are not generic node-link graphs. They are *infographics with a fixed grammar*:

| Element observed | Example in sample | Rendering implication |
|---|---|---|
| Vertical backbone column: `Tokenized text → Token embedding layer → N× block → Final RMSNorm → Linear output layer` | all 5 | Ordered stack; spacing is authored, not ranked |
| Nested rounded containers (outer model box, inner repeating block) with distinct fills | all 5 | True containment (parent/child), not "groups of nodes" |
| Repeat notation: brace + `61 ×` / `36 ×` / `62 ×` label | all 5 | A glyph + label, not 61 rendered copies |
| Residual/skip connections: orthogonal polyline, arrowhead, ⊕ merge | all 5 | Manual waypoint routing with a junction marker |
| Dashed inset ("Feed forward (SwiGLU) module") with its own internal flow | all 5 | A nested sub-figure at a different scale |
| Dot-leader callouts into margin text with mixed weight/colour spans (`Vocabulary size of 129k`) | all 5 | Leader line + rich-text block with baseline-aligned spans |
| Detail panel ("MoE layer") connected by two dotted "zoom" edges to the block it expands | 4 of 5 | Semantic-zoom edges, not dataflow edges |
| Badges/ellipsis (`1`, `256`, `…`) and bullet lists inside the figure | 4 of 5 | Small structured text components |
| One accent colour per model, applied to title, emphasis spans, borders, badges | all 5 | Token-driven theming |

**Conclusion.** The hard part is *composition and typography*, not *graph layout*. Any renderer that owns its own layout algorithm (Mermaid, React Flow + ELK/dagre, Graphviz) must be fought to reproduce absolute placement, and still cannot express brace glyphs, dot-leader callouts, or ⊕ junctions without custom code. Conversely, a library of SVG primitives with explicit coordinates reproduces this grammar directly, and the "layout engine" for 90% of figures is a stack function plus authored constants.

*Caveat, and a validation task:* the template-family claim is based on 5 samples. Classify all 132 figures (how many distinct templates, which variants) in Spike 1 before freezing the component inventory.

### 4.2 SVG vs Canvas: what the platform actually guarantees

| Property | SVG | Canvas 2D / WebGL |
|---|---|---|
| Output model | XML markup, retained as DOM nodes; "can be searched, indexed, scripted, and compressed" ([MDN SVG](https://developer.mozilla.org/en-US/docs/Web/SVG)) | "just a bitmap [that] does not provide information about any drawn objects" ([MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)) |
| Text | Real `<text>`/`<tspan>`; styleable, selectable, localizable | Painted pixels; "text written on canvas can cause legibility issues with users relying on screen magnification" ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)) |
| Accessibility | Elements participate in the accessibility tree when authored correctly ([SVG-AAM](https://www.w3.org/TR/SVG-AAM-1.0/)) | "Canvas content is not exposed to accessibility tools like semantic HTML is" ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)) |
| Styling/theming | CSS applies, including custom properties ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)) and `vector-effect` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/vector-effect)) | Repaint required for every style change; theme = code, not CSS |
| Vector export | The format *is* the export | Requires a second renderer to emit SVG at all |
| Zoom/pan | `viewBox` + `<g transform>`; stroke width controllable via `vector-effect: non-scaling-stroke` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/vector-effect)) | Redraw at new scale; text re-rasterized |
| Scale ceiling | One DOM node per primitive; cost grows with node count **[benchmark]** | Flat per-frame cost; best for 10k+ marks **[benchmark]** |

Two implementation details matter for this library specifically:

- **SVG text does not reflow.** "The `<text>` element does not wrap by default, to make this happen it needs to be styled with the `white-space` CSS property" ([MDN `<text>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text)). Multi-line labels are an explicit layout problem (`<tspan>` per line, cited in [MDN `<tspan>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/tspan)), not a CSS accident. Measuring text requires the DOM (`getComputedTextLength`, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/SVGTextContentElement/getComputedTextLength)) — which is exactly what a Node-side export cannot do (§4.8).
- **`<use>` gives cheap reuse** of a repeated sub-drawing ("takes nodes from within an SVG document, and duplicates them somewhere else", [MDN `<use>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use)) — useful for expert grids and repeated stacks, with the caveat that CSS inheritance into the cloned shadow content is limited.

**Verdict:** for static, typography-heavy, ~10³-element figures, SVG's costs (DOM weight) are hypothetical and its benefits (text, a11y, CSS theming, export) are immediate. Canvas/WebGL is the wrong default and should exist only as a renderer swap behind the scene IR.

PixiJS does not change this: it is a WebGL/WebGPU scene-graph renderer ([PixiJS intro](https://pixijs.com/8.x/guides/getting-started/intro)) with an 80.4 MB unpacked install ([registry](https://www.npmjs.com/package/pixi.js)), and it renders into a canvas — inheriting every accessibility and export limitation above, plus a text-rendering pipeline that is not the browser's.

### 4.3 React + declarative SVG: the mechanics that matter

**Attribute naming is handled by React DOM.** React DOM maps SVG presentation attributes to camelCase props (`strokeWidth`, `strokeLinecap`, `fillRule`, `clipPath`, `markerEnd`, `dominantBaseline`, `textAnchor`, `vectorEffect`, `paintOrder`, `stopColor` are all present in its name map) — see [`possibleStandardNames.js`](https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/shared/possibleStandardNames.js). Consequence: JSX is a complete SVG authoring surface; no `innerHTML` string building is needed.

**Static SVG is a supported React output.** `renderToStaticMarkup` "renders a non-interactive React tree to an HTML string", and accepts `identifierPrefix` "to avoid conflicts when using multiple roots on the same page" ([React docs](https://react.dev/reference/react-dom/server/renderToStaticMarkup)). That is the export path: the same component tree → `.svg` file, in Node, with deterministic IDs.

**IDs must be stable and unique.** `<defs>` markers, gradients and `aria-labelledby` targets need unique IDs; `useId` exists for this and is explicitly "for generating unique IDs that can be passed to accessibility attributes" ([React docs](https://react.dev/reference/react/useId)). Caveats from the same page: it "cannot be used in async Server Components", and it should not be used for list keys or cache keys. For file export, prefer an explicit `idPrefix` prop (or `identifierPrefix`) over `useId`, so the same figure renders byte-identically on every run.

**Measurement is an escape hatch, not a render step.** `useLayoutEffect` "fires before the browser repaints" and "can hurt performance" ([React docs](https://react.dev/reference/react/useLayoutEffect)); it is the right tool for a one-shot measure-on-mount fallback, and the wrong tool for computing every box position. Any measurement in render makes SSR export impossible (§4.8) and makes the output nondeterministic. Container *sizing* is a separate concern and belongs to [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) on the host element — it must feed the `viewBox`/aspect ratio, never the scene's internal geometry.

**Escape hatches are legal but must be quarantined.** React documents refs as direct DOM access ("React will put a reference to this node into `myRef.current`", with cleanup returned from ref callbacks) ([React docs](https://react.dev/learn/manipulating-the-dom-with-refs)), and frames Effects as the way to "synchronize your components with some external system like a non-React widget" — while warning that if "there is no external system involved … you shouldn't need an Effect" ([React docs](https://react.dev/learn/you-might-not-need-an-effect)). This is the precise boundary for D3 (§4.4): a D3-owned subtree is an "external widget" and needs an Effect; D3-as-math needs nothing.

**Keys must be stable and data-derived.** "Keys must be unique among siblings … Keys must not change" ([React docs](https://react.dev/learn/rendering-lists)). Since the spec already carries node IDs, this is free — and it is what lets an agent *patch* a figure (change one label) without remounting the scene.

**Do not accept markup from the model.** `dangerouslySetInnerHTML` "should be used with extreme caution … it is trivial to introduce an XSS vulnerability" ([React docs](https://react.dev/reference/react-dom/components/common)). Agent output must be **data validated against a schema**, never an SVG/HTML string. Mermaid's `securityLevel` exists for the same reason in the DSL world ([Mermaid usage](https://mermaid.js.org/config/usage.html)).

**React 19 specifics.** `ref` is now a regular prop for function components and `forwardRef` will be deprecated ([React 19 release notes](https://react.dev/blog/2024/12/05/react-19)); document-metadata hoisting (`<title>`, `<meta>`, `<link>`) is new. ⚠️ Because `<title>` is *also* an SVG element, verify in Spike 5 that an SVG `<title>` used for the accessible name is **not** hoisted into `<head>`; until verified, prefer `aria-labelledby` pointing at an explicit `<title id>` and assert the rendered markup in a test.

### 4.4 D3's role: math yes, DOM ownership no

D3's data join is an imperative enter/update/exit algorithm over DOM nodes: `selection.data` "bind[s] the specified array of data with the selected elements … [and] defines the enter and exit selections", which are then materialized with `append`/`remove` ([d3-selection joining docs](https://github.com/d3/d3/blob/main/docs/d3-selection/joining.md)). Handing a subtree to D3 means two systems mutate the same DOM, with React re-rendering from stale assumptions. That is the failure mode visx names directly: "Mixing two mental models for updating the DOM is never a good time. Copy and pasting d3 code into `useEffect()` is just that" ([visx README](https://github.com/airbnb/visx/blob/master/README.md)).

The other half of D3 is pure and does not touch the DOM at all:

- Shape generators return **path data strings** when no canvas context is set: `link({source:[100,100],target:[300,300]}) // "M100,100C200,100,200,300,300,300"` ([d3-shape link docs](https://github.com/d3/d3/blob/main/docs/d3-shape/link.md)). A string is a perfectly good React prop: `<path d={d3.linkVertical()(edge)} />`.
- Scales, forces, hierarchies and interpolators are numeric libraries ([d3-force](https://github.com/d3/d3/blob/main/docs/d3-force.md)).

visx is the existence proof of the split — "under the hood, visx is using d3 for the calculations and math" ([README](https://github.com/airbnb/visx/blob/master/README.md)) — and its component granularity ("use only the packages you need") is the model to copy.

**Cost of admitting D3 math is negligible.** Measured locally: `d3-shape` with `linkVertical`, `linkHorizontal`, `line`, `curveBumpX` bundles to **4.2 kB gzip** (§9). `d3-selection` (84 kB unpacked) is not needed at all.

**Recommendation:** allow `d3-shape` (and `d3-scale` if axes ever appear) as *pure functions*; forbid `d3-selection`, `d3-transition`, and any `select/append/attr` usage in library code, enforced by an ESLint `no-restricted-imports` rule.

### 4.5 Automatic layout: ELK, dagre, d3-force, d3-hierarchy

All four are *node position* engines; none renders. The relevant differences for this corpus:

| Engine | Compound/nested containers | Cross-hierarchy edges | Orthogonal edge routing | Ports (attachment points) | API model | Measured gzip | License |
|---|---|---|---|---|---|---|---|
| **ELK layered** | Yes — "full layout of compound graphs with cross-hierarchy edges is supported" ([ELK layered](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html)) | Yes | Yes (`EdgeRouting.ORTHOGONAL` default) | Yes ("arbitrary port constraints are respected") | Async — `elkjs.layout()` returns a Promise; React Flow notes it "runs asynchronously" ([RF layouting](https://reactflow.dev/learn/layouting/layouting)) | **450.7 kB** (bundled) / 2.1 kB (api only) | EPL-2.0 ([LICENSE](https://github.com/kieler/elkjs/blob/master/LICENSE.md)) |
| **dagre** | Partial — sub-flow layout has an open bug when a sub-flow node connects outside ([RF layouting](https://reactflow.dev/learn/layouting/layouting)) | Limited | No | No | Yes | **17.0 kB** | MIT |
| **d3-force** | No | n/a | No | No | Iterative (ticks) | not measured | ISC |
| **d3-hierarchy** | No (single root tree) | n/a | No | No | Sync | not measured | ISC |

Two facts decide how these can be used:

1. **They need geometry up front.** dagre "requires only very basic information to lay out graphs, such as the dimensions of nodes" ([dagre wiki](https://github.com/dagrejs/dagre/wiki)) — i.e. you must already know how big every box is, which means you must already have solved text layout (§4.2). ELK is the same contract (it computes positions for elements with declared sizes; "elkjs is not a diagramming framework itself — it computes positions", [elkjs README](https://github.com/kieler/elkjs)).
2. **They optimize an aesthetic, not your figure.** dagre's stated priority is "Speed … potentially at the cost of not being able to adopt more optimal or exact algorithms" ([wiki](https://github.com/dagrejs/dagre/wiki)). ELK optimizes crossings/layers. Neither knows that a residual edge should hug the container's right edge or that a callout must not cross the diagram.

**Recommendation:** default to authored/template geometry; expose layout as a port. ELK is the only credible "graph mode" because it is the only one whose documented feature set (compound graphs, cross-hierarchy edges, orthogonal routing, ports) matches nested blocks with residual edges. dagre is the cheap fallback for strict trees. d3-force is for exploration, never for shipped figures.

The ecosystem's own guidance agrees that layout is not included: React Flow states plainly "We have not implemented our own layouting solution yet" and points users at dagre/ELK/d3-force ([layouting guide](https://reactflow.dev/learn/layouting/layouting)).

### 4.6 React Flow: excellent for editors, wrong for this figure class

React Flow's model: nodes are React components rendered into HTML containers, handles are "just `div` elements", edges are "an SVG path" ([terms & definitions](https://reactflow.dev/learn/concepts/terms-and-definitions)), and custom nodes are arbitrary components ([custom nodes](https://reactflow.dev/learn/customization/custom-nodes)).

What it gives you: viewport/zoom/pan, selection, dragging, connection handles, keyboard focus cycling (`nodesFocusable`), `onlyRenderVisibleElements` virtualization, and configurable ARIA strings ([ReactFlow API reference](https://reactflow.dev/api-reference/react-flow)).

What it costs here:

| Need | React Flow reality |
|---|---|
| Nested containers, insets, braces, callouts | Not in the model. Nodes are flat boxes; nesting/inset panels are custom HTML inside a node, or a second overlapping flow. |
| Deterministic geometry | Nodes are measured in the browser; positions come from an external layout engine. |
| SSR / static export | Supported since v12, **but** you must supply `width`/`height` (or `initialWidth`/`initialHeight`) and explicit `handles` positions, because "we can't measure the dimensions on the server" ([SSR guide](https://reactflow.dev/learn/advanced-use/ssr-ssg-configuration)). |
| Vector export | Not native. The official "Download Image" example uses `html-to-image` and pins it to `1.11.11` because later versions regressed ([example](https://reactflow.dev/examples/misc/download-image)). HTML nodes ⇒ rasterization via `foreignObject`, not SVG. |
| Layout | External (§4.5). |
| Perf tuning | Requires memoized node types, `useCallback`, and avoiding `nodes` reads in components ([performance guide](https://reactflow.dev/learn/advanced-use/performance)) — i.e. the library's state churn becomes your problem. |
| Bundle | 86.4 kB gzip for `ReactFlow + Background + useNodesState` (react external), pulling `zustand`, `classcat`, `@xyflow/system`, `react-compiler-runtime` ([registry](https://www.npmjs.com/package/@xyflow/react)) |

**Verdict:** React Flow solves "user drags boxes and wires them". This library solves "agent emits a spec, we draw a publication figure". Those are different products. Keep React Flow out of the core; if an editor is ever built, it should edit the same spec and reuse the same components (its MIT license makes that unproblematic, [repo](https://github.com/xyflow/xyflow)).

### 4.7 Mermaid / diagram-as-code: best authoring ergonomics, worst fidelity control

Mermaid is "a JavaScript based diagramming and charting tool that renders Markdown-inspired text definitions" ([intro](https://mermaid.js.org/intro/)), which is genuinely the most natural output format for an LLM. The limits are structural:

- **Layout is algorithmic and not author-controlled.** Flowcharts expose `direction` and a `layout` setting; Mermaid 12 ships `dagre` and `elk` (ELK as a package you register), and the two reference pages currently disagree on which is the flowchart default — the theming page lists `dagre` as the global default, the flowchart page says ELK ([theming](https://mermaid.js.org/config/theming.html), [flowchart syntax](https://mermaid.js.org/syntax/flowchart.html)). Either way there is no way to say "put the MoE panel at (900, 300)".
- **Styling is theme-variable-level.** Themes are enumerated (`default`, `neutral`, `dark`, `forest`, `base`, …) and only `base` is modifiable ([theming](https://mermaid.js.org/config/theming.html)). Per-node colours exist as classes, but not the layered fills/dashes/badges in the corpus.
- **No insets, braces, ⊕ junctions, or dot-leader callouts** as first-class constructs; they would be approximated with subgraphs and edge labels.
- **It is a big dependency:** 1.53 MB gzip for the default export bundle, 123.6 MB unpacked, with `d3`, `cytoscape`, `katex`, `dompurify`, `elkjs`, `dagre-d3-es` among its dependencies ([registry](https://www.npmjs.com/package/mermaid)).
- **It is a security-sensitive parser** with a `securityLevel` knob ([usage](https://mermaid.js.org/config/usage.html)).
- **Export exists** via `mmdc`, producing SVG/PNG/PDF ([mermaid-cli](https://github.com/mermaid-js/mermaid-cli)) — but the SVG it produces is its own layout, themed by its variables.

The other mature diagram-as-code option, **Graphviz/DOT**, trades the same fidelity for a better layout engine. DOT is a graph grammar with nodes, edges, subgraphs and clusters, plus compass `port`s on node borders ([DOT language](https://graphviz.org/doc/info/lang.html)); `@viz-js/viz` compiles Graphviz to WebAssembly and returns SVG strings ([repo](https://github.com/mdaines/viz-js), MIT). It gives stronger rank/cluster layout than Mermaid and native SVG output, but equally no absolute placement, no rich inline text, and only attribute-level theming. It is a fine *backend* for a graph-mode figure and a poor primary model for designed infographics.

**Verdict:** Mermaid (and DOT) is the right answer for "agent writes docs with diagrams nobody designed". It is the wrong answer for "reproduce this designed figure", which is the stated objective. It is, however, a legitimate *secondary output adapter* later ("also emit a Mermaid approximation for README embedding") — behind the same spec.

### 4.8 Export: SVG is free, PNG is a rasterization step, fonts are the trap

**SVG.** `renderToStaticMarkup(<Figure spec={spec} />)` → HTML string containing `<svg>…</svg>` → write `.svg` ([React docs](https://react.dev/reference/react-dom/server/renderToStaticMarkup)). Two prerequisites: (a) all geometry computed without DOM measurement; (b) a stable ID prefix for `<defs>`/markers (see §4.3). Add `xmlns="http://www.w3.org/2000/svg"` and a `viewBox` ([MDN viewBox](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox)).

**PNG, browser path:** serialize → `Blob` → object URL → `Image` → `ctx.drawImage` ([MDN drawImage](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)) → `canvas.toBlob` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)). Serialization itself is `XMLSerializer` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/XMLSerializer)).

**The trap:** when SVG is used as an image, "external resources (e.g., images, stylesheets) cannot be loaded, though they can be used if inlined through `data:` URLs", and JavaScript is disabled ([MDN SVG as an image](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image)). Web fonts are external resources. Therefore: **the exported SVG must be self-contained** — system font stack, or fonts embedded as `data:` URLs / outlined as paths. This is a design constraint, not a post-processing detail, and it must be decided before choosing a type system.

**PNG, CI path:** `resvg` renders static SVG to PNG, is "guaranteed to work everywhere where you can compile the Rust itself", and claims reproducible output ("if you render an SVG file on x86 Windows and then render it on ARM macOS — the produced image will be identical") ([resvg](https://github.com/linebender/resvg)). Its limits: static SVG subset only, no scripting/animation, and no native text rendering (it embeds fonts) ([resvg](https://github.com/linebender/resvg)). Node bindings exist (`@resvg/resvg-js`, MPL-2.0, [registry](https://www.npmjs.com/package/@resvg/resvg-js)).

**Implication for architecture:** export must be a pure function of the spec + theme. Any component that measures the DOM silently breaks the Node path, so it must be impossible by construction (types/functions receive geometry, not refs).

### 4.9 Accessibility: the spec must produce semantics, not just pixels

- "In SVG documents, most SVG elements do not provide semantic information of value to assistive technologies… only has meaning to assistive technologies if the author provides alternative text, descriptions, or WAI-ARIA semantics" ([SVG-AAM](https://www.w3.org/TR/SVG-AAM-1.0/)). So a11y is *authored*, and the component library is where it gets authored.
- The Graphics ARIA module defines `graphics-document` ("a type of `document` in which the visual appearance or layout of content conveys meaning") and `graphics-object` ("a distinct object or sub-component with semantic meaning") ([W3C](https://www.w3.org/TR/graphics-aria-1.0/)). A figure = `graphics-document`; its blocks (backbone, FFN inset, MoE panel) = `graphics-object` with `aria-labelledby` pointing at visible titles.
- `<title>` supplies the accessible name and `<desc>` the description, both via SVG-AAM's name/description computation ([SVG-AAM](https://www.w3.org/TR/SVG-AAM-1.0/); [MDN `<title>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/title)).
- WCAG 2.2 requires text alternatives for non-text content (SC 1.1.1) and prefers real text over images of text (SC 1.4.5: "If the technologies being used can achieve the visual presentation, text is used to convey information rather than images of text") ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)). This is the strongest argument against a canvas-first or "export a PNG" pipeline: it converts every label into an image of text.

**Design consequence:** the spec carries `title`, `description`, and per-node labels as *data*; the renderer emits `<title>/<desc>` and `aria-labelledby`; a11y assertions run in the DOM test suite, not in a screenshot diff.

### 4.10 Testing and visual regression

- **jsdom cannot help with geometry.** jsdom explicitly does not do layout or rendering: "Layout: the ability to calculate where elements will be visually laid out as a result of CSS, which impacts methods like `getBoundingClientRects()`" is unimplemented, and layout-related properties return zeros ([jsdom README](https://github.com/jsdom/jsdom)). Any unit test that relies on `getBBox`/`getComputedTextLength` will fail or be meaningless.
- **Browser mode is the right unit-test environment for rendering.** Vitest's browser mode "allows you to run your tests in the browser natively, providing access to browser globals like window and document", using Playwright/WebDriver providers (CDP) rather than simulated events ([Vitest](https://vitest.dev/guide/browser/)).
- **Screenshot diffs must be environment-pinned.** Playwright warns: "Browser rendering can vary based on the host OS, version, settings, hardware, power source (battery vs. power adapter), headless mode… For consistent screenshots, run tests in the same environment where the baseline screenshots were generated" ([Playwright](https://playwright.dev/docs/test-snapshots)).
- **A geometry snapshot is more valuable than a pixel diff** for this library: assert the computed scene (node boxes, waypoints, text line breaks) as JSON. Pixels then catch only paint regressions. SVG's determinism makes this possible; a canvas renderer would leave only pixels.
- **A component workshop is optional, not architectural.** Storybook-style isolation is useful for reviewing primitives and wiring visual tests ([Storybook visual testing](https://storybook.js.org/docs/writing-tests/visual-testing)), but the same coverage is obtainable from Vitest browser mode + Playwright; do not put a workshop in the critical path of the build.
- **For CI raster goldens, `resvg` beats a browser** because it is platform-reproducible by design ([resvg](https://github.com/linebender/resvg)).

### 4.11 Bundle, dependency and maintenance risk (measured)

Method: `esbuild 0.28.2 --bundle --minify --format=esm`, `react`/`react-dom` external, `gzip -9`, on 2026-11-27, in a scratch directory. These are *library-level* numbers (one representative entry each), not app-level deltas — re-measure with the app's real imports **[benchmark]**.

| Entry | minified ESM | gzip -9 | Unpacked install | License | Transitive deps of note |
|---|---|---|---|---|---|
| `@xyflow/react` (`ReactFlow`, `Background`, `useNodesState`) | 248.9 kB | **86.4 kB** | 1.32 MB | MIT | `zustand`, `classcat`, `@xyflow/system`, `react-compiler-runtime` |
| `elkjs` (`elk.bundled.js`) | 1496.5 kB | **450.7 kB** | 8.25 MB | **EPL-2.0** | none (GWT-compiled Java) |
| `elkjs` (`elk-api.js` only) | 5.3 kB | **2.1 kB** | — | EPL-2.0 | worker loaded separately |
| `@dagrejs/dagre` (default) | 48.7 kB | **17.0 kB** | 1.43 MB | MIT | `@dagrejs/graphlib` |
| `d3-shape` (4 exports) | 19.9 kB | **4.2 kB** | 178 kB | ISC | `d3-path` |
| `mermaid` (default export) | 5382.1 kB | **1526.4 kB** | 123.6 MB | MIT | `d3`, `elkjs`, `cytoscape`, `katex`, `dompurify`, … |

Non-size risks worth recording:

- **ELK's license is EPL-2.0** ([LICENSE](https://github.com/kieler/elkjs/blob/master/LICENSE.md); npm metadata says `EPL-2.0 OR GPL-3.0-or-later`). EPL is a weak-copyleft license: modifications to EPL code carry source-availability obligations and the license includes patent/termination terms. Keeping it an *optional peer* — never bundling or modifying it — avoids most of that surface, but get legal review before shipping it in the default install.
- **ELK is a GWT port**; its own README lists recurring issues around module formats, web workers, and bundler integration (`g is not defined`, `Can't resolve web-worker`) ([elkjs README](https://github.com/kieler/elkjs)). Pin the version and test the bundler path.
- **`dagre` (unscoped) is stale** — last publish 2022-06 ([registry](https://www.npmjs.com/package/dagre)) — while `@dagrejs/dagre` is active. Use the scoped package.
- **Mermaid pulls a large, security-sensitive parser stack** ([registry](https://www.npmjs.com/package/mermaid)); if it is ever offered, it must be a dynamically imported optional adapter.

### 4.12 Risks specific to agent-generated specs

Schema conformance is not correctness. OpenAI's own documentation is explicit: structured outputs constrain "completed, non-refusal model output to your supplied JSON Schema. Your application still needs to handle refusals, incomplete responses, and API errors, and validate any business rules that the schema does not express" ([OpenAI structured outputs](https://platform.openai.com/docs/guides/structured-outputs)). Anthropic's tool use passes an `input_schema` and returns a `tool_use` block the host must act on ([Anthropic](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview)) — same division of responsibility.

| Failure mode | Why it happens | Detection | Mitigation |
|---|---|---|---|
| Plausible but wrong coordinates | LLMs predict tokens, not geometry | Overlap/out-of-bounds/edge-crosses-node checks on the computed scene | Templates with slots; layout functions; only allow explicit coords in an escape-hatch field |
| Text overflow | SVG `<text>` never wraps ([MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text)) | Measured line widths vs box width at build time | Deterministic text metrics + `maxWidth` + explicit ellipsis/`<tspan>` breaking |
| Dangling references | Edges to node IDs that were renamed/dropped | Referential-integrity validation before layout | Typed IDs, two-pass validation, actionable errors ("edge e3 → unknown node `moe_2`") |
| ID collisions in `<defs>` | Multiple figures on a page | Duplicate-ID check on rendered markup | `idPrefix`/`identifierPrefix`; `useId` where SSR isn't needed |
| Hallucinated facts ("1T params", "384 experts") | The model is writing prose, not reading a spec sheet | Not detectable by the library | Separate `provenance` field per numeric label; require a source string; surface unverified labels in review |
| Runaway size | "Draw 100 experts" | Caps in the schema (`maxItems`) and in validation | Hard limits + a documented "use `…` elision" primitive (the corpus already does this) |
| Nondeterministic re-renders | Auto-layout version drift, async layout, measurement | Byte-diff two renders of the same spec | Pure layout, pinned layout engine version, scene snapshots in CI |
| Markup injection | Model returns SVG/HTML instead of data | Reject non-conforming specs at the boundary | Never `dangerouslySetInnerHTML` ([React docs](https://react.dev/reference/react-dom/components/common)); `securityLevel`-style trust boundary if a DSL is ever added ([Mermaid](https://mermaid.js.org/config/usage.html)) |

---

## 5. Option comparison

Scores: 1 (poor) – 5 (excellent), weighted per §3. "B" is A plus D3 math; they are kept separate because the dependency decision is separable. "F" (Graphviz/DOT via WASM) is included because the brief asks for diagram-as-code alternatives beyond Mermaid; its bundle cost is not measured here.

| Criterion (weight) | A. React + SVG | B. A + D3 math | C. React Flow | D. Canvas / PixiJS | E. Mermaid | F. Graphviz/DOT |
|---|---|---|---|---|---|---|
| C1 Fidelity to figure grammar (20) | **5** — absolute placement, any glyph, nested `<g>`, dashes, leaders | **5** — same | 2 — flat HTML nodes; insets/callouts/braces must be hacked | 3.5 — can draw anything, but text/typography must be re-implemented | 2 — theme/shape constrained, no absolute layout | 2 — clusters only, no absolute placement |
| C2 Determinism (15) | **5** — spec → scene → markup | **5** | 2 — measured nodes + external async layout | 4 — deterministic if code is, but DPR/font-dependent raster | 2.5 — layout engine + text metrics vary | 3 — deterministic per Graphviz build, text metrics still matter |
| C3 Agent authorability (15) | 4 — small typed spec; coordinates are the sharp edge | 4 | 3 — graph JSON is natural, layout is not controllable | 2 — imperative draw calls are a bad target | **5** — text DSL is the most natural LLM output | 4.5 — DOT is compact and widely represented |
| C4 Vector export (12) | **5** — the render *is* SVG | **5** | 1 — official path is `html-to-image` raster ([example](https://reactflow.dev/examples/misc/download-image)) | 1 — needs a second renderer | 4 — `mmdc` emits SVG ([CLI](https://github.com/mermaid-js/mermaid-cli)) | 4 — DOT→SVG natively ([viz-js](https://github.com/mdaines/viz-js)) |
| C5 Accessibility (10) | **5** — DOM + `<title>/<desc>` + `graphics-*` roles | **5** | 3 — good keyboard nav for editors, weak static semantics | 1 — "not exposed to accessibility tools like semantic HTML is" ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)) | 2.5 — generated markup, limited per-node control | 2 — generated markup, limited control |
| C6 Themeability (8) | **5** — CSS vars, `currentColor`, media queries | **5** | 3 — CSS vars in their stylesheet; HTML nodes | 2 — theme = code | 2 — theme variables only ([docs](https://mermaid.js.org/config/theming.html)) | 2 — attribute-level styling |
| C7 Performance/scale (8) | 4 — fine at 10³ elements **[benchmark]** | 4 | 3 — virtualization helps, re-render churn hurts ([perf guide](https://reactflow.dev/learn/advanced-use/performance)) | **5** — 10⁴+ marks | 2.5 | 3 |
| C8 Dependency/bundle risk (7) | **5** — React only | 4.5 — +4.2 kB gzip (ISC) | 3 — 86.4 kB gzip + zustand et al. | 2 — 80.4 MB unpacked, WebGL/WebGPU | 2 — 1.53 MB gzip, parser stack | 3 — WASM payload **[benchmark]** |
| C9 Testability (5) | **5** — scene JSON + DOM + SVG snapshots | **5** | 2.5 — nondeterministic geometry | 3 — screenshot-only | 3 | 3 |
| **Weighted score** | **4.77** | **4.74** | **2.38** | **2.67** | **2.90** | **2.96** |

Reading the matrix:

- **A and B are effectively tied.** That is the point: D3 math is a 4.2 kB optional convenience, not an architecture. Admit it only where it removes real code (link/curve generators, scales); hand-roll the rest.
- **C is last**, and the gap is structural, not cosmetic: HTML nodes + external layout + raster export are three separate mismatches with the stated objective. It also loses to both diagram-as-code options, which at least emit vector output from a declarative spec.
- **D fails on the objective itself**: a canvas figure cannot be an SVG, and its text is not text. It only wins on raw scale.
- **E and F are the strongest alternatives and are within 0.1 of each other.** Their entire advantage is authoring ergonomics (C3) plus native vector output (C4); they lose ~3 points on fidelity, determinism, theming and a11y. If the product pivots to "diagrams nobody designed, embedded in docs", E or F becomes the right primary — not because SVG lost, but because the job changed. Until then they are ~38% below the recommended path on the weighted score.

---

## 6. Risks and tradeoffs of the recommendation

| Risk | Severity | Mitigation | Residual |
|---|---|---|---|
| **Text layout is now our job** (no reflow, no auto-wrap) | High | Deterministic text metrics module (precomputed advances per font/weight/size) + explicit `<tspan>` line breaking; `textLength`/`lengthAdjust` as a last resort ([MDN `<text>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text)); never measure during render | Font substitution changes metrics; export may differ ±1 px |
| **Authoring burden**: every figure needs coordinates | Medium | Template components (`Backbone`, `RepeatBlock`, `Residual`, `DetailPanel`, `Callout`) so specs are declarative, not coordinate soup; layout functions for stacks | Novel topologies still need human layout |
| **Export fidelity** (fonts, CSS) | Medium | Self-contained SVG: system fonts or embedded `data:` fonts ([MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image)); inline all styles; validate with `resvg` in CI | External images must be inlined |
| **DOM weight at scale** | Medium | Cap primitives per figure; `<use>` for repeats ([MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use)); optional canvas renderer behind the IR | 10⁴-element figures need the swap **[benchmark]** |
| **Layout engine lock-in** (if ELK is adopted) | Medium | Layout port + scene IR; ELK as optional peer; snapshot layouts per version | ELK output changes between versions |
| **ELK license** (EPL-2.0) | Medium | Optional peer, never bundled/vendored; legal review before shipping it in the default install | Downstream users must accept EPL terms if they opt in |
| **React 19 `<title>` hoisting inside `<svg>`** | Low–Medium | Verify in Spike 5; use `aria-labelledby` + explicit IDs; assert rendered markup | If hoisted, a small wrapper is needed |
| **SVG is not "free" for animation** | Low | Not a goal; if needed, CSS transitions on transform/opacity respect `prefers-reduced-motion` | — |
| **The template assumption is wrong** (figures are more diverse than sampled) | Medium | Full-corpus classification in Spike 1 before freezing primitives; keep an `escape hatch` node type | Some figures need bespoke components |

**The trade we are consciously making:** we give up "layout is automatic" and "interaction is free" in exchange for exact fidelity, deterministic output, real text, vector export, and a spec an agent can be validated against. Given the objective — *recreate these designed figures* — that is the correct trade.

---

## 7. Recommended architecture

### 7.1 Pipeline

```
FigureSpec (JSON, versioned, zod/JSON-Schema validated)
    │  normalize: ids, refs, caps, semantic checks (overlap, dangling edges, text fit)
    ▼
LayoutEngine (port)                 ← swappable: template | manual | elk | dagre
    │  pure: (spec, theme, metrics) → Scene      no DOM, no async in the default path
    ▼
Scene (positioned IR: absolute boxes, waypoints, text lines, marker refs)
    │  serializable, snapshot-tested, the real public contract
    ▼
Renderer (React + SVG)              ← swappable in principle: svg | canvas
    │  components only read the Scene; they never measure, never compute layout
    ▼
<svg> in the app  ·  renderToStaticMarkup → .svg  ·  resvg/canvas → .png
```

### 7.2 Module seams

| Module | Owns | Must not |
|---|---|---|
| `spec/` | types, JSON Schema, migrations, semantic validators, caps | know about SVG |
| `layout/` | `LayoutEngine` interface; `template` (default), `manual`, `elk` (opt-in), `dagre` (opt-in) | touch the DOM; be async in the default engine |
| `geometry/` | anchors, side selection, orthogonal routing, residual junctions (⊕), braces, dot leaders, text line-breaking | import React |
| `scene/` | the positioned IR + its schema/version | contain JSX or DOM refs |
| `render/svg/` | React components; `idPrefix`; `<title>/<desc>`; marker `<defs>` | measure, fetch, or read global state |
| `theme/` | tokens → CSS custom properties + attribute fallbacks; light/dark/print | hard-code colours in components |
| `export/` | `toSvgString`, `toPng` (browser), `toPngNode` (resvg), `toReactComponent` | contain layout logic |
| `test/` | scene snapshots, DOM/a11y assertions, pixel goldens | rely on jsdom for geometry |

### 7.3 Type sketch (the contract, not an implementation)

```ts
type Id = string;

interface FigureSpec {
  schemaVersion: 1;
  title: string;
  description?: string;          // → <desc>
  canvas: { width: number; height: number };
  theme: ThemeRef;               // accent, surface, ink, muted, font stack
  nodes: NodeSpec[];             // boxes, pills, ⊕, braces, badges, text blocks
  edges: EdgeSpec[];             // flow | residual | leader | zoom
  groups: GroupSpec[];           // nested containers (backbone, repeat block, insets)
  layout: LayoutSpec;            // { mode: 'template' | 'manual' | 'elk' | 'dagre' }
}

type EdgeKind = 'flow' | 'residual' | 'leader' | 'zoom';
interface EdgeSpec {
  id: Id; kind: EdgeKind;
  from: Anchor; to: Anchor;      // node id + side, or absolute point
  waypoints?: Point[];           // required for 'residual' unless routed by layout
  arrow?: 'none' | 'end' | 'both';
  junction?: 'plus' | 'none';    // ⊕ at the merge point
}

interface LayoutEngine {
  readonly id: string;
  layout(spec: FigureSpec, ctx: LayoutContext): Scene;   // sync by contract
}
interface LayoutContext { theme: Theme; metrics: TextMetrics; }  // deterministic inputs

interface Scene { schemaVersion: 1; width: number; height: number;
                  shapes: SceneShape[]; edges: SceneEdge[]; text: SceneText[]; }
```

Two rules make the whole thing work: **`layout` is synchronous and pure**, and **`Scene` is serializable**. Everything else (exports, snapshots, canvas fallback, editor) hangs off those two properties. The `EdgeKind` discriminant is deliberate: it lets kind-specific fields (`waypoints`, `junction`) be required for the kinds that need them and rejected for the ones that don't ([TS discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)), which is what the runtime schema must enforce too.

### 7.4 MVP dependencies

| Dependency | Role | Justification |
|---|---|---|
| `react`, `react-dom` (peer, ≥19) | renderer | `ref` as prop, `identifierPrefix`, metadata fixes ([React 19](https://react.dev/blog/2024/12/05/react-19)) |
| `zod` **or** `ajv` + JSON Schema | spec validation | one source of truth for types *and* the agent-facing schema ([JSON Schema](https://json-schema.org/understanding-json-schema/structuring), [Zod](https://zod.dev/)); do not hand-maintain both |
| `d3-shape` (optional, 4.2 kB) | link/curve/path math | pure string generators ([docs](https://github.com/d3/d3/blob/main/docs/d3-shape/link.md)) |
| `@dagrejs/dagre` (optional peer, 17 kB) | simple tree layout | cheap, sync, MIT |
| `elkjs` (optional peer, 450.7 kB, EPL-2.0) | compound/graph layout | only engine matching nested blocks + orthogonal + ports ([ELK](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html)) |
| `vitest` + browser mode, `@playwright/test` | unit/visual tests | real browser, CDP events ([Vitest](https://vitest.dev/guide/browser/), [Playwright](https://playwright.dev/docs/test-snapshots)) |
| `@resvg/resvg-js` (dev/CI) | deterministic PNG goldens | platform-reproducible ([resvg](https://github.com/linebender/resvg)) |

Deliberately **not** in the MVP: React Flow, Mermaid, PixiJS, `d3-selection`, any CSS-in-JS runtime, any icon set (draw the handful of glyphs as paths).

### 7.5 What stays swappable

| Seam | Swap to | Cost of swapping |
|---|---|---|
| `LayoutEngine` | manual ↔ template ↔ ELK ↔ dagre ↔ future constraint solver | low — it returns `Scene` |
| Renderer backend | SVG ↔ Canvas (for >10⁴ primitives) | medium — must reimplement hit-testing/a11y; IR unchanged |
| Theme | token objects + CSS vars | trivial |
| Rasterizer | browser canvas ↔ resvg ↔ headless Chrome | low |
| Output adapter | native SVG ↔ Mermaid approximation ↔ PNG | low (new module) |
| Spec version | `schemaVersion` + migrations | medium — must be planned now |

**Not swappable:** the `Scene` IR. It is the contract every other seam depends on; version it from day one and snapshot it in tests.

### 7.6 Non-goals

Interactive editing/dragging; arbitrary graph auto-layout as the default; 10k-node diagrams; animation engine; HTML-in-SVG nodes; accepting raw SVG/HTML from a model.

---

## 8. Validation plan

Five timeboxed spikes, each with an artifact and a pass criterion. Run them before writing library code, in this order.

**Spike 1 — Corpus classification (1 day).**
Inventory all 132 figures: which primitives appear, how many distinct templates, which variants (norm placement, MoE vs dense, extra side labels). Artifact: `docs/research/corpus-inventory.md` + a primitive checklist.
*Pass:* ≥80% of figures expressible with ≤12 primitives + ≤5 composite templates. *If it fails:* expand the primitive set before freezing the API.

**Spike 2 — Three figures by hand in JSX (2 days).**
`deepseek-v3`, `gemma-3-27b`, `gpt-oss-120b` as static React+SVG components with no library abstractions, at the sampled aspect ratios. Artifact: three `.svg` files + side-by-side renders.
*Pass:* a reviewer cannot tell which is the original at 50% zoom without reading the title; all text is real text; every figure exports to a valid standalone `.svg`.
*Kill criterion:* if hand-authoring three figures takes >2 days, the primitive set is wrong, not the rendering model.

**Spike 3 — Layout engine bake-off (2 days).**
Re-lay the MoE detail panel (router + 8 experts + ellipsis) and the backbone column with (a) template math, (b) dagre, (c) ELK layered with compound nodes and orthogonal routing. Record: wall time at 10/50/200 nodes, edge crossings, whether residual edges hug containers, bundle delta.
*Pass:* template wins on fidelity and latency; ELK is within 2× dagre latency at 50 nodes and beats dagre on crossings for the nested case. Otherwise ELK stays out and graph mode ships dagre-only.
**[benchmark]** — ELK latency numbers must be measured locally; no credible first-party benchmark exists.

**Spike 4 — Export determinism (1 day).**
Render each figure twice via `renderToStaticMarkup` with a fixed `idPrefix`; byte-compare. Rasterize via `resvg` on macOS and Linux CI; pixel-compare. Then rasterize via browser canvas and compare against `resvg`.
*Pass:* SVG byte-identical across runs and platforms; `resvg` PNGs identical across platforms; browser-vs-resvg diff ≤0.5% pixels (antialiasing only).
**[benchmark]** — cross-engine text rasterization differences are expected; quantify them.

**Spike 5 — Text metrics + a11y (2 days).**
For 40 representative labels (mixed weight/colour spans, 12–20 px): compare a precomputed metrics table against `getComputedTextLength` in Chromium/WebKit/Firefox. Then assert accessible names/descriptions from the accessibility tree (CDP `Accessibility.getFullAXTree`, or Playwright's accessibility snapshot), and confirm whether an SVG `<title>` is hoisted by React 19.
*Pass:* width error <1% at all sizes for the chosen font stack; every figure exposes a name + description; no `<title>` leakage into `<head>`.
**[benchmark]** — metric accuracy is font- and engine-specific; test the actual stack.

**Then, and only then:** freeze `Scene` v1, implement `spec → layout(template) → render/svg`, and add ELK/dagre behind flags.

**Benchmarks to run before publishing (not blocking the decision):**
1. App-level gzip delta of the library (size-limit), not entry-level.
2. First-render time at 500 / 2 000 / 5 000 / 10 000 SVG primitives in one `<svg>`; find the cliff and set a documented cap.
3. Zoom/pan smoothness with a CSS transform on the `<svg>` root vs re-rendering (the corpus is static; this should be trivially fast, but prove it).
4. `resvg` vs browser raster time for a 3000×2800 figure at 2×.
5. `@viz-js/viz` WASM payload and cold-start, if Graphviz is ever considered as a graph-mode backend.

---

## 9. Measured data and method

All measurements taken 2026-11-27 on the author's machine (macOS, Apple silicon), in `/tmp`, with no changes to this repository.

**Corpus.** `pi-fff find` inventory of `images/` → 132. Dimensions via `sips -g pixelWidth -g pixelHeight`; aspect ratios computed per file; median 1.024, min 0.855, max 1.462; most common exact sizes 2927×2744 (×5), 2861×2723 (×3), 2807×2721 (×3).

**Bundles.** Scratch project with `esbuild 0.28.2`; per library a one-line entry importing the public API; flags `--bundle --minify --format=esm --external:react --external:react-dom`; size measured as `wc -c` and `gzip -9 -c | wc -c`. Installed versions: react/react-dom 19.3.1, @xyflow/react 13.0.3, elkjs 0.12.2, @dagrejs/dagre 3.1.4, d3-shape 3.2.1, mermaid 12.3.0.

| Entry | gzip |
|---|---|
| React Flow (`ReactFlow`+`Background`+`useNodesState`) | 86 354 B |
| elkjs bundled | 450 746 B |
| elkjs api only | 2 140 B |
| @dagrejs/dagre | 17 020 B |
| d3-shape (4 exports) | 4 234 B |
| mermaid (default) | 1 526 382 B |

**Registry metadata.** `npm view <pkg> version license dist.unpackedSize dependencies` — used for versions, licenses and unpacked install sizes (§4.11).

**Limitations of this evidence.** (a) Entry-level bundle sizes overstate an app's marginal cost for tree-shakeable packages and understate it for packages with side-effectful entry points; re-measure with the real import graph. (b) The template-family claim rests on 10 unique figures of 132. (c) No runtime performance measurement was performed — every perf claim above is either structural (DOM node per element) or marked **[benchmark]**.

---

## 10. Sources

**Specifications / standards**
- W3C, *SVG Accessibility API Mappings 1.0* — https://www.w3.org/TR/SVG-AAM-1.0/
- W3C, *WAI-ARIA Graphics Module* — https://www.w3.org/TR/graphics-aria-1.0/
- W3C, *Web Content Accessibility Guidelines (WCAG) 2.2* — https://www.w3.org/TR/WCAG22/
- JSON Schema, *Structuring a complex schema* — https://json-schema.org/understanding-json-schema/structuring
- JSON Schema reference — https://json-schema.org/understanding-json-schema

**MDN (web platform reference)**
- *SVG: Scalable Vector Graphics* — https://developer.mozilla.org/en-US/docs/Web/SVG
- *`<text>`* — https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text
- *`<tspan>`* — https://developer.mozilla.org/en-US/docs/Web/SVG/Element/tspan
- *`<title>`* — https://developer.mozilla.org/en-US/docs/Web/SVG/Element/title
- *`<use>`* — https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use
- *`<foreignObject>`* — https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject
- *viewBox* — https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox
- *SVG as an image* — https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image
- *Canvas API* (accessibility concerns) — https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- *`getComputedTextLength()`* — https://developer.mozilla.org/en-US/docs/Web/API/SVGTextContentElement/getComputedTextLength
- *`vector-effect`* — https://developer.mozilla.org/en-US/docs/Web/CSS/vector-effect
- *Using CSS custom properties* — https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- *`XMLSerializer`* — https://developer.mozilla.org/en-US/docs/Web/API/XMLSerializer
- *`drawImage()`* — https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
- *`toBlob()`* — https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
- *`ResizeObserver`* — https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver

**React**
- *renderToStaticMarkup* — https://react.dev/reference/react-dom/server/renderToStaticMarkup
- *useId* — https://react.dev/reference/react/useId
- *useLayoutEffect* — https://react.dev/reference/react/useLayoutEffect
- *Manipulating the DOM with Refs* — https://react.dev/learn/manipulating-the-dom-with-refs
- *You Might Not Need an Effect* — https://react.dev/learn/you-might-not-need-an-effect
- *Rendering Lists* — https://react.dev/learn/rendering-lists
- *Common components (`dangerouslySetInnerHTML`)* — https://react.dev/reference/react-dom/components/common
- *React v19* — https://react.dev/blog/2024/12/05/react-19
- React DOM SVG attribute name map — https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/shared/possibleStandardNames.js

**D3 / visx**
- *Joining data* (d3-selection) — https://github.com/d3/d3/blob/main/docs/d3-selection/joining.md
- *Selecting elements* — https://github.com/d3/d3/blob/main/docs/d3-selection/selecting.md
- *Links* (d3-shape) — https://github.com/d3/d3/blob/main/docs/d3-shape/link.md
- *d3-force* — https://github.com/d3/d3/blob/main/docs/d3-force.md
- *What is D3?* — https://d3js.org/what-is-d3
- visx README (D3-for-math rationale) — https://github.com/airbnb/visx/blob/master/README.md

**Layout engines**
- ELK Layered reference — https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html
- elkjs README — https://github.com/kieler/elkjs
- elkjs LICENSE (EPL-2.0) — https://github.com/kieler/elkjs/blob/master/LICENSE.md
- elkjs package.json — https://github.com/kieler/elkjs/blob/master/package.json
- dagre wiki — https://github.com/dagrejs/dagre/wiki
- dagre repo — https://github.com/dagrejs/dagre
- Graphviz, *DOT Language* — https://graphviz.org/doc/info/lang.html
- Viz.js (Graphviz WASM, SVG strings) — https://github.com/mdaines/viz-js
- npm: elkjs — https://www.npmjs.com/package/elkjs · dagre — https://www.npmjs.com/package/dagre · @dagrejs/dagre — https://www.npmjs.com/package/@dagrejs/dagre

**React Flow**
- *Layouting overview* — https://reactflow.dev/learn/layouting/layouting
- *Terms and definitions* — https://reactflow.dev/learn/concepts/terms-and-definitions
- *Custom nodes* — https://reactflow.dev/learn/customization/custom-nodes
- *Server side rendering* — https://reactflow.dev/learn/advanced-use/ssr-ssg-configuration
- *Performance* — https://reactflow.dev/learn/advanced-use/performance
- *The ReactFlow component* (props incl. `onlyRenderVisibleElements`, `nodesFocusable`) — https://reactflow.dev/api-reference/react-flow
- *Download Image* (html-to-image) — https://reactflow.dev/examples/misc/download-image
- Repo / license — https://github.com/xyflow/xyflow
- npm: @xyflow/react — https://www.npmjs.com/package/@xyflow/react

**Mermaid**
- *About Mermaid* — https://mermaid.js.org/intro/
- *Flowcharts syntax* — https://mermaid.js.org/syntax/flowchart.html
- *Theme configuration* — https://mermaid.js.org/config/theming.html
- *Usage / securityLevel* — https://mermaid.js.org/config/usage.html
- Repo — https://github.com/mermaid-js/mermaid
- mermaid-cli (SVG/PNG/PDF) — https://github.com/mermaid-js/mermaid-cli
- npm: mermaid — https://www.npmjs.com/package/mermaid

**Canvas / WebGL**
- PixiJS introduction — https://pixijs.com/8.x/guides/getting-started/intro
- npm: pixi.js (80.4 MB unpacked) — https://www.npmjs.com/package/pixi.js

**Export / rasterization**
- resvg README (reproducibility, static subset, no native text) — https://github.com/linebender/resvg
- npm: @resvg/resvg-js — https://www.npmjs.com/package/@resvg/resvg-js

**Testing**
- jsdom README (no layout/rendering) — https://github.com/jsdom/jsdom
- Vitest browser mode — https://vitest.dev/guide/browser/
- Playwright visual comparisons — https://playwright.dev/docs/test-snapshots
- Storybook visual testing — https://storybook.js.org/docs/writing-tests/visual-testing

**Agent / spec validation**
- OpenAI, *Structured model outputs* — https://platform.openai.com/docs/guides/structured-outputs
- Anthropic, *Tool use with Claude* — https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview
- Zod — https://zod.dev/
- TypeScript, *Narrowing* (discriminated unions) — https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
