import type { Box, Diagnostic, EdgeSpec, Id, Point } from './types';

export type ConnectorSide = 'top' | 'right' | 'bottom' | 'left';

export type ConnectorBox = {
  id: Id;
  /** The Node/Group id this box represents for Anchor lookup; not its containing group. */
  owner: Id;
  box: Box;
  radius?: number;
  kind?: 'node' | 'group' | 'text';
};

export type ConnectorRequest = {
  edge: EdgeSpec;
  from: ConnectorBox;
  to: ConnectorBox;
  /** Middle points only; the endpoints always come from the resolved Ports. */
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
  fromGap: number;
  /** Distance from the to owner boundary to the path end; includes JUNCTION_OFFSET when a junction is present. */
  toGap: number;
  openFrom: boolean;
  openTo: boolean;
  arrow: 'none' | 'end' | 'both';
  junction?: { point: Point; kind: 'plus' | 'multiply' | 'gate' };
};

const DEFAULT_CLEARANCE = 8;
const STUB = 16;
const TRUNK_OFFSET = 24;
const LOOP_DEPTH = 24;
const JUNCTION_OFFSET = 20;
const ENDPOINT_TOLERANCE = 2;
const RADIUS_SIDE_RATIO = 0.3;

function center(box: Box): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function add(point: Point, vector: Point, scale = 1): Point {
  return { x: point.x + vector.x * scale, y: point.y + vector.y * scale };
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

function roundedCornerCenter(point: Point, box: Box, radius: number): Point | undefined {
  if (radius <= 0) return undefined;
  if (point.x <= box.x + radius && point.y <= box.y + radius) return { x: box.x + radius, y: box.y + radius };
  if (point.x >= box.x + box.width - radius && point.y <= box.y + radius) return { x: box.x + box.width - radius, y: box.y + radius };
  if (point.x >= box.x + box.width - radius && point.y >= box.y + box.height - radius) return { x: box.x + box.width - radius, y: box.y + box.height - radius };
  if (point.x <= box.x + radius && point.y >= box.y + box.height - radius) return { x: box.x + radius, y: box.y + box.height - radius };
  return undefined;
}

function pointInsideRounded(point: Point, box: Box, radius: number): boolean {
  if (point.x < box.x || point.x > box.x + box.width || point.y < box.y || point.y > box.y + box.height) return false;
  const corner = roundedCornerCenter(point, box, radius);
  if (!corner) return true;
  return Math.hypot(point.x - corner.x, point.y - corner.y) <= radius + 0.001;
}

function boxContainsBox(outer: Box, inner: Box): boolean {
  return outer.x <= inner.x
    && outer.y <= inner.y
    && outer.x + outer.width >= inner.x + inner.width
    && outer.y + outer.height >= inner.y + inner.height;
}

function facing(from: ConnectorPort, to: ConnectorPort): boolean {
  return from.normal.x === -to.normal.x && from.normal.y === -to.normal.y;
}

function mixedCorner(
  fromOut: Point,
  toOut: Point,
  fromBox: Box,
  toBox: Box,
): Point {
  const candidates = [
    { x: fromOut.x, y: toOut.y },
    { x: toOut.x, y: fromOut.y },
  ];
  return candidates.find((candidate) => !pointInsideRounded(candidate, fromBox, 0) && !pointInsideRounded(candidate, toBox, 0))
    ?? candidates[0];
}

function selfLoopPerimeter(
  box: Box,
  fromPort: ConnectorPort,
  toPort: ConnectorPort,
  start: Point,
  end: Point,
): Point[] {
  const margin = STUB + LOOP_DEPTH;
  const outer = {
    left: box.x - margin,
    right: box.x + box.width + margin,
    top: box.y - margin,
    bottom: box.y + box.height + margin,
  };
  const onSide = (side: ConnectorSide, point: Point): Point => {
    switch (side) {
      case 'top': return { x: point.x, y: outer.top };
      case 'right': return { x: outer.right, y: point.y };
      case 'bottom': return { x: point.x, y: outer.bottom };
      case 'left': return { x: outer.left, y: point.y };
    }
  };
  const cornerAfter = (side: ConnectorSide): Point => {
    switch (side) {
      case 'top': return { x: outer.right, y: outer.top };
      case 'right': return { x: outer.right, y: outer.bottom };
      case 'bottom': return { x: outer.left, y: outer.bottom };
      case 'left': return { x: outer.left, y: outer.top };
    }
  };
  const cornerBefore = (side: ConnectorSide): Point => {
    switch (side) {
      case 'top': return { x: outer.left, y: outer.top };
      case 'right': return { x: outer.right, y: outer.top };
      case 'bottom': return { x: outer.right, y: outer.bottom };
      case 'left': return { x: outer.left, y: outer.bottom };
    }
  };
  const order: ConnectorSide[] = ['top', 'right', 'bottom', 'left'];
  const fromIndex = order.indexOf(fromPort.side);
  const toIndex = order.indexOf(toPort.side);
  const clockwiseSteps = (toIndex - fromIndex + 4) % 4;
  const counterClockwiseSteps = (fromIndex - toIndex + 4) % 4;
  const corners: Point[] = [];
  if (clockwiseSteps <= counterClockwiseSteps) {
    for (let step = 0; step < clockwiseSteps; step += 1) {
      corners.push(cornerAfter(order[(fromIndex + step) % 4]));
    }
  } else {
    for (let step = 0; step < counterClockwiseSteps; step += 1) {
      corners.push(cornerBefore(order[(fromIndex - step + 4) % 4]));
    }
  }
  return [start, onSide(fromPort.side, start), ...corners, onSide(toPort.side, end), end];
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
  const fromOut = add(start, fromPort.normal, STUB);
  const toOut = add(end, toPort.normal, STUB);
  if (request.from.id === request.to.id) {
    if (fromPort.side === toPort.side) {
      const vertical = fromPort.side === 'top' || fromPort.side === 'bottom';
      const outward = vertical
        ? (fromPort.normal.y > 0
          ? Math.max(fromOut.y, toOut.y) + LOOP_DEPTH
          : Math.min(fromOut.y, toOut.y) - LOOP_DEPTH)
        : (fromPort.normal.x > 0
          ? Math.max(fromOut.x, toOut.x) + LOOP_DEPTH
          : Math.min(fromOut.x, toOut.x) - LOOP_DEPTH);
      const first = vertical ? { x: fromOut.x, y: outward } : { x: outward, y: fromOut.y };
      const second = vertical ? { x: toOut.x, y: outward } : { x: outward, y: toOut.y };
      return [start, fromOut, first, second, toOut, end];
    }
    return selfLoopPerimeter(request.from.box, fromPort, toPort, start, end);
  }
  if (facing(fromPort, toPort)) {
    const vertical = fromPort.side === 'top' || fromPort.side === 'bottom';
    const aligned = vertical
      ? Math.abs(fromOut.x - toOut.x) < 1
      : Math.abs(fromOut.y - toOut.y) < 1;
    if (aligned) return [start, end];
    if (vertical) {
      const trunk = (fromOut.y + toOut.y) / 2;
      return [start, fromOut, { x: fromOut.x, y: trunk }, { x: toOut.x, y: trunk }, toOut, end];
    }
    const trunk = (fromOut.x + toOut.x) / 2;
    return [start, fromOut, { x: trunk, y: fromOut.y }, { x: trunk, y: toOut.y }, toOut, end];
  }
  const fromHorizontal = fromPort.side === 'left' || fromPort.side === 'right';
  const toHorizontal = toPort.side === 'left' || toPort.side === 'right';
  if (fromHorizontal && toHorizontal) {
    const trunk = fromPort.normal.x > 0
      ? Math.max(fromOut.x, toOut.x) + TRUNK_OFFSET
      : Math.min(fromOut.x, toOut.x) - TRUNK_OFFSET;
    return [start, fromOut, { x: trunk, y: fromOut.y }, { x: trunk, y: toOut.y }, toOut, end];
  }
  if (!fromHorizontal && !toHorizontal) {
    const trunk = fromPort.normal.y > 0
      ? Math.max(fromOut.y, toOut.y) + TRUNK_OFFSET
      : Math.min(fromOut.y, toOut.y) - TRUNK_OFFSET;
    return [start, fromOut, { x: fromOut.x, y: trunk }, { x: toOut.x, y: trunk }, toOut, end];
  }
  return [start, fromOut, mixedCorner(fromOut, toOut, request.from.box, request.to.box), toOut, end];
}

export function resolveConnectors(requests: ConnectorRequest[]): ResolvedConnector[] {
  const endpoints: Endpoint[] = [];
  const sides: Array<{ from: ConnectorSide; to: ConnectorSide }> = [];

  requests.forEach((request, requestIndex) => {
    const isSelfLoop = request.edge.from.node === request.edge.to.node || request.from.id === request.to.id;
    const fromSide = sideFor(request.from.box, request.to.box, request.edge.from.side);
    const toSide = request.edge.to.side && request.edge.to.side !== 'center'
      ? request.edge.to.side
      : isSelfLoop
        ? fromSide
        : sideFor(request.to.box, request.from.box, undefined);
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
      const effectiveRadius = length > 0
        ? Math.min(endpoint.box.radius ?? 0, length * RADIUS_SIDE_RATIO)
        : 0;
      const maxInset = group.length > 1 ? 0.5 - 0.5 / group.length : 0.45;
      const inset = length > 0
        ? Math.min(maxInset, (effectiveRadius + DEFAULT_CLEARANCE) / length)
        : 0.5;
      let t = group.length === 1
        ? 0.5
        : inset + ((index + 0.5) / group.length) * (1 - 2 * inset);
      if (endpoint.offset !== undefined && length > 0) {
        // Explicit offset is an author override; auto allocation always produces distinct ports.
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
    const openFrom = request.openFrom !== undefined;
    const fromGap = openFrom ? 0 : request.fromGap ?? 0;
    const openTo = request.openTo !== undefined;
    const junctionKind = request.edge.junction === 'plus'
      || request.edge.junction === 'multiply'
      || request.edge.junction === 'gate'
      ? request.edge.junction
      : undefined;
    const junctionPoint = junctionKind && !openTo
      ? add(toPoint, toNormal, (request.toGap ?? 0) + JUNCTION_OFFSET)
      : undefined;
    const toGap = openTo
      ? 0
      : (request.toGap ?? 0) + (junctionKind ? JUNCTION_OFFSET : 0);
    const start = request.openFrom ?? add(fromPoint, fromNormal, fromGap);
    const end = request.openTo ?? junctionPoint ?? add(toPoint, toNormal, request.toGap ?? 0);
    return {
      edgeId: request.edge.id,
      role: roleFor(request.edge),
      points: routePoints(request, start, end, { side: fromSide, t: fromT, point: fromPoint, normal: fromNormal }, { side: toSide, t: toT, point: toPoint, normal: toNormal }),
      fromPort: { side: fromSide, t: fromT, point: fromPoint, normal: fromNormal },
      toPort: { side: toSide, t: toT, point: toPoint, normal: toNormal },
      fromGap,
      toGap,
      openFrom,
      openTo,
      arrow: arrowFor(request.edge),
      junction: junctionPoint && junctionKind
        ? { point: junctionPoint, kind: junctionKind }
        : undefined,
    };
  });
}

/** Builds diagnostic budgets keyed by Edge id. Internal wiring must key by its Scene path id. */
export function endpointBudgetsOf(
  connectors: ResolvedConnector[],
): ConnectorDiagnosticInput['endpointBudgets'] {
  return Object.fromEntries(connectors.map((connector) => [
    connector.edgeId,
    {
      from: { gap: connector.fromGap, open: connector.openFrom },
      to: { gap: connector.toGap, open: connector.openTo },
    },
  ]));
}

export type ConnectorPathLike = {
  id: Id;
  sourceId?: Id;
  role: string;
  points: Point[];
  arrow?: 'none' | 'end' | 'both';
  /** Optional endpoint owners for internal wiring; falls back to sourceId. */
  attach?: { from: Id; to: Id };
};

export type ConnectorAnnotation = {
  id: Id;
  style?: string;
};

export type ConnectorEndpointBudget = {
  gap?: number;
  open?: boolean;
};

export type ConnectorDiagnosticInput = {
  paths: ConnectorPathLike[];
  edges: EdgeSpec[];
  boxes: ConnectorBox[];
  annotations?: ConnectorAnnotation[];
  endpointBudgets?: Record<Id, { from?: ConnectorEndpointBudget; to?: ConnectorEndpointBudget }>;
  auditInternalWiring?: boolean;
  severity?: 'warning' | 'error';
};

function distanceToBox(point: Point, box: Box, radius = 0): number {
  if (pointInsideRounded(point, box, radius)) return 0;
  const corner = roundedCornerCenter(point, box, radius);
  if (corner) {
    return Math.max(0, Math.hypot(point.x - corner.x, point.y - corner.y) - radius);
  }
  const dx = Math.max(box.x - point.x, 0, point.x - (box.x + box.width));
  const dy = Math.max(box.y - point.y, 0, point.y - (box.y + box.height));
  return Math.hypot(dx, dy);
}

function distanceToBoundary(point: Point, box: Box, radius = 0): number {
  if (pointInsideRounded(point, box, radius)) {
    const corner = roundedCornerCenter(point, box, radius);
    if (corner) return Math.abs(Math.hypot(point.x - corner.x, point.y - corner.y) - radius);
    return Math.min(
      Math.abs(point.x - box.x),
      Math.abs(point.x - (box.x + box.width)),
      Math.abs(point.y - box.y),
      Math.abs(point.y - (box.y + box.height)),
    );
  }
  return distanceToBox(point, box, radius);
}

function nearestBox(point: Point, boxes: ConnectorBox[]): ConnectorBox | undefined {
  let nearest: ConnectorBox | undefined;
  let best = Number.POSITIVE_INFINITY;
  for (const candidate of boxes) {
    const distance = distanceToBox(point, candidate.box, candidate.radius ?? 0);
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

function segmentCrossesBox(a: Point, b: Point, box: Box, radius = 0): boolean {
  if (pointInsideRounded(a, box, radius) || pointInsideRounded(b, box, radius)) return true;
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

function segmentEntersBox(a: Point, b: Point, box: Box, radius = 0): boolean {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (!clip(-dx, a.x - box.x)) return false;
  if (!clip(dx, box.x + box.width - a.x)) return false;
  if (!clip(-dy, a.y - box.y)) return false;
  if (!clip(dy, box.y + box.height - a.y)) return false;
  if (t1 - t0 < 0.001) return false;
  const mid = { x: a.x + dx * (t0 + t1) / 2, y: a.y + dy * (t0 + t1) / 2 };
  return pointInsideRounded(mid, box, radius);
}

export function diagnoseConnectorLinks(input: ConnectorDiagnosticInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const severity = input.severity ?? 'warning';
  const warning = (code: string, message: string, sourceIds: Id[]): Diagnostic => ({
    severity,
    code,
    message,
    sourceIds,
  });
  const edgeIds = new Set(input.edges.map((edge) => edge.id));
  const boxIds = new Set(input.boxes.flatMap((box) => [box.id, box.owner]));
  const annotationIds = new Set((input.annotations ?? []).map((annotation) => annotation.id));
  const pathsBySource = new Map<Id, ConnectorPathLike[]>();
  const edgePathIds = new Set<Id>();

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
    if (edgeIds.has(path.sourceId)) edgePathIds.add(path.id);
  }

  const checkEndpoint = (
    path: ConnectorPathLike,
    point: Point,
    owner: Id,
    boxes: ConnectorBox[],
    budget: ConnectorEndpointBudget | undefined,
    direction: 'starts' | 'ends',
    edgeId?: Id,
  ): void => {
    if (budget?.open) {
      // An open endpoint is deliberately unattached, but it must not hide
      // inside any box (including its own owner) and must stay clear of
      // unrelated boxes.
      for (const box of input.boxes) {
        if (pointInsideRounded(point, box.box, box.radius ?? 0)) {
          diagnostics.push(warning('edge-open-endpoint', `Path "${path.id}" open ${direction} is inside node "${box.owner}"`, edgeId ? [edgeId, path.id, box.owner] : [path.id, box.owner]));
          return;
        }
        if (box.owner === owner) continue;
        if (distanceToBox(point, box.box, box.radius ?? 0) < DEFAULT_CLEARANCE) {
          diagnostics.push(warning('edge-open-endpoint', `Path "${path.id}" open ${direction} is within ${DEFAULT_CLEARANCE}px of node "${box.owner}"`, edgeId ? [edgeId, path.id, box.owner] : [path.id, box.owner]));
          return;
        }
      }
      return;
    }
    if (boxes.length === 0) return;
    const gap = budget?.gap ?? 0;
    const distance = Math.min(...boxes.map((box) => distanceToBoundary(point, box.box, box.radius ?? 0)));
    if (distance > gap + ENDPOINT_TOLERANCE) {
      diagnostics.push(warning('edge-endpoint-far', `Path "${path.id}" ${direction} ${Math.round(distance)}px from its owner`, edgeId ? [edgeId, path.id] : [path.id]));
    }
    const ownerDistance = Math.min(...boxes.map((box) => distanceToBox(point, box.box, box.radius ?? 0)));
    const nearest = nearestBox(point, input.boxes);
    if (nearest && nearest.owner !== owner && distanceToBox(point, nearest.box, nearest.radius ?? 0) < ownerDistance - 1) {
      diagnostics.push(warning('edge-owner-mismatch', `Path "${path.id}" ${direction} closer to "${nearest.owner}" than "${owner}"`, edgeId ? [edgeId, path.id] : [path.id]));
    }
  };

  const checkCrossing = (
    path: ConnectorPathLike,
    fromBox: ConnectorBox,
    toBox: ConnectorBox,
    edgeId?: Id,
  ): void => {
    for (let index = 0; index < path.points.length - 1; index += 1) {
      for (const obstacle of input.boxes) {
        if (obstacle.id === fromBox.id || obstacle.id === toBox.id) continue;
        // Crossing a container of the endpoint's own box is intended (the
        // port sits inside the group being left); a foreign box that merely
        // happens to contain the start/end point must still be checked.
        if (boxContainsBox(obstacle.box, fromBox.box) || boxContainsBox(obstacle.box, toBox.box)) continue;
        if (segmentCrossesBox(path.points[index], path.points[index + 1], obstacle.box, obstacle.radius ?? 0)) {
          diagnostics.push(warning('edge-crosses-node', `Path "${path.id}" crosses node "${obstacle.owner}"`, edgeId ? [edgeId, path.id, obstacle.owner] : [path.id, obstacle.owner]));
          return;
        }
      }
    }
  };

  const ownerPenetrationSeen = new Set<string>();
  const checkOwnerPenetration = (
    path: ConnectorPathLike,
    box: ConnectorBox,
    edgeId?: Id,
  ): void => {
    const key = `${path.id}:${box.id}`;
    if (ownerPenetrationSeen.has(key)) return;
    ownerPenetrationSeen.add(key);
    for (let index = 0; index < path.points.length - 1; index += 1) {
      if (segmentEntersBox(path.points[index], path.points[index + 1], box.box, box.radius ?? 0)) {
        diagnostics.push(warning('edge-crosses-node', `Path "${path.id}" re-enters its owner "${box.owner}"`, edgeId ? [edgeId, path.id, box.owner] : [path.id, box.owner]));
        return;
      }
    }
  };

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
    const budgets = input.endpointBudgets?.[edge.id];
    for (const path of realizing) {
      const start = path.points[0];
      const end = path.points[path.points.length - 1];
      if (!start || !end) continue;
      const fromAttached = fromBoxes.reduce((nearest, box) => distanceToBox(start, box.box, box.radius ?? 0) < distanceToBox(start, nearest.box, nearest.radius ?? 0) ? box : nearest, fromBoxes[0]);
      const toAttached = toBoxes.reduce((nearest, box) => distanceToBox(end, box.box, box.radius ?? 0) < distanceToBox(end, nearest.box, nearest.radius ?? 0) ? box : nearest, toBoxes[0]);
      const expectedArrow = arrowFor(edge);
      if (path.arrow !== undefined && path.arrow !== expectedArrow) {
        diagnostics.push(warning('edge-direction', `Path "${path.id}" has arrow "${path.arrow}" but Edge "${edge.id}" expects "${expectedArrow}"`, [edge.id, path.id]));
      }
      checkEndpoint(path, start, edge.from.node, fromBoxes, budgets?.from, 'starts', edge.id);
      checkEndpoint(path, end, edge.to.node, toBoxes, budgets?.to, 'ends', edge.id);
      checkCrossing(path, fromAttached, toAttached, edge.id);
      if (!budgets?.from?.open) checkOwnerPenetration(path, fromAttached, edge.id);
      if (!budgets?.to?.open) checkOwnerPenetration(path, toAttached, edge.id);
    }
  }

  for (const path of input.paths) {
    if (edgePathIds.has(path.id)) continue;
    if (!path.sourceId) continue;
    const isAnnotationLeader = annotationIds.has(path.sourceId);
    const isRegisteredOwner = boxIds.has(path.sourceId);
    if (!isAnnotationLeader && !isRegisteredOwner) continue;
    if (!isAnnotationLeader && !path.attach && !input.auditInternalWiring) continue;
    const fromOwner = path.attach?.from ?? path.sourceId;
    const toOwner = path.attach?.to ?? path.sourceId;
    const fromBoxes = input.boxes.filter((box) => box.owner === fromOwner);
    const toBoxes = input.boxes.filter((box) => box.owner === toOwner);
    if (fromBoxes.length === 0 || toBoxes.length === 0) {
      diagnostics.push(warning('unlinked-path', `Path "${path.id}" attach owner is not registered`, [path.id, fromOwner, toOwner]));
      continue;
    }
    const budgets = input.endpointBudgets?.[path.id];
    const start = path.points[0];
    const end = path.points[path.points.length - 1];
    if (!start || !end) continue;
    const fromAttached = fromBoxes.reduce((nearest, box) => distanceToBox(start, box.box, box.radius ?? 0) < distanceToBox(start, nearest.box, nearest.radius ?? 0) ? box : nearest, fromBoxes[0]);
    const toAttached = toBoxes.reduce((nearest, box) => distanceToBox(end, box.box, box.radius ?? 0) < distanceToBox(end, nearest.box, nearest.radius ?? 0) ? box : nearest, toBoxes[0]);
    checkEndpoint(path, start, fromOwner, fromBoxes, budgets?.from, 'starts');
    checkEndpoint(path, end, toOwner, toBoxes, budgets?.to, 'ends');
    checkCrossing(path, fromAttached, toAttached);
    if (!budgets?.from?.open) checkOwnerPenetration(path, fromAttached);
    if (!budgets?.to?.open) checkOwnerPenetration(path, toAttached);
  }

  for (const annotation of input.annotations ?? []) {
    if (annotation.style === 'leader' && !pathsBySource.has(annotation.id)) {
      diagnostics.push(warning('orphan-leader', `Leader annotation "${annotation.id}" has no Path`, [annotation.id]));
    }
  }

  return diagnostics;
}

export type ConnectorContractInput = Omit<ConnectorDiagnosticInput, 'auditInternalWiring'>;

/** Audits semantic Edges and leader annotations; Internal Wiring is linkage-only unless it declares attach owners. */
export function auditConnectorContract(input: ConnectorContractInput): Diagnostic[] {
  return diagnoseConnectorLinks(input);
}
