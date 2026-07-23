import { Prisma } from '@prisma/client';
import { embedText } from './client';
import { prisma } from '@/lib/db/prisma';

// A2 + A4 — search the embedded resolved-ticket precedent bank.

export interface PrecedentHit {
  id: string;
  complaint: string;
  handling: string;
  category: string | null;
  competency: string | null;
  source: string;
  similarity: number;
}

/**
 * Nearest resolved precedents for a complaint. Accepts an optional pre-computed
 * query embedding so callers (e.g. the analyzer, which already embeds the query
 * for KB search) don't pay for a second embedding.
 */
export async function searchPrecedents(
  query: string,
  topK = 3,
  minScore = 0.35,
  queryEmbedding?: number[],
): Promise<PrecedentHit[]> {
  let vec = queryEmbedding;
  if (!vec) {
    try { vec = await embedText(query); } catch { return []; }
  }
  const literal = `[${vec.join(',')}]`;

  try {
    const rows = await prisma.$queryRaw<Array<{
      id: string; complaint: string; handling: string;
      category: string | null; competency: string | null; source: string; similarity: number;
    }>>`
      SELECT id, complaint, handling, category::text AS category, competency, source,
             1 - (embedding <=> ${literal}::vector) AS similarity
      FROM ticket_precedents
      WHERE "isActive" = true AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${literal}::vector) > ${minScore}
      ORDER BY similarity DESC
      LIMIT ${topK}
    `;
    return rows.map((r) => ({ ...r, similarity: Number(r.similarity) }));
  } catch {
    return [];
  }
}

/** Compact, citable block for the analyzer prompt. */
export function buildPrecedentContext(hits: PrecedentHit[], maxCharsPerHit = 320): string {
  if (hits.length === 0) return '';
  const body = hits.map((h, i) => {
    const handling = h.handling.length > maxCharsPerHit ? h.handling.slice(0, maxCharsPerHit).trimEnd() + '…' : h.handling;
    return `[Precedent ${i + 1}${h.category ? ` · ${h.category}` : ''}] Situation: ${h.complaint.slice(0, 160)}\nHow the team handles it: ${handling}`;
  }).join('\n\n');
  return `[SIMILAR RESOLVED TICKETS — how experienced agents have handled close cases]\n${body}\n[END SIMILAR RESOLVED TICKETS]`;
}
