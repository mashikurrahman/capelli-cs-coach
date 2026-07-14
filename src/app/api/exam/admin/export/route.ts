import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { GRADER_ROLES } from '@/lib/exam/build-exam';
import { competencyBreakdown, teamWeakAreas, type BreakdownRow } from '@/lib/exam/report';

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function nl(s: unknown): string {
  return esc(s).replace(/\n/g, '<br>');
}
const LETTER = (i: number | null | undefined) => (i == null || i < 0 ? '—' : String.fromCharCode(65 + i));

const CSS = `
body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #16233b; }
h1 { color: #0b2e6b; font-size: 20pt; border-bottom: 2px solid #0b2e6b; padding-bottom: 4pt; }
h2 { color: #0b2e6b; font-size: 15pt; margin-top: 18pt; }
h3 { color: #14213d; font-size: 12.5pt; margin: 12pt 0 4pt; }
.muted { color: #64748b; font-size: 10pt; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 10pt; }
th { background: #0b2e6b; color: #fff; text-align: left; }
th, td { border: 1px solid #9aa5b4; padding: 4pt 8pt; vertical-align: top; }
tr:nth-child(even) td { background: #f5f7fb; }
.pass { color: #15803d; font-weight: bold; }
.fail { color: #b91c1c; font-weight: bold; }
.pending { color: #1d4ed8; font-weight: bold; }
.sheet { page-break-before: always; }
.q { margin: 10pt 0; padding: 8pt 10pt; border: 1px solid #d8dee8; border-radius: 4pt; }
.opt { margin: 2pt 0 2pt 14pt; }
.correct { color: #15803d; font-weight: bold; }
.chosen-wrong { color: #b91c1c; font-weight: bold; text-decoration: line-through; }
.tag { font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
.ans { background: #f5f7fb; border-left: 3pt solid #0b2e6b; padding: 6pt 10pt; margin: 4pt 0; }
.key { background: #eef5ff; border-left: 3pt solid #3b82f6; padding: 6pt 10pt; margin: 4pt 0; font-size: 10pt; }
.mark-ok { color: #15803d; font-weight: bold; }
.mark-no { color: #b91c1c; font-weight: bold; }
`;

