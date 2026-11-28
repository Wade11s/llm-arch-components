# Connector contract

Status: accepted

Connector geometry is produced from an **Edge** contract rather than hand-authored coordinates. A semantic **Edge** resolves one-to-one to a **Path**: both endpoints are **Ports** on the boundary of the **Node** or **Group** named by the **Anchor**, with a gap budget, and any arrow sits on the `to` end. Templates may keep `waypoints`, but only as middle points; they cannot override the endpoints. **Internal Wiring** inside an inset is exempt from an `EdgeSpec` and still uses the same resolver with explicit **Node** or **Group** endpoints.

We chose this over a generic orthogonal router because a router would rewrite the geometry of all 58 figures and flatten hand-tuned routing that matches the reference images. We also rejected a point fix of the Tencent Hy4 figure because it leaves the same defect class for every other template.

## Consequences

The public `FigureSpec` and `Scene` types and `schemaVersion` do not change. A **Path**'s `sourceId` carries either an **Edge** id (semantic) or a **Node** or **Group** id (internal wiring); a path matching neither is a contract failure. Tencent Hy4 is the tracer: its Spec must be reconciled to describe what is drawn, and only its snapshots may change. Unmigrated templates remain byte-identical and therefore sit outside the connector invariants until their own migration. `waypoints` and the layer-schedule `routes` map remain supported as middle-point overrides.
