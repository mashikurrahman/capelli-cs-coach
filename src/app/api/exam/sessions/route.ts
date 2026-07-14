import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { GRADER_ROLES } from '@/lib/exam/build-exam';
import { z } from 'zod';

// GET — list sessions. Takers get the currently-open ones; graders get all
// (with attempt counts) for management.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  const isGrader = GRADER_ROLES.includes(role);

  if (!isGrader) {
    const open = await prisma.examSession.findMany({
      where: { isOpen: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, timeLimitMin: true, createdAt: true },
    });
    return NextResponse.json({ open });
  }

  const sessions = await prisma.examSession.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { attempts: true } },
    },
    take: 100,
  });
  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id, title: s.title, isOpen: s.isOpen, timeLimitMin: s.timeLimitMin,
      createdBy: s.createdBy?.name ?? '', createdAt: s.createdAt, closedAt: s.closedAt,
      attemptCount: s._count.attempts,
    })),
  });
}

const createSchema = z.object({
  title: z.string().min(1).max(120),
  timeLimitMin: z.number().int().min(5).max(240).optional(),
});

// POST — open a new exam (grader only).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  if (!GRADER_ROLES.includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = createSchema.parse(await req.json());
  const created = await prisma.examSession.create({
    data: {
      title: body.title.trim(),
      timeLimitMin: body.timeLimitMin ?? null,
      createdById: (session.user as { id: string }).id,
    },
  });
  return NextResponse.json({ id: created.id, title: created.title });
}

const patchSchema = z.object({ id: z.string(), isOpen: z.boolean() });

// PATCH — open/close a session (grader only).
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  if (!GRADER_ROLES.includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = patchSchema.parse(await req.json());
  const updated = await prisma.examSession.update({
    where: { id: body.id },
    data: { isOpen: body.isOpen, closedAt: body.isOpen ? null : new Date() },
  });
  return NextResponse.json({ id: updated.id, isOpen: updated.isOpen });
}
