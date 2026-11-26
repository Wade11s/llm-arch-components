# Corpus inventory: LLM architecture reference figures

**Issue:** #1 — 盘点全部参考图并确定首版图元与模板清单  
**Corpus:** 132 `.webp` reference figures  
**Method:** every figure was visually inspected; local LiteParse OCR was used only as a text aid. The image, not OCR or external model documentation, is the visual source of truth. Source watermarks are excluded from the component vocabulary.

## 1. Executive result

- **132 / 132 figures (100.0%)** fit the expanded first-version vocabulary of **17 primitives and 9 composite templates** without a custom primitive or template.
- The initial 12-primitive/5-template candidate covered **103/132 (78.0%)**. The 80% acceptance threshold required at least **106 figures**, so the initial candidate **DID NOT PASS** and was expanded.
- The expanded first-version vocabulary **PASSES** the same threshold.
- **0 figures** record custom requirements. These are listed explicitly below rather than hidden in a catch-all primitive.
- Confidence: 121 high, 11 medium, 0 low.

The expanded set is sufficient for the first prototype vocabulary. The five added primitives and four added templates are listed below with the reason for expansion; any remaining custom cases stay explicit extension points.

Coverage here means structural expressiveness, not pixel-identical output. Typography, edge routing, and visual fidelity remain validation work for issue #2.

## 2. Primitive vocabulary

| ID | Meaning | Figures | Corpus share |
|---|---|---:|---:|
| `P01` | Container/frame: rounded solid or dashed containers, nested panels, grouped regions | 132 | 100.0% |
| `P02` | Operation block: rectangular, pill, dark, or highlighted operation nodes | 132 | 100.0% |
| `P03` | Text annotation: titles, labels, notes, bullets, inline math, mixed-weight text | 132 | 100.0% |
| `P04` | Flow edge: normal directed dataflow connectors, straight or elbowed | 132 | 100.0% |
| `P05` | Residual edge: skip/residual/shortcut paths returning to a merge | 126 | 95.5% |
| `P06` | Operator/junction: plus, multiply, sigmoid, exp, gate, or other operator symbols | 132 | 100.0% |
| `P07` | Callout leader: dotted leaders from components to explanatory text | 132 | 100.0% |
| `P08` | Repeat marker: braces, N× labels, and grouped repetition notation | 131 | 99.2% |
| `P09` | Repetition stack: offset cards, expert/head grids, repeated parallel miniatures | 69 | 52.3% |
| `P10` | Badge/counter: small numbered or colored tags attached to nodes | 78 | 59.1% |
| `P11` | Ellipsis/omission: ellipsis or equivalent omission markers | 87 | 65.9% |
| `P12` | Legend/table: layer schedules, ratio tables, structured notes, or legends | 68 | 51.5% |
| `P13` | Stream bundle/terminal: parallel residual lanes, read/write buses, dots, bracket terminals, or depth-source buses | 14 | 10.6% |
| `P14` | Recurrence loop: explicit feedback for repeated passes, shared weights, or far-skip/depth reuse | 7 | 5.3% |
| `P15` | Attention mask matrix: labeled 0/1 or sparse-attention grids with token axes and highlights | 3 | 2.3% |
| `P16` | Pipeline/lane schematic: ordered Q/K/V lanes, stage pipelines, or parallel attention/FFN branches | 27 | 20.5% |
| `P17` | Gradient/pattern fill: non-flat surface treatments used for block or operation fills | 13 | 9.8% |

## 3. Composite template vocabulary

| ID | Reusable composition | Figures | Corpus share |
|---|---|---:|---:|
| `T01` | Backbone with repeat block: input → embedding → repeated block(s) → final norm/output | 132 | 100.0% |
| `T02` | Residual block: norm → mixing/attention → merge → norm → FFN/MoE → merge | 126 | 95.5% |
| `T03` | Feed-forward detail: dense or gated FFN inset with linear/activation/multiply paths | 112 | 84.8% |
| `T04` | Mixing detail: attention, linear-attention, recurrent, convolutional, or other token-mixing inset | 39 | 29.5% |
| `T05` | MoE experts detail: router → expert branches → aggregation, including shared/routed experts | 90 | 68.2% |
| `T06` | Layer-group schedule: nested repeated groups, before/inside/after-loop stages, or a first-class layer schedule | 34 | 25.8% |
| `T07` | Multi-stream residual detail: parallel residual streams with pre/post read-write or constrained mixing | 9 | 6.8% |
| `T08` | Multi-tower backbone: separate encoder/decoder or other parallel backbone towers with cross-links | 1 | 0.8% |
| `T09` | Attention-mask explanation: token-axis mask grid, block highlights, and annotated attention examples | 3 | 2.3% |

Templates compose rather than forming mutually exclusive figure categories: one figure normally combines a backbone, residual block, and zero or more detail panels.

### 3.1 Why the vocabulary was expanded

| Added ID(s) | Reason | Representative figures |
|---|---|---|
| `P13`, `P16`, `T07` | Parallel residual streams, read/write buses, terminals, and mHC/GR/iHC insets are not plain residual edges. | DeepSeek-V4 family, Motif-3-Beta, Qwen3.8-Flash-Next |
| `P14`, `T06` | Repeated passes, shared-weight recurrence, nested layer groups, and layer schedules need first-class recurrence and grouping. | GLM-5.4, Inkling 2, LFM2.5, Ling-3.1 |
| `T08` | Two coordinated towers cannot be reduced to a single backbone without losing structure. | DeepSeek-V4.1-Flash |
| `P15`, `T09` | Sparse-attention explanations include labeled mask matrices and token/block highlights. | Qwen3.8-Flash-Next, Tencent-Hy4 |
| `P17` | Non-flat gradient fills recur across 13 figures and cannot be represented by a flat accent token alone. | Kimi K2.x, Laguna S 2.1, MiniMax M2.7/M3, Arete, Ornith, Sarvam, Qwen3.8-27B, Zaya1 |

Normalization rule: head-group grids and vertical lane insets use `P09`/`P16`; side shortcut-MoE nodes use `P02`/`P05`/`P06`; gate badges use `P10`; repeat-label gutters use `P08`. LongCat's dual-attention block is a parameterized `T02` with two mixing sublayers, not a separate template.

The raw batch evidence recorded the following initial gap labels before normalization:

| Initial gap label | Records |
|---|---:|
| `custom:layer-group-stack` | 8 |
| `custom:lane-column-inset` | 5 |
| `custom:multi-stream-residual-inset` | 5 |
| `custom:dual-attention-block` | 4 |
| `custom:head-grid` | 4 |
| `custom:layer-schedule-sidebar` | 4 |
| `custom:recurrent-pass-stack` | 4 |
| `custom:repeat-label-gutter` | 4 |
| `custom:attention-mask-matrix` | 3 |
| `custom:branch-terminal` | 2 |
| `custom:far-skip` | 2 |
| `custom:gate-badge` | 2 |
| `custom:multi-stream-residual-detail` | 2 |
| `custom:parallel-lane-bundle` | 2 |
| `custom:shortcut-moe-node` | 2 |
| `custom:sublayer-frame-schedule` | 2 |
| `custom:attnres-block` | 1 |
| `custom:depth-source-bus` | 1 |
| `custom:depth-source-sum` | 1 |
| `custom:dual-tower-encoder-decoder` | 1 |
| `custom:far-skip-loop` | 1 |
| `custom:head-group-diagram` | 1 |
| `custom:parallel-branch-bundle` | 1 |
| `custom:pass-row-card` | 1 |
| `custom:recurrent-depth-loop` | 1 |
| `custom:stream-bundle` | 1 |
| `custom:weight-reuse-loop` | 1 |
| `custom:weight-shared-repeat-group` | 1 |

## 4. Theme, typography, edge, and block variants

These tables record observed vocabulary, not proposed public prop names. They are inputs to the prototype's theme and renderer design.

### 4.1 Accent colors

| Observed accent | Figures |
|---|---:|
| blue | 18 |
| orange | 16 |
| azure blue | 15 |
| green | 13 |
| dodger blue | 9 |
| lime green | 6 |
| crimson red | 5 |
| steel blue | 5 |
| teal | 5 |
| slate gray | 4 |
| black | 3 |
| bright sky blue | 3 |
| emerald green | 3 |
| pink | 3 |
| burnt orange | 2 |
| coral | 2 |
| coral red | 2 |
| cornflower blue | 2 |
| crimson | 2 |
| royal blue | 2 |
| violet | 2 |
| amber | 1 |
| bright blue | 1 |
| charcoal gray | 1 |
| dark gold / olive | 1 |
| magenta | 1 |
| orange to yellow-green gradient | 1 |
| purple | 1 |
| sky blue | 1 |
| teal cyan | 1 |
| violet to lavender gradient | 1 |

### 4.2 Fill treatments

