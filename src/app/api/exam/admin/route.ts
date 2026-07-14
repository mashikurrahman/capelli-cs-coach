import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { GRADER_ROLES } from '@/lib/exam/build-exam';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  if (!GRADER_ROLES.includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const attempts = await prisma.examAttempt.findMany({
    orderBy: [{ status: 'asc' }, { submittedAt: 'desc' }, { startedAt: 'desc' }],
    include: { user: { select: { name: true, email: true } } },
    take: 200,
  });

  const bankSize = await prisma.examQuestion.count({ where: { isActive: true } });

  const stats = {
    bankSize,
    awaitingGrading: attempts.filter((a) => a.status === 'SUBMITTED').length,
    graded: attempts.filter((a) => a.status === 'GRADED').length,
    passed: attempts.filter((a) => a.passed === true).length,
  };

  return NextResponse.json({
    stats,
    attempts: attempts.map((a) => ({
      id: a.id,
      taker: a.user?.name ?? 'Unknown',
      email: a.user?.email ?? '',
      status: a.status,
      autoScore: a.autoScore,
      autoMax: a.autoMax,
      writtenScore: a.writtenScore,
      writtenMax: a.writtenMax,
      totalScore: a.totalScore,
      maxScore: a.maxScore,
      passed: a.passed,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      gradedAt: a.gradedAt,
    })),
  });
}
