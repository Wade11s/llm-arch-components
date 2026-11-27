import { z } from 'zod';
import { FigureValidationError } from './errors';
import type { Diagnostic, FigureSpec, Id } from './types';

const textSpanSchema = z.object({
  text: z.string(),
  emphasis: z.enum(['normal', 'bold', 'italic']).optional(),
  color: z.enum(['ink', 'muted', 'accent', 'inverse']).optional(),
}).strict();

const textSpecSchema = z.object({
  spans: z.array(textSpanSchema).min(1),
  maxWidth: z.number().finite().positive().optional(),
  align: z.enum(['start', 'center', 'end']).optional(),
}).strict();

const fillSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('solid'), color: z.string() }).strict(),
  z.object({
    kind: z.literal('linear-gradient'),
    from: z.string(),
    to: z.string(),
    angle: z.number().finite().optional(),
  }).strict(),
]);

const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
const sizeSchema = z.object({
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
}).strict();
const boxSchema = pointSchema.extend(sizeSchema.shape).strict();

const groupSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['model', 'repeat-block', 'inset', 'layer-group', 'tower', 'note']),
  parent: z.string().optional(),
  title: textSpecSchema.optional(),
  children: z.array(z.string()).default([]),
  repeat: z.object({ count: z.number().int().positive(), label: z.string().optional() }).strict().optional(),
  style: z.object({
    fill: fillSchema.optional(),
    stroke: z.string().optional(),
    strokeStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
  }).strict().optional(),
}).strict();

const operationDataSchema = z.discriminatedUnion('family', [
  z.object({ family: z.literal('gqa'), heads: z.number().int().positive(), kvHeads: z.number().int().positive(), ratio: z.string().optional() }).strict(),
  z.object({ family: z.literal('mla'), heads: z.number().int().positive(), kvRank: z.number().int().positive().optional() }).strict(),
  z.object({ family: z.literal('moe'), experts: z.number().int().positive(), activeExperts: z.number().int().positive(), sharedExperts: z.number().int().nonnegative().optional() }).strict(),
  z.object({ family: z.literal('ffn'), hidden: z.number().int().positive(), activation: z.string().min(1) }).strict(),
  z.object({ family: z.literal('qsa'), heads: z.number().int().positive(), kvHeads: z.number().int().positive(), blockSize: z.number().int().positive().optional() }).strict(),
  z.object({ family: z.literal('gated-delta-net'), qkHeads: z.number().int().positive(), vHeads: z.number().int().positive() }).strict(),
  z.object({ family: z.literal('gated-residual'), streams: z.number().int().positive(), operation: z.enum(['read', 'write']) }).strict(),
  z.object({ family: z.literal('xlstm'), matrixMemory: z.literal(true) }).strict(),
]);

const operatorDataSchema = z.object({ operator: z.enum(['plus', 'multiply', 'sigmoid', 'exp']) }).strict();
const maskDataSchema = z.object({
  rows: z.array(z.string()),
  columns: z.array(z.string()),
  values: z.array(z.union([z.literal(0), z.literal(1)])),
}).strict();

const nodeBaseShape = {
  id: z.string().min(1),
  parent: z.string().optional(),
  label: textSpecSchema.optional(),
  role: z.string().optional(),
  style: z.object({
    fill: fillSchema.optional(),
    stroke: z.string().optional(),
    emphasis: z.boolean().optional(),
  }).strict().optional(),
};

const nodeSchema = z.discriminatedUnion('kind', [
  z.object({ ...nodeBaseShape, kind: z.literal('operation'), data: operationDataSchema }).strict(),
  z.object({ ...nodeBaseShape, kind: z.literal('composite'), data: operationDataSchema }).strict(),
  z.object({ ...nodeBaseShape, kind: z.literal('text'), data: textSpecSchema }).strict(),
  z.object({ ...nodeBaseShape, kind: z.literal('operator'), data: operatorDataSchema }).strict(),
  z.object({ ...nodeBaseShape, kind: z.literal('badge'), data: z.object({ value: z.string() }).strict() }).strict(),
  z.object({ ...nodeBaseShape, kind: z.literal('ellipsis'), data: z.object({}).strict() }).strict(),
  z.object({ ...nodeBaseShape, kind: z.literal('repeat'), data: z.object({ count: z.number().int().positive(), label: z.string().optional() }).strict() }).strict(),
  z.object({ ...nodeBaseShape, kind: z.literal('stack'), data: z.object({ count: z.number().int().positive(), child: z.string() }).strict() }).strict(),
  z.object({ ...nodeBaseShape, kind: z.literal('mask'), data: maskDataSchema }).strict(),
]);