| Observed fill | Occurrences |
|---|---:|
| light gray | 130 |
| white pills | 49 |
| white | 34 |
| dark charcoal | 33 |
| charcoal | 22 |
| pale tan | 21 |
| salmon | 21 |
| dark gray | 14 |
| bright blue | 13 |
| dark gray node | 13 |
| charcoal node | 12 |
| steel blue | 11 |
| orange | 10 |
| pale yellow | 9 |
| pink | 9 |
| sky blue | 8 |
| green | 7 |
| mint green | 7 |
| gold | 6 |
| pastel green | 6 |
| pastel pink | 6 |
| pastel salmon | 6 |
| pastel yellow | 6 |
| slate blue | 5 |
| cream | 4 |
| light orange | 4 |
| lime green | 4 |
| pastel blue | 4 |
| slate | 4 |
| blue | 3 |
| cornflower blue | 3 |
| dusty pink | 3 |
| medium green | 3 |
| pale blue | 3 |
| salmon pink | 3 |
| tan | 3 |
| white pills with pink outline | 3 |
| azure blue | 2 |
| dodger blue | 2 |
| indigo | 2 |
| lavender | 2 |
| orange to lavender gradient | 2 |
| pale green | 2 |
| pale yellow highlight | 2 |
| red-to-orange gradient | 2 |
| teal | 2 |
| amber | 1 |
| blue-outlined norm pills | 1 |
| blue-outlined white pills | 1 |
| blue-to-purple gradient | 1 |
| blue-violet gradient | 1 |
| cyan-to-blue gradient | 1 |
| dark maroon | 1 |
| dark slate | 1 |
| dark slate gray | 1 |
| dark slate node | 1 |
| dark teal | 1 |
| emerald green | 1 |
| gray | 1 |
| green-outlined label pill | 1 |
| lavender-to-pink gradient | 1 |
| light green | 1 |
| lime gradient | 1 |
| magenta-to-orange gradient | 1 |
| medium blue | 1 |
| mid gray | 1 |
| muted purple | 1 |
| near black | 1 |
| near-white | 1 |
| orange-to-red gradient | 1 |
| orange-yellow gradient | 1 |
| pale orange | 1 |
| pink-to-lavender gradient | 1 |
| powder blue | 1 |
| salmon/coral | 1 |
| saturated blue | 1 |
| white label pill | 1 |
| white pills with orange outline | 1 |
| white/lavender pills | 1 |
| yellow | 1 |

### 4.3 Typography variants

| Observed treatment | Occurrences |
|---|---:|
| bold black headings | 28 |
| mixed-weight callout | 28 |
| bold colored title | 23 |
| mixed-weight margin callout | 18 |
| bold blue sans title | 15 |
| mixed-weight callouts with blue numerals | 15 |
| inline colored emphasis in bullets | 13 |
| inline colored numbers | 13 |
| bulleted note list | 12 |
| bold blue title | 11 |
| bold orange title | 11 |
| bulleted legend text with bold emphasis | 9 |
| large pink bold title | 8 |
| mixed-weight callouts with green numerals | 6 |
| monospaced schedule table | 6 |
| bold black callout with pink numbers | 5 |
| bold black inset titles | 5 |
| bold black title | 5 |
| large green bold title | 5 |
| three-line attention label | 5 |
| two-line lime green bold title | 5 |
| bold black callout with blue numerals | 4 |
| bold green title | 4 |
| heavy slate title | 4 |
| large blue bold title | 4 |
| large orange bold title | 4 |
| left-edge repeat labels | 4 |
| two-line head-count note | 4 |
| bold black panel headings | 3 |
| bold callout with green numerals | 3 |
| bold callout with pink numerals | 3 |
| bold emerald sans title | 3 |
| bold green sans title | 3 |
| coral inline emphasis | 3 |
| inline blue emphasis | 3 |
| inline colored emphasis | 3 |
| mixed-weight bullet list | 3 |
| orange-outlined norm pills | 3 |
| pastel layer chips | 3 |
| pink-outlined norm pills | 3 |
| small head captions | 3 |
| small inset subheads | 3 |
| Step 1-5 labels | 3 |
| blue inline mHC labels | 2 |
| bold black callout with green numerals | 2 |
| bold coral sans title | 2 |
| bold crimson title | 2 |
| bold orange sans title | 2 |
| bulleted composition notes | 2 |
| color-coded layer chips | 2 |
| colored prose block | 2 |
| grouped Local/Global note blocks | 2 |
| large blue bold title with parenthetical subtitle | 2 |
| mixed-weight callout with orange numbers | 2 |
| mixed-weight callouts | 2 |
| mixed-weight callouts with coral numerals | 2 |
| mixed-weight callouts with orange numerals | 2 |
| monospace inset labels | 2 |
| monospace layer schedule | 2 |
| monospace layer-ratio table | 2 |
| monospace pass labels | 2 |
| monospace schedule block | 2 |
| monospaced layer table | 2 |
| orange inline emphasis | 2 |
| Q/K/V letter labels | 2 |
| rotated panel labels | 2 |
| small dark inset headers | 2 |
| small inset titles | 2 |
| superscript footnote markers | 2 |
| teal title | 2 |
| two-line subtitle | 2 |
| blue arithmetic note lines | 1 |
| blue bold inline numerals | 1 |
| blue bold numerals inline | 1 |
| blue callout box | 1 |
| blue high-emphasis subheads (GR) | 1 |
| blue inline node labels | 1 |
| blue inline node labels for mHC/RMSNorm | 1 |
| blue pre/post norm labels | 1 |
| blue-outlined mixer pills with blue bold text | 1 |
| bold azure sans title | 1 |
| bold black callout with orange numbers | 1 |
| bold black callout with orange numerals | 1 |
| bold black paragraph headers | 1 |
| bold black section headings | 1 |
| bold blue sans title with black equation suffix | 1 |
| bold blue sans title with gray quoted suffix | 1 |
| bold blue sans title with gray subtitle | 1 |
| bold callout with blue numerals | 1 |
| bold callout with coral numerals | 1 |
| bold colored callout text | 1 |
| bold colored stat lines | 1 |
| bold colored title spanning two lines | 1 |
| bold coral title | 1 |
| bold green callout box text | 1 |
| bold green multi-line bottom note | 1 |
| bold highlighted spans inside module labels | 1 |
| bold inset titles in quotes | 1 |
| bold purple sans title | 1 |
| bold teal numeric emphasis | 1 |
| bold teal sans title | 1 |
| bold teal title with gray subtitle | 1 |
| bold teal two-line title | 1 |
| bold two-tone title (blue then violet) | 1 |
| bold violet sans title | 1 |
| bulleted legend text | 1 |
| bulleted legend with inline emphasis | 1 |
| bulleted resource list | 1 |
| bulleted stack-composition notes | 1 |
| color-coded layer-name chips | 1 |
| coral inline emphasis 'IndexShare' | 1 |
| dotted sub-bullets with arithmetic (64 × (128 + 192) = 20,480) | 1 |
| dotted-leader stat labels | 1 |
| gradient title text | 1 |
| gray subtitle note | 1 |
| green bold head-count numerals | 1 |
| green-outlined text pill | 1 |
| heavy black sans title | 1 |
| inline blue emphasis in labels | 1 |
| inline coral emphasis | 1 |
| inline italic emphasis in node label | 1 |
| inline math in callout (3×4,096 = 12,288) | 1 |
| inline math in callout (5×5,120 = 25,600) | 1 |
| inline math R_i = R_i + s_i y_i | 1 |
| italic emphasis inside node label | 1 |
| italic-ish annotation text for 'NoPE every 4th layer' | 1 |
| large blue bold title with bold subtitle | 1 |
| large blue bold title with subtitle note | 1 |
| large coral bold title | 1 |
| large lime green bold title | 1 |
| layer-range note lines | 1 |
| mixed-weight bullet callout | 1 |
| mixed-weight callout (bold black + blue numbers) | 1 |
| mixed-weight callout blocks stacked left | 1 |
| mixed-weight callouts with azure numerals | 1 |
| mixed-weight callouts with purple numerals | 1 |
| mixed-weight callouts with violet numerals | 1 |
| mixed-weight caption | 1 |
| mixed-weight right-aligned callouts with blue numerals | 1 |
| mixed-weight step labels | 1 |
| monochrome mixed-weight callouts | 1 |
| monospace footnote | 1 |
| monospace inline notes | 1 |
| multi-color inline emphasis inside the dark node (yellow SWA / orange DSA) | 1 |
| multi-line attention label with coral emphasis | 1 |
| multi-line attention label with inline coral emphasis | 1 |
| multi-line bold callouts with blue numerals | 1 |
| multi-line bold notes with orange numerals | 1 |
| multi-line mixed-weight notes | 1 |
| multi-line note blocks | 1 |
| one-line head-count label | 1 |
| orange inline emphasis inside a dark node | 1 |
| panel titles tinted to match their border color | 1 |
| parenthetical '(vision encoder and DSpark draft head not shown)' subtitle | 1 |
| parenthetical clarifier | 1 |
| parenthetical clarifier line | 1 |
| pink sublayer labels | 1 |
| plain-language multi-line captions at the corners | 1 |
| quoted inset subtitles | 1 |
| quoted module label ('linear attention') | 1 |
| row labels A/B in the schedule table | 1 |
| small bulleted legend | 1 |
| small caption labels | 1 |
| small matrix labels | 1 |
| small matrix row labels (a/b/c) and column dots | 1 |
| small matrix row/column labels | 1 |
| small per-head letters (q/k/v) | 1 |
| small repeat-count labels | 1 |
| small repeat-count labels (5×, 3×, 1×, 4×) | 1 |
| small secondary note text inside the inset | 1 |
| stacked feature-note blocks | 1 |
| stacked head-count note in green | 1 |
| stacked Local/Global head notes | 1 |
| Step 1-5 mixed-weight labels | 1 |
| three-line attention label with '+' separator | 1 |
| three-line attention label with colored keywords | 1 |
| three-line attention label with colored parentheticals | 1 |
| tiny head index labels | 1 |
| top-left multi-line omission note | 1 |
| two-line attention label | 1 |
| two-line context note | 1 |
| two-line context-length note | 1 |
| two-line dimension callout | 1 |
| two-line dimension labels | 1 |
| two-line head-count annotation | 1 |
| two-line side-pill label | 1 |
| two-line side-pill labels | 1 |
| white norm pills on blue background | 1 |

### 4.4 Edge variants

