import type { Box, Diagnostic, EdgeSpec, Id, Point } from './types';

export type ConnectorSide = 'top' | 'right' | 'bottom' | 'left';

export type ConnectorBox = {
  id: Id;
  owner: Id;
  box: Box;
  radius?: number;
  kind?: 'node' | 'group' | 'text';
};

export type ConnectorRequest = {
  edge: EdgeSpec;
  from: ConnectorBox;
  to: ConnectorBox;
  waypoints?: Point[];
  fromGap?: number;
  toGap?: number;
  openFrom?: Point;
  openTo?: Point;
};

export type ConnectorPort = {
  side: ConnectorSide;
  t: number;
  point: Point;
  normal: Point;
};

export type ResolvedConnector = {
  edgeId: Id;
  role: string;
  points: Point[];
  fromPort: ConnectorPort;
  toPort: ConnectorPort;
  arrow: 'none' | 'end' | 'both';
  junction?: { point: Point; kind: 'plus' | 'multiply' | 'gate' };
};

const DEFAULT_CLEARANCE = 8;

function center(box: Box): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function normalFor(side: ConnectorSide): Point {
  switch (side) {
    case 'top': return { x: 0, y: -1 };
    case 'right': return { x: 1, y: 0 };
    case 'bottom': return { x: 0, y: 1 };
    case 'left': return { x: -1, y: 0 };
  }
}

