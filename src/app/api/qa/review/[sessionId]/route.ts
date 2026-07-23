import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const QA_ROLES = ['ADMIN', 'TEAM_LEADER', 'QA'];

function guard(session: any): { ok: true; userId: string } | { ok: false; res: NextResponse } {
  if (!session?.user) return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  if (!QA_ROLES.includes(role)) return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { ok: true, userId: (session.user as { id: string }).id };
}

function workflowName(s: { workflow: { name: string } | null; analysisResult: unknown }): string | null {
  if (s.workflow?.name) return s.workflow.name;
  const a = s.analysisResult as { workflowName?: string; workflow_recommended?: string } | null;
  return a?.workflowName ?? a?.workflow_recommended ?? null;
}

// GET — the detail a reviewer needs: complaint, drafts, and any existing review.
export async function GET(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const g = guard(await getServerSession(authOptions));
  if (!g.ok) return g.res;

  const s = await prisma.ticketSession.findUnique({
    where: { id: params.sessionId },
    include: {
      agent: { select: { name: true, email: true } },
      workflow: { select: { name: true } },
      generatedEmails: { orderBy: { createdAt: 'desc' }, take: 1 },
      internalNotes: { orderBy: { createdAt: 'desc' }, take: 1 },
      qaReviews: { orderBy: { createdAt: 'desc' }, take: 1, include: { reviewer: { select: { name: true } } } },
    },
  });
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const review = s.qaReviews[0] ?? null;
  return NextResponse.json({
    id: s.id,
    agent: s.agent?.name ?? 'Unknown',
    complaint: s.redactedComplaint || s.rawComplaint,
    agentNotes: s.agentNotes,
    primaryIssue: s.primaryIssue,
    riskLevel: s.riskLevel,
    confidenceScore: s.confidenceScore,
    workflowName: workflowName(s),
    customerEmail: s.generatedEmails[0]?.body ?? null,
    emailSubject: s.generatedEmails[0]?.subject ?? null,
    internalNote: s.internalNotes[0]?.body ?? null,
    createdAt: s.createdAt,
    review: review && {
      id: review.id,
      accuracyScore: review.accuracyScore, policyScore: review.policyScore, toneScore: review.toneScore,
      completenessScore: review.completenessScore, zendeskScore: review.zendeskScore, overallScore: review.overallScore,
      riskLevel: review.riskLevel, status: review.status, notes: review.notes, issues: review.issues,
      reviewer: review.reviewer?.name ?? null, createdAt: review.createdAt,
    },
  });
}

const score = z.number().int().min(0).max(100);
const saveSchema = z.object({
  accuracyScore: score, policyScore: score, toneScore: score,
  completenessScore: score, zendeskScore: score, overallScore: score,
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['APPROVED', 'NEEDS_REVISION', 'FLAGGED', 'PENDING']),
  notes: z.string().max(4000).optional(),
  issues: z.array(z.string().max(400)).max(20).optional(),
});

// POST — save a review (create new; a session can carry more than one over time).
export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const g = guard(await getServerSession(authOptions));
  if (!g.ok) return g.res;

  const parsed = saveSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid review' }, { status: 400 });

  const ticket = await prisma.ticketSession.findUnique({ where: { id: params.sessionId }, select: { id: true } });
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const v = parsed.data;
  const created = await prisma.qaReview.create({
    data: {
      sessionId: params.sessionId,
      reviewerId: g.userId,
      accuracyScore: v.accuracyScore, policyScore: v.policyScore, toneScore: v.toneScore,
      completenessScore: v.completenessScore, zendeskScore: v.zendeskScore, overallScore: v.overallScore,
      riskLevel: v.riskLevel, status: v.status, notes: v.notes ?? null, issues: v.issues ?? [],
    },
  });

  // Reflect the reviewed risk back onto the session for the coach/analytics views.
  await prisma.ticketSession.update({
    where: { id: params.sessionId },
    data: { riskLevel: v.riskLevel },
  }).catch(() => {});

  await prisma.auditLog.create({
    data: { userId: g.userId, action: 'QA_REVIEWED', resource: 'ticket_session', resourceId: params.sessionId,
      details: { overall: v.overallScore, status: v.status } as any },
  }).catch(() => {});

  return NextResponse.json({ id: created.id });
}
