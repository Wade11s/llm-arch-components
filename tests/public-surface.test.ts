import { describe, expect, test } from 'bun:test';
import * as publicApi from '../src/index';

const expectedExports = [
  'FigureLayoutError',
  'FigureValidationError',
  'SceneSvg',
  'renderFigure',
  'renderFigureFromJson',
];

describe('public interface', () => {
  test('exports only the small accepted surface', () => {
    expect(Object.keys(publicApi).sort()).toEqual(expectedExports);
  });
});
