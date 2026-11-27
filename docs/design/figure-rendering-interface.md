# Figure rendering interface: FigureSpec, Scene, LayoutEngine, renderFigure

**Status:** reviewed / accepted  
**Issue:** #3  
**Decision record:** `docs/adr/0001-figure-rendering-interface.md`  
**Audience:** coding agents authoring LLM architecture figures, and maintainers implementing the renderer.  
**Evidence:** `docs/research/corpus-inventory.md`, `docs/research/prototype-validation.md`, `docs/research/react-svg-rendering.md`.

## 1. Purpose

Define the smallest stable interface that lets an agent describe an LLM architecture figure without writing SVG, JSX, or layout code.

The interface must support the three validated prototypes while leaving room for the structures found in the 132-figure inventory. It must not expose 17 primitive categories and 9 composite-template categories as 26 public modules.

The proposed pipeline is:

```text
FigureSpec
  → validate + normalize
  → LayoutEngine (template | manual)
  → Scene (serializable, positioned)
  → renderFigure
  → SVG output + diagnostics
```

The public interface is deliberately small. Internally, the implementation may use many drawing modules.

## 2. Design decisions

| Decision | Choice | Reason |
|---|---|---|
| Authoring model | Typed, versioned data | Agents can generate and validate JSON/TypeScript data more reliably than coordinates or markup. |
| Default layout | Deterministic templates | The corpus is a family of designed infographics, not arbitrary graphs. |
| Escape hatch | Explicit manual placement | Novel structures must remain possible without forking the renderer. |
| Rendering | React + SVG | Validated by issue #2 for real text, vector export, and deterministic SSR. |
| Geometry | Computed before rendering | Browser measurement would make SSR and reproducible export impossible. |
| Public surface | `FigureSpec`, `Scene`, `LayoutEngine`, `renderFigure` | A small interface hides the drawing vocabulary. |
| Validation | Always on | Invalid references or unsafe input must fail before rendering. |
| Layout in v1 | Synchronous and pure | Same normalized input must produce the same Scene. |
| Raw markup | Not accepted | Prevents markup injection and keeps the renderer in control. |

## 3. Shared types

These are design sketches, not the final source layout.

```ts
type Id = string;

type Point = { x: number; y: number };
type Size = { width: number; height: number };
type Box = Point & Size;

type TextSpan = {
  text: string;
  emphasis?: "normal" | "bold" | "italic";
  color?: "ink" | "muted" | "accent" | "inverse";
};

type TextSpec = {
  spans: TextSpan[];
  maxWidth?: number;
  align?: "start" | "center" | "end";
};

type Theme = {
  accent: string;
  surface: string;
  ink: string;
  muted: string;
  background: string;
  fontFamily: string;
  monospaceFamily?: string;
};

type Fill =
  | { kind: "solid"; color: string }
  | { kind: "linear-gradient"; from: string; to: string; angle?: number };
```

`TextSpan` supports mixed color/weight labels such as “Multi-head latent attention” and “Vocabulary size of 129k” without accepting HTML.

## 4. FigureSpec

`FigureSpec` is the authoring contract. It describes semantic structure and layout intent, not SVG elements.

```ts
interface FigureSpec {
  schemaVersion: 1;
  id: Id;
  title: string;
  description: string;
  canvas: Size;
  theme: Theme;
  groups: GroupSpec[];
  nodes: NodeSpec[];
  edges: EdgeSpec[];
  annotations?: AnnotationSpec[];
  layout: LayoutSpec;
}
```

### 4.1 Groups

```ts
type GroupKind =
  | "model"
  | "repeat-block"
  | "inset"
  | "layer-group"
  | "tower"
  | "note";

interface GroupSpec {
  id: Id;
  kind: GroupKind;
  parent?: Id;
  title?: TextSpec;
  children: Id[];
  repeat?: { count: number; label?: string };
  style?: {
    fill?: Fill;
    stroke?: string;
    strokeStyle?: "solid" | "dashed" | "dotted";
  };
}
```

Groups express containment. A group may contain nodes and other groups. `repeat` describes visual repetition; it does not request N copies of the implementation.

