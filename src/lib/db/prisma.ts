import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Reuse a single client across hot reloads AND warm serverless invocations so we
// don't pay connection setup on every request.
globalForPrisma.prisma = prisma;

// Kick off the DB connection during cold-start module init so the handshake
// overlaps with the rest of startup instead of blocking the first query.
void prisma.$connect().catch(() => { /* first real query will surface any error */ });
