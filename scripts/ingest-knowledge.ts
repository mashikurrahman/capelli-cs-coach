/**
 * Knowledge-base ingestion script.
 *
 * Parses the Capelli CS training materials, chunks them, embeds each chunk
 * with Cloudflare Workers AI, and stores everything in Postgres/pgvector
 * so the Ticket Coach can retrieve evidence-based guidance.
 *
 * Run with: npx tsx scripts/ingest-knowledge.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { embedTexts } from '../src/lib/ai/client';
import { parseDocument } from '../src/lib/ai/document-processor';

// ─── Load .env manually (tsx does not auto-load it) ───────────────────────────
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const prisma = new PrismaClient();
const BATCH_SIZE = 25;

const DESKTOP = 'C:/Users/User/Desktop/Capelli_CS_All_PDF_Files';
const UPLOADS = path.resolve(__dirname, '..', 'uploads');
const KNOWLEDGE = path.resolve(__dirname, '..', 'knowledge');

interface ManifestEntry {
  filePath: string;
  title: string;
  category:
    | 'TRAINING_MANUAL' | 'SOP' | 'EMAIL_TEMPLATE' | 'ZENDESK_TAGS' | 'CONTACTS'
    | 'CLUBS_PASSWORDS' | 'PRODUCT_GUIDE' | 'POLICY' | 'PRACTICE_QUESTIONS'
    | 'CHEAT_SHEET' | 'GENERAL';
  isSensitive?: boolean;
}

const MANIFEST: ManifestEntry[] = [
  {
    filePath: `${DESKTOP}/CS Customer Service Training Manual- Updated 3.11.25(3).pdf`,
    title: 'CS Customer Service Training Manual (Updated 3.11.25)',
    category: 'TRAINING_MANUAL',
  },
  {
    filePath: `${DESKTOP}/Customer Service Templates by Common Scenarios(3).pdf`,
    title: 'Customer Service Templates by Common Scenarios',
    category: 'EMAIL_TEMPLATE',
  },
  {
    filePath: `${DESKTOP}/Order Holds, Changes & Cancelation Guidelines-1117(3).pdf`,
    title: 'Order Holds, Changes & Cancelation Guidelines',
    category: 'SOP',
  },
  {
    filePath: `${DESKTOP}/Zendesk Tags - Updated(2).pdf`,
    title: 'Zendesk Tags (Updated)',
    category: 'ZENDESK_TAGS',
  },
  {
    filePath: `${DESKTOP}/Capelli_CS_Practice_Questions_Part_1_Answers(2).pdf`,
    title: 'Practice Questions Part 1 — Answer Guide',
    category: 'PRACTICE_QUESTIONS',
  },
  {
    filePath: `${DESKTOP}/Contacts Cheat sheet table-1117(2).pdf`,
    title: 'Contacts Cheat Sheet (Internal Routing)',
    category: 'CONTACTS',
    isSensitive: true,
  },
  {
    filePath: `${DESKTOP}/clubs passwords 2026(2).pdf`,
    title: 'Clubs Passwords 2026',
    category: 'CLUBS_PASSWORDS',
    isSensitive: true,
  },
  {
    filePath: 'C:/Users/User/Desktop/Capelli_CS_A_to_Z_Learning_Playbook_Final_Master.pdf',
    title: 'Capelli CS A-to-Z Learning Playbook',
    category: 'CHEAT_SHEET',
  },
  {
    filePath: 'C:/Users/User/Desktop/Capelli_CS_Compact_Training_Module_Updated.pdf',
    title: 'Capelli CS Compact Training Module',
    category: 'CHEAT_SHEET',
  },
  {
    filePath: path.join(KNOWLEDGE, 'product-development-directory.txt'),
    title: 'Product Development Directory',
    category: 'PRODUCT_GUIDE',
  },
];

// ─── Embedding helpers ─────────────────────────────────────────────────────────
async function embedBatch(texts: string[]): Promise<number[][]> {
  return embedTexts(texts);
}

async function storeEmbedding(chunkId: string, embedding: number[]): Promise<void> {
  const vec = `[${embedding.join(',')}]`;
  await prisma.$executeRaw`
    UPDATE document_chunks SET embedding = ${vec}::vector WHERE id = ${chunkId}
  `;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Document ingestion ────────────────────────────────────────────────────────
async function ingestDocument(entry: ManifestEntry, adminId: string): Promise<void> {
  const fileName = path.basename(entry.filePath);

  if (!fs.existsSync(entry.filePath)) {
    console.warn(`  ⚠ SKIPPED (file not found): ${entry.filePath}`);
    return;
  }

  // Idempotency: remove any previous version of this document (chunks cascade)
  await prisma.document.deleteMany({ where: { fileName } });

  const ext = path.extname(fileName).toUpperCase().replace('.', '');
  const fileType = (['PDF', 'DOCX', 'XLSX', 'CSV', 'TXT'].includes(ext) ? ext : 'OTHER') as
    'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'TXT' | 'OTHER';

  const doc = await prisma.document.create({
    data: {
      title: entry.title,
      fileName,
      fileType,
      filePath: entry.filePath,
      fileSize: fs.statSync(entry.filePath).size,
      status: 'PROCESSING',
      isSensitive: entry.isSensitive ?? false,
      category: entry.category,
      uploadedById: adminId,
      notes: 'Ingested by scripts/ingest-knowledge.ts',
    },
  });

  const { chunks, pageCount } = await parseDocument(entry.filePath, fileName);
  if (chunks.length === 0) {
    await prisma.document.update({ where: { id: doc.id }, data: { status: 'FAILED' } });
    console.warn(`  ✗ FAILED (no content extracted): ${entry.title}`);
    return;
  }

  // Create chunk records
  const chunkIds: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const rec = await prisma.documentChunk.create({
      data: {
        documentId: doc.id,
        chunkIndex: i,
        content: c.content,
        pageNumber: c.pageNumber ?? null,
        sectionHeading: c.sectionHeading ?? null,
        tokenCount: c.tokenEstimate,
        isSensitive: entry.isSensitive ?? false,
      },
    });
    chunkIds.push(rec.id);
  }

  // Embed in batches
  let embedded = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const slice = chunks.slice(i, i + BATCH_SIZE);
    try {
      const vectors = await embedBatch(slice.map(c => c.content));
      for (let j = 0; j < vectors.length; j++) {
        await storeEmbedding(chunkIds[i + j], vectors[j]);
        embedded++;
      }
    } catch (err) {
      console.warn(`  ⚠ Embedding batch ${i / BATCH_SIZE + 1} failed for ${entry.title}:`, (err as Error).message);
    }
    await sleep(250);
  }

  await prisma.document.update({
    where: { id: doc.id },
    data: { status: 'PROCESSED', pageCount: pageCount ?? null },
  });

  console.log(`  ✓ ${entry.title} — ${chunks.length} chunks, ${embedded} embedded${entry.isSensitive ? ' [sensitive]' : ''}`);
}

// ─── Club passwords seeding ────────────────────────────────────────────────────
async function seedClubs(): Promise<void> {
  const pdfPath = `${DESKTOP}/clubs passwords 2026(2).pdf`;
  if (!fs.existsSync(pdfPath)) {
    console.warn('  ⚠ Clubs passwords PDF not found — skipping Club table seed');
    return;
  }

  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(fs.readFileSync(pdfPath));
  const lines = data.text.split('\n').map((l: string) => l.trim()).filter(Boolean);

  const nameHeader = lines.findIndex((l: string) => /^CLUB NAME$/i.test(l));
  const passHeader = lines.findIndex((l: string) => /^CLUB PASSWORD$/i.test(l));
  if (nameHeader === -1 || passHeader === -1 || passHeader <= nameHeader) {
    console.warn('  ⚠ Could not locate CLUB NAME / CLUB PASSWORD headers — skipping Club table seed');
    return;
  }

  const names = lines.slice(nameHeader + 1, passHeader);
  const passwords = lines.slice(passHeader + 1);

  if (names.length !== passwords.length) {
    console.warn(`  ⚠ Column count mismatch (${names.length} names vs ${passwords.length} passwords) — skipping Club table seed to avoid mispairing`);
    return;
  }

  // Spot-check known pairs before trusting positional alignment
  const map = new Map(names.map((n: string, i: number) => [n, passwords[i]]));
  const checks: Array<[string, string]> = [
    ['Laguna United FC', 'LUFC2026'],
    ['Slammers FC', 'slammers2024'],
    ['1776 United', '1776U24'],
  ];
  for (const [club, expected] of checks) {
    if (map.has(club) && map.get(club) !== expected) {
      console.warn(`  ⚠ Alignment spot-check failed for "${club}" (got "${map.get(club)}", expected "${expected}") — skipping Club table seed`);
      return;
    }
  }

  let created = 0;
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const rawPass = passwords[i];
    const password = /^(Not Found|NO PASSWORD|NEEDS PASS)$/i.test(rawPass) ? null : rawPass;
    const existing = await prisma.club.findFirst({ where: { name } });
    if (existing) {
      await prisma.club.update({ where: { id: existing.id }, data: { password } });
    } else {
      await prisma.club.create({
        data: { name, password, isActive: true, isSensitive: true },
      });
      created++;
    }
  }
  console.log(`  ✓ Clubs seeded: ${names.length} total (${created} new)`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📚 Ingesting Capelli CS knowledge base…\n');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('No ADMIN user found — run `npm run db:seed` first.');

  // Clean up documents stuck in PROCESSING/FAILED from earlier broken pipeline
  const stuck = await prisma.document.deleteMany({
    where: { status: { in: ['PROCESSING', 'FAILED'] } },
  });
  if (stuck.count > 0) console.log(`  ↻ Removed ${stuck.count} stuck document record(s)\n`);

  for (const entry of MANIFEST) {
    await ingestDocument(entry, admin.id);
  }

  console.log('\n🏟  Seeding Club table from passwords sheet…');
  await seedClubs();

  // Summary
  const docCount = await prisma.document.count({ where: { status: 'PROCESSED' } });
  const chunkCount = await prisma.documentChunk.count();
  const embeddedCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM document_chunks WHERE embedding IS NOT NULL
  `;
  console.log(`\n✅ Done. ${docCount} documents · ${chunkCount} chunks · ${Number(embeddedCount[0].count)} embedded vectors.`);
}

main()
  .catch(err => {
    console.error('❌ Ingestion failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
