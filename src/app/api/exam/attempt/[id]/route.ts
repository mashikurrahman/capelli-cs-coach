import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { GRADER_ROLES } from '@/lib/exam/build-exam';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  const isGrader = GRADER_ROLES.includes(role);

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      responses: { orderBy: { order: 'asc' }, include: { question: true } },
    },
  });
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (attempt.userId !== userId && !isGrader) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Graders see the model answers (grading key); takers reviewing their own
  // finished attempt see MCQ correctness but not the written grading key.
  const responses = attempt.responses.map((r) => ({
    id: r.id,
    order: r.order,
    type: r.question.type,
    competency: r.question.competency,
    prompt: r.question.prompt,
    options: r.question.options,
    points: r.question.points,
    selectedIndex: r.selectedIndex,
    isCorrect: r.isCorrect,
    correctIndex: attempt.status !== 'IN_PROGRESS' ? r.question.correctIndex : null,
    writtenAnswer: r.writtenAnswer,
    awardedPoints: r.awardedPoints,
    graderNote: r.graderNote,
    modelAnswer: isGrader ? r.question.modelAnswer : null,
  }));

  return NextResponse.json({
    id: attempt.id,
    status: attempt.status,
    taker: attempt.user,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    gradedAt: attempt.gradedAt,
    autoScore: attempt.autoScore,
    autoMax: attempt.autoMax,
    writtenScore: attempt.writtenScore,
    writtenMax: attempt.writtenMax,
    totalScore: attempt.totalScore,
    maxScore: attempt.maxScore,
    passed: attempt.passed,
    canGrade: isGrader && attempt.status === 'SUBMITTED',
    responses,
  });
}
