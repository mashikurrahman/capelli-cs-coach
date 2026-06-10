import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { canManageWorkflows } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const q = searchParams.get('q');

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    else where.status = { not: 'ARCHIVED' };
    if (q) where.name = { contains: q, mode: 'insensitive' };

    const workflows = await prisma.workflow.findMany({
      where,
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
        escalationRules: true,
        commonMistakes: true,
        zendeskTags: true,
        templates: true,
        _count: { select: { sessions: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ workflows });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role as any;
    if (!canManageWorkflows(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { steps, escalationRules, commonMistakes, zendeskTags, templates, ...workflowData } = body;

    const workflow = await prisma.workflow.create({
      data: {
        ...workflowData,
        steps: steps ? { create: steps } : undefined,
        escalationRules: escalationRules ? { create: escalationRules } : undefined,
        commonMistakes: commonMistakes ? { create: commonMistakes } : undefined,
        zendeskTags: zendeskTags ? { create: zendeskTags } : undefined,
        templates: templates ? { create: templates } : undefined,
      },
      include: { steps: true },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (err) {
    console.error('Create workflow error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
