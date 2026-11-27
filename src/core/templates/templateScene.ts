import { FigureLayoutError } from '../errors';
import { SceneBuilder } from '../sceneBuilder';
import type {
  Box,
  FigureSpec,
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

export function requireSlot(spec: FigureSpec, name: string): Id {
  if (spec.layout.mode !== 'template') templateFailure('wrong-layout', 'Template layout requires mode "template"');
  const value = spec.layout.slots[name];
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) templateFailure('missing-slot', `Template layout requires a "${name}" slot`, [name]);
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

export class TemplateScene {
  private readonly builder: SceneBuilder;

  constructor(theme: Theme, metrics: TextMetrics) {
    this.builder = new SceneBuilder(theme, metrics);
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
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      radius?: number;
      size?: number;
      weight?: number;
      textFill?: string;
      sourceId?: Id;
    } = {},
  ): void {
    const size = options.size ?? 34;
    this.box(`${id}-box`, role, box, {
      fill: this.solid(options.fill ?? '#FFFFFF'),
      stroke: this.stroke(options.stroke ?? '#000000', options.strokeWidth ?? 5),
      radius: options.radius ?? 28,
      sourceId: options.sourceId,
      label: options.sourceId ? this.builder.labelOf(content) : undefined,
    });
    this.text(`${id}-label`, `${role}-label`, { x: box.x + box.width / 2, y: box.y + box.height / 2 + size * 0.36 }, content, {
      size,
      weight: options.weight ?? 500,
      fill: options.textFill,
      align: 'center',
      sourceId: options.sourceId,
    });
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
      this.text(`${id}-${index}`, options.role ?? `annotation-${id}`, {
        x: at.x,
        y: at.y + index * (options.lineGap ?? Math.round((options.size ?? 36) * 1.42)),
      }, line, {
        size: options.size ?? 36,
        weight: options.weight ?? 700,
        align: options.align ?? 'start',
        family: options.family,
        sourceId: options.sourceId === null ? undefined : options.sourceId ?? annotation?.id,
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
