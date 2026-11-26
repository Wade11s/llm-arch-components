import { FigureValidationError } from './errors';
import { renderFigure } from './renderFigure';
import type { RenderedFigure, RenderFigureOptions } from './types';

export function renderFigureFromJson(json: string, options: RenderFigureOptions = {}): RenderedFigure {
  let input: unknown;
  try {
    input = JSON.parse(json);
  } catch (error) {
    throw new FigureValidationError([{
      severity: 'error',
      code: 'invalid-json',
      message: error instanceof Error ? error.message : 'Invalid JSON input',
      path: '$',
    }]);
  }
  return renderFigure(input as Parameters<typeof renderFigure>[0], options);
}
