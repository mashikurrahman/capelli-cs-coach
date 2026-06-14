import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { canManageUsers } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { hardDeleteUser } from '@/lib/users/delete';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({ ids: z.array(z.string().min(1)).min(1) });

// Permanently remove the selected users and their personal activity. Each user
// is deleted in its own transaction (FK-safe) so one failure doesn't abort the
// rest. Returns how many were deleted and any that failed.
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
    const failed: string[] = [];

    for (const id of targets) {
      try {
        await hardDeleteUser(id, currentUserId);
        deleted.push(id);
      } catch (err) {
        console.error(`Bulk delete failed for user ${id}:`, err);
        failed.push(id);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'USER_DELETED',
        resource: 'user',
        details: { bulk: true, deleted: deleted.length, failed: failed.length } as any,
      },
    });

    return NextResponse.json({ deleted: deleted.length, failed: failed.length });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    console.error('Bulk delete error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
