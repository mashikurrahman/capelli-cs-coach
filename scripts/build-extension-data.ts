/**
 * Generates extension/data/workflows.json from the canonical DEFAULT_WORKFLOWS
 * so the Chrome extension ships the same workflow logic as the web app.
 * Run with: npm run ext:data
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DEFAULT_WORKFLOWS } from '../src/lib/workflows/default-workflows';
import { SYNONYMS } from '../src/lib/workflows/synonyms';
import { VIDEO_SCENARIOS } from '../src/lib/training/video-scenarios';
import { AGENT_SCENARIOS } from '../src/lib/training/agent-ticket-scenarios';

const outDir = join(process.cwd(), 'extension', 'data');
mkdirSync(outDir, { recursive: true });

const wfFile = join(outDir, 'workflows.json');
writeFileSync(wfFile, JSON.stringify(DEFAULT_WORKFLOWS, null, 0), 'utf8');
console.log(`Wrote ${DEFAULT_WORKFLOWS.length} workflows -> ${wfFile}`);

const synFile = join(outDir, 'synonyms.json');
writeFileSync(synFile, JSON.stringify(SYNONYMS, null, 0), 'utf8');
console.log(`Wrote ${Object.keys(SYNONYMS).length} synonym groups -> ${synFile}`);

// Decision hints ("how the team closes this") aggregated per workflow from BOTH
// the training-video scenarios and the ~70 real Zendesk tickets — mirrors
// src/lib/workflows/decision-hints.ts.
type Hint = { requiresEvidencePicture: boolean; escalateTo?: string; status?: string; fault?: string; fulfillment?: string; notes: string[] };
const hints: Record<string, Hint> = {};
for (const s of [...VIDEO_SCENARIOS, ...AGENT_SCENARIOS]) {
  const h = hints[s.workflowId] ?? { requiresEvidencePicture: false, notes: [] };
  if (s.requiresEvidencePicture) h.requiresEvidencePicture = true;
  if (s.escalateTo && !h.escalateTo) h.escalateTo = s.escalateTo;
  if (!h.status) h.status = s.status;
  if (!h.fault) h.fault = s.fault;
  if ((!h.fulfillment || h.fulfillment === 'unknown') && s.fulfillment) h.fulfillment = s.fulfillment;
  if (s.note && !h.notes.includes(s.note)) h.notes.push(s.note);
  hints[s.workflowId] = h;
}
const hintFile = join(outDir, 'decision-hints.json');
writeFileSync(hintFile, JSON.stringify(hints, null, 0), 'utf8');
console.log(`Wrote ${Object.keys(hints).length} decision hints -> ${hintFile}`);
