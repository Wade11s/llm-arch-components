import { describe, expect, test } from 'bun:test';
import { diagnoseConnectorLinks } from '../src/core/connectors';
import type { ConnectorBox } from '../src/core/connectors';
import { renderFigure } from '../src/core/renderFigure';
import type { Scene, ScenePath, SceneText } from '../src/core/types';
import { tencentHy4Spec } from '../src/specs/tencentHy4';

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
      'flow-sample-tokenized': { from: { gap: 8 }, to: { gap: 0 } },
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
    expect(maskZoom?.points[0]).toEqual({ x: 1325, y: 1010 });
    expect(maskZoom?.points.at(-1)).toEqual({ x: 2149, y: 1050 });
    expect(ihcZoom?.role).toBe('zoom-leader');
    expect(ihcZoom?.arrow).toBe('none');
    expect(ihcZoom?.points[0]).toEqual({ x: 1300, y: 2126 });
    expect(ihcZoom?.points.at(-1)).toEqual({ x: 1893, y: 2240 });
  });

  test('keeps the output arrow open near the drafter note', () => {
    const output = migratedPaths.find((path) => path.sourceId === 'output-to-drafter');
    expect(output?.points[0]).toEqual({ x: 1150, y: 418 });
    expect(output?.points.at(-1)?.x).toBe(1150);
    expect(output?.points.at(-1)?.y).toBeCloseTo(246.8, 1);
    expect(output?.arrow).toBe('end');
  });

  test('derives annotation leaders from text bounds and lands them on the target boundary', () => {
    const vocabulary = migratedPaths.find((path) => path.sourceId === 'vocabulary');
    const context = migratedPaths.find((path) => path.sourceId === 'context');
    const embedding = migratedPaths.find((path) => path.sourceId === 'embedding');
    expect(vocabulary?.points[0].x).toBeGreaterThan(24);
    expect(vocabulary?.points[0].y).toBeGreaterThan(530);
    expect(vocabulary?.points.at(-1)).toEqual({ x: 970, y: 498 });
    expect(context?.points.at(-1)).toEqual({ x: 897.5, y: 1843.2 });
    expect(embedding?.points.at(-1)).toEqual({ x: 880, y: 2384 });
  });
});