const anchorSchema = z.object({
  node: z.string().min(1),
  side: z.enum(['top', 'right', 'bottom', 'left', 'center']).optional(),
  offset: z.number().finite().optional(),
}).strict();

const edgeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['flow', 'residual', 'route', 'feedback', 'leader', 'zoom']),
  from: anchorSchema,
  to: anchorSchema,
  waypoints: z.array(pointSchema).optional(),
  arrow: z.enum(['none', 'end', 'both']).optional(),
  junction: z.enum(['none', 'plus', 'multiply', 'gate']).optional(),
  label: textSpecSchema.optional(),
  style: z.object({
    stroke: z.string().optional(),
    width: z.number().finite().positive().optional(),
    dash: z.enum(['solid', 'dashed', 'dotted']).optional(),
  }).strict().optional(),
}).strict();

const annotationSchema = z.object({
  id: z.string().min(1),
  target: z.string().min(1),
  placement: z.enum(['left', 'right', 'top', 'bottom', 'inside']),
  content: z.union([textSpecSchema, z.object({ bullets: z.array(textSpecSchema).min(1) }).strict()]),
  style: z.enum(['plain', 'boxed', 'leader', 'badge']).optional(),
}).strict();

const templateIdSchema = z.enum([
  'backbone',
  'residual-block',
  'feed-forward',
  'moe',
  'layer-schedule',
  'multi-stream-residual',
  'multi-tower',
  'attention-mask',
]);

const layoutSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('template'),
    template: templateIdSchema,
    slots: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
    options: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).optional(),
  }).strict(),
  z.object({
    mode: z.literal('manual'),
    placements: z.record(z.string(), boxSchema),
    routes: z.record(z.string(), z.array(pointSchema)).optional(),
  }).strict(),
]);

export const figureSpecSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  canvas: sizeSchema,
  theme: z.object({
    accent: z.string().min(1),
    surface: z.string().min(1),
    ink: z.string().min(1),
    muted: z.string().min(1),
    background: z.string().min(1),
    fontFamily: z.string().min(1),
    monospaceFamily: z.string().optional(),
  }).strict(),
  groups: z.array(groupSchema),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  annotations: z.array(annotationSchema).optional(),
  layout: layoutSchema,
}).strict();

function issue(code: string, message: string, path?: string, sourceIds?: Id[]): Diagnostic {
  return { severity: 'error', code, message, path, sourceIds };
}

const implementedTemplates = new Set(['backbone', 'moe', 'attention-mask', 'layer-schedule', 'multi-tower']);
const implementedVariants: Record<string, Set<string>> = {
  backbone: new Set(['recurrent-detail']),
  moe: new Set(['mixing-detail', 'multi-stream-residual']),
  'attention-mask': new Set(['ihc-pipeline']),
  'layer-schedule': new Set(['layer-group', 'recurrent-pass']),
};

