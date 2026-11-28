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
  type ReferenceReviewChecklist,
  type ReferenceVerificationEntry,
  type ReferenceVerificationStatus,
} from './lib/reference-verification';

const { values, positionals } = parseArgs({
  options: {
    'out-dir': { type: 'string' },
    manifest: { type: 'string', default: 'docs/verification/reference-verification.json' },
    status: { type: 'string' },
    reviewer: { type: 'string' },
    checklist: { type: 'string' },
    issue: { type: 'string' },
    'accepted-difference': { type: 'string', multiple: true },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
  strict: true,
});

if (values.help) {
  console.log('Usage: bun scripts/verify-reference.tsx <slug> [--out-dir <dir>] [--manifest <file>] [--status pending|pass|accepted-difference|fail] [--reviewer <name>] [--checklist <file>] [--issue <number>] [--accepted-difference <note>]');
  process.exit(0);
}

const requestedSlug = positionals[0];
if (!requestedSlug) throw new Error('A figure slug is required');
const requestedStatus = values.status as ReferenceVerificationStatus | undefined;
if (requestedStatus && !referenceVerificationStatuses.includes(requestedStatus)) {
  throw new Error(`Unknown status "${requestedStatus}"`);
}
const signing = requestedStatus === 'pass' || requestedStatus === 'accepted-difference';
if (signing && !values.reviewer) {
  throw new Error('--reviewer is required when recording pass or accepted-difference');
}
if (requestedStatus === 'accepted-difference' && (values['accepted-difference'] ?? []).length === 0) {
  throw new Error('--accepted-difference is required when status is accepted-difference');
}

const entry = figureSpecs.find((figure) => figure.slug === requestedSlug)
  ?? figureSpecs.find((figure) => `${figure.slug}-spec` === requestedSlug);
if (!entry) throw new Error(`Unknown figure "${requestedSlug}"`);
const slug = entry.slug;
const checklistKeys = ['structure', 'text', 'connections', 'insets', 'visualHierarchy', 'crops'] as const;
let signingChecklist: ReferenceReviewChecklist | undefined;
if (signing) {
  const signingChecklistPath = values.checklist ?? `docs/verification/checklists/${slug}.json`;
  try {
    const parsed = JSON.parse(await readFile(signingChecklistPath, 'utf8')) as Partial<ReferenceReviewChecklist>;
    if (!checklistKeys.every((key) => parsed[key] === true)) {
      throw new Error(`Checklist ${signingChecklistPath} must mark ${checklistKeys.join(', ')} as true`);
    }
    signingChecklist = parsed as ReferenceReviewChecklist;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`A completed --checklist is required when signing; expected ${signingChecklistPath}`);
    }
    throw error;
  }
}
const outDir = values['out-dir'] ?? `artifacts/review/${slug}-reference`;
const manifestPath = values.manifest ?? 'docs/verification/reference-verification.json';
const svgDir = values['out-dir'] ? `${outDir}/svg` : 'artifacts/svg';
const svgPath = `${svgDir}/${slug}-spec.svg`;
const comparisonPath = `${outDir}/${slug}-spec-comparison.png`;
const renderPath = `${outDir}/${slug}-spec-render-native.png`;
const reportPath = `${outDir}/${slug}-reference-verification.md`;
const referencePath = entry.reference.replace(/^\.\.\//, '');

const first = renderFigure(entry.spec, { idPrefix: `${slug}-spec-export` });
const second = renderFigure(entry.spec, { idPrefix: `${slug}-spec-export` });
const referenceMetadata = await (await sharpFromFile(referencePath)).metadata();

await mkdir(svgDir, { recursive: true });
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
  '--svg-dir', svgDir,
], { stdout: 'pipe', stderr: 'pipe' });
const [reviewExit, reviewError] = await Promise.all([
  review.exited,
  new Response(review.stderr).text(),
]);
if (reviewExit !== 0) throw new Error(reviewError);

const metrics = await computeReferenceMetrics(referencePath, renderPath, entry.width, entry.height);
const crops = await writeReferenceCrops(referencePath, renderPath, outDir, `${slug}-reference`, first.scene);
const canvasDeltaX = Math.abs((referenceMetadata.width ?? 0) - entry.width);
const canvasDeltaY = Math.abs((referenceMetadata.height ?? 0) - entry.height);
const hardGates = [
  { label: 'Deterministic SVG export', pass: first.svg === second.svg && (await readFile(svgPath, 'utf8')) === first.svg },
  { label: 'Self-contained SVG without embedded raster or external resources', pass: !/<image\b|data:image\/|<foreignObject\b|\b(?:href|src)=["'](?:https?:|\/)/i.test(first.svg) },
  { label: 'Reference canvas is within 2px of the FigureSpec', pass: canvasDeltaX <= 2 && canvasDeltaY <= 2 },
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

const checklistPath = values.checklist
  ?? existing.checklistPath
  ?? `docs/verification/checklists/${slug}.json`;
const checklist = signing ? signingChecklist : existing.checklist;

const referenceSha256 = sha256(await readFile(referencePath));
const svgSha256 = sha256(first.svg);
const signatureChanged = Boolean(existing.baseline && (
  existing.baseline.referenceSha256 !== referenceSha256 || existing.baseline.svgSha256 !== svgSha256
));
const gatesFailed = hardGates.some((gate) => !gate.pass);
let status = requestedStatus ?? existing.status;
if (!requestedStatus && signatureChanged) status = 'pending';
if (gatesFailed) status = 'fail';

const issue = values.issue === undefined ? existing.issue : Number(values.issue);
if (issue !== undefined && (!Number.isInteger(issue) || issue <= 0)) {
  throw new Error('--issue must be a positive integer');
}
if (status === 'fail' && issue === undefined) {
  throw new Error('--issue is required when recording fail');
}
if (signing && gatesFailed) {
  throw new Error('Cannot sign pass or accepted-difference while a hard gate fails');
}

const signedNow = signing;
const invalidated = !requestedStatus && signatureChanged;
const evidence: ReferenceVerificationEntry = {
  ...existing,
  slug,
  status,
  issue,
  checklist: invalidated ? undefined : checklist,
  checklistPath: checklist || values.checklist ? checklistPath : existing.checklistPath,
  baseline: signedNow
    ? { referenceSha256, svgSha256, metrics }
    : existing.baseline,
  reference: {
    path: referencePath,
    sha256: referenceSha256,
    width: referenceMetadata.width ?? entry.width,
    height: referenceMetadata.height ?? entry.height,
  },
  svg: { path: svgPath, sha256: svgSha256 },
  metrics,
  reviewer: invalidated ? undefined : values.reviewer ?? existing.reviewer,
  reviewedAt: invalidated ? undefined : requestedStatus ? new Date().toISOString() : existing.reviewedAt,
  artifacts: {
    comparison: comparisonPath,
    crops,
    report: reportPath,
  },
  acceptedDifferences: invalidated
    ? undefined
    : values['accepted-difference']?.length
      ? values['accepted-difference']
      : existing.acceptedDifferences,
};

const driftWarnings = referenceMetricDriftWarnings(existing.baseline?.metrics, metrics);
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
