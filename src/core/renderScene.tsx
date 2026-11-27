import { renderToStaticMarkup } from 'react-dom/server';
import type { Fill, Scene, SceneElement, Stroke } from './types';

function gradientId(idPrefix: string, fill: Fill): string | undefined {
  if (fill.kind !== 'linear-gradient') return undefined;
  return `${idPrefix}-gradient-${fill.from.replace(/[^a-zA-Z0-9]/g, '')}-${fill.to.replace(/[^a-zA-Z0-9]/g, '')}`;
}

function fillValue(idPrefix: string, fill: Fill): string {
  if (fill.kind === 'solid') return fill.color;
  return `url(#${gradientId(idPrefix, fill)})`;
}

function strokeProps(stroke: Stroke): Record<string, string | number | undefined> {
  return {
    stroke: stroke.color,
    strokeWidth: stroke.width,
    strokeDasharray: stroke.dash === 'dotted' ? '4 14' : stroke.dash === 'dashed' ? '12 12' : undefined,
    strokeLinecap: 'butt',
  };
}

function pathData(points: Array<{ x: number; y: number }>): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
}

function Glyph({ element, idPrefix }: { element: Extract<SceneElement, { kind: 'glyph' }>; idPrefix: string }) {
  const { x, y } = element.at;
  const size = element.size;
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: Math.max(3, size * 0.08), strokeLinecap: 'round' as const };
  switch (element.glyph) {
    case 'plus':
      return (
        <g id={`${idPrefix}-${element.id}`} color="black">
          <circle cx={x} cy={y} r={size * 0.45} fill="white" stroke="black" strokeWidth={Math.max(3, size * 0.08)} />
          <path d={`M${x - size * 0.25} ${y} H${x + size * 0.25} M${x} ${y - size * 0.25} V${y + size * 0.25}`} {...common} />
        </g>
      );
    case 'multiply':
      return (
        <g id={`${idPrefix}-${element.id}`} color="black">
          <circle cx={x} cy={y} r={size * 0.45} fill="white" stroke="black" strokeWidth={Math.max(3, size * 0.08)} />
          <path d={`M${x - size * 0.22} ${y - size * 0.22} L${x + size * 0.22} ${y + size * 0.22} M${x + size * 0.22} ${y - size * 0.22} L${x - size * 0.22} ${y + size * 0.22}`} {...common} />
        </g>
      );
    case 'brace':
      return (
        <path
          id={`${idPrefix}-${element.id}`}
          d={`M${x - size * 0.35} ${y - size * 0.55} C${x - size * 0.52} ${y - size * 0.42} ${x - size * 0.48} ${y - size * 0.25} ${x - size * 0.32} ${y - size * 0.12} C${x - size * 0.18} ${y} ${x - size * 0.2} ${y + size * 0.08} ${x - size * 0.34} ${y + size * 0.12} C${x - size * 0.18} ${y + size * 0.16} ${x - size * 0.1} ${y + size * 0.28} ${x - size * 0.04} ${y + size * 0.42} C${x + size * 0.03} ${y + size * 0.55} ${x + size * 0.18} ${y + size * 0.62} ${x + size * 0.32} ${y + size * 0.56}`}
          fill="none"
          stroke="black"
          strokeWidth={Math.max(5, size * 0.07)}
          strokeLinecap="round"
        />
      );
    case 'ellipsis':
      return <text id={`${idPrefix}-${element.id}`} x={x} y={y} fontSize={size} textAnchor="middle" fill="black">…</text>;
    case 'sigmoid':
      return <text id={`${idPrefix}-${element.id}`} x={x} y={y} fontSize={size} textAnchor="middle" fill="black">σ</text>;
    case 'exp':
      return <text id={`${idPrefix}-${element.id}`} x={x} y={y} fontSize={size} textAnchor="middle" fill="black">exp</text>;
    default:
      return <text id={`${idPrefix}-${element.id}`} x={x} y={y} fontSize={size} textAnchor="middle" fill="black">{element.glyph}</text>;
  }
}

