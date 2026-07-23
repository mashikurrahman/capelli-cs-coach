import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { smartMatchWorkflows } from '@/lib/workflows/smart-match';
import { searchPrecedents } from '@/lib/ai/precedents';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({ complaint: z.string().min(3) });

// Smart matcher: cleaned input → keyword + embedding hybrid, with an
// intelligent LLM layer for tricky/ambiguous/multi-issue complaints.
// Returns ranked matches plus (when the brain was used) an analysis, and — for
// substantial complaints — the nearest resolved-ticket precedents (A2).
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { complaint } = schema.parse(await req.json());

    // Only look up precedents for a real complaint (not a few typed words).
    const wantPrecedents = complaint.trim().length >= 24;
    const [result, precedents] = await Promise.all([
      smartMatchWorkflows(complaint, 4),
      wantPrecedents ? searchPrecedents(complaint, 2, 0.42) : Promise.resolve([]),
    ]);

    return NextResponse.json({
      ...result,
      precedents: precedents.map((p) => ({
        complaint: p.complaint,
        handling: p.handling,
        category: p.category,
        similarity: Math.round(p.similarity * 100),
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Match failed' }, { status: 400 });
  }
}
