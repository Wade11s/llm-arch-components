import { diagnoseScene } from './diagnostics';
import { templateLayoutEngine } from './layout';
import { systemTextMetrics } from './metrics';
import { renderSceneToSvg } from './renderScene';
import { validateFigureSpec } from './validation';
import type { FigureSpec, RenderedFigure, RenderFigureOptions } from './types';

export { FigureLayoutError, FigureValidationError } from './errors';
export { SceneSvg } from './renderScene';

export function renderFigure(input: FigureSpec, options: RenderFigureOptions = {}): RenderedFigure {
  const spec = validateFigureSpec(input);
  const engine = options.layout ?? templateLayoutEngine;
  const positioned = engine.layout(spec, {
    theme: spec.theme,
    metrics: options.metrics ?? systemTextMetrics,
  });
  const diagnostics = [...positioned.diagnostics, ...diagnoseScene(spec, positioned)];
  const scene = { ...positioned, diagnostics };
  const svg = renderSceneToSvg(scene, options.idPrefix ?? spec.id);
  return {
    scene,
    svg,
    diagnostics,
  };
}

export type { FigureSpec, RenderedFigure, RenderFigureOptions } from './types';
export type { Scene } from './types';
