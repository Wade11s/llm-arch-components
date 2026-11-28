# Connector contract

Status: accepted

Connector geometry is produced from an **Edge** contract rather than hand-authored coordinates. A semantic **Edge** resolves one-to-one to a **Path**: both endpoints are **Ports** on the boundary of the **Node** or **Group** named by the **Anchor**, with a gap budget, and any arrow sits on the `to` end. Templates may keep `waypoints`, but only as middle points; they cannot override the endpoints. **Internal Wiring** inside a group or inset is exempt from an `EdgeSpec`; it must carry a **Node** or **Group** `sourceId`, and a hand-drawn bus that terminates on another internal **Path** at a junction is covered by a local bus invariant instead of the Edge endpoint check.

We chose this over a generic orthogonal router because a router would rewrite the geometry of all 58 figures and flatten hand-tuned routing that matches the reference images. We also rejected a point fix of the Tencent Hy4 figure because it leaves the same defect class for every other template.

## Consequences

The public `FigureSpec` and `Scene` types and `schemaVersion` do not change. A **Path**'s `sourceId` carries an **Edge** id (semantic), a **Node** or **Group** id (internal wiring), or an **Annotation** id (leader callout); a path matching none of these is a contract failure. The internal ConnectorResolver owns port allocation and per-kind routing. TemplateScene integration is the next tracer step; until then no template consumes the resolver. Tencent Hy4 is the tracer: its Spec must be reconciled to describe what is drawn, and only its snapshots may change. Unmigrated templates remain byte-identical and therefore sit outside the connector invariants until their own migration. `waypoints` and the layer-schedule `routes` map remain supported as middle-point overrides.
