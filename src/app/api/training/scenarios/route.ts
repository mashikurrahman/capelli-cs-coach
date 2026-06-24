import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { generatePracticeScenarios } from '@/lib/training/generate-practice';

const DIFF_ORDER: Record<string, number> = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 };

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbScenarios = await prisma.trainingScenario.findMany({
      where: { isPublished: true },
      include: {
        quizQuestions: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { attempts: true } },
      },
      orderBy: [{ difficulty: 'asc' }, { sortOrder: 'asc' }],
    });

    // Always offer the practice library generated from real labelled tickets so
    // agents can train even before an admin authors custom scenarios. Hand-built
    // DB scenarios come first.
    const generated = generatePracticeScenarios().sort(
      (a, b) => (DIFF_ORDER[a.difficulty] ?? 1) - (DIFF_ORDER[b.difficulty] ?? 1)
    );

    return NextResponse.json({ scenarios: [...dbScenarios, ...generated] });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
