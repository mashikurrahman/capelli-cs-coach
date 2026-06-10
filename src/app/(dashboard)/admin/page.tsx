import AdminOverview from '@/components/admin/AdminOverview';
import { getSession } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';

export const metadata = { title: 'Admin — Capelli CS Coach' };

export default async function AdminPage() {
  const session = await getSession();
  const role = (session!.user as any).role;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [users, docs, sessions, unresolved, recentLogs] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.document.count({ where: { status: 'PROCESSED' } }),
    prisma.ticketSession.count({ where: { createdAt: { gte: since } } }),
    prisma.unresolvedQuery.count({ where: { wasReviewed: false } }),
    prisma.auditLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
  ]);

  return (
    <AdminOverview
      role={role}
      stats={{ users, docs, sessions, unresolved }}
      recentLogs={recentLogs as any[]}
    />
  );
}
