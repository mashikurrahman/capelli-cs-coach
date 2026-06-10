import { getSession } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import DashboardHome from '@/components/dashboard/DashboardHome';

export default async function DashboardPage() {
  const session = await getSession();
  const userId = (session!.user as { id: string }).id;
  const role = (session!.user as { role: string }).role;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalSessions, completedSessions, avgConf, recentSessions, updates, docCount] = await Promise.all([
    prisma.ticketSession.count({ where: { agentId: userId, createdAt: { gte: since } } }),
    prisma.ticketSession.count({ where: { agentId: userId, status: 'COMPLETED', createdAt: { gte: since } } }),
    prisma.ticketSession.aggregate({
      _avg: { confidenceScore: true },
      where: { agentId: userId, createdAt: { gte: since } },
    }),
    prisma.ticketSession.findMany({
      where: { agentId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, primaryIssue: true, confidenceScore: true,
        riskLevel: true, status: true, createdAt: true,
      },
    }),
    prisma.adminUpdate.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] as any,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.document.count({ where: { status: 'PROCESSED' } }),
  ]);

  return (
    <DashboardHome
      userName={(session!.user as { name: string }).name}
      role={role}
      stats={{
        totalSessions,
        completedSessions,
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        avgConfidence: Math.round(avgConf._avg.confidenceScore ?? 0),
        docCount,
      }}
      recentSessions={recentSessions as any[]}
      updates={updates}
    />
  );
}
