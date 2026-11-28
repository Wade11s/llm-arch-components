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

function pathsFor(scene: Scene, ids: Set<string>): ScenePath[] {
  return scene.elements.filter(
    (element): element is ScenePath => element.kind === 'path' && element.sourceId !== undefined && ids.has(element.sourceId),
  );
}

describe('Tencent Hy4 connector flows', () => {
  const result = renderFigure(tencentHy4Spec);
  const scene = result.scene;
  const flowEdges = tencentHy4Spec.edges.filter((edge) => edge.id.startsWith('flow-'));
  const flowIds = new Set(flowEdges.map((edge) => edge.id));
  const flowPaths = pathsFor(scene, flowIds);

  test('realizes every backbone flow as one Edge-backed Path', () => {
    expect(flowEdges).toHaveLength(13);
    expect(flowPaths).toHaveLength(13);
    expect(new Set(flowPaths.map((path) => path.sourceId))).toEqual(flowIds);
  });

  test('keeps every flow on its declared owners without crossing another node', () => {
    const diagnostics = diagnoseConnectorLinks({
      paths: flowPaths,
      edges: flowEdges,
      boxes: sceneBoxes(scene),
      endpointBudgets: {
        'flow-sample-tokenized': { from: { gap: 8 }, to: { gap: 0 } },
      },
    });
    expect(diagnostics.filter((item) =>
      item.code === 'edge-endpoint-far'
      || item.code === 'edge-owner-mismatch'
      || item.code === 'edge-crosses-node'
      || item.code === 'unplaced-edge'
    )).toEqual([]);
  });

  test('splits the output chain at Final RMSNorm instead of crossing it', () => {
    expect(flowIds.has('flow-head-norm')).toBe(true);
    expect(flowIds.has('flow-norm-output')).toBe(true);
    expect(flowIds.has('flow-final-head-output')).toBe(false);
  });

  test('renders bottom-up from the tokenized input to the output layer', () => {
    const centerX = (id: string): number | undefined => {
      const path = flowPaths.find((candidate) => candidate.sourceId === id);
      return path?.points[0]?.x;
    };
    expect(centerX('flow-tokenized-embedding')).toBe(1150);
    expect(centerX('flow-norm-output')).toBe(1150);
  });
});
