/**
 * Matcher evaluation harness.
 *
 * Runs every labelled scenario (training video + the ~70 real Zendesk tickets)
 * through the deterministic keyword matcher and reports top-1 / top-3 routing
 * accuracy. It also measures the *lift* the synonym-expansion layer adds, by
 * scoring a baseline pass that matches trigger phrases against the raw text with
 * no paraphrase expansion.
 *
 * Pure + offline (no AI / no network) so it is fully reproducible in CI.
 * Run with:  npx tsx scripts/eval-matcher.ts
 */
import { DEFAULT_WORKFLOWS } from '../src/lib/workflows/default-workflows';
import { matchWorkflows } from '../src/lib/workflows/match';
import { VIDEO_SCENARIOS } from '../src/lib/training/video-scenarios';
import { AGENT_SCENARIOS } from '../src/lib/training/agent-ticket-scenarios';

type Labelled = { id: string; complaint: string; workflowId: string };

const SCENARIOS: Labelled[] = [...VIDEO_SCENARIOS, ...AGENT_SCENARIOS].map((s) => ({
  id: s.id,
  complaint: s.complaint,
  workflowId: s.workflowId,
}));

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Baseline ranking: trigger-phrase keyword scoring on RAW text, no synonyms. */
function baselineRank(complaint: string): string[] {
  const text = ' ' + normalize(complaint) + ' ';
  return DEFAULT_WORKFLOWS.map((wf) => {
    let score = 0;
    for (const phrase of wf.triggerPhrases) {
      const p = normalize(phrase);
      if (!p) continue;
      if (text.includes(' ' + p + ' ') || text.includes(p)) {
        score += Math.min(4, p.split(' ').length + 1);
      }
    }
    return { id: wf.workflowId, score, sort: wf.sortOrder };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.sort - b.sort)
    .map((r) => r.id);
}

/** Enhanced ranking: the real production matcher (keyword + synonym expansion). */
function enhancedRank(complaint: string): string[] {
  return matchWorkflows(complaint, DEFAULT_WORKFLOWS.length).map((m) => m.workflow.workflowId);
}

interface Tally {
  top1: number;
  top3: number;
  noMatch: number;
}

function evaluate(rank: (c: string) => string[]): { tally: Tally; misses: Labelled[] } {
  const tally: Tally = { top1: 0, top3: 0, noMatch: 0 };
  const misses: Labelled[] = [];
  for (const s of SCENARIOS) {
    const ranked = rank(s.complaint);
    if (ranked.length === 0) tally.noMatch++;
    const top1 = ranked[0] === s.workflowId;
    const top3 = ranked.slice(0, 3).includes(s.workflowId);
    if (top1) tally.top1++;
    if (top3) tally.top3++;
    if (!top1) misses.push(s);
  }
  return { tally, misses };
}

function pct(n: number): string {
  return ((n / SCENARIOS.length) * 100).toFixed(1) + '%';
}

const base = evaluate(baselineRank);
const enh = evaluate(enhancedRank);

console.log('\n══════════════════════════════════════════════════════════════');
console.log('  Capelli CS Coach — Matcher Routing Accuracy');
console.log('══════════════════════════════════════════════════════════════');
console.log(`  Labelled scenarios: ${SCENARIOS.length}  (video: ${VIDEO_SCENARIOS.length}, real tickets: ${AGENT_SCENARIOS.length})`);
console.log('  ─────────────────────────────────────────────────────────');
console.log('                       Top-1        Top-3        No match');
console.log(`  Baseline (raw kw)    ${pct(base.tally.top1).padEnd(12)} ${pct(base.tally.top3).padEnd(12)} ${base.tally.noMatch}`);
console.log(`  + Synonym layer      ${pct(enh.tally.top1).padEnd(12)} ${pct(enh.tally.top3).padEnd(12)} ${enh.tally.noMatch}`);
const liftTop1 = ((enh.tally.top1 - base.tally.top1) / SCENARIOS.length) * 100;
const liftTop3 = ((enh.tally.top3 - base.tally.top3) / SCENARIOS.length) * 100;
console.log('  ─────────────────────────────────────────────────────────');
console.log(`  Lift from synonyms   ${(liftTop1 >= 0 ? '+' : '') + liftTop1.toFixed(1)}pp      ${(liftTop3 >= 0 ? '+' : '') + liftTop3.toFixed(1)}pp`);
console.log('══════════════════════════════════════════════════════════════');

if (enh.misses.length) {
  console.log(`\n  Top-1 misses with current matcher (${enh.misses.length}):`);
  for (const m of enh.misses) {
    const got = enhancedRank(m.complaint).slice(0, 3).join(', ') || '(none)';
    console.log(`   • [${m.id}] expected "${m.workflowId}"  →  got: ${got}`);
  }
} else {
  console.log('\n  No top-1 misses — every labelled ticket routes correctly. ✓');
}
console.log('');