### 4.2 Nodes

```ts
type NodeKind =
  | "operation"
  | "text"
  | "operator"
  | "badge"
  | "ellipsis"
  | "repeat"
  | "stack"
  | "mask"
  | "composite";

interface NodeBase {
  id: Id;
  parent?: Id;
  label?: TextSpec;
  role?: string;
  style?: {
    fill?: Fill;
    stroke?: string;
    emphasis?: boolean;
  };
}

type NodeSpec = NodeBase & (
  | { kind: "operation" | "composite"; data: OperationData }
  | { kind: "text"; data: TextSpec }
  | { kind: "operator"; data: OperatorData }
  | { kind: "badge"; data: { value: string } }
  | { kind: "ellipsis"; data: Record<string, never> }
  | { kind: "repeat"; data: { count: number; label?: string } }
  | { kind: "stack"; data: { count: number; child: Id } }
  | { kind: "mask"; data: MaskData }
);

type OperationData =
  | { family: "gqa"; heads: number; kvHeads: number; ratio?: string }
  | { family: "mla"; heads: number; kvRank?: number }
  | { family: "moe"; experts: number; activeExperts: number; sharedExperts?: number }
  | { family: "ffn"; hidden: number; activation: string }
  | { family: "qsa"; heads: number; kvHeads: number; blockSize?: number }
  | { family: "gated-delta-net"; qkHeads: number; vHeads: number }
  | { family: "gated-residual"; streams: number; operation: "read" | "write" };

type OperatorData = { operator: "plus" | "multiply" | "sigmoid" | "exp" };
type MaskData = { rows: string[]; columns: string[]; values: Array<0 | 1> };
```

There is no generic `params` bag. Each node kind has typed scalar data, and unknown fields are rejected by both the TypeScript types and runtime schema. This prevents an agent from smuggling coordinates, markup, or functions into a semantic node.

`composite` is a controlled extension point for structures such as MoE panels, Q/K/V lanes, and multi-stream residual insets. Its internal implementation belongs to the corresponding template, not to the public component surface.

### 4.3 Edges

```ts
type Anchor = {
  node: Id;
  side?: "top" | "right" | "bottom" | "left" | "center";
  offset?: number;
};

type EdgeKind =
  | "flow"
  | "residual"
  | "route"
  | "feedback"
  | "leader"
  | "zoom";

interface EdgeSpec {
  id: Id;
  kind: EdgeKind;
  from: Anchor;
  to: Anchor;
  waypoints?: Point[];
  arrow?: "none" | "end" | "both";
  junction?: "none" | "plus" | "multiply" | "gate";
  label?: TextSpec;
  style?: {
    stroke?: string;
    width?: number;
    dash?: "solid" | "dashed" | "dotted";
  };
}
```

Rules:

- `flow`, `route`, and `feedback` describe semantic connections.
- `residual` is routed orthogonally by default and may end at a `plus` junction.
- `leader` and `zoom` are explanatory links, not model dataflow.
- `waypoints` are optional for templates and allowed for manual placement.
- Referenced node IDs must exist before layout begins.

### 4.4 Annotations

```ts
interface AnnotationSpec {
  id: Id;
  target: Id;
  placement: "left" | "right" | "top" | "bottom" | "inside";
  content: TextSpec | { bullets: TextSpec[] };
  style?: "plain" | "boxed" | "leader" | "badge";
}
```

Annotations carry vocabulary size, context length, active parameters, dense-first-block notes, and similar explanatory content.

### 4.5 LayoutSpec

