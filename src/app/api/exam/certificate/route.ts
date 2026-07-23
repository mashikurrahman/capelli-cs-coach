import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { GRADER_ROLES, PASS_PERCENT } from '@/lib/exam/build-exam';

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// E7 — Pass certificate. Rendered as a print-ready web page (open in a browser
// tab, then Print → “Save as PDF”), matching how the exam report is served so
// it never comes down as a blank Word file.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  const isGrader = GRADER_ROLES.includes(role);

  const attemptId = req.nextUrl.searchParams.get('attemptId');
  if (!attemptId) return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 });

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { user: { select: { name: true, email: true } }, session: { select: { title: true } } },
  });
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (attempt.userId !== userId && !isGrader) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (attempt.status !== 'GRADED' || !attempt.passed || attempt.totalScore == null) {
    return NextResponse.json({ error: 'A certificate is only available for a passed, graded exam.' }, { status: 409 });
  }

  const pct = attempt.maxScore ? Math.round((attempt.totalScore / attempt.maxScore) * 100) : 0;
  const dateStr = (attempt.gradedAt ?? attempt.submittedAt ?? new Date()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const certId = attempt.id.slice(-8).toUpperCase();

  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Certificate — ${esc(attempt.user?.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #16233b; margin: 0; background: #eef2f8; }
  .bar { position: sticky; top: 0; background: #fff7ed; border-bottom: 1px solid #fdba74; padding: 10px 14px;
    color: #9a3412; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-family: Arial, sans-serif; }
  .bar button { background: #0b2e6b; color: #fff; border: 0; border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; }
  .wrap { padding: 32px 16px; display: flex; justify-content: center; }
  .cert { width: 900px; max-width: 100%; background: #fff; border: 3px solid #0b2e6b; border-radius: 6px;
    padding: 56px 64px; text-align: center; box-shadow: 0 10px 40px rgba(11,46,107,.12);
    background-image: linear-gradient(135deg, #fff 0%, #f7faff 100%); }
  .cert::after { content: ''; display: block; }
  .frame { border: 1px solid #c7d4ea; border-radius: 4px; padding: 40px 44px; }
  .brand { letter-spacing: .18em; text-transform: uppercase; color: #0b2e6b; font-family: Arial, sans-serif; font-weight: 700; font-size: 13px; }
  h1 { font-size: 40px; color: #0b2e6b; margin: 18px 0 4px; letter-spacing: .02em; }
  .sub { color: #64748b; font-family: Arial, sans-serif; font-size: 13px; letter-spacing: .04em; text-transform: uppercase; }
  .name { font-size: 34px; margin: 28px 0 6px; color: #14213d; border-bottom: 2px solid #d8b24a; display: inline-block; padding: 0 24px 8px; }
  .body { color: #334155; font-size: 16px; line-height: 1.6; margin: 18px auto 0; max-width: 560px; }
  .exam { font-weight: 700; color: #0b2e6b; }
  .stats { display: flex; justify-content: center; gap: 48px; margin: 34px 0 8px; font-family: Arial, sans-serif; }
  .stat .v { font-size: 30px; font-weight: 800; color: #0b2e6b; }
  .stat .l { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .06em; margin-top: 2px; }
  .seal { width: 92px; height: 92px; border-radius: 50%; margin: 26px auto 0; background: radial-gradient(circle at 50% 40%, #d8b24a, #b8912f);
    color: #fff; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif; font-weight: 800;
    font-size: 12px; letter-spacing: .08em; text-align: center; line-height: 1.2; box-shadow: 0 4px 12px rgba(184,145,47,.4); }
  .foot { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; font-family: Arial, sans-serif; }
  .foot .cell { text-align: center; flex: 1; }
  .foot .line { border-top: 1px solid #94a3b8; margin: 0 12px 6px; padding-top: 6px; color: #475569; font-size: 12px; }
  .cid { color: #94a3b8; font-size: 11px; font-family: Arial, sans-serif; letter-spacing: .05em; }
  @media print {
    .no-print { display: none !important; }
    body { background: #fff; }
    .wrap { padding: 0; }
    .cert { border-width: 3px; box-shadow: none; width: 100%; }
    @page { size: landscape; margin: 12mm; }
  }
</style></head>
<body>
<div class="bar no-print">
  <span>🏅 To save or share this certificate, use <strong>Print → “Save as PDF”</strong> (landscape).</span>
  <button onclick="window.print()">Print / Save as PDF</button>
</div>
<div class="wrap"><div class="cert"><div class="frame">
  <div class="brand">Capelli Sport · Customer Support</div>
  <h1>Certificate of Achievement</h1>
  <div class="sub">CS Workflow Certification</div>
  <div class="name">${esc(attempt.user?.name)}</div>
  <p class="body">has successfully passed the <span class="exam">${esc(attempt.session?.title ?? 'Capelli CS Certification Exam')}</span>,
  demonstrating competency across the Capelli customer-support workflows and meeting the ${PASS_PERCENT}% passing standard.</p>
  <div class="stats">
    <div class="stat"><div class="v">${pct}%</div><div class="l">Score</div></div>
    <div class="stat"><div class="v">${attempt.totalScore}/${attempt.maxScore}</div><div class="l">Points</div></div>
    <div class="stat"><div class="v">Pass</div><div class="l">Result</div></div>
  </div>
  <div class="seal">CAPELLI<br>CERTIFIED</div>
  <div class="foot">
    <div class="cell"><div class="line">${esc(dateStr)}</div>Date</div>
    <div class="cell"><div class="line">Capelli Sport CS</div>Issued by</div>
  </div>
  <p class="cid">Certificate ID: CS-${certId}</p>
</div></div></div>
</body></html>`;

  return new NextResponse(page, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
