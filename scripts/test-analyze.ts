/**
 * Full Ticket Coach analysis smoke test against the live provider stack.
 * Run: npx tsx scripts/test-analyze.ts
 */
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

import { analyzeTicket } from '../src/lib/ai/ticket-analyzer';

async function main() {
  const t0 = Date.now();
  const result = await analyzeTicket({
    complaint: 'Hi, I ordered a medium jersey but received a large. My order number is CS12345. Please help.',
    orderNumber: 'CS12345',
  } as any);
  const ms = Date.now() - t0;

  console.log(`Analysis returned in ${ms}ms`);
  console.log('  issue_summary  :', result.issue_summary);
  console.log('  primary_issue  :', result.primary_issue_type);
  console.log('  confidence     :', result.confidence_score);
  console.log('  risk_level     :', result.risk_level);
  console.log('  steps          :', result.step_by_step_actions?.length, 'actions');
  console.log('  sources        :', result.source_references?.length, 'refs ->',
    result.source_references?.slice(0, 2).map(s => s.document_name).join(' | '));
  console.log('  email subject  :', result.email_subject);
  console.log('  zendesk_tags   :', result.zendesk_tags?.map(t => t.tag).join(', '));
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
