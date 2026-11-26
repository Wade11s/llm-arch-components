import type {
  Box,
  Diagnostic,
  Fill,
  FontSpec,
  Id,
  Point,
  Scene,
  SceneElement,
  Stroke,
  TextMetrics,
  TextSpan,
  TextSpec,
  Theme,
} from './types';

export class SceneBuilder {
  readonly elements: SceneElement[] = [];
  readonly diagnostics: Diagnostic[] = [];

  constructor(
    private readonly theme: Theme,
    private readonly metrics: TextMetrics,
  ) {}

  solid(color: string): Fill {
    return { kind: 'solid', color };
  }

  stroke(color: string, width: number, dash?: Stroke['dash']): Stroke {
    return { color, width, dash };
  }

  box(id: Id, role: string, box: Box, options: {
    fill?: Fill;
    stroke?: Stroke;
    radius?: number;
    sourceId?: Id;
    label?: string;
  } = {}): void {
    this.elements.push({
      id,
      sourceId: options.sourceId,
      role,
      label: options.label,
      kind: 'box',
      box,
      radius: options.radius ?? 26,
      fill: options.fill ?? this.solid('#FFFFFF'),
      stroke: options.stroke ?? this.stroke(this.theme.ink, 5),
    });
  }

  group(id: Id, role: string, box: Box, children: Id[], options: {
    fill?: Fill;
    stroke?: Stroke;
    sourceId?: Id;
  } = {}): void {
    this.elements.push({
      id,
      sourceId: options.sourceId,
      role,
      kind: 'group',
      box,
      children,
      fill: options.fill,
      stroke: options.stroke,
    });
  }

  path(id: Id, role: string, points: Point[], options: {
    stroke?: Stroke;
    arrow?: 'none' | 'end' | 'both';
    junction?: 'plus' | 'multiply' | 'gate';
    sourceId?: Id;
    label?: string;
  } = {}): void {
    this.elements.push({
      id,
      sourceId: options.sourceId,
      role,
      label: options.label,
      kind: 'path',
      points,
      stroke: options.stroke ?? this.stroke(this.theme.ink, 6),
      arrow: options.arrow ?? 'end',
      junction: options.junction,
    });
  }

  glyph(id: Id, role: string, at: Point, glyph: 'plus' | 'multiply' | 'sigmoid' | 'exp' | 'brace' | 'ellipsis', size: number, options: {
    sourceId?: Id;
    label?: string;
  } = {}): void {
    this.elements.push({
      id,
      sourceId: options.sourceId,
      role,
      label: options.label,
      kind: 'glyph',
      at,
      glyph,
      size,
    });
  }

  text(id: Id, role: string, at: Point, text: string | TextSpec, options: {
    size?: number;
    weight?: number;
    fill?: string;
    align?: 'start' | 'center' | 'end';
    family?: string;
    sourceId?: Id;
    label?: string;
  } = {}): void {
    const spec = typeof text === 'string' ? { spans: [{ text }] } : text;
    const font: FontSpec = {
      family: options.family ?? this.theme.fontFamily,
      size: options.size ?? 40,
      weight: options.weight ?? 400,
    };
    const align = options.align ?? spec.align ?? 'start';
    const lines: Array<Array<{ span: TextSpan; width: number }>> = [[]];
    const pushLine = () => {
      if (lines[lines.length - 1].length > 0) lines.push([]);
    };
    for (const span of spec.spans) {
      const tokens = spec.maxWidth ? span.text.split(/(\s+)/).filter(Boolean) : [span.text];
      for (const token of tokens) {
        const tokenSpan = { ...span, text: token };
        const width = this.metrics.measure(tokenSpan, font);
        const line = lines[lines.length - 1];
        const lineWidth = line.reduce((sum, item) => sum + item.width, 0);
        if (spec.maxWidth && lineWidth > 0 && lineWidth + width > spec.maxWidth && token.trim().length > 0) {
          pushLine();
          if (token.trim().length === 0) continue;
        }
        lines[lines.length - 1].push({ span: tokenSpan, width });
      }
    }
    const renderedLines = lines.filter((line) => line.length > 0).map((line, lineIndex) => {
      const totalWidth = line.reduce((sum, item) => sum + item.width, 0);
      let cursor = align === 'center' ? at.x - totalWidth / 2 : align === 'end' ? at.x - totalWidth : at.x;
      return {
        baseline: at.y + lineIndex * this.metrics.lineHeight(font),
        spans: line.map(({ span, width }) => {
          const x = cursor;
          cursor += width;
          return {
            ...span,
            x,
            width,
            size: font.size,
            weight: span.emphasis === 'bold' ? Math.max(font.weight, 700) : font.weight,
            fill: options.fill ?? this.color(span.color),
          };
        }),
      };
    });
    this.elements.push({
      id,
      sourceId: options.sourceId,
      role,
      label: options.label,
      kind: 'text',
      at,
      align,
      fontFamily: font.family,
      lines: renderedLines.length > 0 ? renderedLines : [{ baseline: at.y, spans: [] }],
    });
  }

  scene(spec: { id: Id; canvas: { width: number; height: number }; title: string; description: string }): Scene {
    return {
      schemaVersion: 1,
      id: spec.id,
      canvas: spec.canvas,
      metadata: { title: spec.title, description: spec.description },
      elements: this.elements,
      diagnostics: this.diagnostics,
    };
  }

  color(value: TextSpan['color']): string {
    switch (value) {
      case 'accent': return this.theme.accent;
      case 'muted': return this.theme.muted;
      case 'inverse': return '#FFFFFF';
      default: return this.theme.ink;
    }
  }

  labelOf(text: TextSpec): string {
    return text.spans.map((span) => span.text).join('');
  }
}
