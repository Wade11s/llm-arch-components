import { describe, expect, test } from 'bun:test';
import { diagnoseConnectorLinks, resolveConnectors } from '../src/core/connectors';
import type { ConnectorBox, ConnectorRequest } from '../src/core/connectors';
import type { EdgeSpec } from '../src/core/types';

const edge = (overrides: Partial<EdgeSpec> = {}): EdgeSpec => ({
  id: 'flow-a-b',
  kind: 'flow',
  from: { node: 'a' },
  to: { node: 'b' },
  ...overrides,
});

const box = (id: string, x: number, y: number, width = 100, height = 40): ConnectorBox => ({
  id,
  owner: id,
  box: { x, y, width, height },
  radius: 20,
});

const request = (overrides: Partial<ConnectorRequest> = {}): ConnectorRequest => ({
  edge: edge(),
  from: box('a', 0, 100),
  to: box('b', 0, 0),
  ...overrides,
});

describe('ConnectorResolver', () => {
  test('attaches a flow to facing boundaries and puts the arrow on the to end', () => {
    const [resolved] = resolveConnectors([request()]);
    expect(resolved.fromPort.side).toBe('top');
    expect(resolved.toPort.side).toBe('bottom');
    expect(resolved.points[0]).toEqual({ x: 50, y: 100 });
    expect(resolved.points.at(-1)).toEqual({ x: 50, y: 40 });
    expect(resolved.arrow).toBe('end');
  });
});

test('allocates distinct ports for multiple edges leaving the same side', () => {
  const requests = [
    request({
      edge: edge({ id: 'to-b', from: { node: 'a', side: 'top' }, to: { node: 'b' } }),
      to: box('b', 0, 0, 40),
    }),
    request({
      edge: edge({ id: 'to-c', from: { node: 'a', side: 'top' }, to: { node: 'c' } }),
      to: box('c', 160, 0, 40),
    }),
  ];
  const [left, right] = resolveConnectors(requests);
  expect(left.fromPort.side).toBe('top');
  expect(right.fromPort.side).toBe('top');
  expect(left.fromPort.point.x).not.toBe(right.fromPort.point.x);
  expect(left.fromPort.point.x).toBeLessThan(right.fromPort.point.x);
  expect(left.fromPort.point.x).toBeGreaterThan(20);
  expect(right.fromPort.point.x).toBeLessThan(80);
});

test('keeps attached endpoints on the boundary and applies the gap budget', () => {
  const [resolved] = resolveConnectors([request({ fromGap: 8, toGap: 6 })]);
  expect(resolved.fromPort.point).toEqual({ x: 50, y: 100 });
  expect(resolved.points[0]).toEqual({ x: 50, y: 92 });
  expect(resolved.points.at(-1)).toEqual({ x: 50, y: 46 });
});

test('uses waypoints only between the resolved endpoints', () => {
  const [resolved] = resolveConnectors([request({ waypoints: [{ x: 100, y: 70 }] })]);
  expect(resolved.points).toEqual([
    { x: 50, y: 100 },
    { x: 100, y: 70 },
    { x: 50, y: 40 },
  ]);
});

test('routes a residual as an orthogonal loop with a junction outside the target', () => {
  const [resolved] = resolveConnectors([request({
    edge: edge({
      id: 'residual-a-b',
      kind: 'residual',
      from: { node: 'a', side: 'right' },
      to: { node: 'b', side: 'right' },
      junction: 'plus',
    }),
  })]);
  expect(resolved.points.length).toBe(6);
  expect(resolved.points[1].y).toBe(resolved.points[0].y);
  expect(resolved.points[2].x).toBe(resolved.points[3].x);
  expect(resolved.points[4].y).toBe(resolved.points[5].y);
  expect(resolved.points.every((point) => point.x >= 100)).toBe(true);
  expect(resolved.junction?.kind).toBe('plus');
  expect(resolved.junction?.point.x).toBeGreaterThan(100);
});

