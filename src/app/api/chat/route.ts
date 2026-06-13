import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

interface ChatRow {
  id: string;
  body: string;
  createdAt: Date;
  userId: string;
  name: string;
  role: string;
}

// GET /api/chat — recent team messages (optionally only those after a timestamp)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const after = req.nextUrl.searchParams.get('after');

  const rows = after
    ? await prisma.$queryRaw<ChatRow[]>`
        SELECT m.id, m.body, m."createdAt", m."userId", u.name, u.role::text AS role
        FROM chat_messages m JOIN users u ON u.id = m."userId"
        WHERE m."createdAt" > ${new Date(after)}
        ORDER BY m."createdAt" ASC LIMIT 200`
    : await prisma.$queryRaw<ChatRow[]>`
        SELECT m.id, m.body, m."createdAt", m."userId", u.name, u.role::text AS role
        FROM chat_messages m JOIN users u ON u.id = m."userId"
        ORDER BY m."createdAt" DESC LIMIT 100`;

  const messages = (after ? rows : rows.reverse()).map(r => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    userId: r.userId,
    userName: r.name,
    userRole: r.role,
  }));

  return NextResponse.json({ messages });
}

const postSchema = z.object({ body: z.string().trim().min(1).max(2000) });

// POST /api/chat — send a message to the team room
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  let parsed: { body: string };
  try {
    parsed = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Message is required (1–2000 chars).' }, { status: 400 });
  }

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO chat_messages (id, "userId", body) VALUES (${id}, ${userId}, ${parsed.body})
  `;

  return NextResponse.json({ id }, { status: 201 });
}
