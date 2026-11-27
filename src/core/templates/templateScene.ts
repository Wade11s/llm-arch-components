import { FigureLayoutError } from '../errors';
import { SceneBuilder } from '../sceneBuilder';
import type {
  Box,
  FigureSpec,
  Fill,
  GroupSpec,
  Id,
  NodeSpec,
  Point,
  Scene,
  TextSpec,
  Theme,
} from '../types';
import type { TextMetrics } from '../types';

type OperationNode = Extract<NodeSpec, { kind: 'operation' | 'composite' }>;
type Annotation = NonNullable<FigureSpec['annotations']>[number];

export function templateText(value: string): TextSpec {
  return { spans: [{ text: value }] };
}

export function templateFailure(code: string, message: string, sourceIds?: Id[]): never {
  throw new FigureLayoutError([{ severity: 'error', code, message, sourceIds }]);
}

export function requireSlot(spec: FigureSpec, name: string, templateName = 'Template'): Id {
  if (spec.layout.mode !== 'template') templateFailure('wrong-layout', `${templateName} requires template layout`);
  const value = spec.layout.slots[name];
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) templateFailure('missing-slot', `${templateName} requires a "${name}" slot`, [name]);
  return id;
}

export function requireGroup(spec: FigureSpec, id: Id): GroupSpec {
  const group = spec.groups.find((candidate) => candidate.id === id);
  if (!group) templateFailure('missing-group', `Group "${id}" does not exist`, [id]);
  return group;
}

export function requireOperation(
  spec: FigureSpec,
  predicate: (node: OperationNode) => boolean,
  message = 'Template layout requires matching operation nodes',
): OperationNode {
  const node = spec.nodes.find((candidate): candidate is OperationNode =>
    (candidate.kind === 'operation' || candidate.kind === 'composite') && predicate(candidate));
  if (!node) templateFailure('missing-operation', message);
  return node;
}

export function annotationOf(spec: FigureSpec, id: Id): Annotation | undefined {
  return (spec.annotations ?? []).find((candidate) => candidate.id === id);
}

export function annotationLines(spec: FigureSpec, id: Id): TextSpec[] {
  const annotation = annotationOf(spec, id);
  if (!annotation) return [];
  return 'bullets' in annotation.content ? annotation.content.bullets : [annotation.content];
}

export function createTemplateApi(templateName: string, failureCode: string) {
  return {
    fail: (message: string): never => templateFailure(failureCode, message),
    slot: (spec: FigureSpec, name: string): Id => requireSlot(spec, name, templateName),
    groupOf: requireGroup,
    operation: (spec: FigureSpec, family: string) =>
      requireOperation(spec, (candidate) => candidate.data.family === family, `${templateName} requires a ${family} operation`),
  };
}

export class TemplateScene {
  private readonly builder: SceneBuilder;
  private readonly pillRadius?: number;
  private readonly pillSize?: number;
  private readonly calloutLineGap?: number;
  private readonly calloutSourceId?: Id | null;
  private readonly calloutSize?: number;
  private readonly calloutIdStyle?: 'plain' | 'line';
  private readonly pillSourceId?: 'id' | 'none';
  private readonly pillIdSuffix?: boolean;
  private readonly pillTextLabel?: boolean;

  constructor(theme: Theme, metrics: TextMetrics, options: { pillRadius?: number; pillSize?: number; calloutLineGap?: number; calloutSourceId?: Id | null; calloutSize?: number; calloutIdStyle?: 'plain' | 'line'; pillSourceId?: 'id' | 'none'; pillIdSuffix?: boolean; pillTextLabel?: boolean } = {}) {
    this.builder = new SceneBuilder(theme, metrics);
    this.pillRadius = options.pillRadius;
    this.pillSize = options.pillSize;
    this.calloutLineGap = options.calloutLineGap;
    this.calloutSourceId = options.calloutSourceId;
    this.calloutSize = options.calloutSize;
    this.calloutIdStyle = options.calloutIdStyle ?? 'plain';
    this.pillSourceId = options.pillSourceId ?? 'none';
    this.pillIdSuffix = options.pillIdSuffix ?? true;
    this.pillTextLabel = options.pillTextLabel ?? false;
  }

  get elements() {
    return this.builder.elements;
  }

  get diagnostics() {
    return this.builder.diagnostics;
  }

  labelOf(text: TextSpec): string {
    return this.builder.labelOf(text);
  }

  solid(color: string) {
    return this.builder.solid(color);
  }

  stroke(color: string, width: number, dash?: 'solid' | 'dashed' | 'dotted') {
    return this.builder.stroke(color, width, dash);
  }

  text(...args: Parameters<SceneBuilder['text']>) {
    this.builder.text(...args);
  }

  box(...args: Parameters<SceneBuilder['box']>) {
    this.builder.box(...args);
  }

  group(...args: Parameters<SceneBuilder['group']>) {
    this.builder.group(...args);
  }

  path(...args: Parameters<SceneBuilder['path']>) {
    this.builder.path(...args);
  }

  glyph(...args: Parameters<SceneBuilder['glyph']>) {
    this.builder.glyph(...args);
  }

