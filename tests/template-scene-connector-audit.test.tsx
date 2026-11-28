import { expect, test } from 'bun:test';
import { TemplateScene } from '../src/core/templates/templateScene';
import type { EdgeSpec, FigureSpec } from '../src/core/types';
import { tencentHy4Spec } from '../src/specs/tencentHy4';

const flow: EdgeSpec = {
  id: 'flow-a-b',
  kind: 'flow',
  from: { node: 'a' },
  to: { node: 'b' },
};

function auditSpec(edges: EdgeSpec[], annotations: FigureSpec['annotations'] = []): FigureSpec {
  return {
    schemaVersion: 1,
    id: 'connector-audit',
    canvas: { width: 1000, height: 1000 },
    title: 'Connector audit',
    description: 'Connector contract audit test',
    theme: tencentHy4Spec.theme,
    groups: [],
    nodes: [],
    edges,
    annotations,
    layout: { mode: 'manual', placements: {} },
  } as FigureSpec;
}

test('TemplateScene leaves the connector contract audit off by default', () => {
  const builder = new TemplateScene(tencentHy4Spec.theme, {
    measure: () => 100,
    lineHeight: () => 40,
  });
  const scene = builder.scene(auditSpec([flow]));

  expect(scene.diagnostics).toEqual([]);
});

function contractBuilder(): TemplateScene {
  return new TemplateScene(tencentHy4Spec.theme, {
    measure: () => 100,
    lineHeight: () => 40,
  }, { enforceConnectorContract: true });
}

function registerBox(builder: TemplateScene, id: string, x: number, y: number): void {
  builder.box(id, 'node', { x, y, width: 200, height: 80 }, { sourceId: id });
}

test('TemplateScene reports an unlinked path when the contract audit is enabled', () => {
  const builder = contractBuilder();
  builder.flow('ghost-path', [{ x: 10, y: 10 }, { x: 100, y: 100 }], { sourceId: 'ghost-node' });

  const scene = builder.scene(auditSpec([]));
  expect(scene.diagnostics).toContainEqual(expect.objectContaining({
    severity: 'error',
    code: 'unlinked-path',
    sourceIds: ['ghost-path'],
  }));
});

test('TemplateScene uses resolved endpoint budgets for gap and open endpoints', () => {
  const builder = contractBuilder();
  registerBox(builder, 'a', 100, 100);
  registerBox(builder, 'b', 100, 400);
  builder.edge(flow, { from: 'a', to: 'b', fromGap: 6 });
  builder.edge({ ...flow, id: 'flow-open', from: { node: 'a' }, to: { node: 'b' } }, {
    from: 'a',
    to: 'b',
    openTo: { x: 700, y: 700 },
  });

  const scene = builder.scene(auditSpec([
    flow,
    { ...flow, id: 'flow-open' },
  ]));
  expect(scene.diagnostics).toEqual([]);
});

test('TemplateScene reports a flow with the wrong arrow direction', () => {
  const builder = contractBuilder();
  registerBox(builder, 'a', 100, 100);
  registerBox(builder, 'b', 100, 400);
  builder.edge(flow, { from: 'a', to: 'b', arrow: 'none' });

  const scene = builder.scene(auditSpec([flow]));
  expect(scene.diagnostics).toContainEqual(expect.objectContaining({
    severity: 'error',
    code: 'edge-direction',
    sourceIds: [flow.id, flow.id],
  }));
});

test('TemplateScene reports a path crossing an unrelated node', () => {
  const builder = contractBuilder();
  registerBox(builder, 'a', 100, 100);
  registerBox(builder, 'b', 100, 500);
  registerBox(builder, 'obstacle', 100, 250);
  builder.edge(flow, { from: 'a', to: 'b' });

  const scene = builder.scene(auditSpec([flow]));
  expect(scene.diagnostics).toContainEqual(expect.objectContaining({
    severity: 'error',
    code: 'edge-crosses-node',
    sourceIds: [flow.id, flow.id, 'obstacle'],
  }));
});

test('TemplateScene reports an orphaned leader annotation', () => {
  const scene = contractBuilder().scene(auditSpec([], [{
    id: 'note',
    target: 'model',
    placement: 'left',
    style: 'leader',
    content: { bullets: [{ spans: [{ text: 'Note' }] }] },
  }]));

  expect(scene.diagnostics).toContainEqual(expect.objectContaining({
    severity: 'error',
    code: 'orphan-leader',
    sourceIds: ['note'],
  }));
});

test('TemplateScene reports an unplaced Edge when the contract audit is enabled', () => {
  const builder = new TemplateScene(tencentHy4Spec.theme, {
    measure: () => 100,
    lineHeight: () => 40,
  }, { enforceConnectorContract: true });
  const scene = builder.scene(auditSpec([flow]));

  expect(scene.diagnostics).toContainEqual(expect.objectContaining({
    severity: 'error',
    code: 'unplaced-edge',
    sourceIds: [flow.id],
  }));
});
