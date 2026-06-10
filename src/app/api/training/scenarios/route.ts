import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const scenarios = await prisma.trainingScenario.findMany({
      where: { isPublished: true },
      include: {
        quizQuestions: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { attempts: true } },
      },
      orderBy: [{ difficulty: 'asc' }, { sortOrder: 'asc' }],
    });

    return NextResponse.json({ scenarios });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
