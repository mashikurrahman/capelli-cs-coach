import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { GRADER_ROLES } from '@/lib/exam/build-exam';

// E4 — Item analysis. For every question that's been answered on a submitted or
// graded attempt, compute how often it's answered correctly, and flag the
// outliers: questions almost everyone fails (a training gap or a mis-keyed
// question) and questions almost nobody misses (little signal).
const MIN_SAMPLE = 3; // need a few answers before a flag is meaningful
const HARD_PCT = 40;
const EASY_PCT = 95;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  if (!GRADER_ROLES.includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const responses = await prisma.examResponse.findMany({
    where: { attempt: { status: { in: ['SUBMITTED', 'GRADED'] } } },
    select: {
      isCorrect: true,
      awardedPoints: true,
      question: { select: { id: true, type: true, competency: true, prompt: true, points: true } },
    },
  });

  const totalAttempts = await prisma.examAttempt.count({
    where: { status: { in: ['SUBMITTED', 'GRADED'] } },
  });

  type Agg = { id: string; type: 'MCQ' | 'WRITTEN'; competency: string; prompt: string; points: number; n: number; ratioSum: number };
  const byQ = new Map<string, Agg>();

  for (const r of responses) {
    const q = r.question;
    let agg = byQ.get(q.id);
    if (!agg) {
      agg = { id: q.id, type: q.type as 'MCQ' | 'WRITTEN', competency: q.competency, prompt: q.prompt, points: q.points, n: 0, ratioSum: 0 };
      byQ.set(q.id, agg);
    }
    if (q.type === 'MCQ') {
      // Every submitted response counts; a blank/wrong pick is a 0.
      agg.n += 1;
      agg.ratioSum += r.isCorrect ? 1 : 0;
    } else if (r.awardedPoints != null && q.points > 0) {
      // Written only contributes once graded.
      agg.n += 1;
      agg.ratioSum += Math.max(0, Math.min(1, r.awardedPoints / q.points));
    }
  }

  const items = [...byQ.values()]
    .filter((a) => a.n > 0)
    .map((a) => {
      const pct = Math.round((a.ratioSum / a.n) * 100);
      const flag: 'hard' | 'easy' | null =
        a.n >= MIN_SAMPLE && pct <= HARD_PCT ? 'hard' : a.n >= MIN_SAMPLE && pct >= EASY_PCT ? 'easy' : null;
      return { id: a.id, type: a.type, competency: a.competency, prompt: a.prompt, attempts: a.n, pct, flag };
    })
    // Hardest first, then easiest — the actionable ends of the distribution.
    .sort((x, y) => x.pct - y.pct);

  return NextResponse.json({ totalAttempts, items });
}
