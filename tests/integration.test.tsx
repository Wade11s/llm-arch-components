import { describe, expect, test } from 'bun:test';
import { renderFigure, FigureValidationError } from '../src/core/renderFigure';
import { renderFigureFromJson } from '../src/core/renderFigureJson';
import { figureSpecs } from '../src/specs';
import { gemma3Spec } from '../src/specs/gemma3';

describe('spec-driven integration surface', () => {
  test('all validated figures render through the same interface with stable Scene snapshots', () => {
    for (const entry of figureSpecs) {
      const result = renderFigure(entry.spec, { idPrefix: `${entry.slug}-snapshot` });
      expect(result.scene.metadata.title).toBe(entry.spec.title);
      expect(result.scene).toMatchSnapshot(entry.slug);
      expect(result.svg).not.toContain('<image');
    }
  });

  test('JSON FigureSpec renders the same SVG as the typed Spec', () => {
    const fromJson = renderFigureFromJson(JSON.stringify(gemma3Spec), { idPrefix: 'json-gemma' });
    const direct = renderFigure(gemma3Spec, { idPrefix: 'json-gemma' });
    expect(fromJson.svg).toBe(direct.svg);
    expect(fromJson.scene).toEqual(direct.scene);
  });

  test('invalid JSON fails with a structured validation error', () => {
    expect(() => renderFigureFromJson('{not json')).toThrow(FigureValidationError);
  });
});
