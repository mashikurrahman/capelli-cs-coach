import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(3),
  message: z.string().min(5),
  visibleTo: z.array(z.enum(['ADMIN', 'TEAM_LEADER', 'TRAINER', 'AGENT', 'QA'])).optional(),
  expiresAt: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role as any;

    const updates = await prisma.adminUpdate.findMany({
      where: {
        isActive: true,
        OR: [
          { visibleTo: { isEmpty: true } },
          { visibleTo: { has: role } },
        ],
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ] as any,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ updates });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role;
    if (!['ADMIN', 'TEAM_LEADER'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const data = createSchema.parse(body);

    const update = await prisma.adminUpdate.create({
      data: {
        title: data.title,
        message: data.message,
        visibleTo: (data.visibleTo as any[]) ?? [],
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: (session.user as { id: string }).id,
        action: 'ADMIN_UPDATE_POSTED',
        resource: 'admin_update',
        resourceId: update.id,
        details: { title: data.title } as any,
      },
    });

    return NextResponse.json(update, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
