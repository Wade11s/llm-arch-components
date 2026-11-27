# Typed layout variants

Status: accepted

Template selection is expressed as `layout.template` plus an optional, template-specific `layout.variant`. The old `layout.options.variant` location is rejected with a fatal `legacy-variant-location` diagnostic. TypeScript's `LayoutSpec` union and JSON runtime validation derive from the same `templateVariants` definition.

We chose this over a stringly typed variant inside the general options bag because a variant changes the structural Layout Template grammar, while options only tune the selected adapter. Manual placement does not accept a variant.

## Consequences

All registered Specs were migrated in one hard cut. `schemaVersion` remains 1 because the project has no stable external JSON consumers yet; future breaking changes after stabilization must bump it. The options bag remains intentionally untyped in this round. Builders that assemble layouts from widened `TemplateId` and string variables must now narrow template and variant together. Existing Scene snapshots must remain byte-identical because this change moves interface data without changing visual output.