```ts
type TemplateId =
  | "backbone"
  | "residual-block"
  | "feed-forward"
  | "moe"
  | "layer-schedule"
  | "multi-stream-residual"
  | "multi-tower"
  | "attention-mask";

const templateVariants = {
  backbone: ["recurrent-detail"],
  "residual-block": [],
  "feed-forward": [],
  moe: ["mixing-detail", "multi-stream-residual"],
  "layer-schedule": ["layer-group", "recurrent-pass"],
  "multi-stream-residual": [],
  "multi-tower": [],
  "attention-mask": ["ihc-pipeline"],
} as const;

type TemplateLayout = {
  [T in TemplateId]: {
    mode: "template";
    template: T;
    variant?: (typeof templateVariants)[T][number];
    slots: Record<string, Id | Id[]>;
    options?: Record<string, number | string | boolean>;
  };
}[TemplateId];

type LayoutSpec = TemplateLayout | {
  mode: "manual";
  placements: Record<Id, Box>;
  routes?: Record<Id, Point[]>;
};
```

Template IDs are a versioned public union, not arbitrary strings. A `Layout Variant` is also typed per template and lives at `layout.variant`; `layout.options.variant` is rejected. Builders may provide a convenient way to produce these IDs, but they do not hide the underlying Spec. Internal template implementation names are not exposed.

Manual placement is explicit and validated for bounds and overlap. It is not the default authoring style.

## 5. Scene

`Scene` is the positioned, renderer-independent intermediate representation. It is the snapshot-test contract.

```ts
interface Scene {
  schemaVersion: 1;
  id: Id;
  canvas: Size;
  metadata: {
    title: string;
    description: string;
  };
  elements: SceneElement[];
  diagnostics: Diagnostic[];
}

type SceneElement =
  | SceneGroup
  | SceneBox
  | ScenePath
  | SceneText
  | SceneGlyph
  | SceneStack
  | SceneGrid;

interface SceneElementBase {
  id: Id;
  sourceId?: Id;
  role: string;
  label?: string;
}

interface SceneGroup extends SceneElementBase {
  kind: "group";
  box: Box;
  children: Id[];
  fill?: Fill;
  stroke?: Stroke;
}

interface SceneBox extends SceneElementBase {
  kind: "box";
  box: Box;
  radius: number;
  fill: Fill;
  stroke: Stroke;
}

interface ScenePath extends SceneElementBase {
  kind: "path";
  points: Point[];
  closed?: boolean;
  stroke: Stroke;
  arrow?: "none" | "end" | "both";
  junction?: "plus" | "multiply" | "gate";
}

interface SceneText extends SceneElementBase {
  kind: "text";
  at: Point;
  lines: PositionedTextLine[];
  align: "start" | "center" | "end";
}

interface PositionedTextLine {
  baseline: number;
  spans: Array<TextSpan & { x: number; width: number }>;
}

interface SceneGlyph extends SceneElementBase {
  kind: "glyph";
  at: Point;
  glyph: "plus" | "multiply" | "sigmoid" | "exp" | "brace" | "ellipsis";
  size: number;
}

interface SceneStack extends SceneElementBase {
  kind: "stack";
  box: Box;
  count: number;
  offset: Point;
  child: Id;
}

interface SceneGrid extends SceneElementBase {
  kind: "grid";
  box: Box;
  rows: number;
  columns: number;
  cells: Array<{ row: number; column: number; text?: string; fill?: Fill }>;
}
```

Scene rules:

1. All positions are absolute in the figure coordinate system.
2. No JSX, DOM nodes, functions, browser objects, or external resource references.
3. Every ID is unique and stable.
4. `sourceId` connects positioned output back to the authoring Spec for diagnostics.
5. Text is already broken into lines and measured using deterministic `TextMetrics`.
6. `Scene` is versioned independently from `FigureSpec` only when necessary; initially both use version 1.

## 6. LayoutEngine

```ts
interface LayoutEngine {
  readonly id: string;
  layout(spec: NormalizedFigureSpec, context: LayoutContext): Scene;
}

interface LayoutContext {
  theme: Theme;
  metrics: TextMetrics;
}

interface TextMetrics {
  measure(text: TextSpan, font: FontSpec): number;
  lineHeight(font: FontSpec): number;
}

interface FontSpec {
  family: string;
  size: number;
  weight: number;
  style?: "normal" | "italic";
}
```

The engine must:

- be synchronous and deterministic;
- be pure with respect to the DOM, network, filesystem, and global state;
- resolve template slots into a positioned Scene;
- produce explicit text line breaks;
- report overlap, out-of-bounds, and unsupported-structure diagnostics;
- never silently drop nodes or edges.