| Observed edge treatment | Occurrences |
|---|---:|
| vertical flow | 99 |
| dotted callout leader | 59 |
| orthogonal residual | 37 |
| vertical flow arrows | 33 |
| dotted diagonal callout leaders | 31 |
| dotted leader | 31 |
| orthogonal residual with ⊕ | 31 |
| dotted zoom | 30 |
| orthogonal residual arrows | 27 |
| elbowed residual | 20 |
| dotted zoom leader to insets | 19 |
| fan-out/fan-in MoE routes | 14 |
| dotted zoom connector | 12 |
| dotted zoom frames | 12 |
| dotted zoom frame | 9 |
| dotted zoom leader to both insets | 8 |
| blue dotted zoom frames | 6 |
| dashed zoom leaders | 6 |
| dotted leader to detail panels | 6 |
| dotted zoom leader to inset | 6 |
| gate branch into ⊗ | 6 |
| red dash-dot zoom connector | 5 |
| orange dash-dot zoom connector | 4 |
| right-angle residual loop with dot terminals | 4 |
| dotted zoom leader | 3 |
| fan-out and merge edges | 3 |
| green dotted zoom frames | 3 |
| dotted zoom leaders | 2 |
| fan-out operator edges | 2 |
| fan-out/fan-in expert routes | 2 |
| feedback edge into merge | 2 |
| gated skip into merge | 2 |
| shortcut edge into second merge | 2 |
| sigmoid-gate side branch into ⊗ | 2 |
| terminal stubs on the iHC pipeline | 2 |
| 4-way parallel residual bus with junction dots | 1 |
| colored long-path edge | 1 |
| curved annotation arrows at the matrix | 1 |
| curved arc arrows inside the mask matrix | 1 |
| curved red/orange annotation arrows at the matrix | 1 |
| dashed sublayer outlines | 1 |
| dashed zoom leader to the macro-block column | 1 |
| dotted diagonal leaders | 1 |
| dotted nested repeat frames | 1 |
| four parallel residual lanes with endpoint dots | 1 |
| green dash-dot zoom connector | 1 |
| heavy dotted zoom frame | 1 |
| input reinjection loop | 1 |
| long orthogonal side feeds | 1 |
| multiply merge edge | 1 |
| orthogonal group-sum loops | 1 |
| orthogonal residual paths | 1 |
| orthogonal residual with merge labels | 1 |
| pink routed depth-source arrows | 1 |
| residual edges that terminate at the norm nodes (no plus junction) | 1 |
| side branch into output path | 1 |
| side feedback edge | 1 |
| single LayerNorm with two parallel sublayer branches into one ⊕ | 1 |
| thick blue loop connector | 1 |
| thick green block-reuse feedback path | 1 |
| thick green long bypass edge returning to the block input | 1 |
| thick green recurrent edge back to the block input | 1 |
| three side boxes feeding the attention block | 1 |
| three-input merge into the ⊕ | 1 |
| two positional blocks joined by a plus into the attention block | 1 |
| two side boxes (QK-Norm, Partial RoPE) into the attention block | 1 |
| vertical gate stubs (Q, K, V, f, i) into the mLSTM band | 1 |
| violet dotted zoom frames | 1 |

### 4.5 Block and mixing kinds

| Observed block kind | Occurrences |
|---|---:|
| MoE | 42 |
| SwiGLU FFN | 33 |
| RMSNorm | 31 |
| GQA | 27 |
| SwiGLU | 22 |
| gated FFN (SwiGLU) | 18 |
| Dense FFN | 17 |
| MLA | 13 |
| dense SwiGLU FFN | 11 |
| sliding-window attention | 10 |
| grouped-query attention | 8 |
| gated DeltaNet linear attention | 7 |
| gated GQA | 7 |
| GELU FFN | 7 |
| GQA with QK-Norm and RoPE | 7 |
| dense gated FFN (SwiGLU) | 6 |
| Mamba-2 SSM | 6 |
| DeepSeek Sparse Attention | 5 |
| GQA with sliding window | 5 |
| Gated MLA | 4 |
| global attention | 4 |
| Kimi Delta Attention | 4 |
| mHC hyper-connections | 4 |
| MoE (256 experts, top-8) | 4 |
| dense FFN | 3 |
| GQA + SWA in 6:1 ratio with partial RoPE | 3 |
| KDA | 3 |
| latent MoE (512 experts, top-22, shared expert) | 3 |
| LatentMoE | 3 |
| LIV convolution | 3 |
| MLA with partial RoPE | 3 |
| MoE (128 experts, 8 active) | 3 |
| MoE (256 experts, 8 routed) | 3 |
| MoE (384 experts, 1 shared + 8 routed) | 3 |
| AttnRes depth-source attention | 2 |
| Block AttnRes | 2 |
| CSA/HCA compressed sparse attention | 2 |
| gated DeepSeek Sparse Attention (DSA) | 2 |
| GQA + SWA with partial RoPE | 2 |
| grouped-query attention (2 KV heads, NoPE) | 2 |
| grouped-query attention (NoPE) | 2 |
| iHC (residual stream) Read/Write | 2 |
| LayerNorm | 2 |
| Lightning Attention-2 | 2 |
| MoE (128 experts, 1 shared + 4 routed) | 2 |
| MoE (128 experts, 1 shared + 6 active) | 2 |
| MoE (128 experts, 4 active + 1 shared) | 2 |
| MoE (256 experts, 3B active) | 2 |
| MoE (384 experts, 8 routed) | 2 |
| MoE with identity experts | 2 |
| multi-head attention | 2 |
| multi-head latent attention | 2 |
| N-gram embedding | 2 |
| per-layer embeddings | 2 |
| ShortConv | 2 |
| 3:1 sliding-window + full GQA (gated) | 1 |
| 3:1 sliding-window + gated GQA | 1 |
| AttnRes depth mixing | 1 |
| compressed convolutional attention (CCA) + GQA in 4:1 ratio | 1 |
| CSA2 compressed sparse attention | 1 |
| DeepSeek Sparse Attention with IndexShare | 1 |
| dense FFN with ReLU-squared | 1 |
| dense gated FFN (SiLU) | 1 |
| DiffTPA differential tensor-product attention (7 layers) | 1 |
| dropout | 1 |
| Engram n-gram lookup | 1 |
| gated DeltaNet | 1 |
| Gated DeltaNet linear attention | 1 |
| Gated DSA | 1 |
| gated full attention (scaled dot-product) | 1 |
| gated GQA with 5:1 local:global sliding window, RoPE+NoPE, gated attention | 1 |
| gated GQA with partial/full RoPE, NoPE and SWA 3:1 ratio | 1 |
| gated grouped-query attention | 1 |
| gated MLA | 1 |
| gated residual (GR Read / GR Write) | 1 |
| GEGLU FFN | 1 |
| Global GQA | 1 |
| GQA / MiniMax sparse attention | 1 |
| GQA + sliding window attention (SWA) in 3:1 ratio | 1 |
| GQA + sliding window attention (SWA) with QK-Norm, partial/full RoPE | 1 |
| GQA + XSA hybrid attention | 1 |
| GQA with 2 KV heads and NoPE | 1 |
| GQA with RoPE | 1 |
| GQA with RoPE/NoPE | 1 |
| GQA with short conv | 1 |
| GQA with sliding-window attention, RoPE+NoPE and learned attention sinks | 1 |
| grouped differential latent attention (GDLA, sliding-window + full) | 1 |
| grouped-query attention (64 heads / 2 KV, NoPE) | 1 |
| grouped-query attention (NoPE, 40 heads / 8 KV) | 1 |
| grouped-query attention + sliding-window attention in 3:1 ratio | 1 |
| HCA/MLA/DSA attention | 1 |
| hybrid GQA (39 sliding-window + 9 DSA layers) | 1 |
| Hybrid short-conv linear attention | 1 |
| Kimi Delta Attention (KDA) / gated GQA | 1 |
| latent MoE | 1 |
| Latent MoE | 1 |
| latent MoE (256 experts, top-8, no shared expert) | 1 |
| latent MoE (256 routed + 1 shared expert) | 1 |
| LoRA adapter | 1 |
| Mamba-2 SSM with Conv1D and SSM state update | 1 |
| Mamba-3 (29 layers) | 1 |
| masked grouped-query attention | 1 |
| masked grouped-query attention with NoPE + RoPE | 1 |
| masked grouped-query attention with QK-Norm and RoPE | 1 |
| masked multi-head attention | 1 |
| mHC manifold-constrained hyper-connections | 1 |
| mHC multi-stream residual | 1 |
| MiniMax sparse attention (GQA) | 1 |
| MLA + LSA | 1 |
| MoE (128 experts, 1 shared + 4 active) | 1 |
| MoE (128 experts, 1 shared + 6 routed) | 1 |
| MoE (128 experts, 6 active + 1 shared) | 1 |
| MoE (128 experts, 8 active + 1 shared) | 1 |
| MoE (128 experts, top-8) | 1 |
| MoE (16 experts, 1 active) | 1 |
| MoE (192 experts, 1 shared + 8 routed) | 1 |
| MoE (256 routed, 6 routed + 1 shared active) | 1 |
| MoE (288 experts, 1 shared + 8 active) | 1 |
| MoE (320 experts, 1 shared + 8 routed) | 1 |
| MoE (352 experts, 1 shared + 8 routed) | 1 |
| MoE (512 experts, 10 routed + 1 shared) | 1 |
| MoE (512 experts, 17B active) | 1 |
| MoE with shared expert | 1 |
| MoE without shared expert (256 experts, 8 active) | 1 |
| MTP | 1 |
| multi-head latent attention (MLA) + DeepSeek sparse attention | 1 |
| multi-head latent attention (MLA) with KV LayerNorm and Partial RoPE | 1 |
| nGPT residual | 1 |
| PolyNorm gated FFN | 1 |
| Pre-RMSNorm | 1 |
| Pre+Post-RMSNorm | 1 |
| QK-Norm | 1 |
| Qwen Sparse Attention (QSA) + gated GQA | 1 |
| recurrent depth loop | 1 |
| recurrent-depth loop | 1 |
| RoPE attention | 1 |
| sliding-window grouped-query attention (3:1 local:global) | 1 |
| sliding-window multi-head attention (3:1 local:global) | 1 |
| Sparse MLA | 1 |
| SWA GQA | 1 |
| SwiGLU (SiTU-GLU) FFN | 1 |
| SwiGLU expert FFN | 1 |
| SwiGLU shared experts | 1 |
| xLSTM with matrix memory (mLSTM) | 1 |