test('routes a self-loop outside the box instead of collapsing to a point', () => {
  const [resolved] = resolveConnectors([request({
    edge: edge({ id: 'loop', kind: 'residual', from: { node: 'a', side: 'top' }, to: { node: 'a', side: 'top' }, junction: 'plus' }),
    to: box('a', 0, 100),
  })]);
  expect(resolved.points.length).toBe(6);
  expect(new Set(resolved.points.map((point) => point.x)).size).toBeGreaterThan(1);
  expect(resolved.points.every((point) => point.y <= 100)).toBe(true);
});

describe('Connector diagnostics', () => {
  const a = box('a', 0, 100);
  const b = box('b', 0, 0);
  const path = (sourceId: string | undefined, points: Array<{ x: number; y: number }>, role = 'flow-path') => ({
    id: `path-${sourceId ?? 'none'}`,
    sourceId,
    role,
    points,
  });
  const edgeSpec = edge();

  test('reports an edge whose path endpoint is farther than its gap budget', () => {
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('flow-a-b', [{ x: 50, y: 60 }, { x: 50, y: 40 }])],
      edges: [edgeSpec],
      boxes: [a, b],
      gapBudgets: { 'flow-a-b': 0 },
    });
    expect(diagnostics.some((item) => item.code === 'edge-endpoint-far')).toBe(true);
  });

  test('reports an endpoint closer to a different owner', () => {
    const c = box('c', 120, 100);
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('flow-a-b', [{ x: 115, y: 120 }, { x: 50, y: 40 }])],
      edges: [edgeSpec],
      boxes: [a, b, c],
    });
    expect(diagnostics.some((item) => item.code === 'edge-owner-mismatch')).toBe(true);
  });

  test('reports a path that crosses a non-endpoint node', () => {
    const obstacle = box('obstacle', 20, 50, 60, 30);
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('flow-a-b', [{ x: 50, y: 100 }, { x: 50, y: 40 }])],
      edges: [edgeSpec],
      boxes: [a, b, obstacle],
    });
    expect(diagnostics.some((item) => item.code === 'edge-crosses-node')).toBe(true);
  });

  test('reports a path whose sourceId matches neither an edge nor a box', () => {
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('missing', [{ x: 50, y: 100 }, { x: 50, y: 40 }])],
      edges: [edgeSpec],
      boxes: [a, b],
    });
    expect(diagnostics.some((item) => item.code === 'unlinked-path')).toBe(true);
  });

  test('reports an edge with no realizing path', () => {
    const diagnostics = diagnoseConnectorLinks({
      paths: [],
      edges: [edgeSpec],
      boxes: [a, b],
    });
    expect(diagnostics.some((item) => item.code === 'unplaced-edge')).toBe(true);
  });

  test('reports a leader annotation without a path', () => {
    const diagnostics = diagnoseConnectorLinks({
      paths: [],
      edges: [],
      boxes: [a, b],
      annotations: [{ id: 'heads', style: 'leader' }],
    });
    expect(diagnostics.some((item) => item.code === 'orphan-leader')).toBe(true);
  });
});


test('leaves zoom and leader paths unarrowed', () => {
  const [zoom] = resolveConnectors([request({ edge: edge({ id: 'zoom', kind: 'zoom' }) })]);
  const [leader] = resolveConnectors([request({ edge: edge({ id: 'leader', kind: 'leader' }) })]);
  expect(zoom.arrow).toBe('none');
  expect(leader.arrow).toBe('none');
});

test('honours explicit open points instead of snapping back to an owner', () => {
  const [resolved] = resolveConnectors([request({ openFrom: { x: 50, y: 220 }, openTo: { x: 50, y: 260 } })]);
  expect(resolved.points[0]).toEqual({ x: 50, y: 220 });
  expect(resolved.points.at(-1)).toEqual({ x: 50, y: 260 });
});
