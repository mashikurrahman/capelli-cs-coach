import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Read-only, unauthenticated feed of APPROVED email templates for the Chrome
// extension to sync. These are customer-facing email bodies with [placeholders]
// — no club passwords, RO numbers, or internal contacts — so they are safe to
// expose. CORS is open because the extension runs from a chrome-extension://
// origin that can't be enumerated ahead of time.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=300',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  const templates = await prisma.template.findMany({
    where: { status: 'APPROVED' },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      category: true,
      keywords: true,
      placeholders: true,
      subject: true,
      body: true,
    },
  });

  return NextResponse.json({ templates, syncedAt: new Date().toISOString() }, { headers: CORS });
}