### Template adapter

The default adapter implements `template` layout. It knows the recurring backbone, residual, inset, MoE, and schedule grammars. It consumes semantic slots rather than arbitrary coordinates.

### Manual adapter

The manual adapter consumes declared boxes and routes. It exists for novel structures and exact placement; it is not an invitation for agents to emit coordinate-heavy figures when a template fits.

### Future graph adapters

ELK or Dagre may be added later only if they return the same `Scene` contract. They are not part of v1. An asynchronous external layout engine must be precomputed or placed behind a separate adapter; it must not make the default `renderFigure` nondeterministic.

## 7. renderFigure

```ts
interface RenderFigureOptions {
  layout?: LayoutEngine;
  idPrefix?: string;
  metrics?: TextMetrics;
}

interface RenderedFigure {
  scene: Scene;
  svg: string;
  diagnostics: Diagnostic[];
}

function renderFigure(
  input: FigureSpec,
  options?: RenderFigureOptions,
): RenderedFigure;
```

Behavior:

1. Validate the input schema and supported version.
2. Normalize IDs, references, defaults, and template slots.
3. Run semantic validation: duplicate IDs, dangling references, invalid sizes, missing required text, and unsafe values fail.
4. Select the template or manual engine, or the supplied engine.
5. Produce a Scene using deterministic metrics.
6. Render the Scene as a self-contained SVG string.
7. Return the Scene, SVG, and non-fatal diagnostics.

`renderFigure` does not perform network access, read the DOM, measure a browser, or accept raw SVG/HTML.

For a browser Gallery, a React adapter may render the returned `Scene` without injecting arbitrary markup. For CLI output, the returned `svg` is written with an XML declaration.

v1 deliberately does not accept a caller-provided renderer adapter. The default output is SVG, while the returned `Scene` remains available for snapshots and future renderers.

## 8. Errors and diagnostics

```ts
type Diagnostic = {
  severity: "warning" | "error";
  code: string;
  message: string;
  path?: string;
  sourceIds?: Id[];
};

class FigureValidationError extends Error {
  readonly issues: Diagnostic[];
}

class FigureLayoutError extends Error {
  readonly issues: Diagnostic[];
}
```

Examples of fatal errors:

- unsupported `schemaVersion`;
- duplicate IDs;
- an edge targeting an unknown node;
- a template missing a required slot;
- non-finite coordinates or dimensions;
- missing `title` or `description`;
- unsafe text or resource values;
- unsupported template structure.

Examples of non-fatal diagnostics:

- a manual route crosses a node;
- a label is close to its declared maximum width;
- an optional visual detail was approximated.

Validation errors must identify the path and source IDs. They must not be replaced by a generic “render failed” message.

## 9. Fonts, IDs, accessibility, and export

- **Fonts:** use a declared system font stack by default. `TextMetrics` is an explicit deterministic input; browser text measurement is not part of layout.
- **IDs:** the caller may provide `idPrefix`; otherwise the normalized `FigureSpec.id` is used. Exported IDs must be stable and unique within the document.
- **Accessibility:** `FigureSpec.title` and `description` feed SVG title/description metadata. Scene elements retain labels and roles where meaningful.
- **Self-contained SVG:** no external images, stylesheets, scripts, or font URLs. Gradients and markers are generated internally.
- **PNG:** rasterization is a separate adapter over the SVG/Scene result, not part of the minimal synchronous `renderFigure` contract.

## 10. Mapping the inventory vocabulary to the interface

The 17 primitive categories and 9 composite templates are implementation capabilities, not a requirement for 26 public exports.

