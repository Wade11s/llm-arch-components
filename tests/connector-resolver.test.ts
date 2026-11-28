import { describe, expect, test } from 'bun:test';
import { diagnoseConnectorLinks, resolveConnectors } from '../src/core/connectors';
import type { ConnectorBox, ConnectorPathLike, ConnectorRequest } from '../src/core/connectors';
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

const path = (
  id: string,
  sourceId: string | undefined,
  points: Array<{ x: number; y: number }>,
  overrides: Partial<ConnectorPathLike> = {},
): ConnectorPathLike => ({ id, sourceId, role: 'flow-path', points, ...overrides });

describe('ConnectorResolver', () => {
  test('attaches a flow to facing boundaries and puts the arrow on the to end', () => {
    const [resolved] = resolveConnectors([request()]);
    expect(resolved.fromPort.side).toBe('top');
    expect(resolved.toPort.side).toBe('bottom');
    expect(resolved.points[0]).toEqual({ x: 50, y: 100 });
    expect(resolved.points.at(-1)).toEqual({ x: 50, y: 40 });
    expect(resolved.arrow).toBe('end');
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

  test('keeps ports off the rounded corners on short sides', () => {
    const requests = [
      request({
        edge: edge({ id: 'to-b', from: { node: 'a', side: 'top' }, to: { node: 'b' } }),
        from: box('a', 0, 100, 40, 40),
        to: box('b', 0, 0, 40, 40),
      }),
      request({
        edge: edge({ id: 'to-c', from: { node: 'a', side: 'top' }, to: { node: 'c' } }),
        from: box('a', 0, 100, 40, 40),
        to: box('c', 60, 0, 40, 40),
      }),
    ];
    const [left, right] = resolveConnectors(requests);
    expect(left.fromPort.point.x).toBeGreaterThanOrEqual(12);
    expect(left.fromPort.point.x).toBeLessThanOrEqual(28);
    expect(right.fromPort.point.x).toBeGreaterThanOrEqual(12);
    expect(right.fromPort.point.x).toBeLessThanOrEqual(28);
    expect(left.fromPort.point.x).not.toBe(right.fromPort.point.x);
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

  test('honours explicit open points and exposes them for diagnostics', () => {
    const [resolved] = resolveConnectors([request({ openFrom: { x: 50, y: 220 }, openTo: { x: 50, y: 260 } })]);
    expect(resolved.points[0]).toEqual({ x: 50, y: 220 });
    expect(resolved.points.at(-1)).toEqual({ x: 50, y: 260 });
    expect(resolved.openFrom).toBe(true);
    expect(resolved.openTo).toBe(true);
    expect(resolved.fromGap).toBe(0);
    expect(resolved.toGap).toBe(0);
  });

  test('leaves zoom and leader paths unarrowed', () => {
    const [zoom] = resolveConnectors([request({ edge: edge({ id: 'zoom', kind: 'zoom' }) })]);
    const [leader] = resolveConnectors([request({ edge: edge({ id: 'leader', kind: 'leader' }) })]);
    expect(zoom.arrow).toBe('none');
    expect(leader.arrow).toBe('none');
  });

  test('does not plough a facing residual through either box', () => {
    const [resolved] = resolveConnectors([request({
      edge: edge({ id: 'residual-facing', kind: 'residual', from: { node: 'a', side: 'bottom' }, to: { node: 'b', side: 'top' } }),
      from: box('a', 0, 0),
      to: box('b', 0, 200),
    })]);
    expect(resolved.points).toEqual([{ x: 50, y: 40 }, { x: 50, y: 200 }]);
  });

  test('routes a same-side residual loop so the path reaches its junction', () => {
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
    expect(resolved.toPort.point).toEqual({ x: 100, y: 20 });
    expect(resolved.toGap).toBe(20);
    expect(resolved.points.at(-1)).toEqual(resolved.junction?.point);
  });

  test('routes a default self-loop on one side instead of through the box', () => {
    const [resolved] = resolveConnectors([request({
      edge: edge({ id: 'loop', kind: 'residual', from: { node: 'a' }, to: { node: 'a' }, junction: 'plus' }),
      to: box('a', 0, 100),
    })]);
    expect(resolved.fromPort.side).toBe('right');
    expect(resolved.toPort.side).toBe('right');
    expect(resolved.points.length).toBe(6);
    expect(resolved.points.every((point) => point.x >= 100)).toBe(true);
  });

  test('keeps a mixed-orientation corner outside both boxes', () => {
    const [resolved] = resolveConnectors([request({
      edge: edge({ id: 'mixed', kind: 'feedback', from: { node: 'a', side: 'right' }, to: { node: 'b', side: 'top' } }),
    })]);
    expect(resolved.points.length).toBe(5);
    expect(resolved.points[2]).toEqual({ x: 116, y: -16 });
  });

  test('is deterministic for identical requests', () => {
    const first = resolveConnectors([request()]);
    const second = resolveConnectors([request()]);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});

describe('Connector diagnostics', () => {
  const a = box('a', 0, 100);
  const b = box('b', 0, 0);
  const edgeSpec = edge();

  test('returns no diagnostics for valid wiring', () => {
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('p', 'flow-a-b', [{ x: 50, y: 100 }, { x: 50, y: 40 }])],
      edges: [edgeSpec],
      boxes: [a, b],
    });
    expect(diagnostics).toEqual([]);
  });

  test('reports an edge whose path endpoint is farther than its gap budget', () => {
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('p', 'flow-a-b', [{ x: 50, y: 60 }, { x: 50, y: 40 }])],
      edges: [edgeSpec],
      boxes: [a, b],
      endpointBudgets: { 'flow-a-b': { from: { gap: 0 }, to: { gap: 0 } } },
    });
    expect(diagnostics.some((item) => item.code === 'edge-endpoint-far')).toBe(true);
  });

  test('reports an endpoint closer to a different owner', () => {
    const c = box('c', 120, 100);
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('p', 'flow-a-b', [{ x: 115, y: 120 }, { x: 50, y: 40 }])],
      edges: [edgeSpec],
      boxes: [a, b, c],
    });
    expect(diagnostics.some((item) => item.code === 'edge-owner-mismatch')).toBe(true);
  });

  test('reports a path that crosses a non-endpoint node', () => {
    const obstacle = box('obstacle', 20, 50, 60, 30);
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('p', 'flow-a-b', [{ x: 50, y: 100 }, { x: 50, y: 40 }])],
      edges: [edgeSpec],
      boxes: [a, b, obstacle],
    });
    expect(diagnostics.some((item) => item.code === 'edge-crosses-node')).toBe(true);
  });

  test('reports a waypoint that lands inside another node', () => {
    const obstacle = box('obstacle', 20, 50, 60, 30);
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('p', 'flow-a-b', [{ x: 50, y: 100 }, { x: 50, y: 60 }, { x: 50, y: 40 }])],
      edges: [edgeSpec],
      boxes: [a, b, obstacle],
    });
    expect(diagnostics.some((item) => item.code === 'edge-crosses-node')).toBe(true);
  });

  test('reports a path crossing an unrelated group, but not its own container', () => {
    const tower = { ...box('tower', 20, 50, 60, 30), kind: 'group' as const };
    const crossed = diagnoseConnectorLinks({
      paths: [path('p', 'flow-a-b', [{ x: 50, y: 100 }, { x: 50, y: 40 }])],
      edges: [edgeSpec],
      boxes: [a, b, tower],
    });
    expect(crossed.some((item) => item.code === 'edge-crosses-node')).toBe(true);

    const container = { ...box('model', 0, 0, 200, 200), kind: 'group' as const };
    const contained = diagnoseConnectorLinks({
      paths: [path('p', 'flow-a-b', [{ x: 50, y: 100 }, { x: 50, y: 40 }])],
      edges: [edgeSpec],
      boxes: [a, b, container],
    });
    expect(contained.some((item) => item.code === 'edge-crosses-node')).toBe(false);
  });

  test('reports a path whose sourceId matches neither an edge nor a box', () => {
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('p', 'missing', [{ x: 50, y: 100 }, { x: 50, y: 40 }])],
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

  test('does not call a leader edge an orphan when it has a path', () => {
    const leaderEdge = edge({ id: 'leader', kind: 'leader' });
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('p', 'leader', [{ x: 50, y: 100 }, { x: 50, y: 40 }])],
      edges: [leaderEdge],
      boxes: [a, b],
    });
    expect(diagnostics.some((item) => item.code === 'orphan-leader')).toBe(false);
  });

  test('accepts declared open and adjacent endpoints', () => {
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('p', 'flow-a-b', [{ x: 50, y: 200 }, { x: 50, y: 48 }])],
      edges: [edgeSpec],
      boxes: [a, b],
      endpointBudgets: { 'flow-a-b': { from: { open: true }, to: { gap: 8 } } },
    });
    expect(diagnostics.some((item) => item.code === 'edge-endpoint-far')).toBe(false);
  });

  test('checks internal wiring endpoints using attach owners', () => {
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('p', 'a', [{ x: 50, y: 60 }, { x: 50, y: 40 }], { attach: { from: 'a', to: 'b' } })],
      edges: [],
      boxes: [a, b],
      endpointBudgets: { p: { from: { gap: 0 }, to: { gap: 0 } } },
    });
    expect(diagnostics.some((item) => item.code === 'edge-endpoint-far')).toBe(true);
  });

  test('accepts a Group as an anchor owner', () => {
    const group = { ...box('g', 0, 0, 100, 40), kind: 'group' as const };
    const groupEdge = edge({ id: 'to-group', from: { node: 'a' }, to: { node: 'g' } });
    const diagnostics = diagnoseConnectorLinks({
      paths: [path('p', 'to-group', [{ x: 50, y: 100 }, { x: 50, y: 40 }])],
      edges: [groupEdge],
      boxes: [a, group],
    });
    expect(diagnostics.some((item) => item.code === 'unplaced-edge')).toBe(false);
    expect(diagnostics.some((item) => item.code === 'edge-endpoint-far')).toBe(false);
  });

  test('honours the requested severity', () => {
    const diagnostics = diagnoseConnectorLinks({
      paths: [],
      edges: [edgeSpec],
      boxes: [a, b],
      severity: 'error',
    });
    expect(diagnostics[0]?.severity).toBe('error');
  });
});
