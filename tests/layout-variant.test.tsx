import { describe, expect, test } from 'bun:test';
import { FigureValidationError, renderFigure, renderFigureFromJson } from '../src';
import { qwen3NextSpec } from '../src/specs/qwen3Next';
import type { FigureSpec } from '../src/core/types';

if (qwen3NextSpec.layout.mode !== 'template' || qwen3NextSpec.layout.template !== 'moe') {
  throw new Error('qwen3NextSpec must use the moe template');
}

const typedVariantSpec: FigureSpec = {
  ...structuredClone(qwen3NextSpec),
  layout: {
    ...structuredClone(qwen3NextSpec.layout),
    variant: 'mixing-detail',
  },
};

function validationIssues(spec: FigureSpec) {
  try {
    renderFigure(spec);
  } catch (error) {
    if (error instanceof FigureValidationError) return error.issues;
    throw error;
  }
  throw new Error('Expected FigureValidationError');
}

describe('typed layout.variant', () => {
  test('accepts a template variant at the public layout field', () => {
    const result = renderFigure(typedVariantSpec, { idPrefix: 'typed-layout-variant' });
    expect(result.scene.elements.some((element) => element.role === 'mixing-attention-inset')).toBe(true);
    expect(result.scene.elements.some((element) => element.role === 'mixing-delta-inset')).toBe(true);
    expect(result.svg).toContain('Gated DeltaNet');
  });

  test('accepts the same typed variant through JSON', () => {
    const typedResult = renderFigure(typedVariantSpec, { idPrefix: 'json-layout-variant' });
    const jsonResult = renderFigureFromJson(JSON.stringify(typedVariantSpec), { idPrefix: 'json-layout-variant' });
    expect(jsonResult.scene).toEqual(typedResult.scene);
    expect(jsonResult.svg).toBe(typedResult.svg);
  });

  test('rejects the legacy options.variant location with a targeted diagnostic', () => {
    const legacy = structuredClone(typedVariantSpec);
    if (legacy.layout.mode !== 'template') throw new Error('bad fixture');
    delete legacy.layout.variant;
    legacy.layout.options = { ...legacy.layout.options, variant: 'mixing-detail' };

    expect(validationIssues(legacy)).toContainEqual(expect.objectContaining({
      code: 'legacy-variant-location',
      path: 'layout.options.variant',
    }));
  });

  test('uses the targeted legacy diagnostic even for an invalid legacy value', () => {
    const legacy = structuredClone(typedVariantSpec);
    if (legacy.layout.mode !== 'template') throw new Error('bad fixture');
    delete legacy.layout.variant;
    Object.assign(legacy.layout.options ?? {}, { variant: null });

    expect(validationIssues(legacy)).toContainEqual(expect.objectContaining({
      code: 'legacy-variant-location',
      path: 'layout.options.variant',
    }));
  });

  test('collects the legacy diagnostic alongside other schema errors', () => {
    const legacy = structuredClone(typedVariantSpec);
    if (legacy.layout.mode !== 'template') throw new Error('bad fixture');
    delete legacy.layout.variant;
    Object.assign(legacy.layout.options ?? {}, { variant: null });
    Object.assign(legacy, { title: undefined });

    const issues = validationIssues(legacy);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'legacy-variant-location',
      path: 'layout.options.variant',
    }));
    expect(issues.some((issue) => issue.code === 'schema' && issue.path === 'title')).toBe(true);
  });

  test('does not suggest a variant migration for manual layout', () => {
    const manual = structuredClone(typedVariantSpec);
    manual.layout = {
      mode: 'manual',
      placements: {},
      options: { variant: null },
    } as unknown as FigureSpec['layout'];

    const issues = validationIssues(manual);
    expect(issues.some((issue) => issue.code === 'legacy-variant-location')).toBe(false);
    expect(issues.some((issue) => issue.code === 'schema')).toBe(true);
  });

  test('rejects an unsupported variant at layout.variant', () => {
    const invalid = structuredClone(typedVariantSpec);
    Object.assign(invalid.layout, { variant: 'typo-variant' });

    expect(validationIssues(invalid)).toContainEqual(expect.objectContaining({
      code: 'unsupported-variant',
      path: 'layout.variant',
    }));
  });

  test('rejects variant on manual layout', () => {
    const manual = structuredClone(typedVariantSpec);
    manual.layout = { mode: 'manual', placements: {}, variant: 'mixing-detail' } as FigureSpec['layout'];

    const issues = validationIssues(manual);
    expect(issues.some((issue) => issue.code === 'schema' && issue.message.includes('variant'))).toBe(true);
  });

  test('locks template-specific variant compatibility at the type level', () => {
    const validLayout: FigureSpec['layout'] = {
      mode: 'template',
      template: 'moe',
      variant: 'mixing-detail',
      slots: { block: 'backbone' },
    };
    const invalidCandidate = {
      mode: 'template',
      template: 'backbone',
      variant: 'ihc-pipeline',
      slots: { block: 'backbone' },
    } as const;
    // @ts-expect-error ihc-pipeline is not a backbone variant
    const invalidLayout: FigureSpec['layout'] = invalidCandidate;

    expect(validLayout.mode).toBe('template');
    expect(invalidLayout).toBeDefined();
  });
});