| Inventory capability | Interface representation |
|---|---|
| Containers and nested panels | `GroupSpec`, `SceneGroup` |
| Operation nodes and badges | `NodeSpec`, `SceneBox`, `SceneGlyph` |
| Rich text and callouts | `TextSpec`, `AnnotationSpec`, `SceneText` |
| Flow, residual, leader, zoom | `EdgeSpec.kind`, `ScenePath` |
| Repeat braces and stacks | `GroupSpec.repeat`, `NodeSpec.kind`, `SceneStack` |
| Operators and gates | `NodeSpec.kind = "operator"`, `SceneGlyph` |
| Layer schedules and notes | `GroupSpec`, `AnnotationSpec`, `SceneGrid` |
| Parallel streams and feedback | `EdgeSpec`, `ScenePath`, composite template |
| Attention mask matrix | `NodeSpec.kind = "mask"`, `SceneGrid` |
| Gradient fills | `Fill` |

No public module is created merely because an inventory category exists.

## 11. Paper traces for the reviewed figures

These traces test expressiveness at the design level. They do not claim that the implementation exists. The first three are already implemented as hand-authored prototypes; the fourth was added specifically to stress-test the interface before freezing.

### 11.1 Gemma 3 (27B)

Representative Spec fragment:

```ts
{
  schemaVersion: 1,
  id: "gemma-3-27b",
  title: "Gemma 3 (27B)",
  description: "Gemma 3 architecture with 62 repeated residual blocks, grouped-query attention, and a feed-forward inset.",
  canvas: { width: 2593, height: 2686 },
  theme: { accent: "#F27200", surface: "#D5D5D5", ink: "#000", muted: "#666", background: "#fff", fontFamily: "Arial" },
  groups: [
    { id: "model", kind: "model", children: ["backbone"] },
    { id: "backbone", kind: "repeat-block", parent: "model", repeat: { count: 62 }, children: ["attention", "ffn"] },
    { id: "ffn-inset", kind: "inset", title: { spans: [{ text: "Feed forward module" }] }, children: ["ffn"] }
  ],
  nodes: [
    { id: "attention", kind: "composite", data: { family: "gqa", ratio: "5:1", heads: 32, kvHeads: 16 } },
    { id: "ffn", kind: "composite", data: { family: "ffn", hidden: 21504, activation: "GELU" } }
  ],
  edges: [
    { id: "residual-attention", kind: "residual", from: { node: "attention" }, to: { node: "attention", side: "top" }, junction: "plus" },
    { id: "residual-ffn", kind: "residual", from: { node: "ffn" }, to: { node: "ffn", side: "top" }, junction: "plus" }
  ],
  annotations: [
    { id: "heads", target: "attention", placement: "right", content: { spans: [{ text: "32 attention heads" }] } }
  ],
  layout: { mode: "template", template: "backbone", slots: { block: "backbone", inset: "ffn-inset" } }
}
```

Trace result: the Spec can express the model container, 62× block, residual paths, Pre/Post-RMSNorm nodes, attention side pills, FFN inset, callouts, and real text. Scene output would contain groups, boxes, paths, glyphs, and measured text lines. No unsupported interface feature is required.

### 11.2 DeepSeek-V3 (671B)

The same backbone structure adds:

- an MLA operation with inline italic/colored spans;
- a 61× repeat block;
- a MoE inset with router, expert stack, badges, and ellipsis;
- an annotation for the first three dense blocks;
- resource-savings bullets and 37B active parameters.

The new structures map to `GroupSpec(kind = "inset")`, `NodeSpec(kind = "composite")`, `NodeSpec(kind = "badge")`, `NodeSpec(kind = "ellipsis")`, `AnnotationSpec`, and `EdgeSpec(kind = "zoom")`. The existing interface covers the validated figure without a new public rendering module.

### 11.3 GPT-OSS (120B)

GPT-OSS uses the same structural concepts with different parameters: 36× repetition, 64 heads, 128 experts, 4 active experts, input/intermediate dimensions of 2,880, and 5.1B active parameters.

This trace demonstrates parameterization: theme, counts, labels, and expert dimensions change in the Spec; no new layout or renderer concept is needed.

### 11.4 Qwen3.8-Flash-Next (125B-A6B)

This trace was added during design review because the three prototypes did not exercise a sparse-attention mask or GR Read/Write structure.

Representative Spec fragment:

