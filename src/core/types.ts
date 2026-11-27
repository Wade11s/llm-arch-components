export type Id = string;

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Box = Point & Size;

export type TextSpan = {
  text: string;
  emphasis?: 'normal' | 'bold' | 'italic';
  color?: 'ink' | 'muted' | 'accent' | 'inverse';
};

export type TextSpec = {
  spans: TextSpan[];
  maxWidth?: number;
  align?: 'start' | 'center' | 'end';
};

export type Theme = {
  accent: string;
  surface: string;
  ink: string;
  muted: string;
  background: string;
  fontFamily: string;
  monospaceFamily?: string;
};

export type Fill =
  | { kind: 'solid'; color: string }
  | { kind: 'linear-gradient'; from: string; to: string; angle?: number };

export type Stroke = {
  color: string;
  width: number;
  dash?: 'solid' | 'dashed' | 'dotted';
};

export type GroupKind = 'model' | 'repeat-block' | 'inset' | 'layer-group' | 'tower' | 'note';

export interface GroupSpec {
  id: Id;
  kind: GroupKind;
  parent?: Id;
  title?: TextSpec;
  children: Id[];
  repeat?: { count: number; label?: string };
  style?: {
    fill?: Fill;
    stroke?: string;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
  };
}

export type NodeKind =
  | 'operation'
  | 'text'
  | 'operator'
  | 'badge'
  | 'ellipsis'
  | 'repeat'
  | 'stack'
  | 'mask'
  | 'composite';

export type OperationData =
  | { family: 'gqa'; heads: number; kvHeads: number; ratio?: string }
  | { family: 'mla'; heads: number; kvRank?: number }
  | { family: 'moe'; experts: number; activeExperts: number; sharedExperts?: number }
  | { family: 'ffn'; hidden: number; activation: string }
  | { family: 'qsa'; heads: number; kvHeads: number; blockSize?: number }
  | { family: 'gated-delta-net'; qkHeads: number; vHeads: number }
  | { family: 'gated-residual'; streams: number; operation: 'read' | 'write' }
  | { family: 'xlstm'; matrixMemory: true };

export type OperatorData = { operator: 'plus' | 'multiply' | 'sigmoid' | 'exp' };
export type MaskData = { rows: string[]; columns: string[]; values: Array<0 | 1> };

interface NodeBase {
  id: Id;
  parent?: Id;
  label?: TextSpec;
  role?: string;
  style?: {
    fill?: Fill;
    stroke?: string;
    emphasis?: boolean;
  };
}

export type NodeSpec = NodeBase & (
  | { kind: 'operation' | 'composite'; data: OperationData }
  | { kind: 'text'; data: TextSpec }
  | { kind: 'operator'; data: OperatorData }
  | { kind: 'badge'; data: { value: string } }
  | { kind: 'ellipsis'; data: Record<string, never> }
  | { kind: 'repeat'; data: { count: number; label?: string } }
  | { kind: 'stack'; data: { count: number; child: Id } }
  | { kind: 'mask'; data: MaskData }
);

export type Anchor = {
  node: Id;
  side?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  offset?: number;
};

export type EdgeKind = 'flow' | 'residual' | 'route' | 'feedback' | 'leader' | 'zoom';

export interface EdgeSpec {
  id: Id;
  kind: EdgeKind;
  from: Anchor;
  to: Anchor;
  waypoints?: Point[];
  arrow?: 'none' | 'end' | 'both';
  junction?: 'none' | 'plus' | 'multiply' | 'gate';
  label?: TextSpec;
  style?: {
    stroke?: string;
    width?: number;
    dash?: 'solid' | 'dashed' | 'dotted';
  };
}

export interface AnnotationSpec {
  id: Id;
  target: Id;
  placement: 'left' | 'right' | 'top' | 'bottom' | 'inside';
  content: TextSpec | { bullets: TextSpec[] };
  style?: 'plain' | 'boxed' | 'leader' | 'badge';
}