function semanticIssues(spec: FigureSpec): Diagnostic[] {
  const issues: Diagnostic[] = [];
  const ids = new Map<Id, string>();
  const addId = (id: Id, path: string) => {
    const existing = ids.get(id);
    if (existing) issues.push(issue('duplicate-id', `Duplicate id "${id}" at ${path}; already used at ${existing}`, path, [id]));
    else ids.set(id, path);
  };

  spec.groups.forEach((group, index) => addId(group.id, `groups[${index}].id`));
  spec.nodes.forEach((node, index) => addId(node.id, `nodes[${index}].id`));
  spec.edges.forEach((edge, index) => addId(edge.id, `edges[${index}].id`));
  (spec.annotations ?? []).forEach((annotation, index) => addId(annotation.id, `annotations[${index}].id`));

  const groupIds = new Set(spec.groups.map((group) => group.id));
  const nodeIds = new Set(spec.nodes.map((node) => node.id));
  const contentIds = new Set([...groupIds, ...nodeIds]);

  spec.groups.forEach((group, index) => {
    if (group.parent && !groupIds.has(group.parent)) {
      issues.push(issue('unknown-reference', `Group parent "${group.parent}" does not exist`, `groups[${index}].parent`, [group.id]));
    }
    group.children.forEach((child, childIndex) => {
      if (!contentIds.has(child)) {
        issues.push(issue('unknown-reference', `Group child "${child}" does not exist`, `groups[${index}].children[${childIndex}]`, [group.id]));
      }
    });
  });

  spec.nodes.forEach((node, index) => {
    if (node.parent && !groupIds.has(node.parent)) {
      issues.push(issue('unknown-reference', `Node parent "${node.parent}" does not exist`, `nodes[${index}].parent`, [node.id]));
    }
    if (node.kind === 'stack' && !nodeIds.has(node.data.child)) {
      issues.push(issue('unknown-reference', `Stack child "${node.data.child}" does not exist`, `nodes[${index}].data.child`, [node.id]));
    }
  });

  spec.edges.forEach((edge, index) => {
    for (const [endpoint, anchor] of [['from', edge.from], ['to', edge.to]] as const) {
      if (!contentIds.has(anchor.node)) {
        issues.push(issue('unknown-reference', `Edge ${endpoint} node "${anchor.node}" does not exist`, `edges[${index}].${endpoint}.node`, [edge.id]));
      }
    }
  });

  (spec.annotations ?? []).forEach((annotation, index) => {
    if (!contentIds.has(annotation.target)) {
      issues.push(issue('unknown-reference', `Annotation target "${annotation.target}" does not exist`, `annotations[${index}].target`, [annotation.id]));
    }
  });

  if (spec.layout.mode === 'template') {
    if (!implementedTemplates.has(spec.layout.template)) {
      issues.push(issue('unsupported-template', `Template "${spec.layout.template}" is not implemented`, 'layout.template'));
    }
    const variant = spec.layout.options?.variant;
    if (variant !== undefined) {
      const allowed = implementedVariants[spec.layout.template];
      if (typeof variant !== 'string' || !allowed?.has(variant)) {
        issues.push(issue('unsupported-variant', `Template "${spec.layout.template}" does not support variant "${String(variant)}"`, 'layout.options.variant'));
      }
    }
    for (const [slot, value] of Object.entries(spec.layout.slots)) {
      const values = Array.isArray(value) ? value : [value];
      values.forEach((id, valueIndex) => {
        if (!contentIds.has(id)) {
          issues.push(issue('unknown-reference', `Template slot "${slot}" references unknown id "${id}"`, `layout.slots.${slot}[${valueIndex}]`));
        }
      });
    }
  } else {
    for (const [id, box] of Object.entries(spec.layout.placements)) {
      if (!contentIds.has(id)) {
        issues.push(issue('unknown-reference', `Manual placement references unknown id "${id}"`, `layout.placements.${id}`));
      }
      if (box.x < 0 || box.y < 0 || box.x + box.width > spec.canvas.width || box.y + box.height > spec.canvas.height) {
        issues.push(issue('out-of-bounds', `Manual placement for "${id}" is outside the canvas`, `layout.placements.${id}`, [id]));
      }
    }
    for (const [id, route] of Object.entries(spec.layout.routes ?? {})) {
      if (!spec.edges.some((edge) => edge.id === id)) {
        issues.push(issue('unknown-reference', `Manual route references unknown edge "${id}"`, `layout.routes.${id}`));
      }
      route.forEach((point, pointIndex) => {
        if (point.x < 0 || point.y < 0 || point.x > spec.canvas.width || point.y > spec.canvas.height) {
          issues.push(issue('out-of-bounds', `Manual route point for "${id}" is outside the canvas`, `layout.routes.${id}[${pointIndex}]`, [id]));
        }
      });
    }
  }

  return issues;
}

export function validateFigureSpec(input: unknown): FigureSpec {
  const parsed = figureSpecSchema.safeParse(input);
  if (!parsed.success) {
    const issues: Diagnostic[] = parsed.error.issues.map((zodIssue) => issue(
      'schema',
      zodIssue.message,
      zodIssue.path.map((part) => String(part)).join('.'),
    ));
    throw new FigureValidationError(issues);
  }
  const spec = parsed.data as FigureSpec;
  const issues = semanticIssues(spec);
  if (issues.length > 0) throw new FigureValidationError(issues);
  return spec;
}
