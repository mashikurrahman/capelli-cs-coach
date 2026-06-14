import { prisma } from '@/lib/db/prisma';

/**
 * Permanently delete a user and all of their personal activity in a single
 * transaction, in foreign-key-safe order.
 *
 * The User row is referenced by several tables that have NO cascade rule, so a
 * naive `prisma.user.delete` always fails on a FK constraint. We clear the
 * dependents explicitly:
 *   - QA reviews they authored, and QA reviews on their ticket sessions
 *   - Unresolved queries are detached from their sessions (kept for the log)
 *   - Quiz attempts, audit logs, chat messages they own
 *   - Their ticket sessions (emails / notes / checklists cascade automatically)
 *
 * Knowledge-base documents they uploaded are PRESERVED by reassigning ownership
 * to the acting admin — deleting shared KB content just because the uploader
 * left would be wrong.
 */
export async function hardDeleteUser(userId: string, reassignDocsTo: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const sessions = await tx.ticketSession.findMany({
      where: { agentId: userId },
      select: { id: true },
    });
    const sessionIds = sessions.map((s) => s.id);

    // QA reviews: authored by this user, or written against their sessions.
    await tx.qaReview.deleteMany({
      where: {
        OR: [
          { reviewerId: userId },
          ...(sessionIds.length ? [{ sessionId: { in: sessionIds } }] : []),
        ],
      },
    });

    // Detach unresolved queries from the soon-to-be-deleted sessions (keep the
    // query record itself — it's an aggregate signal, not personal data).
    if (sessionIds.length) {
      await tx.unresolvedQuery.updateMany({
        where: { sessionId: { in: sessionIds } },
        data: { sessionId: null },
      });
    }

    await tx.quizAttempt.deleteMany({ where: { userId } });
    await tx.auditLog.deleteMany({ where: { userId } });
    await tx.chatMessage.deleteMany({ where: { userId } });

    // Ticket sessions — child emails/notes/checklists cascade on delete.
    await tx.ticketSession.deleteMany({ where: { agentId: userId } });

    // Preserve uploaded documents by transferring ownership.
    await tx.document.updateMany({
      where: { uploadedById: userId },
      data: { uploadedById: reassignDocsTo },
    });

    await tx.user.delete({ where: { id: userId } });
  });
}
