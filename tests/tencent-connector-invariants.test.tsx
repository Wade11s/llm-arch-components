import { describe, expect, test } from 'bun:test';
import { diagnoseConnectorLinks } from '../src/core/connectors';
import type { ConnectorBox } from '../src/core/connectors';
import { renderFigure } from '../src/core/renderFigure';
import type { Box, Point, Scene, ScenePath, SceneText } from '../src/core/types';
import { tencentHy4Spec } from '../src/specs/tencentHy4';

function pointInsideBox(point: Point, box: Box, pad = 0): boolean {
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
  if (pointInsideBox(a, box, 0.001) || pointInsideBox(b, box, 0.001)) return true;
  const corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ];
  let crossings = 0;
  for (let index = 0; index < corners.length; index += 1) {
    if (segmentsIntersect(a, b, corners[index], corners[(index + 1) % corners.length])) crossings += 1;
  }
  return crossings % 2 === 1;
}

function sceneBoxes(scene: Scene): ConnectorBox[] {
  const boxes: ConnectorBox[] = [];
  for (const element of scene.elements) {
    if (element.kind === 'box') {
      boxes.push({
        id: element.id,
        owner: element.sourceId ?? element.id,
        box: element.box,
        radius: element.radius,
        kind: element.role === 'repeat-block' || element.role === 'model-container' ? 'group' : 'node',
      });
    } else if (element.kind === 'group') {
      boxes.push({ id: element.id, owner: element.sourceId ?? element.id, box: element.box, kind: 'group' });
    }
  }
  const sample = scene.elements.find(
    (element): element is SceneText => element.kind === 'text' && element.id === 'sample-input',
  );
  if (sample) {
    const minX = Math.min(...sample.lines.flatMap((line) => line.spans.map((span) => span.x)));
    const maxX = Math.max(...sample.lines.flatMap((line) => line.spans.map((span) => span.x + span.width)));
    const minY = Math.min(...sample.lines.map((line) => line.baseline - (line.spans[0]?.size ?? 38)));
    const maxY = Math.max(...sample.lines.map((line) => line.baseline));
    boxes.push({
      id: 'sample-input-box',
      owner: 'sample-input',
      box: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      kind: 'text',
    });
  }
  return boxes;
}

