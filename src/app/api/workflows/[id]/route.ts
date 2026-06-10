import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { canManageWorkflows } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id },
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
        escalationRules: true,
        commonMistakes: true,
        zendeskTags: true,
        templates: true,
        sourceRefs: true,
      },
    });

    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(workflow);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role as any;
    if (!canManageWorkflows(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { steps, ...data } = body;

    const workflow = await prisma.workflow.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(workflow);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role as any;
    if (!canManageWorkflows(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Only archive, never hard-delete built-in workflows
    const wf = await prisma.workflow.findUnique({ where: { id: params.id } });
    if (!wf) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (wf.isBuiltIn) {
      await prisma.workflow.update({ where: { id: params.id }, data: { status: 'ARCHIVED' } });
      return NextResponse.json({ ok: true, archived: true });
    }

    await prisma.workflow.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
