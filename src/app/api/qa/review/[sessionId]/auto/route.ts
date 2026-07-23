import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { scoreTicketQuality } from '@/lib/ai/qa-rubric';

const QA_ROLES = ['ADMIN', 'TEAM_LEADER', 'QA'];

// POST — AI pre-screen. Returns rubric scores + risk flags for the reviewer to
// confirm or adjust; nothing is persisted here.
export async function POST(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  if (!QA_ROLES.includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const s = await prisma.ticketSession.findUnique({
    where: { id: params.sessionId },
    include: {
      workflow: { select: { name: true } },
      generatedEmails: { orderBy: { createdAt: 'desc' }, take: 1 },
      internalNotes: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const a = s.analysisResult as { workflowName?: string; workflow_recommended?: string } | null;

  try {
    const result = await scoreTicketQuality({
      complaint: s.redactedComplaint || s.rawComplaint,
      workflowName: s.workflow?.name ?? a?.workflowName ?? a?.workflow_recommended ?? null,
      primaryIssue: s.primaryIssue,
      customerEmail: s.generatedEmails[0]?.body ?? null,
      internalNote: s.internalNotes[0]?.body ?? null,
      agentNotes: s.agentNotes,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'AI pre-screen is unavailable right now — score it manually.' }, { status: 502 });
  }
}
