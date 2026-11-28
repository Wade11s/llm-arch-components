# LLM Architecture Components

Shared language for describing and rendering LLM architecture figures.

## Language

**Figure**:
A complete LLM architecture diagram with a title, visual structure, and explanatory content.
_Avoid_: image, picture

**FigureSpec**:
A versioned, renderer-independent description of a **Figure** and its layout intent.
_Avoid_: JSX, SVG document, drawing script

**Node**:
A single placeable element in a **Figure**, such as an operation, label, badge, or mask.
_Avoid_: component, block, shape

**Group**:
A named container in a **Figure** that holds **Nodes** or other **Groups**, such as a model, repeat block, inset, or tower.
_Avoid_: component, panel

**Edge**:
A semantic connection declared in a **FigureSpec**, from one **Anchor** to another.
_Avoid_: line, arrow, connector

**Anchor**:
The endpoint of an **Edge**, naming a **Node** or **Group** and optionally the side it leaves from.
_Avoid_: attachment point, component

**Layout Template**:
A named, versioned arrangement grammar used to organize a **FigureSpec** without requiring the author to provide coordinates.
_Avoid_: auto-layout, arbitrary template string

**Layout Variant**:
A named structural alternative within a **Layout Template**, distinct from visual tuning options for that template.
_Avoid_: template option, visual style

**Scene**:
A positioned, serializable representation of a **Figure** produced from a normalized **FigureSpec**.
_Avoid_: SVG, JSX, DOM tree

**Path**:
A drawn connector in a **Scene** that realizes one **Edge**, an **Internal Wiring** segment, or a leader callout.
_Avoid_: line, connector

**Port**:
The boundary point and outward normal where a **Path** leaves or meets the **Node** or **Group** named by its **Anchor**.
_Avoid_: offset, coordinate

**Internal Wiring**:
A **Path** inside a **Group** or inset that connects parts of that group and therefore has no **Edge** in the **FigureSpec**.
_Avoid_: internal edge, decorative line

**Attached Endpoint**:
A **Path** endpoint that lies on the boundary of the **Node** or **Group** it belongs to.
_Avoid_: anchored end, connected end

**Adjacent Endpoint**:
A **Path** endpoint that stops within a small gap of the text block it belongs to.
_Avoid_: floating end, loose end

**Open Endpoint**:
A **Path** endpoint declared to terminate without belonging to a **Node**, **Group**, or text block, such as a model output arrow.
_Avoid_: dangling end, unconnected line

**LayoutEngine**:
A deterministic transformation from a normalized **FigureSpec** to a **Scene** using a selected **Layout Template** or explicit placement.
_Avoid_: browser measurement, automatic graph editor

**Manual Placement**:
An explicit **Layout Template** alternative in which a **FigureSpec** supplies positions and routes directly for structures not yet covered by a template.
_Avoid_: default authoring mode, arbitrary coordinate dump

**Verified Rendering**:
A **Figure** whose valid **FigureSpec** produces a deterministic, self-contained SVG and passes a side-by-side visual review against its reference image.
_Avoid_: structural coverage, Spec coverage, pixel parity

**Reference Verification**:
Recorded evidence that a **Figure** matches its reference image in structure, text, connections, and visual hierarchy, without requiring pixel parity.
_Avoid_: pixel parity, raw image comparison

**TemplateScene**:
An internal wrapper around **Scene** construction that gives **Layout Template** adapters shared domain methods for pills, flows, callouts, repeat frames, and insets without becoming part of the public export surface.
_Avoid_: public component, base class, universal rendering interface
