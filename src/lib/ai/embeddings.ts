import { gemini, EMBEDDING_MODEL } from './client';
import { prisma } from '@/lib/db/prisma';
import type { KBSearchResult } from '@/types';

export async function embed(text: string): Promise<number[]> {
  const model = gemini.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text.replace(/\n+/g, ' ').slice(0, 8000));
  return result.embedding.values;
}

export async function storeEmbedding(chunkId: string, embedding: number[]): Promise<void> {
  const vec = `[${embedding.join(',')}]`;
  await prisma.$executeRaw`
    UPDATE document_chunks
    SET embedding = ${vec}::vector
    WHERE id = ${chunkId}
  `;
}

export async function semanticSearch(
  query: string,
  topK = 8,
  minScore = 0.3,
  excludeSensitive = true
): Promise<KBSearchResult[]> {
  let queryEmbedding: number[];
  try {
    queryEmbedding = await embed(query);
  } catch {
    return [];
  }

  const vec = `[${queryEmbedding.join(',')}]`;

  try {
    const rows = await prisma.$queryRaw<Array<{
      id: string;
      document_id: string;
      document_title: string;
      doc_category: string;
      content: string;
      section_heading: string | null;
      page_number: number | null;
      is_sensitive: boolean;
      similarity: number;
    }>>`
      SELECT
        dc.id,
        dc."documentId" AS document_id,
        d.title AS document_title,
        d.category::text AS doc_category,
        dc.content,
        dc."sectionHeading" AS section_heading,
        dc."pageNumber" AS page_number,
        dc."isSensitive" AS is_sensitive,
        1 - (dc.embedding <=> ${vec}::vector) AS similarity
      FROM document_chunks dc
      JOIN documents d ON d.id = dc."documentId"
      WHERE d.status = 'PROCESSED'
        AND dc.embedding IS NOT NULL
        ${excludeSensitive ? prisma.$queryRaw`AND dc."isSensitive" = false` : prisma.$queryRaw``}
        AND 1 - (dc.embedding <=> ${vec}::vector) > ${minScore}
      ORDER BY similarity DESC
      LIMIT ${topK}
    `;

    return rows.map(r => ({
      chunkId: r.id,
      documentId: r.document_id,
      documentTitle: r.document_title,
      documentCategory: r.doc_category,
      content: r.content,
      sectionHeading: r.section_heading,
      pageNumber: r.page_number,
      similarity: Number(r.similarity),
      isSensitive: r.is_sensitive,
    }));
  } catch {
    // pgvector not available — fallback to keyword search
    return keywordSearch(query, topK);
  }
}

async function keywordSearch(query: string, topK: number): Promise<KBSearchResult[]> {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (words.length === 0) return [];

  const chunks = await prisma.documentChunk.findMany({
    where: {
      isSensitive: false,
      document: { status: 'PROCESSED' },
      OR: words.map(w => ({ content: { contains: w, mode: 'insensitive' as const } })),
    },
    include: { document: { select: { title: true, category: true } } },
    take: topK,
  });

  return chunks.map(c => ({
    chunkId: c.id,
    documentId: c.documentId,
    documentTitle: c.document.title,
    documentCategory: c.document.category,
    content: c.content,
    sectionHeading: c.sectionHeading,
    pageNumber: c.pageNumber,
    similarity: 0.5,
    isSensitive: c.isSensitive,
  }));
}

export function buildContext(results: KBSearchResult[]): string {
  if (results.length === 0) return '';
  return results.map((r, i) => {
    const loc = [
      r.documentTitle,
      r.sectionHeading && `§ ${r.sectionHeading}`,
      r.pageNumber && `p.${r.pageNumber}`,
    ].filter(Boolean).join(' › ');
    return `[Source ${i + 1}: ${loc}]\n${r.content}`;
  }).join('\n\n---\n\n');
}
