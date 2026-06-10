import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { analyzeTicket } from '@/lib/ai/ticket-analyzer';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const schema = z.object({
  complaint: z.string().min(5),
  orderNumber: z.string().optional(),
  clubTeamName: z.string().optional(),
  channel: z.string().optional(),
  agentNotes: z.string().optional(),
  screenshotDescription: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const input = schema.parse(body);

    // Run AI analysis
    const analysis = await analyzeTicket(input);

    // Store session in database
    const ticketSession = await prisma.ticketSession.create({
      data: {
        agentId: (session.user as { id: string }).id,
        rawComplaint: input.complaint,
        orderNumber: input.orderNumber,
        clubTeamName: input.clubTeamName,
        channel: (input.channel as 'ZENDESK' | 'EMAIL' | 'PHONE' | 'CHAT' | 'OTHER') ?? 'ZENDESK',
        primaryIssue: (analysis.primary_issue_type as any) ?? undefined,
        secondaryIssues: (analysis.secondary_issue_types as any[]) ?? [],
        confidenceScore: analysis.confidence_score,
        riskLevel: analysis.risk_level === 'high' ? 'HIGH' : analysis.risk_level === 'medium' ? 'MEDIUM' : 'LOW',
        analysisResult: analysis as any,
      },
    });

    // Store generated email
    if (analysis.customer_email_draft) {
      await prisma.generatedEmail.create({
        data: {
          sessionId: ticketSession.id,
          subject: analysis.email_subject,
          body: analysis.customer_email_draft,
        },
      });
    }

    // Store internal note
    if (analysis.internal_note_draft) {
      await prisma.internalNote.create({
        data: {
          sessionId: ticketSession.id,
          body: analysis.internal_note_draft,
        },
      });
    }

    // Log unresolved queries (low confidence)
    if (analysis.confidence_score < 50) {
      await prisma.unresolvedQuery.create({
        data: {
          sessionId: ticketSession.id,
          query: input.complaint,
          category: (analysis.primary_issue_type as any) ?? undefined,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as { id: string }).id,
        action: 'TICKET_ANALYZED',
        resource: 'ticket_session',
        resourceId: ticketSession.id,
        details: {
          issueType: analysis.primary_issue_type,
          confidence: analysis.confidence_score,
          risk: analysis.risk_level,
        } as any,
      },
    });

    return NextResponse.json({ analysis, sessionId: ticketSession.id });
  } catch (err) {
    console.error('Ticket analysis error:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
