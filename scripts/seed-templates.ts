/**
 * Reseed the templates table with the official Capelli email templates
 * (verbatim) from src/lib/templates/email-templates.ts.
 *
 * Run: npx tsx scripts/seed-templates.ts
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';

const envPath = path.resolve(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

import { EMAIL_TEMPLATES, complaintsFor } from '../src/lib/templates/email-templates';

const prisma = new PrismaClient();

function extractPlaceholders(body: string): string[] {
  const matches = body.match(/\[([^\]]+)\]/g) ?? [];
  return Array.from(new Set(matches.map(m => m.slice(1, -1))));
}

function pgArray(values: string[]) {
  return values.length === 0
    ? Prisma.sql`ARRAY[]::text[]`
    : Prisma.sql`ARRAY[${Prisma.join(values)}]::text[]`;
}

async function main() {
  // Remove all existing templates (dev-written placeholders) and replace
  // with the official set. Nothing references templates by FK.
  const del = await prisma.$executeRaw`DELETE FROM templates`;
  console.log(`Deleted ${del} existing templates.`);

  let i = 0;
  for (const t of EMAIL_TEMPLATES) {
    const placeholders = extractPlaceholders(t.body);
    const complaints = complaintsFor(t.key);
    await prisma.$executeRaw`
      INSERT INTO templates
        (id, name, type, category, complaints, keywords, subject, body, placeholders, "isOfficial", "sortOrder", status, version, "createdAt", "updatedAt")
      VALUES (
        ${randomUUID()}, ${t.name}, 'CUSTOMER_EMAIL'::"TemplateType", ${t.category},
        ${pgArray(complaints)}, ${pgArray(t.keywords)}, ${t.subject ?? null}, ${t.body}, ${pgArray(placeholders)},
        true, ${i}, 'APPROVED'::"WorkflowStatus", 1, NOW(), NOW()
      )
    `;
    i++;
  }
  console.log(`Inserted ${i} official templates.`);

  const byComplaint = await prisma.$queryRaw<Array<{ complaint: string; n: bigint }>>`
    SELECT UNNEST(complaints) AS complaint, COUNT(*)::bigint AS n FROM templates GROUP BY complaint ORDER BY complaint
  `;
  console.log('\nBy complaint:');
  for (const r of byComplaint) console.log(`  ${r.complaint}: ${Number(r.n)}`);
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
