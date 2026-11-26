# Corpus inventory working format

This directory supports the all-figure inventory for GitHub issue #1. Batch JSON files are raw visual evidence; the final human-readable report is `../corpus-inventory.md`.

Regenerate the report and `summary.json` with `bun scripts/build-corpus-inventory.ts` from the repository root. The script validates all 132 entries, normalizes custom labels into the final vocabulary, and writes the expanded report. Raw custom labels preserve the gaps found by the initial candidate set.

## Classification policy

Classify the *diagram grammar*, not the model's technical correctness. The reference image is the visual source of truth. Exclude the source watermark/attribution from component vocabulary.

## Candidate primitives

Use these IDs when a feature is present; add `custom:<slug>` only when none fits.

- `P01` container-frame — rounded solid/dashed containers, nested panels, grouped regions
- `P02` operation-block — rectangular/pill/dark/highlighted operation nodes
- `P03` text-annotation — titles, labels, notes, bullets, inline math, mixed-weight text
- `P04` flow-edge — normal directed dataflow connectors, straight or elbowed
- `P05` residual-edge — skip/residual/shortcut paths returning to a merge
- `P06` operator-junction — ⊕, ×, σ, exp, gate or other operator symbols
- `P07` callout-leader — dotted leader lines from a component to explanatory text
- `P08` repeat-marker — brace, `N ×`, grouped repeat labels, grouped repetition notation
- `P09` repetition-stack — offset cards, expert/head grids, repeated parallel miniatures
- `P10` badge-counter — small numbered/colored tags attached to nodes
- `P11` ellipsis-omission — `…` or equivalent omission marker
- `P12` legend-table — layer schedules, ratio tables, structured notes or legends
- `P13` stream-bundle/terminal — parallel residual lanes, buses, dots, bracket terminals
- `P14` recurrence-loop — repeated passes, weight reuse, far-skip or depth feedback
- `P15` attention-mask-matrix — token-axis sparse attention grids and highlights
- `P16` pipeline/lane-schematic — Q/K/V lanes, stage pipelines, parallel branches
- `P17` gradient/pattern-fill — non-flat block or operation fills

## Candidate composite templates

Use these IDs when the corresponding reusable composition appears; add `custom:<slug>` only when none fits.

- `T01` backbone-with-repeat-block — input → embedding → repeated block(s) → final norm/output
- `T02` residual-block — norm → mixing/attention → merge → norm → FFN/MoE → merge
- `T03` feed-forward-detail — dense or gated FFN inset with linear/activation/multiply paths
- `T04` mixing-detail — attention, linear-attention, recurrent, convolutional, or other token-mixing inset
- `T05` moe-experts-detail — router → expert branches → aggregation, including shared/routed experts
- `T06` layer-group-schedule — nested groups, loop stages, or layer schedules
- `T07` multi-stream-residual-detail — parallel streams and pre/post mixing
- `T08` multi-tower-backbone — separate encoder/decoder or parallel towers
- `T09` attention-mask-explanation — labeled mask grids and block highlights

## JSON entry shape

Each batch file is a JSON array with exactly one object per assigned image:

```json
{
  "file": "deepseek-v3.webp",
  "model": "DeepSeek-V3 (671B)",
  "compositeTemplates": ["T01", "T02", "T03", "T05"],
  "primitives": ["P01", "P02"],
  "blockKinds": ["GQA", "MoE"],
  "panels": ["Feed forward (SwiGLU) module", "MoE layer"],
  "theme": {
    "accent": "coral",
    "background": "white",
    "fills": ["light gray", "salmon"]
  },
  "typography": ["bold colored title", "mixed-weight callout", "inline colored emphasis"],
  "edges": ["vertical flow", "orthogonal residual", "dotted callout", "dotted zoom"],
  "specialStructures": ["first 3 blocks use dense FFN", "256 routed experts"],
  "customPrimitives": [],
  "customTemplates": [],
  "confidence": "high",
  "notes": "One or two sentences on anything a renderer must handle."
}
```

Required fields: `file`, `model`, `compositeTemplates`, `primitives`, `blockKinds`, `panels`, `theme`, `typography`, `edges`, `specialStructures`, `customPrimitives`, `customTemplates`, `confidence`, `notes`.

Confidence is `high`, `medium`, or `low`. Use `medium`/`low` when text is unreadable or a structure is ambiguous.
