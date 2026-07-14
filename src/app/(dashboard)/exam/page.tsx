import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import { getSession } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import ExamClient from '@/components/exam/ExamClient';

export const metadata: Metadata = { title: 'Certification Exam' };

export default async function ExamPage() {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  const userId = (session.user as { id: string }).id;

  const [attempts, bankSize] = await Promise.all([
    prisma.examAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 20,
      select: {
        id: true, status: true, autoScore: true, autoMax: true, writtenScore: true,
        writtenMax: true, totalScore: true, maxScore: true, passed: true,
        startedAt: true, submittedAt: true, gradedAt: true,
      },
    }),
    prisma.examQuestion.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Certification Exam" subtitle="Prove your Capelli CS knowledge — 30 questions, pass mark 80%" />
      <div className="flex-1 overflow-y-auto">
        <ExamClient
          initialAttempts={attempts.map((a) => ({ ...a, startedAt: a.startedAt.toISOString(), submittedAt: a.submittedAt?.toISOString() ?? null, gradedAt: a.gradedAt?.toISOString() ?? null }))}
          bankReady={bankSize > 0}
        />
      </div>
    </div>
  );
}