## 5. Custom requirements and expansion notes

No figure required a custom primitive or template under the expanded first-version vocabulary.


## 6. Validation elements for the three prototype figures

These are the features that issue #2 must demonstrate, in addition to overall visual similarity and standalone SVG export.

### DeepSeek-V3 (671B) (`deepseek-v3.webp`)

- **Templates:** T01, T02, T03, T05
- **Primitives:** P01, P02, P03, P04, P05, P06, P07, P08, P10, P11
- **Block kinds:** MLA, MoE, SwiGLU FFN, RMSNorm
- **Panels to reproduce:** Backbone stack, Repeated block (coral), Feed forward (SwiGLU) module inset, MoE layer inset, Resource savings note
- **Typography:** bold coral sans title, bold black headings, mixed-weight callouts with coral numerals, italic emphasis inside node label
- **Edges:** vertical flow arrows, orthogonal residual arrows, dotted diagonal callout leaders, dotted zoom frames
- **Special structures:** 61x repeated block brace, MLA dark block with italic 'latent', Partial RoPE side pill, first 3 blocks dense FFN hidden 18,432, MoE experts 1...256, 128 heads
- **Renderer note:** The reference DeepSeek-V3 figure: coral repeated block, MLA with inline italics, 256-expert MoE zoom, and four dotted leaders to capability annotations.

### Gemma 3 (27B) (`gemma-3-27b.webp`)

- **Templates:** T01, T02, T03
- **Primitives:** P01, P02, P03, P04, P05, P06, P07, P08
- **Block kinds:** GQA, sliding-window attention, GELU FFN, RMSNorm
- **Panels to reproduce:** Backbone stack, Repeated block (tan), Feed forward (GELU) module inset
- **Typography:** bold orange sans title, bold black headings, orange-outlined norm pills, mixed-weight callouts with orange numerals
- **Edges:** vertical flow arrows, orthogonal residual arrows, dotted diagonal callout leaders, dotted zoom frame
- **Special structures:** 62x repeated block brace, sandwich Pre/Post RMSNorm, 5:1 local:global sliding-window and GQA, QK-Norm and RoPE side pills, 32 heads / 16 KV heads, hidden layer 21,504
- **Renderer note:** Same component set as Gemma 3 270M with different scale labels; a single right-hand FFN zoom and four diagonal callouts.

### gpt-oss (120B) (`gpt-oss-120b.webp`)

- **Templates:** T01, T02, T03, T05
- **Primitives:** P01, P02, P03, P04, P05, P06, P07, P08, P10, P11
- **Block kinds:** GQA, MoE, SwiGLU FFN, RMSNorm
- **Panels to reproduce:** Backbone stack, Repeated block (purple), Feed forward (SwiGLU) module inset, MoE layer inset, Resource savings note
- **Typography:** bold violet sans title, bold black headings, mixed-weight callouts with violet numerals, bulleted note list
- **Edges:** vertical flow arrows, orthogonal residual arrows, dotted diagonal callout leaders, violet dotted zoom frames
- **Special structures:** 36x repeated block brace, RoPE side pill before GQA, MoE experts 1...128, 4 experts active per token, expert input and intermediate both 2,880, 64 heads, 5.1B active
- **Renderer note:** Single-side-pill variant (RoPE only) with matching expert input and intermediate dimensions; router MoE zoom is violet and uses 1/128 badges.

## 7. Items needing visual recheck

Medium/low confidence entries should be rechecked before any uncertain structure becomes a public component contract.

| Figure | Confidence | Reason / note |
|---|---|---|
| `deepseek-v4-1-flash.webp` | medium | Much denser than the single-backbone family: two blue towers with nested dotted repeat groups, side-fed Engram/Partial RoPE, and a separate mHC inset showing four parallel residual lanes. Renderer needs nested repeat frames and bundled multi-line arrows; some small labels are hard to read at source resolution. Normalized to the expanded vocabulary: P13, P16, T07, T08. |
| `ember-1.webp` | medium | Densest topology in this batch: pink depth-source bus enters both sublayers at W/alpha mixers, and dashed outlines mark the two sublayers inside the teal block. Small diamond and circled-operator glyphs require careful vector handling. Normalized to the expanded vocabulary: P13, T06. |
| `glm-5-4.webp` | medium | Unique recurrent-depth layout: stacked layer cards and a left-hand pass-1/pass-2 schematic feed a thick blue 'run these 28 layers again' loop into the middle block. Needs a loop connector that spans the backbone and a stacked-card primitive. Normalized to the expanded vocabulary: P14, T06. |
| `grok-2-5-270b.webp` | medium | Two stacked SwiGLU insets sit beside the numbered MoE inset; the attention node label is partly illegible, so treat the mixing block as RoPE-style attention. |
| `kimi-k3-1-pro.webp` | medium | The densest card in the batch: dashed sublayer frames, gate badges on skip edges, two vertical lane-style insets and a monospaced layer schedule all coexist, and the small schedule text is only partly legible. Normalized to the expanded vocabulary: P10, P13, P16, T06. |
| `kimi-k3.webp` | medium | Predecessor of K3.1 Pro with the same mint/pink two-tone grammar; the layer schedule is shorter and the second inset is KDA rather than sparse attention. Normalized to the expanded vocabulary: P10, P13, P16, T06. |
| `kimi-linear-48b-a3b.webp` | medium | Two mixing insets share the right column and both use tall Q/K/V lane columns; the layer split is a single monospace line under the insets rather than a table. Normalized to the expanded vocabulary: P16. |
| `qwen3-8-flash-next-125b-a6b.webp` | medium | Landscape figure; the hardest element is the labelled 12×12 sparse-attention matrix with vertical column headers and rounded highlight boxes, which motivated adding P15 and T09. Normalized to the expanded vocabulary: P13, P15, P16, T07, T09. |
| `soofi-s-30b-a3b.webp` | medium | Most structurally unusual figure in the batch: a two-level repeat hierarchy (52 layers × 7-layer macro blocks) plus a per-head Q/K/V lattice that motivated adding P09, P16, and T06. Normalized to the expanded vocabulary: P09, P16, T06. |
| `tencent-hy4-770b-a49b.webp` | medium | Dense composite: the mask-matrix inset with curved annotation arrows and the pipeline inset with terminal stubs both need custom handling; small matrix labels are hard to read at thumbnail size. Normalized to the expanded vocabulary: P13, P15, P16, T07, T09. |
| `tencent-hy4-preview-770b-a49b.webp` | medium | Near-duplicate of tencent-hy4-770b-a49b; only the repeat count and the top-left omission note differ, so a renderer should parameterise both. Normalized to the expanded vocabulary: P13, P15, P16, T07, T09. |

## 8. Full per-figure inventory

Template and primitive IDs refer to §2–3. Every one of the 132 reference figures has exactly one row.

