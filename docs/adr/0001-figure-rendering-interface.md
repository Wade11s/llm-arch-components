# Figure rendering interface

Status: accepted

The project will use a small, versioned interface for Agent-authored LLM architecture figures: typed `FigureSpec`, serializable `Scene`, deterministic `LayoutEngine`, and `renderFigure(spec, options) → { scene, svg, diagnostics }`.

We chose typed node data over a generic `params` bag, versioned template IDs over arbitrary template names, and SVG output over a caller-provided renderer in v1. Template-first layout is the default, with `layout.mode = "manual"` retained only as a validated escape hatch. Structural, safety, reference, and missing-description issues are fatal; visual approximation and width or routing risks are warnings.

This keeps the public interface deep and agent-safe while hiding the 17 primitive and 9 composite-template capabilities behind a smaller contract.
