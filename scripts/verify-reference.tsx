import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { Resvg } from '@resvg/resvg-js';
import { renderFigure } from '../src/core/renderFigure';
import { figureSpecs } from '../src/specs';
import { sharpFromFile } from './lib/image';
import {
  computeReferenceMetrics,
  loadReferenceVerificationManifest,
  referenceMetricDriftWarnings,
  referenceVerificationReport,
  referenceVerificationStatuses,
  sha256,
  writeReferenceCrops,
  writeReferenceVerificationManifest,
  type ReferenceVerificationEntry,
  type ReferenceVerificationStatus,
} from './lib/reference-verification';

const { values, positionals } = parseArgs({
  options: {
    'out-dir': { type: 'string' },
    manifest: { type: 'string', default: 'docs/verification/reference-verification.json' },
    status: { type: 'string' },
    reviewer: { type: 'string' },
    'accepted-difference': { type: 'string', multiple: true },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
  strict: true,
});

if (values.help) {
  console.log('Usage: bun scripts/verify-reference.tsx <slug> [--out-dir <dir>] [--manifest <file>] [--status pending|pass|accepted-difference|fail] [--reviewer <name>] [--accepted-difference <note>]');
  process.exit(0);
}

const requestedSlug = positionals[0];
if (!requestedSlug) throw new Error('A figure slug is required');
const requestedStatus = values.status as ReferenceVerificationStatus | undefined;
if (requestedStatus && !referenceVerificationStatuses.includes(requestedStatus)) {
  throw new Error(`Unknown status "${requestedStatus}"`);
}
if ((requestedStatus === 'pass' || requestedStatus === 'accepted-difference') && !values.reviewer) {
  throw new Error('--reviewer is required when recording pass or accepted-difference');
}
if (requestedStatus === 'accepted-difference' && (values['accepted-difference'] ?? []).length === 0) {
  throw new Error('--accepted-difference is required when status is accepted-difference');
}

const entry = figureSpecs.find((figure) => figure.slug === requestedSlug)
  ?? figureSpecs.find((figure) => `${figure.slug}-spec` === requestedSlug);
if (!entry) throw new Error(`Unknown figure "${requestedSlug}"`);
const slug = entry.slug;
const outDir = values['out-dir'] ?? `artifacts/review/${slug}-reference`;
const manifestPath = values.manifest ?? 'docs/verification/reference-verification.json';
const svgPath = `artifacts/svg/${slug}-spec.svg`;
const comparisonPath = `${outDir}/${slug}-spec-comparison.png`;
const renderPath = `${outDir}/${slug}-spec-render-native.png`;
const reportPath = `${outDir}/${slug}-reference-verification.md`;

const first = renderFigure(entry.spec, { idPrefix: `${slug}-spec-export` });
const second = renderFigure(entry.spec, { idPrefix: `${slug}-spec-export` });
const referenceImage = await sharpFromFile(entry.reference.replace(/^\.\.\//, ''));
const referenceMetadata = await referenceImage.metadata();

await mkdir('artifacts/svg', { recursive: true });
await writeFile(svgPath, first.svg, 'utf8');

await mkdir(outDir, { recursive: true });
await writeFile(renderPath, new Resvg(first.svg, {
  fitTo: { mode: 'width', value: entry.width },
  background: 'white',
  font: { loadSystemFonts: true, sansSerifFamily: 'Arial' },
}).render().asPng());
const review = Bun.spawn([
  process.execPath,
  'scripts/build-review.tsx',
  '--figure', `${slug}-spec`,
  '--out-dir', outDir,
], { stdout: 'pipe', stderr: 'pipe' });
const [reviewExit, reviewError] = await Promise.all([
  review.exited,
  new Response(review.stderr).text(),
]);
if (reviewExit !== 0) throw new Error(reviewError);

const metrics = await computeReferenceMetrics(
  entry.reference.replace(/^\.\.\//, ''),
  renderPath,
  entry.width,
  entry.height,
);
const crops = await writeReferenceCrops(
  entry.reference.replace(/^\.\.\//, ''),
  renderPath,
  outDir,
  `${slug}-reference`,
  entry.width,
  entry.height,
);

const hardGates = [
  { label: 'Deterministic SVG export', pass: first.svg === second.svg && (await readFile(svgPath, 'utf8')) === first.svg },
  { label: 'Self-contained SVG without embedded raster or external resources', pass: !/<image\b|data:image\/|<foreignObject\b|\b(?:href|src)=["'](?:https?:|\/)/i.test(first.svg) },
  { label: 'Reference canvas matches the FigureSpec', pass: referenceMetadata.width === entry.width && referenceMetadata.height === entry.height },
  { label: 'Layout diagnostics contain no errors', pass: first.diagnostics.every((diagnostic) => diagnostic.severity !== 'error') },
  { label: 'Real SVG text is present', pass: (first.svg.match(/<text\b/g) ?? []).length >= 20 },
  { label: '50% comparison generated', pass: (await readFile(comparisonPath)).length > 0 },
];
const warnings = first.diagnostics
  .filter((diagnostic) => diagnostic.severity === 'warning')
  .map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`);

const manifest = await loadReferenceVerificationManifest(manifestPath);
const existing = manifest.figures.find((figure) => figure.slug === slug);
if (!existing) throw new Error(`Manifest is missing figure "${slug}"`);

const status = requestedStatus ?? existing.status;
const driftWarnings = referenceMetricDriftWarnings(existing.metrics, metrics);
const evidence: ReferenceVerificationEntry = {
  ...existing,
  slug,
  status,
  reference: {
    path: entry.reference,
    sha256: sha256(await readFile(entry.reference.replace(/^\.\.\//, ''))),
    width: entry.width,
    height: entry.height,
  },
  svg: {
    path: svgPath,
    sha256: sha256(first.svg),
  },
  metrics,
  reviewer: values.reviewer ?? existing.reviewer,
  reviewedAt: requestedStatus ? new Date().toISOString() : existing.reviewedAt,
  artifacts: {
    comparison: comparisonPath,
    crops,
    report: reportPath,
  },
  acceptedDifferences: values['accepted-difference']?.length
    ? values['accepted-difference']
    : existing.acceptedDifferences,
};

if (status === 'fail' || hardGates.some((gate) => !gate.pass)) {
  evidence.status = 'fail';
} else if (status === 'pass' && !evidence.reviewer) {
  throw new Error('--reviewer is required when recording pass');
}

await writeFile(reportPath, referenceVerificationReport({
  name: entry.name,
  entry: evidence,
  hardGates,
  warnings,
  driftWarnings,
}), 'utf8');
manifest.figures[manifest.figures.indexOf(existing)] = evidence;
await writeReferenceVerificationManifest(manifestPath, manifest);

console.log(`Reference verification for ${slug}: ${evidence.status}`);
console.log(`- comparison: ${comparisonPath}`);
console.log(`- crops: ${crops.length}`);
console.log(`- manifest: ${manifestPath}`);
console.log(`- report: ${reportPath}`);
