import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { assembleExam } from '@/lib/exam/build-exam';

/** Taker-safe question shape (no correct answers / model answers). */
function sanitize(q: { id: string; type: string; competency: string; prompt: string; options: string[]; points: number }, order: number) {
  return {
    id: q.id,
    order,
    type: q.type,
    competency: q.competency,
    prompt: q.prompt,
    options: q.type === 'MCQ' ? q.options : [],
    points: q.points,
  };
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  // Resume an in-progress attempt instead of starting a second one.
  const existing = await prisma.examAttempt.findFirst({
    where: { userId, status: 'IN_PROGRESS' },
    include: { responses: { orderBy: { order: 'asc' }, include: { question: true } } },
  });
  if (existing) {
    return NextResponse.json({
      attemptId: existing.id,
      resumed: true,
      maxScore: existing.maxScore,
      questions: existing.responses.map((r) => ({
        ...sanitize(r.question, r.order),
        selectedIndex: r.selectedIndex,
        writtenAnswer: r.writtenAnswer,
      })),
    });
  }

  const pool = await prisma.examQuestion.findMany({
    where: { isActive: true },
    select: { id: true, type: true, slot: true },
  });
  const written = pool.filter((q) => q.type === 'WRITTEN');
  const mcq = pool.filter((q) => q.type === 'MCQ');
  if (written.length === 0 || mcq.length === 0) {
    return NextResponse.json({ error: 'The exam bank is empty. Seed it first.' }, { status: 400 });
  }

  const orderedIds = assembleExam(written, mcq);
  const questions = await prisma.examQuestion.findMany({ where: { id: { in: orderedIds } } });
  const byId = new Map(questions.map((q) => [q.id, q]));

  const autoMax = orderedIds.reduce((s, id) => s + (byId.get(id)?.type === 'MCQ' ? byId.get(id)!.points : 0), 0);
  const writtenMax = orderedIds.reduce((s, id) => s + (byId.get(id)?.type === 'WRITTEN' ? byId.get(id)!.points : 0), 0);
  const maxScore = autoMax + writtenMax;

  const attempt = await prisma.examAttempt.create({
    data: {
      userId,
      status: 'IN_PROGRESS',
      autoMax,
      writtenMax,
      maxScore,
      responses: {
        create: orderedIds.map((id, i) => ({ questionId: id, order: i })),
      },
    },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    resumed: false,
    maxScore,
    questions: orderedIds.map((id, i) => sanitize(byId.get(id)!, i)),
  });
}
