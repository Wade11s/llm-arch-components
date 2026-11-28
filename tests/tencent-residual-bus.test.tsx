import { describe, expect, test } from 'bun:test';
import { renderFigure } from '../src/core/renderFigure';
import type { Box, SceneBox, ScenePath } from '../src/core/types';
import { tencentHy4Spec } from '../src/specs/tencentHy4';

const BUS_Y = [872, 1328, 1520, 2126];
const TRUNK_X = 1428;

function segmentHitsBox(a: { x: number; y: number }, b: { x: number; y: number }, box: Box): boolean {
  const overlapX = Math.min(Math.max(a.x, b.x), box.x + box.width) - Math.max(Math.min(a.x, b.x), box.x);
  const overlapY = Math.min(Math.max(a.y, b.y), box.y + box.height) - Math.max(Math.min(a.y, b.y), box.y);
  return overlapX > 0.5 && overlapY > 0.5;
}

describe('Tencent Hy4 residual bus', () => {
  const scene = renderFigure(tencentHy4Spec).scene;
  const paths = scene.elements.filter((element): element is ScenePath => element.kind === 'path');
  const trunk = paths.find((path) => path.id === 'residual-trunk');
  const branches = paths.filter((path) => path.role === 'residual-branch');
  const dots = scene.elements.filter(
    (element): element is SceneBox => element.kind === 'box' && element.role === 'residual-dot',
  );

  test('keeps the bus as traceable internal wiring', () => {
    expect(trunk?.sourceId).toBe('backbone');
    expect(branches).toHaveLength(4);
    expect(branches.every((branch) => branch.sourceId === 'backbone')).toBe(true);
    expect(dots).toHaveLength(4);
    expect(dots.every((dot) => dot.sourceId === 'backbone')).toBe(true);
  });

  test('pins the trunk, branch endpoints, and junction dots', () => {
    expect(trunk?.points).toEqual([
      { x: TRUNK_X, y: BUS_Y[0] },
      { x: TRUNK_X, y: BUS_Y[3] },
    ]);
    for (const y of BUS_Y) {
      const branch = branches.find((candidate) => candidate.points[0]?.y === y);
      expect(branch?.points).toEqual([
        { x: 1300, y },
        { x: TRUNK_X, y },
      ]);
      const dot = dots.find((candidate) => candidate.box.y === y - 11);
      expect(dot?.box).toEqual({ x: TRUNK_X - 11, y: y - 11, width: 22, height: 22 });
    }
    expect(tencentHy4Spec.edges.some((edge) => edge.id === 'ihc-residual')).toBe(false);
  });

  test('does not cross a non-endpoint node or group', () => {
    const containers = new Set(['model-container', 'repeat-block']);
    const obstacles = scene.elements.filter(
      (element): element is SceneBox => element.kind === 'box'
        && !containers.has(element.role)
        && element.role !== 'residual-dot',
    );
    for (const path of [trunk, ...branches]) {
      if (!path) continue;
      for (let index = 0; index < path.points.length - 1; index += 1) {
        for (const obstacle of obstacles) {
          expect(segmentHitsBox(path.points[index], path.points[index + 1], obstacle.box)).toBe(false);
        }
      }
    }
  });
});
