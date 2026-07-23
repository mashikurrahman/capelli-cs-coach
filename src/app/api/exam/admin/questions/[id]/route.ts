import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { GRADER_ROLES } from '@/lib/exam/build-exam';
import { questionSchema } from '@/lib/exam/question-schema';
import { z } from 'zod';

function guard(session: any): { ok: true } | { ok: false; res: NextResponse } {
  if (!session?.user) return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  if (!GRADER_ROLES.includes(role)) return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { ok: true };
}

// PATCH — full edit, or a lightweight { isActive } toggle (retire / restore).
const toggleSchema = z.object({ isActive: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const g = guard(await getServerSession(authOptions));
  if (!g.ok) return g.res;

  const existing = await prisma.examQuestion.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  // Toggle-only payload (retire / restore).
  const toggle = toggleSchema.safeParse(body);
  if (toggle.success && Object.keys(body).length === 1) {
    await prisma.examQuestion.update({ where: { id: params.id }, data: { isActive: toggle.data.isActive } });
    return NextResponse.json({ id: params.id, isActive: toggle.data.isActive });
  }

  // Full edit.
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid question' }, { status: 400 });
  }
  const v = parsed.data;
  const isMcq = v.type === 'MCQ';
  const options = isMcq ? (v.options ?? []).filter((o) => o.length > 0) : [];

  await prisma.examQuestion.update({
    where: { id: params.id },
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
      ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
    },
  });

  return NextResponse.json({ id: params.id });
}

// DELETE — retire (soft delete). Hard delete would orphan past attempts'
// responses, so we deactivate instead; if the question was never used, a real
// delete is safe and keeps the bank tidy.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const g = guard(await getServerSession(authOptions));
  if (!g.ok) return g.res;

  const q = await prisma.examQuestion.findUnique({
    where: { id: params.id },
    include: { _count: { select: { responses: true } } },
  });
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (q._count.responses === 0) {
    await prisma.examQuestion.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  }
  await prisma.examQuestion.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ deleted: false, retired: true });
}