```ts
{
  schemaVersion: 1,
  id: "qwen3-8-flash-next",
  title: "Qwen3.8-Flash-Next (125B-A6B)",
  description: "Hybrid Qwen architecture with sparse-attention mask, gated residual streams, and a repeated MoE backbone.",
  canvas: { width: 4078, height: 3391 },
  theme: { accent: "#1D9BF0", surface: "#D5D5D5", ink: "#000", muted: "#666", background: "#fff", fontFamily: "Arial" },
  groups: [
    { id: "model", kind: "model", children: ["backbone", "mask-inset", "gr-inset"] },
    { id: "backbone", kind: "repeat-block", parent: "model", repeat: { count: 48 }, children: ["attention", "moe", "gr-read", "gr-write"] },
    { id: "mask-inset", kind: "inset", parent: "model", title: { spans: [{ text: "Qwen Sparse Attention (QSA)" }] }, children: ["mask"] },
    { id: "gr-inset", kind: "inset", parent: "model", title: { spans: [{ text: "GR (Gated Residual)" }] }, children: ["gr-read", "gr-write"] }
  ],
  nodes: [
    { id: "attention", kind: "composite", data: { family: "qsa", heads: 24, kvHeads: 2 } },
    { id: "moe", kind: "composite", data: { family: "moe", experts: 512, activeExperts: 10, sharedExperts: 1 } },
    { id: "mask", kind: "mask", data: { rows: ["The", "model", "learns"], columns: ["The", "model", "learns"], values: [1, 0, 0, 1, 1, 0, 1, 1, 1] } },
    { id: "gr-read", kind: "composite", data: { family: "gated-residual", streams: 4, operation: "read" } },
    { id: "gr-write", kind: "composite", data: { family: "gated-residual", streams: 4, operation: "write" } }
  ],
  edges: [
    { id: "attention-mask", kind: "zoom", from: { node: "attention" }, to: { node: "mask" } },
    { id: "gr-flow", kind: "flow", from: { node: "gr-read" }, to: { node: "gr-write" } },
    { id: "gr-residual", kind: "residual", from: { node: "gr-write" }, to: { node: "attention" }, junction: "plus" }
  ],
  layout: { mode: "template", template: "attention-mask", slots: { block: "backbone", mask: "mask-inset", residual: "gr-inset" } }
}
```

Trace result: the mask becomes typed `MaskData` and a `SceneGrid`; highlighted rows/cells become positioned boxes or cell fills; GR Read/Write becomes typed operation data; four residual streams become separate `ScenePath` elements with junctions. This review added typed QSA, gated-delta-net, and gated-residual variants rather than falling back to a generic parameter bag.

The trace demonstrates interface expressiveness, not a working layout implementation. The actual mask and multi-stream templates remain implementation validation work.

## 12. Explicit non-goals for v1

- Interactive dragging or graph editing.
- Automatic layout for arbitrary graphs as the default.
- Accepting raw SVG, HTML, JSX, or JavaScript from an agent.
- Guaranteeing pixel-identical output across all system fonts.
- A canvas renderer or animation engine.
- A Mermaid or DOT compatibility layer.
- Implementing all 132 figures in this ticket.

## 13. Resolved review decisions

1. **Typed node data:** the generic `params` bag is removed. Unknown fields are rejected.
2. **Template visibility:** public Specs use versioned, restricted template IDs; builders are optional conveniences.
3. **Manual placement:** retained in the same Spec as `layout.mode = "manual"`, with strict validation and template-first guidance.
4. **Render result:** `renderFigure` returns `{ scene, svg, diagnostics }`; v1 does not accept arbitrary renderer adapters.
5. **Diagnostics:** structural, safety, reference, and missing-description issues are fatal; visual approximation and width/routing risks are warnings.
6. **Freeze evidence:** Qwen3.8-Flash-Next was added as a fourth trace to exercise mask, GR, and multi-stream structures.

## 14. Implementation gate

The interface names and invariants are accepted. Implementation tickets may now be generated from this document. The first implementation slice should prove the accepted interface with Gemma 3, then extend it to MoE and the complex structures covered by the fourth trace.
