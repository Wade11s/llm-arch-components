import { describe, expect, test } from 'bun:test';
import { renderFigure } from '../src/core/renderFigure';
import type { Box, SceneBox, ScenePath } from '../src/core/types';
import { tencentHy4Spec } from '../src/specs/tencentHy4';

const BUS_Y = [872, 1328, 1520, 2126];

function segmentHitsBox(a: { x: number; y: number }, b: { x: number; y: number }, box: Box): boolean {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  if (Math.abs(a.y - b.y) < 0.01) {
    return a.y > box.y + 0.5
      && a.y < box.y + box.height - 0.5
      && Math.max(minX, box.x + 0.5) < Math.min(maxX, box.x + box.width - 0.5);
  }
  if (Math.abs(a.x - b.x) < 0.01) {
    return a.x > box.x + 0.5
      && a.x < box.x + box.width - 0.5
      && Math.max(minY, box.y + 0.5) < Math.min(maxY, box.y + box.height - 0.5);
  }
  for (let index = 1; index < 20; index += 1) {
    const t = index / 20;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    if (x > box.x + 0.5 && x < box.x + box.width - 0.5 && y > box.y + 0.5 && y < box.y + box.height - 0.5) {
      return true;
    }
  }
  return false;
}

describe('Tencent Hy4 residual bus', () => {
  const rendered = renderFigure(tencentHy4Spec);
  const scene = rendered.scene;
  const paths = scene.elements.filter((element): element is ScenePath => element.kind === 'path');
  const trunk = paths.find((path) => path.id === 'residual-trunk');
  const branches = paths.filter((path) => path.role === 'residual-branch');
  const dots = scene.elements.filter(
    (element): element is SceneBox => element.kind === 'box' && element.role === 'residual-dot',
  );

  test('keeps the bus as traceable internal wiring', () => {
    // Linkage only: the bus junctions are path-to-path, so the generic Edge attachment check is exempt.
    expect(trunk).toBeDefined();
    expect(trunk?.sourceId).toBe('backbone');
    expect(branches).toHaveLength(4);
    expect(branches.every((branch) => branch.sourceId === 'backbone')).toBe(true);
    expect(dots).toHaveLength(4);
    expect(dots.every((dot) => dot.sourceId === 'backbone')).toBe(true);
  });

  test('pins the trunk, branch endpoints, and junction dots', () => {
    const readNode = tencentHy4Spec.nodes.find((node) => node.id === 'ihc-read');
    const streams = readNode?.kind === 'composite' && readNode.data.family === 'gated-residual'
      ? readNode.data.streams
      : 0;
    expect(branches).toHaveLength(streams);

    const pills = ['ihc-write-top', 'ihc-read-top', 'ihc-write-mid', 'ihc-read-low'];
    const branchX = branches[0]?.points[1]?.x;
    expect(trunk?.points).toEqual([
      { x: branchX, y: BUS_Y[0] },
      { x: branchX, y: BUS_Y[3] },
    ]);
    for (const [index, y] of BUS_Y.entries()) {
      const pill = scene.elements.find(
        (element): element is SceneBox => element.kind === 'box' && element.id === pills[index],
      );
      expect(pill).toBeDefined();
      const branch = branches.find((candidate) => candidate.points[0]?.y === y);
      expect(branch?.points).toEqual([
        { x: pill!.box.x + pill!.box.width, y },
        { x: branchX, y },
      ]);
      const dot = dots.find((candidate) => candidate.box.y === y - 11);
      expect(dot?.box).toEqual({ x: branchX! - 11, y: y - 11, width: 22, height: 22 });
    }
  });

  test('removes the undrawn residual edge', () => {
    expect(tencentHy4Spec.edges.some((edge) => edge.id === 'ihc-residual')).toBe(false);
    expect(rendered.diagnostics).toEqual([]);
  });

  test('does not cross a non-endpoint node or group', () => {
    const containers = new Set(['model-container', 'repeat-block']);
    const obstacles = scene.elements.filter(
      (element): element is SceneBox => element.kind === 'box'
        && !containers.has(element.role)
        && element.role !== 'residual-dot',
    );
    const moe = scene.elements.find((element): element is SceneBox => element.kind === 'box' && element.id === 'moe');
    expect(moe).toBeDefined();
    expect(segmentHitsBox({ x: 1150, y: 872 }, { x: 1150, y: 2126 }, moe!.box)).toBe(true);

    const bus = [trunk!, ...branches];
    expect(bus).toHaveLength(5);
    for (const path of bus) {
      for (let index = 0; index < path.points.length - 1; index += 1) {
        for (const obstacle of obstacles) {
          expect(segmentHitsBox(path.points[index], path.points[index + 1], obstacle.box)).toBe(false);
        }
      }
    }
  });
});
