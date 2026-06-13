/**
 * Backfill embeddings for any document chunks missing a vector.
 * Paces requests to stay under the AI provider limit and retries on rate limits.
 * and retries on 429.
 *
 * Run with: npx tsx scripts/backfill-embeddings.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { embedTexts } from '../src/lib/ai/client';

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const prisma = new PrismaClient();
const BATCH_SIZE = 20;
const BATCH_PAUSE_MS = 15_000; // ~80 req/min, safely under the 100/min cap

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function embedBatchWithRetry(texts: string[], attempt = 1): Promise<number[][]> {
  try {
    return await embedTexts(texts);
  } catch (err) {
    const msg = (err as Error).message ?? '';
    if (msg.includes('429') && attempt <= 5) {
      console.log(`  …rate limited, waiting 65s (attempt ${attempt}/5)`);
      await sleep(65_000);
      return embedBatchWithRetry(texts, attempt + 1);
    }
    throw err;
  }
}

async function main() {
  const pending = await prisma.$queryRaw<Array<{ id: string; content: string }>>`
    SELECT id, content FROM document_chunks WHERE embedding IS NULL ORDER BY "documentId", "chunkIndex"
  `;
  console.log(`🔁 Backfilling embeddings for ${pending.length} chunks…`);

  let done = 0;
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const slice = pending.slice(i, i + BATCH_SIZE);
    const vectors = await embedBatchWithRetry(slice.map(c => c.content));
    for (let j = 0; j < vectors.length; j++) {
      const vec = `[${vectors[j].join(',')}]`;
      await prisma.$executeRaw`
        UPDATE document_chunks SET embedding = ${vec}::vector WHERE id = ${slice[j].id}
      `;
      done++;
    }
    console.log(`  ✓ ${done}/${pending.length}`);
    if (i + BATCH_SIZE < pending.length) await sleep(BATCH_PAUSE_MS);
  }

  const remaining = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM document_chunks WHERE embedding IS NULL
  `;
  console.log(`\n✅ Done. ${Number(remaining[0].count)} chunks still missing embeddings.`);
}

main()
  .catch(err => { console.error('❌ Backfill failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
