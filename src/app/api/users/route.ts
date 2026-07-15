import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { canManageUsers } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'TEAM_LEADER', 'TRAINER', 'AGENT', 'QA']),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role as any;
    if (!canManageUsers(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const userRole = searchParams.get('role');

    const where: any = {};
    if (q) where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
    if (userRole) where.role = userRole;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, lastLoginAt: true, createdAt: true,
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role as any;
    if (!canManageUsers(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const data = createSchema.parse(body);

    const existing = await prisma.user.findFirst({
      where: { email: { equals: data.email, mode: 'insensitive' } },
    });
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role,
        avatarInitials: data.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: (session.user as { id: string }).id,
        action: 'USER_CREATED',
        resource: 'user',
        resourceId: user.id,
        details: { name: data.name, role: data.role } as any,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
