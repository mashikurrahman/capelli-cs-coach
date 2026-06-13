import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { canManageUsers } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'TEAM_LEADER', 'TRAINER', 'AGENT', 'QA']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role as any;
    const currentUserId = (session.user as { id: string }).id;

    // Users can update their own name/password; admins can update anything
    const isSelf = params.id === currentUserId;
    if (!isSelf && !canManageUsers(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    // Non-admins can't change roles
    if (data.role && !canManageUsers(role)) {
      return NextResponse.json({ error: 'Cannot change roles' }, { status: 403 });
    }

    const updateData: any = {};
    if (data.name) {
      updateData.name = data.name;
      updateData.avatarInitials = data.name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);
    }
    if (data.email) {
      const taken = await prisma.user.findFirst({
        where: { email: { equals: data.email, mode: 'insensitive' }, id: { not: params.id } },
        select: { id: true },
      });
      if (taken) return NextResponse.json({ error: 'That email is already in use by another user.' }, { status: 409 });
      updateData.email = data.email;
    }
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'USER_UPDATED',
        resource: 'user',
        resourceId: params.id,
        details: { changes: Object.keys(updateData) } as any,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role as any;
    if (!canManageUsers(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const currentUserId = (session.user as { id: string }).id;
    if (params.id === currentUserId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Deactivate instead of hard-delete to preserve audit trail
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'USER_DEACTIVATED',
        resource: 'user',
        resourceId: params.id,
        details: {} as any,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