  flow(
    id: Id,
    points: Point[],
    options: {
      role?: string;
      stroke?: string;
      width?: number;
      dash?: 'solid' | 'dashed' | 'dotted';
      arrow?: 'none' | 'end' | 'both';
      junction?: 'plus' | 'multiply' | 'gate';
      sourceId?: Id;
    } = {},
  ): void {
    this.path(id, options.role ?? 'flow-path', points, {
      stroke: this.stroke(options.stroke ?? '#000000', options.width ?? 6, options.dash),
      arrow: options.arrow ?? 'end',
      junction: options.junction,
      sourceId: options.sourceId,
    });
  }

  pill(
    id: Id,
    role: string,
    box: Box,
    content: TextSpec,
    options: {
      fill?: Fill | string;
      stroke?: string;
      strokeWidth?: number;
      radius?: number;
      size?: number;
      weight?: number;
      textFill?: string;
      sourceId?: Id;
    } = {},
  ): void {
    const size = options.size ?? this.pillSize ?? 34;
    const sourceId = options.sourceId ?? (this.pillSourceId === 'id' ? id : undefined);
    this.box(this.pillIdSuffix ? `${id}-box` : id, role, box, {
      fill: typeof options.fill === 'string' ? this.solid(options.fill) : options.fill ?? this.solid('#FFFFFF'),
      stroke: this.stroke(options.stroke ?? '#000000', options.strokeWidth ?? 5),
      radius: options.radius ?? this.pillRadius ?? 28,
      sourceId,
      label: sourceId ? this.builder.labelOf(content) : undefined,
    });
    this.text(`${id}-label`, `${role}-label`, { x: box.x + box.width / 2, y: box.y + box.height / 2 + size * 0.36 }, content, {
      size,
      weight: options.weight ?? 500,
      fill: options.textFill,
      align: 'center',
      sourceId,
      label: this.pillTextLabel ? this.builder.labelOf(content) : undefined,
    });
  }

  multilinePill(
    id: Id,
    role: string,
    box: Box,
    lines: TextSpec[],
    options: { fill?: string; stroke?: string; radius?: number; size?: number; sourceId?: Id } = {},
  ): void {
    const size = options.size ?? 28;
    const sourceId = options.sourceId ?? (this.pillSourceId === 'id' ? id : undefined);
    this.box(`${id}-box`, role, box, {
      fill: this.solid(options.fill ?? '#FFFFFF'),
      stroke: this.stroke(options.stroke ?? '#000000', 5),
      radius: options.radius ?? 22,
      sourceId,
      label: sourceId ? lines.map((line) => this.builder.labelOf(line)).join('\n') : undefined,
    });
    const startY = box.y + box.height / 2 - ((lines.length - 1) * size * 1.35) / 2 + size * 0.36;
    lines.forEach((line, index) => {
      this.text(`${id}-label-${index}`, `${role}-label`, { x: box.x + box.width / 2, y: startY + index * size * 1.35 }, line, {
        size,
        weight: 500,
        align: 'center',
        sourceId,
      });
    });
  }

  repeatFrame(id: Id, box: Box, count: string): void {
    this.box(`${id}-frame`, 'nested-repeat-frame', box, {
      fill: this.solid('#FFFFFF00'),
      stroke: this.stroke('#000000', 8, 'dotted'),
      radius: 34,
    });
    this.text(`${id}-count`, 'nested-repeat-count', { x: box.x + box.width + 35, y: box.y + box.height / 2 }, templateText(count), { size: 32, weight: 700 });
  }

  callout(
    spec: FigureSpec,
    id: Id,
    at: Point,
    options: { size?: number; lineGap?: number; align?: 'start' | 'center' | 'end'; weight?: number; family?: string; role?: string; sourceId?: Id | null } = {},
  ): void {
    const lines = annotationLines(spec, id);
    const annotation = annotationOf(spec, id);
    lines.forEach((line, index) => {
      this.text(this.calloutIdStyle === 'line' ? `${id}-line-${index}` : `${id}-${index}`, options.role ?? `annotation-${id}`, {
        x: at.x,
        y: at.y + index * (options.lineGap ?? this.calloutLineGap ?? Math.round((options.size ?? 36) * 1.42)),
      }, line, {
        size: options.size ?? this.calloutSize ?? 36,
        weight: options.weight ?? 700,
        align: options.align ?? 'start',
        family: options.family,
        sourceId: options.sourceId !== undefined
          ? options.sourceId === null ? undefined : options.sourceId
          : this.calloutSourceId === null ? undefined : this.calloutSourceId ?? annotation?.id,
      });
    });
  }

  insetFrame(id: Id, role: string, box: Box, titleText: TextSpec): void {
    this.box(id, role, box, {
      fill: this.solid('#F3F3F3'),
      stroke: this.stroke('#000000', 8, 'dotted'),
      radius: 58,
    });
    this.text(`${id}-title`, `${role}-title`, { x: box.x, y: box.y - 60 }, titleText, { size: 46, weight: 800 });
  }

  scene(spec: Parameters<SceneBuilder['scene']>[0]): Scene {
    return this.builder.scene(spec);
  }
}
