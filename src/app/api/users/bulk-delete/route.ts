import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { canManageUsers } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({ ids: z.array(z.string().min(1)).min(1) });

// Bulk-remove users. Hard-delete those with no dependent records; for users
// that have history (tickets, audit logs, etc.) a hard delete would break
// foreign keys, so we deactivate them instead. Returns a summary of both.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role: string }).role as any;
    if (!canManageUsers(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const currentUserId = (session.user as { id: string }).id;
    const { ids } = schema.parse(await req.json());

    // Never delete the account performing the action.
    const targets = ids.filter(id => id !== currentUserId);
    if (targets.length === 0) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    const deleted: string[] = [];
    const deactivated: string[] = [];

    for (const id of targets) {
      try {
        await prisma.user.delete({ where: { id } });
        deleted.push(id);
      } catch {
        // Likely a foreign-key constraint (user has history) — deactivate instead.
        try {
          await prisma.user.update({ where: { id }, data: { isActive: false } });
          deactivated.push(id);
        } catch {
          /* user no longer exists — ignore */
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'USER_DEACTIVATED',
        resource: 'user',
        details: { bulk: true, deleted: deleted.length, deactivated: deactivated.length } as any,
      },
    });

    return NextResponse.json({ deleted: deleted.length, deactivated: deactivated.length });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
