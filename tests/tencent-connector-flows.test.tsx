import { describe, expect, test } from 'bun:test';
import { renderFigure } from '../src/core/renderFigure';
import type { Scene, ScenePath, SceneText } from '../src/core/types';
import { tencentHy4Spec } from '../src/specs/tencentHy4';

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
    expect(result.diagnostics.filter((item) =>
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
    for (const path of flowPaths) {
      const start = path.points[0];
      const end = path.points[path.points.length - 1];
      expect(start.y).toBeGreaterThan(end.y);
    }
    const sample = flowPaths.find((path) => path.sourceId === 'flow-sample-tokenized');
    const sampleText = scene.elements.find(
      (element): element is SceneText => element.kind === 'text' && element.id === 'sample-input',
    );
    expect(sample).toBeDefined();
    expect(sampleText).toBeDefined();
    expect(sampleText!.lines[0].baseline - 38 - sample!.points[0].y).toBe(6);
  });
});
