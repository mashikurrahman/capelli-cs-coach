/**
 * Seeds the resolved-ticket precedent bank (A2 + A4).
 *
 * Sources:
 *  - The WRITTEN exam questions already in the DB (complaint = prompt,
 *    handling = modelAnswer, category from the competency slot).
 *  - The LEARNED_PLAYBOOK bullets from src/lib/ai/prompts.ts.
 *
 * Each precedent is embedded (Cloudflare BGE) so a novel complaint can find its
 * nearest resolved examples. Dry-run by default; pass --commit to write.
 *
 *   npx tsx scripts/seed-precedents.ts            # parse + embed count, no write
 *   npx tsx scripts/seed-precedents.ts --commit   # replace + write to DB
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const envPath = path.resolve(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

import { embedTexts, getEmbeddingModel } from '../src/lib/ai/providers';
import { LEARNED_PLAYBOOK } from '../src/lib/ai/prompts';

const prisma = new PrismaClient();
const commit = process.argv.includes('--commit');

// Written competency slot (1..10) → best-fit issue category (enum value).
const SLOT_TO_CATEGORY: Record<number, string> = {
  1: 'TRACKING_NOT_MOVING',
  2: 'PROCESSING_TIME',
  3: 'DAMAGED_DEFECTIVE',
  4: 'RETURN_EXCHANGE',
  5: 'ORDER_CANCELLATION',
  6: 'INDIVIDUAL_ITEM_ORDERING',
  7: 'PLAYER_LINK',
  8: 'OUT_OF_STOCK',
  9: 'ESCALATION',
  10: 'GENERAL_INQUIRY',
};

interface Precedent {
  complaint: string;
  handling: string;
  category: string | null;
  competency: string | null;
  source: string;
  tags: string[];
}

async function fromExam(): Promise<Precedent[]> {
  const written = await prisma.examQuestion.findMany({
    where: { type: 'WRITTEN', isActive: true },
    select: { prompt: true, modelAnswer: true, competency: true, slot: true },
  });
  return written
    .filter((w) => w.modelAnswer && w.modelAnswer.trim().length > 0)
    .map((w) => ({
      complaint: w.prompt.trim(),
      handling: w.modelAnswer!.trim(),
      category: w.slot != null ? SLOT_TO_CATEGORY[w.slot] ?? null : null,
      competency: w.competency,
      source: 'exam',
      tags: [],
    }));
}

function fromPlaybook(): Precedent[] {
  // Each "- ..." bullet inside the playbook is one handling pattern.
  return LEARNED_PLAYBOOK.split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2).trim())
    .filter((l) => l.length > 40)
    .map((bullet) => ({
      // The bullet is the handling; use its opening clause as the "situation".
      complaint: bullet.split(/[.—]/)[0].trim().slice(0, 200),
      handling: bullet,
      category: null,
      competency: null,
      source: 'playbook',
      tags: [],
    }));
}

async function main() {
  const exam = await fromExam();
  const playbook = fromPlaybook();
  const all = [...exam, ...playbook];

  console.log(`Precedents: ${exam.length} from exam bank + ${playbook.length} from playbook = ${all.length}`);
  console.log(`Embedding model: ${getEmbeddingModel()}`);

  if (!commit) {
    console.log('\nDry run — pass --commit to embed + write. Sample:');
    for (const p of all.slice(0, 3)) console.log(`  • [${p.source}/${p.category ?? '—'}] ${p.complaint.slice(0, 80)}…`);
    return;
  }

  // Embed the complaint + handling together (best signal for semantic recall).
  const vectors = await embedTexts(all.map((p) => `${p.complaint}\n\n${p.handling}`));
  console.log(`Embedded ${vectors.length} precedents (dim ${vectors[0]?.length}).`);

  // Replace wholesale so the seed is idempotent.
  await prisma.ticketPrecedent.deleteMany({});
  for (let i = 0; i < all.length; i++) {
    const p = all[i];
    const created = await prisma.ticketPrecedent.create({
      data: {
        complaint: p.complaint,
        handling: p.handling,
        category: p.category as any,
        competency: p.competency,
        source: p.source,
        tags: p.tags,
      },
    });
    const vec = `[${vectors[i].join(',')}]`;
    await prisma.$executeRaw`UPDATE ticket_precedents SET embedding = ${vec}::vector WHERE id = ${created.id}`;
  }

  console.log(`Done. Wrote ${all.length} embedded precedents.`);
}

main()
  .catch((err) => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
