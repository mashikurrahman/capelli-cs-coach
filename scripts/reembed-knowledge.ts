/**
 * Re-embed ALL document chunks with the CURRENT embedding provider
 * (Cloudflare BGE via src/lib/ai/providers). Required after switching
 * embedding models, since vectors from a different model are incompatible.
 *
 * Run with: npx tsx scripts/reembed-knowledge.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const envPath = path.resolve(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

import { embedTexts, getEmbeddingModel, resolveEmbeddingProvider } from '../src/lib/ai/providers';

const prisma = new PrismaClient();
const BATCH_SIZE = 50;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`Re-embedding with ${resolveEmbeddingProvider()} (${getEmbeddingModel()})`);

  const chunks = await prisma.$queryRaw<Array<{ id: string; content: string }>>`
    SELECT id, content FROM document_chunks ORDER BY "documentId", "chunkIndex"
  `;
  console.log(`Total chunks: ${chunks.length}`);

  let done = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const slice = chunks.slice(i, i + BATCH_SIZE);
    const vectors = await embedTexts(slice.map(c => c.content));
    if (i === 0) console.log(`Embedding dimension: ${vectors[0]?.length}`);

    for (let j = 0; j < vectors.length; j++) {
      const vec = `[${vectors[j].join(',')}]`;
      await prisma.$executeRaw`UPDATE document_chunks SET embedding = ${vec}::vector WHERE id = ${slice[j].id}`;
      done++;
    }
    console.log(`  ${done}/${chunks.length}`);
    if (i + BATCH_SIZE < chunks.length) await sleep(300);
  }

  console.log(`Done. Re-embedded ${done} chunks.`);
}

main()
  .catch(err => { console.error('Re-embed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
