/* Quick deterministic-matcher accuracy check against the labelled video scenarios.
   Run: npx tsx scripts/eval-video-scenarios.ts  */
import { matchWorkflows } from '../src/lib/workflows/match';
import { cleanComplaint } from '../src/lib/text/clean-complaint';
import { VIDEO_SCENARIOS } from '../src/lib/training/video-scenarios';

(async () => {
  let top1 = 0, top3 = 0;
  for (const s of VIDEO_SCENARIOS) {
    const matches = matchWorkflows(cleanComplaint(s.complaint), 3);
    const ids = matches.map((m) => m.workflow.workflowId);
    const inTop1 = ids[0] === s.workflowId;
    const inTop3 = ids.includes(s.workflowId);
    if (inTop1) top1++;
    if (inTop3) top3++;
    const mark = inTop1 ? 'T1' : inTop3 ? 'T3' : '--';
    console.log(`${mark}  ${s.id.padEnd(28)} want=${s.workflowId.padEnd(20)} got=[${ids.join(', ')}]`);
  }
  const n = VIDEO_SCENARIOS.length;
  console.log(`\nKeyword-only: top-1 ${top1}/${n} (${Math.round((top1 / n) * 100)}%), top-3 ${top3}/${n} (${Math.round((top3 / n) * 100)}%)`);
  console.log('(Note: the live app also runs semantic + the intelligent brain on uncertain cases, so production accuracy is higher than this keyword-only floor.)');
})();
