import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { semanticMatchWorkflows } from '@/lib/workflows/semantic-match';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({ complaint: z.string().min(3) });

// Semantic fallback matcher (only called when keyword matching misses).
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { complaint } = schema.parse(await req.json());
    const matches = await semanticMatchWorkflows(complaint, 4);
    return NextResponse.json({ matches });
  } catch (err) {
    return NextResponse.json({ error: 'Smart match failed' }, { status: 400 });
  }
}
