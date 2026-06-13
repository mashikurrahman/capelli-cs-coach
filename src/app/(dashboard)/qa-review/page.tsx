import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import { getSession } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import QaReview from '@/components/qa-review/QaReview';

export const metadata: Metadata = { title: 'QA Review' };

const ALLOWED = ['ADMIN', 'TEAM_LEADER', 'QA'];

export default async function QaReviewPage() {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  const role = (session.user as { role: string }).role;
  if (!ALLOWED.includes(role)) redirect('/dashboard');

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [sessions, totalReviewed, pendingCount, flaggedCount] = await Promise.all([
    prisma.ticketSession.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        primaryIssue: true,
        confidenceScore: true,
        riskLevel: true,
        status: true,
        createdAt: true,
        agent: { select: { name: true } },
        qaReviews: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { overallScore: true, status: true },
        },
      },
    }),
    prisma.qaReview.count(),
    prisma.qaReview.count({ where: { status: 'PENDING' } }),
    prisma.qaReview.count({ where: { status: 'FLAGGED' } }),
  ]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="QA Review"
        subtitle="Review recent agent ticket sessions for accuracy, policy, and tone"
      />
      <div className="flex-1 overflow-y-auto">
        <QaReview
          sessions={sessions as any}
          stats={{ totalReviewed, pending: pendingCount, flagged: flaggedCount }}
        />
      </div>
    </div>
  );
}