| Figure | Model | Templates | Primitives | Special structures | Confidence |
|---|---|---|---|---|---|
| `antares-1b.webp` | Antares-1B | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 40x repeated block brace, RoPE side input pill, two residual merges, GQA 16 Q heads / 4 KV heads, SwiGLU inset with multiply junction | high |
| `arcee-ai-trinity-large-400b.webp` | Arcee AI Trinity Large (400B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 60x repeated block brace, first 6 blocks use dense FFN hidden 12,288, MoE inset with Router to numbered expert cards 1...256, shared plus routed experts note, 3:1 SWA ratio | high |
| `btl-3-27b.webp` | BTL-3 (27B) = Qwen3.6-27B base + rank-32 LoRA adapter | T01, T02, T03, T04, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P11, P12, P16 | 64x repeated block brace, partial RoPE side pill, two stacked mixing insets with Q/K/V and alpha/beta taps, layer schedule table Layer 1-4 and trailing ellipsis, gated DeltaNet conv+L2Norm path | high |
| `command-a-218b-a25b.webp` | Command A+ (218B-A25B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 32x repeated block brace, GQA and SWA combined in one attention block, MoE inset with numbered experts 1...128, 8 routed + 1 wide shared expert, 128 attention heads / 8 KV heads | high |
| `datology-xl-30b-a3b.webp` | Datology XL 30B-A3B | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 48x repeated block brace, QK-Norm and RoPE side pills, MoE inset with expert cards 1...128, 8 experts active, YaRN 64k from 8k pretraining | high |
| `deepseek-r1.webp` | DeepSeek-R1 (671B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 61x repeated block brace, MLA dark block with italic 'latent', Partial RoPE side pill, first 3 blocks use dense FFN hidden 18,432, MoE expert cards 1...256, 128 heads | high |
| `deepseek-v3-2.webp` | DeepSeek-V3.2 (671B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 61x repeated block brace, MLA plus DSA combined dark attention node, Partial RoPE side pill, first 3 blocks dense FFN hidden 18,432, MoE experts 1...256, 128 heads | high |
| `deepseek-v3.webp` | DeepSeek-V3 (671B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 61x repeated block brace, MLA dark block with italic 'latent', Partial RoPE side pill, first 3 blocks dense FFN hidden 18,432, MoE experts 1...256, 128 heads | high |
| `deepseek-v4-1-flash.webp` | DeepSeek-V4.1-Flash (552B) | T01, T02, T03, T05, T07, T08 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11, P12, P13, P16 | dual encoder/decoder towers, nested x3/x4 repeat groups, Engram side input from encoder blocks 2 and 15, hierarchical sparse indexer and candidate pool, mHC 4 parallel residual streams, MoE experts 1...384 | medium |
| `deepseek-v4-flash.webp` | DeepSeek-V4-Flash (284B) | T01, T02, T03, T05, T07 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11, P13, P16 | 43x repeated block brace, mHC pre/post wrappers around attention and MoE, mHC head 4-to-1 at output, CSA interleaved with HCA, first 2 layers SWA only, first 3 blocks hash-based MoE, MoE experts 1...256, 4 parallel residual streams inset | high |
| `deepseek-v4-pro.webp` | DeepSeek-V4-Pro (1.6T) | T01, T02, T03, T05, T07 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11, P13, P16 | 61x repeated block brace, mHC pre/post wrappers, mHC head 4-to-1, CSA interleaved with HCA, first 2 layers HCA plus SWA, first 3 blocks hash-based MoE, MoE experts 1...384, 4 parallel residual streams inset | high |
| `domyn-edge-3-93b.webp` | Domyn Edge (3.93B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 36x repeated block brace, sandwich Pre-RMSNorm + Post-RMSNorm around attention and FFN, QK-Norm and Local RoPE / Global NoPE side pills, tied input/output weights, FFN width 9,728 | high |
| `dory1-0-4b.webp` | Dory1.0 (4B) | T01, T02, T03, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P14 | separate 8-block input and output blocks, 20x repeated group executed twice with shared weights, L2 norm(state + input) reinjection, nGPT residual 1 and 2 nodes, 36 distinct blocks / 56 block applications, 3:1 sliding-window/full attention | high |
| `ember-1.webp` | Ember-1 (2.8T) | T01, T02, T03, T04, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P11, P12, P13 | 93x repeated block brace, Depth sources panel feeding W and alpha mixers, current and updated group sums, 8 AttnRes blocks: 7x12 layers plus one 9-layer block, layer 1 dense, layers 2-93 LatentMoE, vision component omitted note, KDA conv+L2Norm path | medium |
| `ernie-5-5-flash-base.webp` | ERNIE-5.5-Flash-Base (280B) | T01, T02, T03, T05, T07 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11, P13, P16 | 43x repeated block brace, MultiMax output plus mHC 4-to-1 head, 37 HCA layers plus 6 MLA/DSA layers, two sigmoid routers selecting top-10 of 512, layer 1 dense FFN, layers 2-43 latent MoE, shared expert at 4,096, 4 parallel residual streams inset | high |
| `gemma-3-270m.webp` | Gemma 3 (270M) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 18x repeated block brace, sandwich Pre/Post RMSNorm around both sublayers, 5:1 local:global sliding-window and GQA, QK-Norm and RoPE side pills, multi-query attention note, 4 heads / 1 KV head | high |
| `gemma-3-27b.webp` | Gemma 3 (27B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 62x repeated block brace, sandwich Pre/Post RMSNorm, 5:1 local:global sliding-window and GQA, QK-Norm and RoPE side pills, 32 heads / 16 KV heads, hidden layer 21,504 | high |
| `gemma-4-12b.webp` | Gemma 4 (12B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 48x repeated block brace, sandwich Pre/Post RMSNorm, Partial RoPE global plus Full RoPE local side pill, 5:1 local:global attention ratio, local 16 heads / 8 KV, global 16 heads / 1 KV | high |
| `gemma-4-26b-a4b.webp` | Gemma 4 (26B-A4B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 30x repeated block brace, sandwich Pre/Post RMSNorm, MoE replaces dense FFN in block, router fan-out to experts 1...128, 8 experts plus 1 shared active, 5:1 local:global GQA, intermediate hidden 704 | high |
| `gemma-4-31b.webp` | Gemma 4 (31B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 60x repeated block brace, sandwich Pre/Post RMSNorm, Partial/Full RoPE side pill, 5:1 local:global ratio, local 32/16 heads, global 32/4 heads, input and intermediate dims 5,376 / 21,504 | high |
| `gemma-4-e2b.webp` | Gemma 4 E2B | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 35x repeated block brace, Per-Layer Embeddings node above block entry, sandwich Pre/Post RMSNorm, layers 1-15 FFN width 6,144, layers 16-35 width 12,288, 4:1 local:global ratio, 8/1 heads local and global | high |
| `gemma-4-e4b.webp` | Gemma 4 E4B | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 42x repeated block brace, Per-Layer Embeddings node above block entry, sandwich Pre/Post RMSNorm, 5:1 local:global ratio, 8/2 heads local and global, input 2,560 / intermediate 10,240 | high |
| `glm-4-5-355b.webp` | GLM-4.5 (355B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 92x repeated block brace, QK-Norm and Partial RoPE side pills, first 3 blocks dense FFN hidden 12,288, router MoE with experts 1...160, 8 experts plus 1 shared active, input expert 5,120 / intermediate 1,536 | high |
| `glm-4-5-air.webp` | GLM-4.5-Air (106B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 46x repeated block brace, Partial RoPE side pill only (no QK-Norm), first block dense FFN hidden 10,944, router MoE with experts 1...128, 8 experts plus 1 shared, input 4,096 / intermediate 1,408 | high |
| `glm-4-7-355b.webp` | GLM-4.7 (355B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 92x repeated block brace, QK-Norm and Partial RoPE side pills, first 3 blocks dense FFN hidden 12,288, MoE experts 1...160, 8 experts plus 1 shared, context 202,752 tokens | high |
| `glm-5-1.webp` | GLM-5.1 (744B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 78x repeated block brace, MLA plus DSA in one dark block, Partial RoPE side pill, first 3 blocks dense FFN hidden 12,288, MoE experts 1...256, 8 experts plus 1 shared, 40B active | high |
| `glm-5-2.webp` | GLM-5.2 (744B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 78x repeated block brace, MLA plus DSA with IndexShare, Partial RoPE side pill, first 3 blocks dense FFN hidden 12,288, MoE experts 1...256, 1M token context | high |
| `glm-5-3-flash.webp` | GLM-5.3-Flash (320B-A18B) ("Ox Alpha") | T01, T02, T03, T05, T07 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11, P13, P16 | 45x repeated block brace, mHC mixer before and after each sublayer, MLA+DSA or KDA alternative attention, NoPE in MLA Q/K side pill, 34 KDA + 11 MLA/DSA layers, first 3 blocks dense SwiGLU, MoE experts 1...288, 4 parallel residual streams inset | high |
| `glm-5-4.webp` | GLM-5.4 (~750B) | T01, T02, T03, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P14 | 28x repeated middle-layer brace, stacked before/after loop layer cards, 26 + 28 + 24 = 78 distinct layers / 106 applications, pass 2 reuses sparse indices and KV, layers 1-26 before loop, 55-78 after, MoE experts 1...256, GLM-5 base 744B / 40B active | medium |
| `glm-5-744b.webp` | GLM-5 (744B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 78x repeated block brace, MLA plus DSA dark attention node, Partial RoPE side pill, first 3 blocks dense FFN hidden 12,288, MoE experts 1...256, 8 experts plus 1 shared, context 202,752 | high |
| `gpt-2-xl-1-5b.webp` | GPT-2 XL (1.5B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 48x repeated block brace, pre-LayerNorm with dropout after attention and FFN, Masked multi-head attention 25 heads, learned absolute positional embedding layer separate from token embedding, LayerNorm final | high |
| `gpt-oss-120b.webp` | gpt-oss (120B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 36x repeated block brace, RoPE side pill before GQA, MoE experts 1...128, 4 experts active per token, expert input and intermediate both 2,880, 64 heads, 5.1B active | high |
| `gpt-oss-20b.webp` | gpt-oss (20B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P10, P11 | 24x repeated block brace, RoPE side pill, MoE experts 1...32, 4 experts active, 3.6B active, expert input/intermediate 2,880 | high |
| `granite-4-1-30b.webp` | Granite 4.1 (30B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | QK-Norm and RoPE pills mounted on the left face of the attention node, two pre-RMSNorm stages inside the block, heads, embedding and FFN dimensions only given as margin callouts | high |
| `grok-2-5-270b.webp` | Grok 2.5 (270B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | dense FFN pill stacked directly above the MoE pill inside the block, numbered expert slots 1 and 8 with an ellipsis between them, resource-savings bullet list as a structured note block | medium |
| `inkling-2-mini.webp` | Inkling 2 Mini (26.4B) | T01, T02, T03, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P13, P14 | three-pass loop drawn as a top-left strip of offset pass rows (6 + 12 + 6 layers), 12x per-pass brace and a 19-24 layer card offset behind the block, W and alpha gate badges on depth-source skip edges, 128 expert slots with ellipsis | high |
| `inkling-2-small.webp` | Inkling 2 Small (594B) | T01, T02, T03, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P13, P14 | AttnRes panel lists token embeddings, earlier block sums and current group sum feeding a sum, short conv (kernel 3) node inside the attention block, 48 layer applications from 24 distinct blocks, 384 expert slots with ellipsis | high |
| `inkling.webp` | Inkling (975B) | T01, T02, T03, T04, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | two short-conv sub-blocks (kernel 4 and kernel 3) inside one repeating unit, K/V head callouts on the left edge, dense FFN used in the first layers while the rest of the block is MoE, 256 expert slots with ellipsis | high |
| `instella-moe-16b-a3b.webp` | Instella-MoE (16B-A3B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P09, P10, P11, P12, P14 | FarSkip-Collective arrow leaves the block and rejoins as 'To next attention', extra dense decoder layer node between embedding and the repeated block, shared expert and routed experts merged separately with two plus nodes, sigmoid gate before the output projection, partial RoPE on 32/128 dims | high |
| `intellect-3.webp` | INTELLECT-3 (106B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | first block uses a dense FFN instead of MoE, single shared plus 8 routed experts active, 128 expert slots with ellipsis under the MoE inset | high |
| `jetbrains-mellum2-thinking-12b-a2-5b.webp` | JetBrains Mellum2 (12B-A2.5B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P17 | 3:1 sliding-window to global attention ratio noted inside the attention node, RoPE/YaRN pill and QK-Norm pill stacked on the left, 64 expert slots with ellipsis | high |
| `kimi-k2-5.webp` | Kimi K2.5 (1T) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | first block uses a dense FFN with hidden size 18,432 instead of MoE, 1 shared plus 8 experts active per token, 384 expert slots with ellipsis, single 61x badge under the block with no brace | high |
| `kimi-k2-6.webp` | Kimi K2.6 (1T) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P17 | pink-to-lavender gradient fill on the repeated block, partial RoPE called out inside the MLA node, 384 expert slots with ellipsis, dense first block with 18,432 hidden size | high |
| `kimi-k2-7-code.webp` | Kimi K2.7 Code (1T) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P17 | lavender-to-pink gradient block, dense first block with 18,432 hidden size, 384 expert slots with ellipsis, 1 shared plus 8 active experts | high |
| `kimi-k2.webp` | Kimi K2 (1T) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | flat green block with a single 61x badge, dense first block with hidden size 18,432, 384 expert slots with ellipsis, YaRN context 128k with 4k RoPE base | high |
| `kimi-k3-1-pro.webp` | Kimi K3.1 Pro (2.8T) | T01, T02, T03, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P12, P10, P13, P16 | two dashed pink sublayer frames with rotated names inside the block, AttnRes depth-source panel with W and alpha gate badges plus a grouped sum, two tall dotted insets for DSA and KDA with Q/K/V lane columns, bottom layer schedule: 1 dense, 2-93 LatentMoE, 69 KDA + 24 DSA | medium |
| `kimi-k3.webp` | Kimi K3 (2.8T) | T01, T02, T03, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P12, P10, P13, P16 | KDA or gated MLA branching inside the attention node, AttnRes depth sources with W and alpha badges, 3:1 ratio note with a per-layer schedule list, 93x badge with brace at block bottom | medium |
| `kimi-linear-48b-a3b.webp` | Kimi Linear (48B-A3B) | T01, T02, T03, T04 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P16 | two stacked dotted insets (MLA above, KDA below) both zoomed from one attention node, MoE node drawn without any detail inset, monospace split note: 20 KDA layers and 7 MLA layers with the MLA layer indices | medium |
| `kolibri-1-78b.webp` | Kolibri-1 (78B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | four separate norm nodes (pre and post around both sublayers) with four merge points, QK-Norm and RoPE+NoPE pills beside the attention node, 384 expert slots with ellipsis, 48 Q heads vs 4 KV heads | high |
| `laguna-s-2-1.webp` | Laguna S 2.1 (118B-A8B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P17 | dotted green MoE inset with numbered slots 1 and 256, QK-Norm pill plus a two-line RoPE pill on the attention node, gradient block fill (lighter at top), first layer uses a dense FFN with hidden size 8,192 | high |
| `laguna-xs-2-1.webp` | Laguna XS 2.1 (33B-A3B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | flat green block with 40x badge, numbered MoE slots 1 and 256 with ellipsis, first layer uses a dense FFN with hidden size 8,192, 8 routed plus 1 shared expert | high |
| `laguna-xs-2.webp` | Laguna XS.2 (33B-A3B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | visually identical to XS 2.1 apart from the 4k RoPE base and title, flat green block with 40x badge, numbered MoE slots 1 and 256, first layer dense FFN with hidden size 8,192 | high |
| `lfm2-5-1-2b.webp` | LFM2.5 (1.2B) | T01, T02, T03, T04, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P16 | three nested group frames labelled 1x, 3x and 3x down the left edge, 16x Layers brace under the innermost group, colored pill nodes: green convolution, salmon attention, q/k/v cell head grid (blue q, red k, orange v) | high |
| `lfm2-5-350m.webp` | LFM2.5 (350M) | T01, T02, T03, T04, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P16 | 1x / 3x / 3x nested group frames plus a 16x Layers brace, 16 Q and 8 K/V heads with the same q/k/v cell grid, solid black FFN inset frame with a multiply junction | high |
| `lfm2-5-8b-a1b.webp` | LFM2.5 (8B-A1B) | T01, T02, T03, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P16 | 2x, 4x and 1x groups inside a 24x Layers brace, no SwiGLU inset; the block only gets a MoE inset, 32 expert slots with 1 and 32 badges and an ellipsis, 4 experts active per token as a wrapped side note | high |
| `lfm3-1-7b.webp` | LFM3 (1.7B) | T01, T02, T03, T04, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P16 | three pill colors: green ShortConv, salmon global GQA, blue SWA GQA, 1x / 5x / 1x groups inside a 24x Layers brace, partial RoPE (global) with 16 Q and 4 K/V heads in the grid caption | high |
| `ling-2-5-1t.webp` | Ling-2.5 (1T) | T01, T02, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P11, P12 | tall monospace layer table on the right with layers 1-16 plus ellipsis, superscript 1 and 2 footnote legend beneath the table, MoE node has no detail inset, expert counts given only in the top-left callout | high |
| `ling-2-6-1t.webp` | Ling-2.6 (1T) | T01, T02, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P11, P12 | MTP layer pill above the block feeding the output path, saturated orange block instead of tan, monospace layer table with footnote legend, MoE without inset | high |
| `ling-3-0-flash.webp` | Ling-3.0-flash (124B-A5.1B) | T01, T02, T03, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P12, P16 | two stacked dotted insets with pink MLA bar and cream Gated Delta Rule bar, sigmoid gate circles at the top-right of each inset, 5:1 KDA to gated MLA schedule as monospace lines, dense FFNs only in layers 1-2 | high |
| `ling-3-1-flash.webp` | Ling-3.1-flash (560B-A25B) | T01, T02, T03, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P12, P16 | 7:1 KDA to gated MLA schedule with repeat-9-times note, dense FFNs in the first four layers, 72x badge with brace, extra per-layer size lines (expert intermediate, MLA ranks) | high |
| `llama-3-2-1b.webp` | Llama 3.2 (1B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | one dotted FFN inset only, no attention inset, RoPE pill attached to the attention node, 16x badge with brace, all dimensions in the right margin | high |
| `llama-3-2-3b.webp` | Llama 3.2 (3B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 28x badge with brace, 24 heads vs 32 heads in the 1B sibling, embedding dimension 3,072 while hidden stays 8,192 | high |
| `llama-3-8b.webp` | Llama 3 (8B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | dark gray block fill with blue inline emphasis on 'grouped-query', 32x badge with brace, hidden 14,336 and embedding 4,096 in the margin | high |
| `llama-4-maverick.webp` | Llama 4 Maverick (400B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | RoPE/NoPE pill on the attention node with a NoPE-every-4th-layer margin note, 128 expert slots with 1 and 128 badges and an ellipsis, dense and MoE blocks alternate every second block, 48x badge with brace | high |
| `longcat-2-5-1-6t-a48b.webp` | LongCat-2.5 (1.6T-A48B) | T01, T02, T03, T04, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P11, P12 | two attention sublayers with four RMSNorms and four merges in one block, Shortcut MoE node on the right whose arrow joins the second merge, 768 FFN plus 128 identity experts, 12 selected per token, token + N-gram embedding node at the block base | high |
| `longcat-flash-lite-68-5b-a3b.webp` | Meituan LongCat-Flash-Lite (68.5B-A3B) | T01, T02, T03, T04, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P11, P12 | 14x badge with brace, Shortcut MoE side node joining the second merge, 256 FFN plus 128 identity experts, 12 selected per token, N-gram table adds 31.4B parameters (46% of total) as a callout | high |
| `marin-mochi-535b-a23b.webp` | Marin Mochi (535B-A23B) | T01, T02, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | 48× brace repeat on the inner block, dark highlighted mixing node, expert cards badged 1…8 and 1…384, shared-expert box bypassing the router, Step 1-5 numbered narrative inside the zoom panel | high |
| `minimax-m2-230b.webp` | MiniMax-M2 (230B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | 62× brace repeat, dark highlighted attention node, expert cards badged 1 and 256 with dotted omission, SwiGLU multiply junction | high |
| `minimax-m2-5-230b.webp` | MiniMax-M2.5 (230B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | 62× brace repeat, dark highlighted attention node, expert cards badged 1 and 256 with dotted omission, SwiGLU multiply junction | high |
| `minimax-m2-7-230b.webp` | MiniMax-M2.7 (230B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P17 | 62× brace repeat, orange-to-red vertical gradient on the repeated block, dark highlighted attention node, expert cards badged 1 and 256 with dotted omission, SwiGLU multiply junction | high |
| `minimax-m3-1-flash-428b.webp` | MiniMax-M3.1-Flash (428B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P17 | 60× brace repeat, first 3 blocks use dense FFN at 12,288 intermediate size, expert cards badged 1 and 128 with dotted omission, shared expert noted in bullets only, gradient container fill, parenthetical subtitle excludes the vision encoder and DSpark draft head | high |
| `minimax-m3-428b.webp` | MiniMax-M3 (428B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P17 | 60× brace repeat, first 3 blocks use dense FFN with GQA at 12,288 hidden size, expert cards badged 1 and 128 with dotted omission, shared expert noted textually | high |
| `mistral-large-3.webp` | Mistral Large 3 (673B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | 61× brace repeat, first 3 blocks use dense FFN at hidden size 16,384, expert cards badged 1 and 128 with dotted omission, 128 heads annotated at the block input, two zoom targets from one backbone | high |
| `mistral-large-4.webp` | Mistral Large 4 (1T-A52B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | 72× brace repeat, attention node is a multi-line stack of MLA + DSA text, first block uses dense FFN at intermediate size 24,576, expert cards badged 1 and 128 with dotted omission, 64 heads callout at block base | high |
| `mistral-small-3-1-24b.webp` | Mistral Small 3.1 (24B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 40× brace repeat, norm nodes highlighted with orange outline, inset panel has no title, only Leader lines, dense model with no MoE panel | high |
| `mistral-small-4.webp` | Mistral Small 4 (119B-A6B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | 36× brace repeat, expert cards badged 1 and 128 with dotted omission, 32 heads callout, dimension note between the two insets | high |
| `motif-3-beta.webp` | Motif-3-Beta (314B-A13B) | T01, T02, T03, T05, T07 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P13, P16 | 53× brace repeat, 4 parallel residual streams replacing plain residual, mHC mixer before and after each sublayer, first 2 blocks use dense FFNs, expert cards badged 1 and 384, third inset explains the mixer wiring | high |
| `muse-glimmer-30b.webp` | Muse Glimmer (30B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 52× brace repeat, Pre-RMSNorm and Post-RMSNorm pair around each sublayer, lowercase scale-less RMSNorm between embedding and block, 3:1 local/global attention ratio annotated, dense model with a single untitled FFN inset | high |
| `muse-spark-open-816b-a42b.webp` | Muse Spark Open (816B-A42B) | T01, T02, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | 62× brace repeat, merge labels reading Gated blend, Scale then RMSNorm chain at block top, expert cards badged 1...8 and 1...256, Sigmoid router, no shared expert, FP32 residual stream noted | high |
| `naive-n0-5-flash-309b.webp` | Naive-N0.5-Flash (309B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | 48× brace repeat, attention node carries three-line hybrid text with two-tone emphasis, first block uses DSA and dense FFN at hidden size 16,384, expert cards badged 1 and 256 with dotted omission | high |
| `nanbeige-4-1-3b.webp` | Nanbeige4.1 (3B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 32× brace repeat, Q/KV head-group ratio 20 Q / 4 KV, dense model with one untitled inset | high |
| `nanbeige-4-2-3b.webp` | Nanbeige4.2 (3B) | T01, T02, T03, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P14 | 22× brace repeat with a separate 'repeat once with same 22-layer weights' loop, 22 distinct layers, 44 total layers, Q/KV head-group ratio 48 Q / 8 KV, dense model with one untitled inset | high |
| `nanbeige-4-3-33b.webp` | Nanbeige4.3 (33B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 52× brace repeat, Q/KV head-group ratio 56 Q / 8 KV, dense model with one untitled inset, very large context figure in the margin | high |
| `nemotron-3-5-lightning-30b-a3b.webp` | Nemotron 3.5 Lightning (30B-A3B) | T01, T04, T05, T06 | P01, P02, P03, P04, P06, P07, P08, P09, P10, P11, P16 | color-coded stacked layer schedule with repeat counts, 5 macro blocks with 7 layers each, GQA drawn as a Q/K/V head grid (4 Q, 2 KV), Mamba-2 contains a multiply merge and SiLU gate symbol, no explicit residual edges drawn | high |
| `nemotron-3-5-super-vl-120b-a12b.webp` | Nemotron 3.5 Super VL (120B-A12B) | T01, T04, T05, T06 | P01, P02, P03, P04, P06, P07, P08, P09, P10, P11, P16 | nested repeat labels (4×, 4×, 3×, 3×) inside macro blocks, 88-layer hybrid stack: 40 Mamba-2 + 40 LatentMoE + 8 Attention, LatentMoE inset has shared expert bypass and Step 1-5 narrative, GQA inset drawn as Q/K/V head grid | high |
| `nemotron-3-nano-30b-a3b.webp` | Nemotron 3 Nano (30B-A3B) | T01, T04, T05, T06 | P01, P02, P03, P04, P06, P07, P08, P09, P10, P11, P16 | color-coded layer schedule with 5×/3×/1×/4× repeats, 5 macro blocks with 7 layers each, GQA head grid (4 Q, 2 KV), Mamba-2 multiply merge and SiLU gate, 1M supported context noted | high |
| `nemotron-3-nano-4b.webp` | Nemotron 3 Nano (4B) | T01, T03, T04, T06 | P01, P02, P03, P04, P06, P07, P08, P09, P16 | layer schedule with 3×/3×/3×/2×/2×/3× repeat groups, some repeated pairs wrapped in their own rounded container, plain 3-node ReLU² FFN inset with no multiply branch, GQA drawn as Q/K/V head grid | high |
| `nemotron-3-super-120b-a12b.webp` | Nemotron 3 Super (120B-A12B) | T01, T04, T05, T06 | P01, P02, P03, P04, P06, P07, P08, P09, P10, P11 | multi-token prediction noted above the output, nested repeat counts 4×/4×/3×/3×, 88-layer stack: 40 Mamba-2 + 40 LatentMoE + 8 Attention, LatentMoE shared-expert bypass | high |
| `nemotron-3-ultra-550b-a55b.webp` | Nemotron 3 Ultra (550B-A55B) | T01, T04, T05, T06 | P01, P02, P03, P04, P06, P07, P08, P09, P10, P11 | 108× repeat with nested macro-block grouping (outer 4× containing 1×/3×/1×/2×/1×/3×), 108-layer stack: 48 Mamba-2 + 48 LatentMoE + 12 Attention, dotted omission inside one macro block, each inset border color matches its title color | high |
| `north-mini-code-30b-a3b.webp` | North Mini Code (30B-A3B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P16 | 49× brace repeat, one RMSNorm feeding two parallel branches (attention and MoE) merged at a single circled-plus junction, attention node stacks GQA plus SWA in one dark multi-line block, first block uses dense FFN at intermediate size 3,072, expert cards badged 1 and 128 with dotted omission | high |
| `nous-research-arete-27b.webp` | Nous Research Arete (27B) | T01, T02, T04, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P11, P12, P17 | 64× brace repeat, two separate attention insets (full and linear) feeding one node, gradient container fill, bottom monospaced 3:1 layer schedule table ending in ellipsis, norm placement varies between the two insets | high |
| `olala-v1-0-mini-7a1b.webp` | Olala v1.0 Mini (7A1B) | T01, T02, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P12 | 36× brace repeat, norm-into-residual wiring without merge symbols, single dark node covering two layer kinds with counts, Latent MoE has routed and shared branches merged at one plus, right margin holds titled prose spec blocks | high |
| `olmo-2-7b.webp` | OLMo 2 (7B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 32× brace repeat, post-norm placement (norm sits between residual and sublayer), QK-Norm and RoPE enter the attention node from the left, regular MHA, no GQA grouping | high |
| `olmo-3-32b.webp` | OLMo 3 (32B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 64× brace repeat, post-norm placement, two dotted leaders leave the same attention node (window size and head counts), multi-line mixing node with two-tone emphasis | high |
| `olmo-3-7b.webp` | OLMo 3 (7B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 32× brace repeat, post-norm placement, two dotted leaders from the attention node, regular MHA with 32 Q and 32 KV heads | high |
| `ornith-1-5-35b-a3b.webp` | Ornith 1.5 (35B-A3B) | T01, T02, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P11, P12, P17 | 40× brace repeat, two attention insets attached to one node, Expert count and active-parameter stat stacked above the block, monospaced 3:1 layer schedule table ending in ellipsis, gated softmax and gated delta-rule cores | high |
| `ouro-thinking-2-6b.webp` | Ouro-Thinking (2.6B) | T01, T02, T03, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P12, P14 | 48× brace repeat plus a separate 3× weight-reuse loop, Pre-RMSNorm and Post-RMSNorm pairs per sublayer, exit-gate merge (circle-dot symbol) just before the output layer, 48 distinct layers but 192 total layers, prose note explains the learned exit gate | high |
| `phi-4.webp` | Phi-4 (14B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 40× brace repeat, pre-norm layout with RMSNorm 1 and RMSNorm 2 inside the block, single RoPE input arrow into the attention node, 40 Q heads / 10 KV heads | high |
| `qwen3-0-6b.webp` | Qwen3 (0.6B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | 28× brace repeat, pre-norm layout with RMSNorm 1 and RMSNorm 2, QK-Norm and RoPE enter the attention node separately from the left, small model with a single dense FFN inset | high |
| `qwen3-235b-a22b.webp` | Qwen3 (235B-A22B) | T01, T02, T03, T04, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | GQA and FFN/MoE zoomed into separate dotted insets, 128 experts with 8 active, 94× brace repeat marker beside block panel, expert index badges 1 and 128 with ellipsis between | high |
| `qwen3-30b-a3b.webp` | Qwen3 (30B-A3B) | T01, T02, T03, T04, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | identical layout to the 235B sibling, only counts differ (48×, 3B active, hidden 768), 128 experts with 8 active | high |
| `qwen3-32b.webp` | Qwen3 (32B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | Pre-RMSNorm labels instead of RMSNorm, two side boxes (QK-Norm, RoPE) feeding the attention block with arrows, 64× brace repeat marker | high |
| `qwen3-4b.webp` | Qwen3 (4B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | attention labelled 'Masked grouped-query attention', 32 heads with no KV split stated, 36× brace repeat marker | high |
| `qwen3-5-397b.webp` | Qwen3.5 (397B) | T01, T02, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P11, P12 | two large mixing insets sharing identical bottom-row skeleton, gate path drawn right of the attention core into a ⊗, QK-Norm label bound to the Q/K branches, 3:1 schedule table with trailing ellipsis row | high |
| `qwen3-6-27b.webp` | Qwen3.6 (27B) | T01, T02, T04, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P11, P12 | dense FFN variant of the Qwen3.6 skeleton, two mixing insets with identical bottom-row skeleton, 3:1 schedule table with trailing ellipsis | high |
| `qwen3-6-35b-a3b.webp` | Qwen3.6 (35B-A3B) | T01, T02, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P11, P12 | MoE block with no expert-level inset, only a left-margin 256 experts / 3B active callout, 3:1 schedule table with trailing ellipsis | high |
| `qwen3-8-27b.webp` | Qwen3.8 (27B) | T01, T02, T04, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P11, P12, P17 | block panel fill is a top-down blue→purple gradient, top annotation '(Vision encoder and MTP head omitted)' | high |
| `qwen3-8-flash-next-125b-a6b.webp` | Qwen3.8-Flash-Next (125B-A6B) | T01, T02, T04, T05, T07, T09 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P12, P13, P15, P16 | token-by-token 0/1 attention mask matrix in three block columns, blue rounded outline highlighting repeated mask rows, 4× residual branches annotated in the block column, GR Read / GR Write pills interleaved between MoE and attention, N-gram (bigram/trigram) embedding callout at layer 2 | medium |
| `qwen3-8b.webp` | Qwen3 (8B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | Pre-RMSNorm labels, QK-Norm and RoPE side boxes wired into the attention block, 36× brace repeat marker | high |
| `qwen3-coder-flash-30b-a3b.webp` | Qwen3-Coder-Flash (30B-A3B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | MoE inset border and Router outline use the blue accent while the FFN inset uses black dots, expert badges 1 (dark) and 128 (blue) with ellipsis, single shared zoom assembly feeding both insets | high |
| `qwen3-next-80b-a3b.webp` | Qwen3-Next (80B-A3B) | T01, T02, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P11, P12 | no tokenizer/embedding callouts, so the left margin has a single context-length note, 3:1 schedule table with trailing ellipsis, MoE block without an expert inset | high |
| `recursive-flint-40b-a2-5b.webp` | Recursive Flint (40B-A2.5B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | single combined 'FFN / MoE' block, two Pre-RMSNorm nodes (no RMSNorm 2 label), expert index badges 1 and 256 in dark gray, callout stacks at all four corners of the canvas | high |
| `reflection-beam-501b.webp` | Reflection Beam (501B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | sandwich norm: Pre-RMSNorm and Post-RMSNorm on both sublayers, three annotation boxes (QK-Norm, RoPE + NoPE, Gated attention) stacked at the left, MoE inset titled 'no shared' | high |
| `sarvam-105b.webp` | Sarvam (105B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P17 | decoder-block fill is an orange→periwinkle vertical gradient, attention block itself filled saturated orange with bold white label, three separate left annotations for head dims, uncompressed dim and latent dim, expert badges 1 (gray) and 128 (orange) | high |
| `sarvam-30b.webp` | Sarvam (30B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P17 | same pair of insets as Sarvam 105B but with GQA instead of MLA, expert badges 1 and 128 in gray/orange, dense first block noted at bottom-left | high |
| `smollm3-3b.webp` | SmolLM3 (3B) | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | separate NoPE and RoPE boxes joined with '+' before the attention block, dense model with a single FFN inset, 36× brace repeat marker | high |
| `solar-open-2.webp` | Solar Open (250B-A15B) | T01, T02, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | landscape canvas with insets stacked in a right column, schedule table ends with 'Repeat ×12' instead of an ellipsis, single NoPE box feeding attention, no FFN/embedding callouts at all | high |
| `soofi-s-30b-a3b.webp` | Soofi S (30B-A3B) | T01, T02, T04, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P16 | hybrid stack built from a repeating MoE+Mamba-2 macro block with 5×, 3×, 1×, 4× groups, dashed second container for the macro-block group, GQA head diagram with V, K and Q columns and bracket joins, dotted brace repeat marker for 52 layers | medium |
| `step-3-5-flash-196b.webp` | Step 3.5 Flash (196B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | attention label stacks GQA and SWA with a plus sign, two-line RoPE annotation box (Partial RoPE global / Full RoPE local), expert badges 1 (dark) and 288 (blue) | high |
| `step-5-preview-600b.webp` | Step-5-Preview (~600B) | T01, T02, T03, T05, T06 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | separate NoPE box plus 'Partial RoPE (global) / Full RoPE (local)' box feeding attention, schedule table with two lettered row variants (3× SWA+MoE vs full attention+MoE), expert badges 1 and 352 | high |
| `tencent-hy3-preview-295b-a21b.webp` | Tencent Hy3-preview (295B-A21B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | top-left note about one extra MTP layer with 3.8B parameters, bright blue block fill with an inner black outline, expert badges 1 (dark) and 192 (blue) | high |
| `tencent-hy4-770b-a49b.webp` | Tencent Hy4 (770B-A49B) | T01, T02, T03, T04, T05, T07, T09 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P12, P13, P15, P16 | landscape canvas, three-token mask matrix with 'The model attends to past tokens' captions, iHC inset drawn as a 4-stage pipeline with bracket terminals, separate 5-layer DFly2 drafter note at top-left | medium |
| `tencent-hy4-preview-770b-a49b.webp` | Tencent Hy4-preview (770B) | T01, T02, T03, T04, T05, T07, T09 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P12, P13, P15, P16 | same composition as the Hy4 sibling with 78× instead of 60×, '(MTP prediction layer omitted)' note replaces the drafter caption, iHC inset drawn as a 4-stage pipeline | medium |
| `tiny-aya-3-35b.webp` | Tiny Aya (3.35B) | T01, T02, T03, T04 | P01, P02, P03, P04, P05, P06, P07, P08, P16 | post-LayerNorm position (norm sits before the split, not before each sublayer), attention and FFN drawn side by side as parallel branches, RoPE + NoPE combined in one input box, 36× brace repeat marker | high |
| `vibethinker-3b.webp` | VibeThinker-3B | T01, T02, T03 | P01, P02, P03, P04, P05, P06, P07, P08 | single RoPE box feeding attention, 36× brace repeat marker, the callouts are scattered to five separate corners | high |
| `xiaomi-mimo-v2-5-310b.webp` | Xiaomi MiMo-V2.5 (310B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | top subtitle listing omitted encoders and 3 MTP layers, attention block uses inline orange emphasis for (GQA) and (SWA), dotted MoE inset border follows the orange accent, expert badges 1 (dark) and 256 (orange) | high |
| `xiaomi-mimo-v2-5-pro-1-02t.webp` | Xiaomi MiMo-V2.5-Pro (1T) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | dense first block with hidden size 16,384 called out in orange, expert badges 1 and 384, 70× brace repeat marker | high |
| `xiaomi-mimo-v2-6-flash-rl-309b.webp` | Xiaomi MiMo-V2.6-Flash (309B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | top subtitle noting omitted encoders and the 5-layer DFlash speculative decoder, native context 1M tokens in the left margin, expert badges 1 and 256 | high |
| `xiaomi-mimo-v2-6-pro-rl-1-02t.webp` | Xiaomi MiMo-V2.6-Pro (1T) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | identical frame to V2.6-Flash but 70× and 384 experts, embedding dimension 6,144 instead of 4,096, expert badges 1 and 384 | high |
| `xiaomi-mimo-v2-flash-309b.webp` | Xiaomi MiMo-V2-Flash (309B) | T01, T02, T03, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12 | context noted as 32k pretraining / 256k trained, no 6:1 ratio text, plain GQA + SWA label, expert badges 1 and 256 | high |
| `xlstm-7b.webp` | xLSTM (7B) | T01, T02, T03, T04 | P01, P02, P03, P04, P05, P06, P07, P08, P12, P16 | wide horizontal mLSTM band with five labelled input stubs, inner σ and exp operator pills on the gate path, RMSNorm inside the mLSTM inset above a ⊗, context described as '8k training / No fixed limit', inset carries a short secondary note in small type | high |
| `zaya1-8b.webp` | ZAYA1 (8B) | T01, T02, T03, T04, T05 | P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P17 | decoder-block fill is a vertical orange→yellow→green gradient, title says 8B while the bullet says 8.4B model size, expert badges 1 (dark) and 16 (orange), only one routed expert active per token | high |

## 9. Acceptance checklist for issue #1

- [x] All 132 figures have a classification record (§8).
- [x] Deduplicated primitive and composite-template vocabularies are defined (§2–3).
- [x] Theme, typography, edge, and block variants are recorded (§4).
- [x] Initial candidate coverage is reported as 103/132 (78.0%); the vocabulary was expanded to 17 primitives + 9 templates.
- [x] Expanded-vocabulary coverage is calculated: 132/132 (100.0%).
- [x] Custom requirements and the reason for any expansion are recorded (§5).
- [x] Validation elements for DeepSeek-V3, Gemma 3 (27B), and GPT-OSS (120B) are listed (§6).

The remaining implementation-risk question is not whether these elements can be drawn as SVG, but whether layout, typography, and edge routing can reproduce them cleanly. That is the scope of issue #2.
