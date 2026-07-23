import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { GRADER_ROLES, SLOT_LABEL } from '@/lib/exam/build-exam';
import { questionSchema } from '@/lib/exam/question-schema';

// E9 — Question-bank admin. Add / edit / retire exam questions in-app instead
// of re-seeding from files. Retiring is a soft delete (isActive=false) because
// past attempts' responses still reference the question.

function guard(session: any): { ok: true; userId: string } | { ok: false; res: NextResponse } {
  if (!session?.user) return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  if (!GRADER_ROLES.includes(role)) return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { ok: true, userId: (session.user as { id: string }).id };
}

export async function GET() {
  const g = guard(await getServerSession(authOptions));
  if (!g.ok) return g.res;

  const questions = await prisma.examQuestion.findMany({
    orderBy: [{ type: 'asc' }, { slot: 'asc' }, { createdAt: 'asc' }],
    include: { _count: { select: { responses: true } } },
  });

  return NextResponse.json({
    slots: SLOT_LABEL,
    questions: questions.map((q) => ({
      id: q.id, type: q.type, slot: q.slot, competency: q.competency, difficulty: q.difficulty,
      prompt: q.prompt, options: q.options, correctIndex: q.correctIndex, modelAnswer: q.modelAnswer,
      points: q.points, isActive: q.isActive, usedCount: q._count.responses,
    })),
  });
}

export async function POST(req: NextRequest) {
  const g = guard(await getServerSession(authOptions));
  if (!g.ok) return g.res;

  const parsed = questionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid question' }, { status: 400 });
  }
  const v = parsed.data;
  const isMcq = v.type === 'MCQ';
  const options = isMcq ? (v.options ?? []).filter((o) => o.length > 0) : [];

  const created = await prisma.examQuestion.create({
    data: {
      type: v.type,
      slot: isMcq ? null : v.slot!,
      competency: v.competency,
      difficulty: v.difficulty ?? 'INTERMEDIATE',
      prompt: v.prompt,
      options,
      correctIndex: isMcq ? v.correctIndex! : null,
      modelAnswer: isMcq ? null : (v.modelAnswer || null),
      points: v.points ?? (isMcq ? 2 : 6),
      isActive: true,
    },
  });

  return NextResponse.json({ id: created.id });
}
