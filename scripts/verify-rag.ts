/**
 * End-to-end RAG verification using the CURRENT provider stack
 * (Cloudflare embeddings + Groq/Cloudflare chat via src/lib/ai/providers).
 *
 * Run with: npx tsx scripts/verify-rag.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const envPath = path.resolve(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

import { embedText, generateText, resolveChatProvider, resolveEmbeddingProvider, getEmbeddingModel, getChatModel } from '../src/lib/ai/providers';

const prisma = new PrismaClient();

async function search(query: string) {
  const values = await embedText(query);
  const vec = `[${values.join(',')}]`;

  const rows = await prisma.$queryRaw<Array<{ title: string; section: string | null; sim: number; preview: string }>>`
    SELECT d.title, dc."sectionHeading" AS section,
           1 - (dc.embedding <=> ${vec}::vector) AS sim,
           LEFT(dc.content, 110) AS preview
    FROM document_chunks dc
    JOIN documents d ON d.id = dc."documentId"
    WHERE d.status = 'PROCESSED' AND dc.embedding IS NOT NULL AND dc."isSensitive" = false
    ORDER BY dc.embedding <=> ${vec}::vector
    LIMIT 4
  `;

  console.log(`\n"${query}"`);
  for (const row of rows) {
    console.log(`   ${(Number(row.sim) * 100).toFixed(1)}%  [${row.title}]${row.section ? ' § ' + row.section : ''}`);
    console.log(`         ${row.preview.replace(/\s+/g, ' ')}…`);
  }
}

async function main() {
  console.log(`Embedding provider: ${resolveEmbeddingProvider()} (${getEmbeddingModel()})`);
  console.log(`Chat provider:      ${resolveChatProvider()} (${getChatModel()})`);

  const stats = await prisma.$queryRaw<Array<{ total: bigint; embedded: bigint }>>`
    SELECT COUNT(*)::bigint AS total, COUNT(embedding)::bigint AS embedded FROM document_chunks
  `;
  console.log(`Chunks: ${Number(stats[0].embedded)}/${Number(stats[0].total)} embedded`);

  await search('customer wants to exchange a fleece hoodie for a different size');
  await search('customized jersey with player number 11 return');
  await search('order not shipped customer wants to change Youth Medium to Youth Large OBD wave');
  await search('item out of stock black hoodie youth large');

  const res = await generateText({
    prompt: 'Return ONLY this JSON and nothing else: {"status":"ok","model_works":true}',
    temperature: 0,
    maxOutputTokens: 100,
  });
  console.log('\nGeneration test:', res.trim().slice(0, 200));
}

main()
  .catch(err => { console.error('Verification failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
