import type { Diagnostic } from './types';

export class FigureValidationError extends Error {
  readonly issues: Diagnostic[];

  constructor(issues: Diagnostic[]) {
    super(issues.map((issue) => `${issue.code}: ${issue.message}`).join('; '));
    this.name = 'FigureValidationError';
    this.issues = issues;
  }
}

export class FigureLayoutError extends Error {
  readonly issues: Diagnostic[];

  constructor(issues: Diagnostic[]) {
    super(issues.map((issue) => `${issue.code}: ${issue.message}`).join('; '));
    this.name = 'FigureLayoutError';
    this.issues = issues;
  }
}
