# LLM Architecture Components

Shared language for describing and rendering LLM architecture figures.

## Language

**Figure**:
A complete LLM architecture diagram with a title, visual structure, and explanatory content.
_Avoid_: image, picture

**FigureSpec**:
A versioned, renderer-independent description of a **Figure** and its layout intent.
_Avoid_: JSX, SVG document, drawing script

**Layout Template**:
A named, versioned arrangement grammar used to organize a **FigureSpec** without requiring the author to provide coordinates.
_Avoid_: auto-layout, arbitrary template string

**Scene**:
A positioned, serializable representation of a **Figure** produced from a normalized **FigureSpec**.
_Avoid_: SVG, JSX, DOM tree

**LayoutEngine**:
A deterministic transformation from a normalized **FigureSpec** to a **Scene** using a selected **Layout Template** or explicit placement.
_Avoid_: browser measurement, automatic graph editor

**Manual Placement**:
An explicit **Layout Template** alternative in which a **FigureSpec** supplies positions and routes directly for structures not yet covered by a template.
_Avoid_: default authoring mode, arbitrary coordinate dump

**Verified Rendering**:
A **Figure** whose valid **FigureSpec** produces a deterministic, self-contained SVG and passes a side-by-side visual review against its reference image.
_Avoid_: structural coverage, Spec coverage, pixel parity

**TemplateScene**:
An internal wrapper around **Scene** construction that gives **Layout Template** adapters shared domain methods for pills, flows, callouts, repeat frames, and insets without becoming part of the public export surface.
_Avoid_: public component, base class, universal rendering interface