function Element({ element, idPrefix, markerId }: { element: SceneElement; idPrefix: string; markerId: string }) {
  switch (element.kind) {
    case 'group':
      return (
        <g id={`${idPrefix}-${element.id}`} data-element={element.role} data-scene-id={element.id}>
          {element.fill && element.stroke && (
            <rect
              x={element.box.x}
              y={element.box.y}
              width={element.box.width}
              height={element.box.height}
              rx={32}
              fill={fillValue(idPrefix, element.fill)}
              {...strokeProps(element.stroke)}
            />
          )}
        </g>
      );
    case 'box':
      return (
        <g id={`${idPrefix}-${element.id}`} data-element={element.role} data-scene-id={element.id}>
          <rect
            x={element.box.x}
            y={element.box.y}
            width={element.box.width}
            height={element.box.height}
            rx={element.radius}
            fill={fillValue(idPrefix, element.fill)}
            {...strokeProps(element.stroke)}
          />
        </g>
      );
    case 'path':
      return (
        <g id={`${idPrefix}-${element.id}`} data-element={element.role} data-scene-id={element.id}>
          <path
            d={pathData(element.points)}
            fill="none"
            {...strokeProps(element.stroke)}
            markerEnd={element.arrow === 'end' || element.arrow === 'both' ? `url(#${markerId})` : undefined}
            markerStart={element.arrow === 'both' ? `url(#${markerId})` : undefined}
          />
          {element.junction === 'plus' && element.points.length > 0 && (
            <Glyph
              element={{ ...element, id: `${element.id}-junction`, kind: 'glyph', at: element.points[element.points.length - 1], glyph: 'plus', size: 60 }}
              idPrefix={idPrefix}
            />
          )}
        </g>
      );
    case 'text':
      return (
        <text
          id={`${idPrefix}-${element.id}`}
          data-element={element.role}
          data-scene-id={element.id}
          x={element.at.x}
          y={element.at.y}
          fontFamily={element.fontFamily}
        >
          {element.lines.map((line, lineIndex) => line.spans.map((span, spanIndex) => (
            <tspan
              key={`${lineIndex}-${spanIndex}`}
              x={span.x}
              y={line.baseline}
              fontSize={span.size}
              fontWeight={span.weight}
              fontStyle={span.emphasis === 'italic' ? 'italic' : 'normal'}
              fill={span.fill}
            >
              {span.text}
            </tspan>
          )))}
        </text>
      );
    case 'glyph':
      return <Glyph element={element} idPrefix={idPrefix} />;
    case 'stack':
      return (
        <g id={`${idPrefix}-${element.id}`} data-element={element.role} data-scene-id={element.id}>
          {Array.from({ length: element.count }, (_, index) => (
            <rect
              key={index}
              x={element.box.x + index * element.offset.x}
              y={element.box.y - index * element.offset.y}
              width={element.box.width}
              height={element.box.height}
              rx={24}
              fill="white"
              stroke="black"
              strokeWidth={5}
            />
          ))}
        </g>
      );
    case 'grid':
      return (
        <g id={`${idPrefix}-${element.id}`} data-element={element.role} data-scene-id={element.id}>
          <Grid element={element} idPrefix={idPrefix} />
        </g>
      );
    default:
      return null;
  }
}

function Grid({ element }: { element: Extract<SceneElement, { kind: 'grid' }>; idPrefix: string }) {
  const cellWidth = element.box.width / element.columns;
  const cellHeight = element.box.height / element.rows;
  return (
    <>
      {element.cells.map((cell, index) => (
        <g key={`${cell.row}-${cell.column}-${index}`}>
          <rect
            x={element.box.x + cell.column * cellWidth}
            y={element.box.y + cell.row * cellHeight}
            width={cellWidth}
            height={cellHeight}
            fill={cell.fill ? fillValue('grid', cell.fill) : '#E5EDF7'}
          />
          {cell.text && (
            <text
              x={element.box.x + (cell.column + 0.5) * cellWidth}
              y={element.box.y + (cell.row + 0.65) * cellHeight}
              textAnchor="middle"
              fontSize={Math.min(cellWidth, cellHeight) * 0.45}
              fill="black"
            >
              {cell.text}
            </text>
          )}
        </g>
      ))}
    </>
  );
}

export function SceneSvg({ scene, idPrefix }: { scene: Scene; idPrefix: string }) {
  const markerId = `${idPrefix}-arrow`;
  const gradients = new Map<string, Fill>();
  for (const element of scene.elements) {
    if ('fill' in element && element.fill?.kind === 'linear-gradient') {
      const id = gradientId(idPrefix, element.fill);
      if (id) gradients.set(id, element.fill);
    }
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${scene.canvas.width} ${scene.canvas.height}`}
      width={scene.canvas.width}
      height={scene.canvas.height}
      role="img"
      aria-labelledby={`${idPrefix}-title ${idPrefix}-desc`}
    >
      <title id={`${idPrefix}-title`}>{scene.metadata.title}</title>
      <desc id={`${idPrefix}-desc`}>{scene.metadata.description}</desc>
      <defs>
        <marker id={markerId} viewBox="0 0 30 30" markerWidth={30} markerHeight={30} refX={28} refY={15} orient="auto" markerUnits="userSpaceOnUse">
          <path d="M2 2 L28 15 L2 28 Z" fill="black" />
        </marker>
        {[...gradients].map(([id, fill]) => fill.kind === 'linear-gradient' && (
          <linearGradient key={id} id={id} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fill.from} />
            <stop offset="100%" stopColor={fill.to} />
          </linearGradient>
        ))}
      </defs>
      <rect width={scene.canvas.width} height={scene.canvas.height} fill="#FFFFFF" />
      {scene.elements.map((element) => <Element key={element.id} element={element} idPrefix={idPrefix} markerId={markerId} />)}
    </svg>
  );
}

export function renderSceneToSvg(scene: Scene, idPrefix: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${renderToStaticMarkup(<SceneSvg scene={scene} idPrefix={idPrefix} />)}\n`;
}
