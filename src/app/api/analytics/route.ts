import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { canViewAnalytics } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role as any;
    if (!canViewAnalytics(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') ?? '30');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalSessions,
      completedSessions,
      escalatedSessions,
      avgConfidence,
      topIssues,
      lowConfidenceCount,
      docsCount,
      activeUsers,
      recentSessions,
      unresolvedCount,
    ] = await Promise.all([
      prisma.ticketSession.count({ where: { createdAt: { gte: since } } }),
      prisma.ticketSession.count({ where: { status: 'COMPLETED', createdAt: { gte: since } } }),
      prisma.ticketSession.count({ where: { status: 'ESCALATED', createdAt: { gte: since } } }),
      prisma.ticketSession.aggregate({
        _avg: { confidenceScore: true },
        where: { createdAt: { gte: since } },
      }),
      prisma.ticketSession.groupBy({
        by: ['primaryIssue'],
        _count: true,
        where: { primaryIssue: { not: null }, createdAt: { gte: since } },
        orderBy: { _count: { primaryIssue: 'desc' } },
        take: 8,
      }),
      prisma.ticketSession.count({
        where: { confidenceScore: { lt: 60 }, createdAt: { gte: since } },
      }),
      prisma.document.count({ where: { status: 'PROCESSED' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.ticketSession.findMany({
        where: { createdAt: { gte: since } },
        select: {
          id: true, primaryIssue: true, confidenceScore: true,
          riskLevel: true, status: true, createdAt: true,
          agent: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.unresolvedQuery.count({ where: { wasReviewed: false } }),
    ]);

    return NextResponse.json({
      summary: {
        totalSessions,
        completedSessions,
        escalatedSessions,
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        avgConfidence: Math.round(avgConfidence._avg.confidenceScore ?? 0),
        lowConfidenceCount,
        docsCount,
        activeUsers,
        unresolvedCount,
      },
      topIssues: topIssues.map(t => ({
        issue: t.primaryIssue,
        count: t._count,
      })),
      recentSessions,
      period: { days, since },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
