import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const schema = z.object({
  sessionId: z.string(),
  rating: z.enum(['CORRECT', 'PARTIALLY_CORRECT', 'INCORRECT']),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const data = schema.parse(body);

    const ticketSession = await prisma.ticketSession.findUnique({
      where: { id: data.sessionId },
    });
    if (!ticketSession) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.ticketSession.update({
      where: { id: data.sessionId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: (session.user as { id: string }).id,
        action: 'FEEDBACK_SUBMITTED',
        resource: 'ticket_session',
        resourceId: data.sessionId,
        details: { rating: data.rating, comment: data.comment } as any,
      },
    });

    if (data.rating === 'INCORRECT' || data.rating === 'PARTIALLY_CORRECT') {
      await prisma.unresolvedQuery.create({
        data: {
          sessionId: data.sessionId,
          query: `Agent feedback: ${data.rating}${data.comment ? ` — ${data.comment}` : ''}`,
          category: ticketSession.primaryIssue ?? undefined,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
