/**
 * One-off cleanup: collapse the duplicated "Welcome to Capelli…" dashboard
 * banners (caused by a non-idempotent seed) down to a single canonical row.
 * Safe to re-run.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TITLE = 'Welcome to Capelli CS Workflow Coach!';
const MESSAGE = 'To enable AI-powered guidance, upload your Capelli training documents in Admin › Upload Docs. The AI needs your materials to cite policies correctly.';

async function main() {
  const before = await prisma.adminUpdate.findMany({ where: { title: TITLE }, select: { id: true } });
  console.log(`Found ${before.length} welcome announcement row(s).`);

  const del = await prisma.adminUpdate.deleteMany({ where: { title: TITLE } });
  console.log(`Deleted ${del.count} row(s).`);

  await prisma.adminUpdate.upsert({
    where: { id: 'welcome-update' },
    update: { title: TITLE, message: MESSAGE, isActive: true },
    create: { id: 'welcome-update', title: TITLE, message: MESSAGE, isActive: true, visibleTo: [] },
  });

  const after = await prisma.adminUpdate.count({ where: { title: TITLE } });
  console.log(`Now ${after} welcome announcement row (expected 1).`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
