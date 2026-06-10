import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const patchSchema = z.object({
  action: z.enum(['email_copied', 'note_copied', 'complete', 'step_update']),
  currentStep: z.number().optional(),
  completedSteps: z.array(z.number()).optional(),
  checklistResults: z.array(z.object({
    key: z.string(),
    label: z.string(),
    isRequired: z.boolean(),
    isChecked: z.boolean(),
  })).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const data = patchSchema.parse(body);
    const userId = (session.user as { id: string }).id;

    const ticketSession = await prisma.ticketSession.findUnique({ where: { id: params.id } });
    if (!ticketSession) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (ticketSession.agentId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (data.action === 'email_copied') {
      await prisma.generatedEmail.updateMany({
        where: { sessionId: params.id },
        data: { wasCopied: true, copiedAt: new Date() },
      });
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'EMAIL_COPIED',
          resource: 'ticket_session',
          resourceId: params.id,
          details: {} as any,
        },
      });
    }

    if (data.action === 'note_copied') {
      await prisma.internalNote.updateMany({
        where: { sessionId: params.id },
        data: { wasCopied: true },
      });
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'NOTE_COPIED',
          resource: 'ticket_session',
          resourceId: params.id,
          details: {} as any,
        },
      });
    }

    if (data.action === 'complete') {
      await prisma.ticketSession.update({
        where: { id: params.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    if (data.action === 'step_update' && data.currentStep !== undefined) {
      await prisma.ticketSession.update({
        where: { id: params.id },
        data: {
          currentStep: data.currentStep,
          completedSteps: data.completedSteps ?? [],
        },
      });
    }

    if (data.checklistResults && data.checklistResults.length > 0) {
      for (const item of data.checklistResults) {
        const existing = await prisma.checklistResult.findFirst({
          where: { sessionId: params.id, checkKey: item.key },
        });
        if (existing) {
          await prisma.checklistResult.update({
            where: { id: existing.id },
            data: { isChecked: item.isChecked, checkedAt: item.isChecked ? new Date() : null },
          });
        } else {
          await prisma.checklistResult.create({
            data: {
              sessionId: params.id,
              checkKey: item.key,
              checkLabel: item.label,
              isRequired: item.isRequired,
              isChecked: item.isChecked,
              checkedAt: item.isChecked ? new Date() : null,
            },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    console.error('Session PATCH error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ticketSession = await prisma.ticketSession.findUnique({
      where: { id: params.id },
      include: {
        generatedEmails: true,
        internalNotes: true,
        checklistResults: true,
        qaReviews: { select: { id: true, status: true, overallScore: true } },
      },
    });

    if (!ticketSession) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(ticketSession);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