describe('Tencent Hy4 connector invariants', () => {
  const scene = renderFigure(tencentHy4Spec).scene;
  const leaderAnnotations = (tencentHy4Spec.annotations ?? []).filter((annotation) => annotation.style === 'leader');
  const leaderIds = new Set(leaderAnnotations.map((annotation) => annotation.id));
  const migratedEdges = tencentHy4Spec.edges.filter((edge) =>
    edge.id.startsWith('flow-') || edge.id === 'attention-mask' || edge.id === 'ihc-zoom' || edge.id === 'output-to-drafter',
  );
  const migratedIds = new Set([...migratedEdges.map((edge) => edge.id), ...leaderIds]);
  const migratedPaths = scene.elements.filter(
    (element): element is ScenePath => element.kind === 'path' && element.sourceId !== undefined && migratedIds.has(element.sourceId),
  );
  const diagnostics = diagnoseConnectorLinks({
    paths: migratedPaths,
    edges: migratedEdges,
    boxes: sceneBoxes(scene),
    annotations: leaderAnnotations,
    endpointBudgets: {
      'flow-sample-tokenized': { from: { gap: 6 }, to: { gap: 0 } },
      'output-to-drafter': { from: { gap: 0 }, to: { open: true } },
    },
    severity: 'error',
  });

  test('realizes every migrated Edge and leader annotation exactly once', () => {
    expect(migratedEdges).toHaveLength(16);
    expect(migratedPaths).toHaveLength(19);
    expect(new Set(migratedPaths.map((path) => path.sourceId))).toEqual(migratedIds);
    expect(leaderAnnotations).toHaveLength(3);
    for (const annotation of leaderAnnotations) {
      expect(migratedPaths.filter((path) => path.sourceId === annotation.id && path.role === 'leader')).toHaveLength(1);
    }
  });

  test('has no attachment, direction, crossing, linkage, or leader violation', () => {
    expect(diagnostics).toEqual([]);
  });

  test('starts the zooms on the declared components and ends them on the inset borders', () => {
    const maskZoom = migratedPaths.find((path) => path.sourceId === 'attention-mask');
    const ihcZoom = migratedPaths.find((path) => path.sourceId === 'ihc-zoom');
    expect(maskZoom?.role).toBe('zoom-leader');
    expect(maskZoom?.arrow).toBe('none');
    expect(maskZoom?.stroke.dash).toBe('dotted');
    expect(maskZoom?.points[0]).toEqual({ x: 1543, y: 900 });
    expect(maskZoom?.points.at(-1)).toEqual({ x: 2149, y: 650 });
    expect(maskZoom?.points.every((point) => point.x > 1428)).toBe(true);
    expect(ihcZoom?.role).toBe('zoom-leader');
    expect(ihcZoom?.arrow).toBe('none');
    expect(ihcZoom?.stroke.dash).toBe('dotted');
    expect(ihcZoom?.points[0].x).toBe(1300);
    expect(ihcZoom?.points[0].y).toBeCloseTo(2129.2, 1);
    expect(ihcZoom?.points.at(-1)).toEqual({ x: 1893, y: 2175 });
  });

  test('keeps the output arrow open near the drafter note', () => {
    const output = migratedPaths.find((path) => path.sourceId === 'output-to-drafter');
    expect(output?.points[0]).toEqual({ x: 1150, y: 418 });
    expect(output?.points.at(-1)?.x).toBe(1150);
    expect(output?.points.at(-1)?.y).toBeCloseTo(246.8, 1);
    expect(output?.arrow).toBe('end');
  });

  test('keeps the open output tip outside every box and clear of the model', () => {
    const output = migratedPaths.find((path) => path.sourceId === 'output-to-drafter');
    const tip = output!.points.at(-1)!;
    for (const box of sceneBoxes(scene)) {
      expect(pointInsideBox(tip, box.box)).toBe(false);
      expect(distanceToBox(tip, box.box)).toBeGreaterThanOrEqual(8 - 0.001);
    }
  });

  test('crosses only the owner containers on the two zoom leaders', () => {
    const allowedBySource: Record<string, Set<string>> = {
      'attention-mask': new Set(['backbone', 'model', 'mask-inset']),
      'ihc-zoom': new Set(['ihc-read', 'backbone', 'model', 'ihc-inset']),
    };
    const zoomPaths = scene.elements.filter(
      (element): element is ScenePath => element.kind === 'path' && element.role === 'zoom-leader',
    );
    expect(zoomPaths.map((path) => path.sourceId).sort()).toEqual(['attention-mask', 'ihc-zoom']);
    for (const path of zoomPaths) {
      const allowed = allowedBySource[path.sourceId!];
      if (!allowed) throw new Error(`Unexpected zoom path ${path.id}`);
      for (let index = 0; index < path.points.length - 1; index += 1) {
        for (const box of sceneBoxes(scene)) {
          if (allowed.has(box.owner)) continue;
          expect(segmentCrossesBox(path.points[index], path.points[index + 1], box.box)).toBe(false);
        }
      }
    }
  });

  test('links all six leader callouts to a declared node, group, or annotation', () => {
    const leaders = scene.elements.filter(
      (element): element is ScenePath => element.kind === 'path' && element.role === 'leader',
    );
    expect(leaders.map((path) => path.id).sort()).toEqual([
      'leader-attention',
      'leader-context',
      'leader-embedding',
      'leader-ffn',
      'leader-moe',
      'leader-vocabulary',
    ]);
    const known = new Set([
      ...tencentHy4Spec.nodes.map((node) => node.id),
      ...tencentHy4Spec.groups.map((group) => group.id),
      ...(tencentHy4Spec.annotations ?? []).map((annotation) => annotation.id),
    ]);
    for (const leader of leaders) {
      expect(leader.sourceId).toBeDefined();
      expect(known.has(leader.sourceId!)).toBe(true);
    }
    const ffn = leaders.find((path) => path.id === 'leader-ffn');
    expect(ffn?.sourceId).toBe('backbone');
  });

  test('links every Tencent path and leader in the whole scene', () => {
    const allPaths = scene.elements.filter((element): element is ScenePath => element.kind === 'path');
    const unlinked = diagnoseConnectorLinks({
      paths: allPaths,
      edges: tencentHy4Spec.edges,
      boxes: sceneBoxes(scene),
      annotations: leaderAnnotations,
    }).filter((item) => item.code === 'unlinked-path' || item.code === 'orphan-leader');
    expect(unlinked).toEqual([]);
  });

  test('derives annotation leaders from text bounds and lands them on the target boundary', () => {
    const vocabulary = migratedPaths.find((path) => path.sourceId === 'vocabulary');
    const context = migratedPaths.find((path) => path.sourceId === 'context');
    const embedding = migratedPaths.find((path) => path.sourceId === 'embedding');
    const block = (id: string) => {
      const texts = scene.elements.filter(
        (element): element is SceneText => element.kind === 'text'
          && element.sourceId === id
          && element.id.startsWith(`caption-${id}-`),
      );
      const spans = texts.flatMap((text) => text.lines.flatMap((line) => line.spans));
      const baselines = texts.flatMap((text) => text.lines.map((line) => line.baseline));
      const size = spans[0]?.size ?? 0;
      const left = Math.min(...spans.map((span) => span.x));
      const right = Math.max(...spans.map((span) => span.x + span.width));
      const top = Math.min(...baselines) - size;
      const bottom = Math.max(...baselines) + size * 0.3;
      return { left, right, top, bottom, center: (top + bottom) / 2 };
    };
    for (const path of [vocabulary, context, embedding]) {
      const annotation = tencentHy4Spec.annotations?.find((item) => item.id === path?.sourceId);
      const bounds = block(annotation!.id);
      expect(path?.points[0].x).toBeCloseTo(bounds.right + 5, 1);
      expect(path?.points[0].y).toBeCloseTo(bounds.center, 1);
    }
    expect(vocabulary?.points.at(-1)?.x).toBeCloseTo(970.2, 0);
    expect(vocabulary?.points.at(-1)?.y).toBeCloseTo(477.3, 0);
    expect(context?.points.at(-1)?.x).toBeCloseTo(897.5, 1);
    expect(context?.points.at(-1)?.y).toBeCloseTo(1834.5, 0);
    expect(embedding?.points.at(-1)?.x).toBeCloseTo(890.1, 0);
    expect(embedding?.points.at(-1)?.y).toBeCloseTo(2379.6, 0);
  });
});
