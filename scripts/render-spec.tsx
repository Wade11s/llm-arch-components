import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { renderFigureFromJson } from '../src/core/renderFigureJson';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('Usage: bun scripts/render-spec.tsx <figure-spec.json> <output.svg>');
  process.exit(1);
}

const json = await readFile(inputPath, 'utf8');
const result = renderFigureFromJson(json, { idPrefix: outputPath.replace(/[^a-zA-Z0-9-]/g, '-') });
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, result.svg, 'utf8');
console.log(JSON.stringify({ output: outputPath, sceneElements: result.scene.elements.length, diagnostics: result.diagnostics }, null, 2));
