import type { Diagnostic, FigureSpec, Scene } from './types';

function intersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function diagnoseScene(spec: FigureSpec, scene: Scene): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const ids = new Set<string>();
  for (const element of scene.elements) {
    if (ids.has(element.id)) {
      diagnostics.push({ severity: 'error', code: 'duplicate-scene-id', message: `Scene element id "${element.id}" is duplicated`, sourceIds: [element.id] });
    }
    ids.add(element.id);
    if (element.kind === 'path') {
      for (const point of element.points) {
        if (point.x < 0 || point.y < 0 || point.x > scene.canvas.width || point.y > scene.canvas.height) {
          diagnostics.push({ severity: 'warning', code: 'out-of-bounds', message: `Path "${element.id}" leaves the canvas`, sourceIds: [element.id] });
          break;
        }
      }
    }
    if (element.kind === 'text') {
      for (const line of element.lines) {
        for (const span of line.spans) {
          if (span.x + span.width > scene.canvas.width + 1) {
            diagnostics.push({ severity: 'warning', code: 'text-overflow', message: `Text "${element.id}" extends past the canvas width`, sourceIds: [element.id] });
          }
        }
      }
    }
  }

  if (spec.layout.mode === 'manual') {
    const entries = Object.entries(spec.layout.placements);
    for (let index = 0; index < entries.length; index += 1) {
      for (let other = index + 1; other < entries.length; other += 1) {
        const [id, box] = entries[index];
        const [otherId, otherBox] = entries[other];
        if (intersects(box, otherBox)) {
          diagnostics.push({ severity: 'warning', code: 'overlap', message: `Manual placements "${id}" and "${otherId}" overlap`, sourceIds: [id, otherId] });
        }
      }
    }
  }
  return diagnostics;
}
