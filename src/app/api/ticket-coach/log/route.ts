import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  complaint: z.string().min(1),
  orderNumber: z.string().optional(),
  clubName: z.string().optional(),
  workflowId: z.string().optional(),
  workflowName: z.string().optional(),
});

// Lightweight completion log for the deterministic Ticket Coach.
// No AI — just records that a workflow was handled (keeps dashboard metrics).
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = schema.parse(await req.json());
    const userId = (session.user as { id: string }).id;

    const ticketSession = await prisma.ticketSession.create({
      data: {
        agentId: userId,
        rawComplaint: data.complaint,
        orderNumber: data.orderNumber,
        clubTeamName: data.clubName,
        status: 'COMPLETED',
        completedAt: new Date(),
        analysisResult: { workflowId: data.workflowId, workflowName: data.workflowName, engine: 'deterministic' } as any,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'TICKET_ANALYZED',
        resource: 'ticket_session',
        resourceId: ticketSession.id,
        details: { workflow: data.workflowName, engine: 'deterministic' } as any,
      },
    });

    return NextResponse.json({ id: ticketSession.id });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to log' }, { status: 400 });
  }
}
