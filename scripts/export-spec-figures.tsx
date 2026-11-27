import { mkdir, writeFile } from 'node:fs/promises';
import { renderFigure } from '../src/core/renderFigure';
import { figureSpecs } from '../src/specs';

await mkdir('artifacts/svg', { recursive: true });
for (const entry of figureSpecs) {
  const slug = `${entry.slug}-spec`;
  const result = renderFigure(entry.spec, { idPrefix: `${slug}-export` });
  const path = `artifacts/svg/${slug}.svg`;
  await writeFile(path, result.svg, 'utf8');
  console.log(`- ${path} (${result.scene.elements.length} scene elements)`);
}