export type TemplateId =
  | 'backbone'
  | 'residual-block'
  | 'feed-forward'
  | 'moe'
  | 'layer-schedule'
  | 'multi-stream-residual'
  | 'multi-tower'
  | 'attention-mask';

export type LayoutSpec =
  | {
      mode: 'template';
      template: TemplateId;
      slots: Record<string, Id | Id[]>;
      options?: Record<string, number | string | boolean>;
    }
  | {
      mode: 'manual';
      placements: Record<Id, Box>;
      routes?: Record<Id, Point[]>;
    };

export interface FigureSpec {
  schemaVersion: 1;
  id: Id;
  title: string;
  description: string;
  canvas: Size;
  theme: Theme;
  groups: GroupSpec[];
  nodes: NodeSpec[];
  edges: EdgeSpec[];
  annotations?: AnnotationSpec[];
  layout: LayoutSpec;
}

export interface SceneElementBase {
  id: Id;
  sourceId?: Id;
  role: string;
  label?: string;
}

export interface SceneGroup extends SceneElementBase {
  kind: 'group';
  box: Box;
  children: Id[];
  fill?: Fill;
  stroke?: Stroke;
}

export interface SceneBox extends SceneElementBase {
  kind: 'box';
  box: Box;
  radius: number;
  fill: Fill;
  stroke: Stroke;
}

export interface ScenePath extends SceneElementBase {
  kind: 'path';
  points: Point[];
  closed?: boolean;
  stroke: Stroke;
  arrow?: 'none' | 'end' | 'both';
  junction?: 'plus' | 'multiply' | 'gate';
}

export interface SceneText extends SceneElementBase {
  kind: 'text';
  at: Point;
  lines: PositionedTextLine[];
  align: 'start' | 'center' | 'end';
  fontFamily: string;
}

export interface PositionedTextLine {
  baseline: number;
  spans: Array<TextSpan & { x: number; width: number; size: number; weight: number; fill: string }>;
}

export interface SceneGlyph extends SceneElementBase {
  kind: 'glyph';
  at: Point;
  glyph: 'plus' | 'multiply' | 'sigmoid' | 'exp' | 'brace' | 'ellipsis';
  size: number;
}

export interface SceneStack extends SceneElementBase {
  kind: 'stack';
  box: Box;
  count: number;
  offset: Point;
  child: Id;
}

export interface SceneGrid extends SceneElementBase {
  kind: 'grid';
  box: Box;
  rows: number;
  columns: number;
  cells: Array<{ row: number; column: number; text?: string; fill?: Fill }>;
}

export type SceneElement =
  | SceneGroup
  | SceneBox
  | ScenePath
  | SceneText
  | SceneGlyph
  | SceneStack
  | SceneGrid;

export interface Scene {
  schemaVersion: 1;
  id: Id;
  canvas: Size;
  metadata: {
    title: string;
    description: string;
  };
  elements: SceneElement[];
  diagnostics: Diagnostic[];
}

export type Diagnostic = {
  severity: 'warning' | 'error';
  code: string;
  message: string;
  path?: string;
  sourceIds?: Id[];
};

export interface FontSpec {
  family: string;
  size: number;
  weight: number;
  style?: 'normal' | 'italic';
}

export interface TextMetrics {
  measure(text: TextSpan, font: FontSpec): number;
  lineHeight(font: FontSpec): number;
}

export interface LayoutContext {
  theme: Theme;
  metrics: TextMetrics;
}

export type NormalizedFigureSpec = FigureSpec;

export interface LayoutEngine {
  readonly id: string;
  layout(spec: NormalizedFigureSpec, context: LayoutContext): Scene;
}

export interface RenderFigureOptions {
  layout?: LayoutEngine;
  idPrefix?: string;
  metrics?: TextMetrics;
}

export interface RenderedFigure {
  scene: Scene;
  svg: string;
  diagnostics: Diagnostic[];
}