function sideFor(from: Box, to: Box, preferred: EdgeSpec['from']['side']): ConnectorSide {
  if (preferred && preferred !== 'center') return preferred;
  const a = center(from);
  const b = center(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

function opposite(side: ConnectorSide): ConnectorSide {
  switch (side) {
    case 'top': return 'bottom';
    case 'right': return 'left';
    case 'bottom': return 'top';
    case 'left': return 'right';
  }
}

function pointOnSide(box: Box, side: ConnectorSide, t: number): Point {
  switch (side) {
    case 'top': return { x: box.x + box.width * t, y: box.y };
    case 'right': return { x: box.x + box.width, y: box.y + box.height * t };
    case 'bottom': return { x: box.x + box.width * t, y: box.y + box.height };
    case 'left': return { x: box.x, y: box.y + box.height * t };
  }
}

function roleFor(edge: EdgeSpec): string {
  switch (edge.kind) {
    case 'residual': return 'residual-path';
    case 'feedback': return 'feedback-loop';
    case 'zoom': return 'zoom-leader';
    case 'leader': return 'leader';
    case 'route': return 'route-path';
    default: return 'flow-path';
  }
}

function routePoints(
  request: ConnectorRequest,
  start: Point,
  end: Point,
  fromPort: ConnectorPort,
  toPort: ConnectorPort,
): Point[] {
  if (request.waypoints && request.waypoints.length > 0) {
    return [start, ...request.waypoints, end];
  }
  if (request.edge.kind !== 'residual' && request.edge.kind !== 'feedback') {
    return [start, end];
  }
  const stub = 16;
  const fromOut = { x: start.x + fromPort.normal.x * stub, y: start.y + fromPort.normal.y * stub };
  const toOut = { x: end.x + toPort.normal.x * stub, y: end.y + toPort.normal.y * stub };
  if (request.from.id === request.to.id) {
    const depth = 24;
    return [
      start,
      fromOut,
      { x: fromOut.x + fromPort.normal.x * depth, y: fromOut.y + fromPort.normal.y * depth },
      { x: toOut.x + toPort.normal.x * depth, y: toOut.y + toPort.normal.y * depth },
      toOut,
      end,
    ];
  }
  const fromHorizontal = fromPort.side === 'left' || fromPort.side === 'right';
  const toHorizontal = toPort.side === 'left' || toPort.side === 'right';
  if (fromHorizontal && toHorizontal) {
    const trunk = fromPort.normal.x > 0
      ? Math.max(fromOut.x, toOut.x) + 24
      : Math.min(fromOut.x, toOut.x) - 24;
    return [start, fromOut, { x: trunk, y: fromOut.y }, { x: trunk, y: toOut.y }, toOut, end];
  }
  if (!fromHorizontal && !toHorizontal) {
    const trunk = fromPort.normal.y > 0
      ? Math.max(fromOut.y, toOut.y) + 24
      : Math.min(fromOut.y, toOut.y) - 24;
    return [start, fromOut, { x: fromOut.x, y: trunk }, { x: toOut.x, y: trunk }, toOut, end];
  }
  return [start, fromOut, { x: toOut.x, y: fromOut.y }, toOut, end];
}

function arrowFor(edge: EdgeSpec): 'none' | 'end' | 'both' {
  if (edge.arrow) return edge.arrow;
  return edge.kind === 'zoom' || edge.kind === 'leader' ? 'none' : 'end';
}

function sideLength(box: Box, side: ConnectorSide): number {
  return side === 'top' || side === 'bottom' ? box.width : box.height;
}

function sortCoordinate(side: ConnectorSide, other: Point): number {
  return side === 'top' || side === 'bottom' ? other.x : other.y;
}

type Endpoint = {
  requestIndex: number;
  end: 'from' | 'to';
  box: ConnectorBox;
  side: ConnectorSide;
  sort: number;
  offset?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function resolveConnectors(requests: ConnectorRequest[]): ResolvedConnector[] {
  const endpoints: Endpoint[] = [];
  const sides: Array<{ from: ConnectorSide; to: ConnectorSide }> = [];

  requests.forEach((request, requestIndex) => {
    const fromSide = sideFor(request.from.box, request.to.box, request.edge.from.side);
    const toSide = request.edge.to.side && request.edge.to.side !== 'center'
      ? request.edge.to.side
      : opposite(fromSide);
    sides[requestIndex] = { from: fromSide, to: toSide };
    endpoints.push({
      requestIndex,
      end: 'from',
      box: request.from,
      side: fromSide,
      sort: sortCoordinate(fromSide, center(request.to.box)),
      offset: request.edge.from.offset,
    });
    endpoints.push({
      requestIndex,
      end: 'to',
      box: request.to,
      side: toSide,
      sort: sortCoordinate(toSide, center(request.from.box)),
      offset: request.edge.to.offset,
    });
  });

  const grouped = new Map<string, Endpoint[]>();
  for (const endpoint of endpoints) {
    const key = `${endpoint.box.id}:${endpoint.side}`;
    const group = grouped.get(key) ?? [];
    group.push(endpoint);
    grouped.set(key, group);
  }

  const allocated = new Map<string, number>();
  for (const group of grouped.values()) {
    group.sort((a, b) => a.sort - b.sort || a.requestIndex - b.requestIndex);
    group.forEach((endpoint, index) => {
      const length = sideLength(endpoint.box.box, endpoint.side);
      const inset = length > 0
        ? Math.min(0.4, ((endpoint.box.radius ?? 0) + DEFAULT_CLEARANCE) / length)
        : 0.5;
      let t = group.length === 1
        ? 0.5
        : inset + ((index + 0.5) / group.length) * (1 - 2 * inset);
      if (endpoint.offset !== undefined && length > 0) {
        t = clamp(0.5 + endpoint.offset / length, inset, 1 - inset);
      }
      allocated.set(`${endpoint.requestIndex}:${endpoint.end}`, t);
    });
  }

  return requests.map((request, requestIndex) => {
    const fromSide = sides[requestIndex].from;
    const toSide = sides[requestIndex].to;
    const fromT = allocated.get(`${requestIndex}:from`) ?? 0.5;
    const toT = allocated.get(`${requestIndex}:to`) ?? 0.5;
    const fromPoint = pointOnSide(request.from.box, fromSide, fromT);
    const toPoint = pointOnSide(request.to.box, toSide, toT);
    const fromNormal = normalFor(fromSide);
    const toNormal = normalFor(toSide);
    const start = request.openFrom ?? {
      x: fromPoint.x + fromNormal.x * (request.fromGap ?? 0),
      y: fromPoint.y + fromNormal.y * (request.fromGap ?? 0),
    };
    const end = request.openTo ?? {
      x: toPoint.x + toNormal.x * (request.toGap ?? 0),
      y: toPoint.y + toNormal.y * (request.toGap ?? 0),
    };
    const junctionKind = request.edge.junction === 'plus'
      || request.edge.junction === 'multiply'
      || request.edge.junction === 'gate'
      ? request.edge.junction
      : undefined;
    return {
      edgeId: request.edge.id,
      role: roleFor(request.edge),
      points: routePoints(request, start, end, { side: fromSide, t: fromT, point: fromPoint, normal: fromNormal }, { side: toSide, t: toT, point: toPoint, normal: toNormal }),
      fromPort: { side: fromSide, t: fromT, point: fromPoint, normal: fromNormal },
      toPort: { side: toSide, t: toT, point: toPoint, normal: toNormal },
      arrow: arrowFor(request.edge),
      junction: junctionKind
        ? { point: { x: end.x + toNormal.x * 20, y: end.y + toNormal.y * 20 }, kind: junctionKind }
        : undefined,
    };
  });
}

export type ConnectorPathLike = {
  id: Id;
  sourceId?: Id;
  role: string;
  points: Point[];
};

export type ConnectorAnnotation = {
  id: Id;
  style?: string;
};

export type ConnectorDiagnosticInput = {
  paths: ConnectorPathLike[];
  edges: EdgeSpec[];
  boxes: ConnectorBox[];
  annotations?: ConnectorAnnotation[];
  gapBudgets?: Record<Id, number>;
};

function warning(code: string, message: string, sourceIds: Id[]): Diagnostic {
  return { severity: 'warning', code, message, sourceIds };
}

function pointInside(point: Point, box: Box, pad = 0.001): boolean {
  return point.x > box.x + pad
    && point.x < box.x + box.width - pad
    && point.y > box.y + pad
    && point.y < box.y + box.height - pad;
}

function distanceToBox(point: Point, box: Box): number {
  const dx = Math.max(box.x - point.x, 0, point.x - (box.x + box.width));
  const dy = Math.max(box.y - point.y, 0, point.y - (box.y + box.height));
  return Math.hypot(dx, dy);
}

function distanceToBoundary(point: Point, box: Box): number {
  if (pointInside(point, box)) {
    return Math.min(
      Math.abs(point.x - box.x),
      Math.abs(point.x - (box.x + box.width)),
      Math.abs(point.y - box.y),
      Math.abs(point.y - (box.y + box.height)),
    );
  }
  return distanceToBox(point, box);
}

function nearestBox(point: Point, boxes: ConnectorBox[]): ConnectorBox | undefined {
  let nearest: ConnectorBox | undefined;
  let best = Number.POSITIVE_INFINITY;
  for (const candidate of boxes) {
    const distance = distanceToBox(point, candidate.box);
    if (distance < best) {
      best = distance;
      nearest = candidate;
    }
  }
  return nearest;
}

function orientation(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = orientation(c, d, a);
  const d2 = orientation(c, d, b);
  const d3 = orientation(a, b, c);
  const d4 = orientation(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0))
    && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function segmentCrossesBox(a: Point, b: Point, box: Box): boolean {
  if (pointInside(a, box) || pointInside(b, box)) return false;
  const corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ];
  let crossings = 0;
  for (let index = 0; index < corners.length; index += 1) {
    if (segmentsIntersect(a, b, corners[index], corners[(index + 1) % corners.length])) {
      crossings += 1;
    }
  }
  return crossings >= 2;
}

export function diagnoseConnectorLinks(input: ConnectorDiagnosticInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const edgeIds = new Set(input.edges.map((edge) => edge.id));
  const boxIds = new Set(input.boxes.flatMap((box) => [box.id, box.owner]));
  const annotationIds = new Set((input.annotations ?? []).map((annotation) => annotation.id));
  const pathsBySource = new Map<Id, ConnectorPathLike[]>();

  for (const path of input.paths) {
    if (!path.sourceId) {
      diagnostics.push(warning('unlinked-path', `Path "${path.id}" has no Edge or owner link`, [path.id]));
      continue;
    }
    if (!edgeIds.has(path.sourceId) && !boxIds.has(path.sourceId) && !annotationIds.has(path.sourceId)) {
      diagnostics.push(warning('unlinked-path', `Path "${path.id}" links to unknown "${path.sourceId}"`, [path.id]));
    }
    const group = pathsBySource.get(path.sourceId) ?? [];
    group.push(path);
    pathsBySource.set(path.sourceId, group);
  }

  for (const edge of input.edges) {
    const realizing = pathsBySource.get(edge.id) ?? [];
    if (realizing.length === 0) {
      diagnostics.push(warning('unplaced-edge', `Edge "${edge.id}" has no realizing Path`, [edge.id]));
      continue;
    }
    const fromBoxes = input.boxes.filter((box) => box.owner === edge.from.node);
    const toBoxes = input.boxes.filter((box) => box.owner === edge.to.node);
    if (fromBoxes.length === 0 || toBoxes.length === 0) {
      diagnostics.push(warning('unplaced-edge', `Edge "${edge.id}" references an unregistered owner`, [edge.id]));
      continue;
    }
    const gap = input.gapBudgets?.[edge.id] ?? 0;
    for (const path of realizing) {
      const start = path.points[0];
      const end = path.points[path.points.length - 1];
      if (!start || !end) continue;

      const startDistance = Math.min(...fromBoxes.map((box) => distanceToBoundary(start, box.box)));
      const endDistance = Math.min(...toBoxes.map((box) => distanceToBoundary(end, box.box)));
      if (startDistance > gap + 2) {
        diagnostics.push(warning('edge-endpoint-far', `Path "${path.id}" starts ${Math.round(startDistance)}px from its owner`, [edge.id, path.id]));
      }
      if (endDistance > gap + 2) {
        diagnostics.push(warning('edge-endpoint-far', `Path "${path.id}" ends ${Math.round(endDistance)}px from its owner`, [edge.id, path.id]));
      }

      const nearestStart = nearestBox(start, input.boxes);
      const ownerStartDistance = Math.min(...fromBoxes.map((box) => distanceToBox(start, box.box)));
      if (nearestStart && nearestStart.owner !== edge.from.node && distanceToBox(start, nearestStart.box) < ownerStartDistance - 1) {
        diagnostics.push(warning('edge-owner-mismatch', `Path "${path.id}" starts closer to "${nearestStart.owner}" than "${edge.from.node}"`, [edge.id, path.id]));
      }
      const nearestEnd = nearestBox(end, input.boxes);
      const ownerEndDistance = Math.min(...toBoxes.map((box) => distanceToBox(end, box.box)));
      if (nearestEnd && nearestEnd.owner !== edge.to.node && distanceToBox(end, nearestEnd.box) < ownerEndDistance - 1) {
        diagnostics.push(warning('edge-owner-mismatch', `Path "${path.id}" ends closer to "${nearestEnd.owner}" than "${edge.to.node}"`, [edge.id, path.id]));
      }

      let crosses = false;
      for (let index = 0; index < path.points.length - 1 && !crosses; index += 1) {
        for (const obstacle of input.boxes) {
          if (obstacle.kind === 'group') continue;
          if (obstacle.owner === edge.from.node || obstacle.owner === edge.to.node) continue;
          if (segmentCrossesBox(path.points[index], path.points[index + 1], obstacle.box)) {
            diagnostics.push(warning('edge-crosses-node', `Path "${path.id}" crosses node "${obstacle.owner}"`, [edge.id, path.id, obstacle.owner]));
            crosses = true;
            break;
          }
        }
      }
    }
  }

  for (const annotation of input.annotations ?? []) {
    if (annotation.style === 'leader' && !pathsBySource.has(annotation.id)) {
      diagnostics.push(warning('orphan-leader', `Leader annotation "${annotation.id}" has no Path`, [annotation.id]));
    }
  }
  for (const path of input.paths) {
    if (path.role === 'leader' && (!path.sourceId || !annotationIds.has(path.sourceId))) {
      diagnostics.push(warning('orphan-leader', `Leader Path "${path.id}" has no Annotation`, [path.id]));
    }
  }

  return diagnostics;
}
