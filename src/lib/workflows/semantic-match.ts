/**
 * Semantic fallback for workflow matching (server-only).
 * Used only when keyword/trigger-phrase matching misses — embeds the complaint
 * with Cloudflare BGE and ranks the 30 workflows by cosine similarity.
 * Workflow embeddings are computed once and cached in memory.
 */
import { embedText, embedTexts } from '@/lib/ai/client';
import { DEFAULT_WORKFLOWS } from './default-workflows';

let cache: { ids: string[]; vectors: number[][] } | null = null;

function matchText(wf: (typeof DEFAULT_WORKFLOWS)[number]): string {
  // Include the humanized category — a strong, distinctive anchor (e.g.
  // "damaged defective") that sharpens semantic matches for paraphrases.
  const category = wf.category.replace(/_/g, ' ').toLowerCase();
  return [wf.name, category, ...wf.whenToUse, ...wf.triggerPhrases].join('. ');
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

async function ensureCache() {
  if (cache) return cache;
  const ids = DEFAULT_WORKFLOWS.map(w => w.workflowId);
  const vectors = await embedTexts(DEFAULT_WORKFLOWS.map(matchText));
  cache = { ids, vectors };
  return cache;
}

export async function semanticMatchWorkflows(
  complaint: string,
  limit = 4
): Promise<Array<{ workflowId: string; score: number }>> {
  const { ids, vectors } = await ensureCache();
  const q = await embedText(complaint);
  return ids
    .map((workflowId, i) => ({ workflowId, score: cosine(q, vectors[i]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
