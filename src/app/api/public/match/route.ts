import { NextRequest, NextResponse } from 'next/server';
import { smartMatchWorkflows } from '@/lib/workflows/smart-match';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Public, unauthenticated smart-match for the Chrome extension. Returns only
// workflow routing (IDs/names/scores) and a non-sensitive analysis (issues,
// reasoning, extracted order#/club) — no passwords, contacts, or customer data.
// CORS is open because the extension runs from a chrome-extension:// origin.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const schema = z.object({ complaint: z.string().min(3).max(4000) });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const { complaint } = schema.parse(await req.json());
    const result = await smartMatchWorkflows(complaint, 4);
    return NextResponse.json(result, { headers: CORS });
  } catch {
    return NextResponse.json({ error: 'Match failed' }, { status: 400, headers: CORS });
  }
}
