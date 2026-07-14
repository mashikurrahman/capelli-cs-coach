import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { GRADER_ROLES, passed } from '@/lib/exam/build-exam';
import { z } from 'zod';

const schema = z.object({
  grades: z.array(z.object({
    responseId: z.string(),
    awardedPoints: z.number().int().min(0),
    graderNote: z.string().optional(),
  })),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  if (!GRADER_ROLES.includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const graderId = (session.user as { id: string }).id;

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: params.id },
    include: { responses: { include: { question: true } } },
  });
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (attempt.status === 'IN_PROGRESS') return NextResponse.json({ error: 'Exam not submitted yet' }, { status: 409 });

  const body = schema.parse(await req.json());
  const gradeById = new Map(body.grades.map((g) => [g.responseId, g]));

  // Cap each written award at that question's max points.
  const written = attempt.responses.filter((r) => r.question.type === 'WRITTEN');
  let writtenScore = 0;
  for (const r of written) {
    const g = gradeById.get(r.id);
    const awarded = Math.min(g?.awardedPoints ?? r.awardedPoints ?? 0, r.question.points);
    writtenScore += awarded;
    await prisma.examResponse.update({
      where: { id: r.id },
      data: { awardedPoints: awarded, graderNote: g?.graderNote ?? r.graderNote ?? null },
    });
  }

  const autoScore = attempt.autoScore ?? 0;
  const totalScore = autoScore + writtenScore;
  const didPass = passed(totalScore, attempt.maxScore);

  const updated = await prisma.examAttempt.update({
    where: { id: attempt.id },
    data: {
      status: 'GRADED',
      writtenScore,
      totalScore,
      passed: didPass,
      gradedAt: new Date(),
      gradedById: graderId,
    },
  });

  await prisma.auditLog.create({
    data: { userId: graderId, action: 'EXAM_GRADED', resource: 'exam_attempt', resourceId: attempt.id,
      details: { totalScore, maxScore: attempt.maxScore, passed: didPass } as any },
  }).catch(() => {});

  return NextResponse.json({
    status: updated.status,
    autoScore,
    writtenScore,
    totalScore,
    maxScore: attempt.maxScore,
    passed: didPass,
  });
}
