/**
 * Generates extension/data/workflows.json from the canonical DEFAULT_WORKFLOWS
 * so the Chrome extension ships the same workflow logic as the web app.
 * Run with: npm run ext:data
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DEFAULT_WORKFLOWS } from '../src/lib/workflows/default-workflows';
import { SYNONYMS } from '../src/lib/workflows/synonyms';

const outDir = join(process.cwd(), 'extension', 'data');
mkdirSync(outDir, { recursive: true });

const wfFile = join(outDir, 'workflows.json');
writeFileSync(wfFile, JSON.stringify(DEFAULT_WORKFLOWS, null, 0), 'utf8');
console.log(`Wrote ${DEFAULT_WORKFLOWS.length} workflows -> ${wfFile}`);

const synFile = join(outDir, 'synonyms.json');
writeFileSync(synFile, JSON.stringify(SYNONYMS, null, 0), 'utf8');
console.log(`Wrote ${Object.keys(SYNONYMS).length} synonym groups -> ${synFile}`);
