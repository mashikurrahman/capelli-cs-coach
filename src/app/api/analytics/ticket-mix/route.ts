import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { canViewAnalytics } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { DEFAULT_WORKFLOWS } from '@/lib/workflows/default-workflows';

// A3 — Ticket-mix baseline analytics. Surfaces the real distribution of ticket
// types and benchmarks a recent window against the all-time baseline so spikes
// ("tracking questions are up this week") stand out.

const WORKFLOW_TO_CATEGORY = new Map(DEFAULT_WORKFLOWS.map((w) => [w.workflowId, w.category]));
const UNCATEGORIZED = 'GENERAL_INQUIRY';

const SPIKE_MIN_COUNT = 3;      // need a few tickets before calling it a spike
const SPIKE_MIN_DELTA = 8;      // recent share must exceed baseline by ≥ 8 pts

function categoryOf(s: { primaryIssue: string | null; analysisResult: unknown }): string {
  if (s.primaryIssue) return s.primaryIssue;
  const a = s.analysisResult as { workflowId?: string; primary_issue_type?: string } | null;
  if (a?.primary_issue_type) return a.primary_issue_type;
  if (a?.workflowId && WORKFLOW_TO_CATEGORY.has(a.workflowId)) return WORKFLOW_TO_CATEGORY.get(a.workflowId)!;
  return UNCATEGORIZED;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as { role: string }).role as any;
  if (!canViewAnalytics(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const recentDays = Math.min(90, Math.max(1, parseInt(req.nextUrl.searchParams.get('recentDays') ?? '7')));
  const recentSince = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);

  const sessions = await prisma.ticketSession.findMany({
    select: { primaryIssue: true, analysisResult: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const allCount = new Map<string, number>();
  const recentCount = new Map<string, number>();
  let allTotal = 0;
  let recentTotal = 0;

  for (const s of sessions) {
    const cat = categoryOf(s);
    allCount.set(cat, (allCount.get(cat) ?? 0) + 1);
    allTotal += 1;
    if (s.createdAt >= recentSince) {
      recentCount.set(cat, (recentCount.get(cat) ?? 0) + 1);
      recentTotal += 1;
    }
  }

  const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

  const rows = [...allCount.keys()].map((category) => {
    const all = allCount.get(category) ?? 0;
    const recent = recentCount.get(category) ?? 0;
    const baselinePct = pct(all, allTotal);
    const recentPct = pct(recent, recentTotal);
    const delta = Math.round((recentPct - baselinePct) * 10) / 10;
    return {
      category,
      allTime: all,
      recent,
      baselinePct,
      recentPct,
      delta,
      spike: recent >= SPIKE_MIN_COUNT && delta >= SPIKE_MIN_DELTA,
    };
  })
  .sort((a, b) => b.recent - a.recent || b.allTime - a.allTime);

  return NextResponse.json({
    recentDays,
    totals: { allTime: allTotal, recent: recentTotal },
    rows,
    spikes: rows.filter((r) => r.spike).sort((a, b) => b.delta - a.delta),
  });
}
