import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { passed } from '@/lib/exam/build-exam';
import { z } from 'zod';

const schema = z.object({
  answers: z.record(z.object({
    selectedIndex: z.number().int().min(0).max(3).optional(),
    writtenAnswer: z.string().optional(),
  })),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: params.id },
    include: { responses: { include: { question: true } } },
  });
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (attempt.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (attempt.status !== 'IN_PROGRESS') return NextResponse.json({ error: 'Already submitted' }, { status: 409 });

  const body = schema.parse(await req.json());

  let autoScore = 0;
  let hasWritten = false;

  for (const r of attempt.responses) {
    const a = body.answers[r.questionId];
    if (r.question.type === 'MCQ') {
      const sel = a?.selectedIndex;
      const isCorrect = sel != null && sel === r.question.correctIndex;
      const awarded = isCorrect ? r.question.points : 0;
      autoScore += awarded;
      await prisma.examResponse.update({
        where: { id: r.id },
        data: { selectedIndex: sel ?? null, isCorrect, awardedPoints: awarded },
      });
    } else {
      hasWritten = true;
      await prisma.examResponse.update({
        where: { id: r.id },
        data: { writtenAnswer: a?.writtenAnswer ?? '' },
      });
    }
  }

  // If there are written questions, the exam awaits manual grading. Otherwise
  // it's fully auto-graded and final immediately.
  const finalNow = !hasWritten;
  const totalScore = finalNow ? autoScore : null;

  const updated = await prisma.examAttempt.update({
    where: { id: attempt.id },
    data: {
      status: finalNow ? 'GRADED' : 'SUBMITTED',
      submittedAt: new Date(),
      autoScore,
      writtenScore: finalNow ? 0 : null,
      totalScore,
      passed: finalNow ? passed(autoScore, attempt.maxScore) : null,
      gradedAt: finalNow ? new Date() : null,
    },
  });

  await prisma.auditLog.create({
    data: { userId, action: 'EXAM_SUBMITTED', resource: 'exam_attempt', resourceId: attempt.id,
      details: { autoScore, autoMax: attempt.autoMax, awaitingGrading: !finalNow } as any },
  }).catch(() => {});

  return NextResponse.json({
    status: updated.status,
    autoScore,
    autoMax: attempt.autoMax,
    writtenMax: attempt.writtenMax,
    maxScore: attempt.maxScore,
    awaitingGrading: !finalNow,
    passed: updated.passed,
  });
}