function scoreLabel(a: { status: string; totalScore: number | null; maxScore: number; passed: boolean | null; autoScore: number | null; autoMax: number }): string {
  if (a.status === 'GRADED' && a.totalScore != null) {
    const pct = a.maxScore ? Math.round((a.totalScore / a.maxScore) * 100) : 0;
    return `${a.totalScore}/${a.maxScore} (${pct}%) <span class="${a.passed ? 'pass' : 'fail'}">${a.passed ? 'PASS' : 'FAIL'}</span>`;
  }
  if (a.status === 'SUBMITTED') return `MCQ ${a.autoScore}/${a.autoMax} · <span class="pending">written pending</span>`;
  return '<span class="muted">in progress</span>';
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  if (!GRADER_ROLES.includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const attemptId = req.nextUrl.searchParams.get('attemptId');

  const attempts = await prisma.examAttempt.findMany({
    where: {
      status: { in: ['SUBMITTED', 'GRADED'] },
      ...(attemptId ? { id: attemptId } : {}),
    },
    orderBy: [{ submittedAt: 'desc' }],
    include: {
      user: { select: { name: true, email: true } },
      responses: { orderBy: { order: 'asc' }, include: { question: true } },
    },
  });

  const today = new Date().toISOString().slice(0, 10);

  // ── Report sheet (summary) ────────────────────────────────────────────────
  const graded = attempts.filter((a) => a.status === 'GRADED' && a.totalScore != null);
  const avgPct = graded.length
    ? Math.round(graded.reduce((s, a) => s + (a.totalScore! / a.maxScore) * 100, 0) / graded.length)
    : 0;
  const passCount = graded.filter((a) => a.passed).length;

  const toBreakdown = (a: typeof attempts[number]): BreakdownRow[] =>
    competencyBreakdown(a.responses.map((r) => ({
      type: r.question.type, competency: r.question.competency, points: r.question.points,
      awardedPoints: r.awardedPoints, isCorrect: r.isCorrect,
    })));

  let html = `<h1>Capelli Sport — Certification Exam Report</h1>
<p class="muted">Generated ${today} · ${attempts.length} attempt(s)${attemptId ? '' : ` · ${graded.length} graded · avg ${avgPct}% · ${passCount}/${graded.length} passed`}</p>`;

  if (!attemptId) {
    html += `<h2>Report sheet</h2><table>
<tr><th>#</th><th>Team member</th><th>Email</th><th>Status</th><th>MCQ</th><th>Written</th><th>Total</th><th>Result</th><th>Date</th></tr>`;
    attempts.forEach((a, i) => {
      html += `<tr>
<td>${i + 1}</td>
<td>${esc(a.user?.name)}</td>
<td>${esc(a.user?.email)}</td>
<td>${a.status === 'GRADED' ? 'Graded' : 'Awaiting grading'}</td>
<td>${a.autoScore ?? '—'}/${a.autoMax}</td>
<td>${a.writtenScore ?? '—'}/${a.writtenMax}</td>
<td>${a.totalScore ?? '—'}/${a.maxScore}</td>
<td>${scoreLabel(a)}</td>
<td>${esc((a.submittedAt ?? a.startedAt).toISOString().slice(0, 10))}</td>
</tr>`;
    });
    html += `</table>`;

    // Team weak-areas (weakest competency first) across graded attempts.
    if (graded.length) {
      const weak = teamWeakAreas(graded.map(toBreakdown));
      html += `<h3>Team weak areas (weakest first)</h3><table>
<tr><th>Competency</th><th>Team accuracy</th><th>Points</th></tr>`;
      for (const w of weak) {
        html += `<tr><td>${esc(w.competency)}</td><td>${w.pct}%</td><td>${w.earned}/${w.max}</td></tr>`;
      }
      html += `</table>`;
    }
  }

  // ── Per-member answer sheets ──────────────────────────────────────────────
  for (const a of attempts) {
    const written = a.responses.filter((r) => r.question.type === 'WRITTEN');
    const mcq = a.responses.filter((r) => r.question.type === 'MCQ');
    const mcqCorrect = mcq.filter((r) => r.isCorrect).length;

    html += `<div class="sheet"><h2>${esc(a.user?.name)} — Answer Sheet</h2>
<p class="muted">${esc(a.user?.email)} · submitted ${esc((a.submittedAt ?? a.startedAt).toISOString().slice(0, 10))} · Result: ${scoreLabel(a)}</p>`;

    // Competency breakdown for this member.
    const rows = toBreakdown(a);
    if (rows.length) {
      html += `<h3>Competency breakdown</h3><table><tr><th>Competency</th><th>Score</th><th>%</th></tr>`;
      for (const b of rows) {
        const tone = b.pct >= 80 ? 'pass' : b.pct >= 50 ? '' : 'fail';
        html += `<tr><td>${esc(b.competency)}</td><td>${b.earned}/${b.max}</td><td class="${tone}">${b.pct}%</td></tr>`;
      }
      html += `</table>`;
    }

    // Section A — written
    html += `<h3>Section A — Written scenarios (${a.writtenScore ?? '—'}/${a.writtenMax})</h3>`;
    written.forEach((r, i) => {
      const awarded = r.awardedPoints == null ? '—' : r.awardedPoints;
      html += `<div class="q"><p class="tag">Q${i + 1} · ${esc(r.question.competency)} · ${awarded}/${r.question.points} pts</p>
<p>${nl(r.question.prompt)}</p>
<div class="ans"><span class="tag">Their answer</span><br>${r.writtenAnswer ? nl(r.writtenAnswer) : '<i>(left blank)</i>'}</div>
${r.graderNote ? `<p class="muted">Grader note: ${esc(r.graderNote)}</p>` : ''}
${r.question.modelAnswer ? `<div class="key"><span class="tag">Model answer / key</span><br>${nl(r.question.modelAnswer)}</div>` : ''}
</div>`;
    });

    // Section B — MCQ with right/wrong marked
    html += `<h3>Section B — Multiple choice (${mcqCorrect}/${mcq.length} correct · ${a.autoScore}/${a.autoMax} pts)</h3>`;
    mcq.forEach((r, i) => {
      const mark = r.isCorrect ? '<span class="mark-ok">✓ correct</span>' : '<span class="mark-no">✗ incorrect</span>';
      let opts = '';
      r.question.options.forEach((opt, oi) => {
        const isCorrect = oi === r.question.correctIndex;
        const isChosen = oi === r.selectedIndex;
        const cls = isCorrect ? 'correct' : (isChosen ? 'chosen-wrong' : '');
        const tags: string[] = [];
        if (isCorrect) tags.push('✓ correct answer');
        if (isChosen) tags.push('← their choice');
        const suffix = tags.length ? ' — ' + tags.join(' ') : '';
        opts += `<div class="opt ${cls}">${LETTER(oi)}. ${esc(opt)}${suffix}</div>`;
      });
      html += `<div class="q"><p><strong>Q${written.length + i + 1}.</strong> ${esc(r.question.prompt)} &nbsp; ${mark}</p>
${opts}
<p class="muted">Chose ${LETTER(r.selectedIndex)} · Correct ${LETTER(r.question.correctIndex)}</p>
</div>`;
    });

    html += `</div>`;
  }

  const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name=ProgId content=Word.Document>
<title>Capelli Exam Report ${today}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>${CSS}</style></head><body>${html}</body></html>`;

  const who = attemptId && attempts[0] ? '-' + (attempts[0].user?.name ?? 'member').replace(/[^a-z0-9]+/gi, '-').toLowerCase() : '';
  const filename = `capelli-exam-report${who}-${today}.doc`;

  return new NextResponse(doc, {
    headers: {
      'Content-Type': 'application/msword; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
