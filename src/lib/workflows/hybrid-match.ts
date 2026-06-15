/**
 * Hybrid workflow matching (server-only): blends the deterministic keyword
 * matcher with semantic (embedding) similarity, on a cleaned complaint.
 *
 * Why blend: keyword matching is precise but brittle (misses paraphrases /
 * synonyms / typos); embeddings are fuzzy but robust. Together they beat either
 * alone. Scores are min-max normalized per query before blending so neither
 * signal dominates — important because BGE cosine has a high baseline.
 *
 * Resilient: if embeddings are unavailable, it degrades to pure keyword.
 */
import { matchWorkflows } from './match';
import { semanticMatchWorkflows } from './semantic-match';
import { DEFAULT_WORKFLOWS } from './default-workflows';
import { cleanComplaint } from '@/lib/text/clean-complaint';

export interface HybridMatch {
  workflowId: string;
  name: string;
  category: string;
  score: number;            // 0..1 blended
  matchedPhrases: string[];
  method: 'both' | 'keyword' | 'semantic';
}

const W_KEYWORD = 0.5;
const W_SEMANTIC = 0.5;

function minMax(values: number[]): (v: number) => number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  return (v: number) => (span > 0 ? (v - min) / span : (max > 0 ? 1 : 0));
}

export async function hybridMatchWorkflows(rawComplaint: string, limit = 4): Promise<HybridMatch[]> {
  const complaint = cleanComplaint(rawComplaint);

  // Keyword scores for all workflows.
  const lexical = matchWorkflows(complaint, DEFAULT_WORKFLOWS.length);
  const lexById = new Map(lexical.map((l) => [l.workflow.workflowId, l]));
  const normLex = minMax(DEFAULT_WORKFLOWS.map((w) => lexById.get(w.workflowId)?.score ?? 0));

  // Semantic scores (best-effort).
  let semById = new Map<string, number>();
  try {
    const semantic = await semanticMatchWorkflows(complaint, DEFAULT_WORKFLOWS.length);
    semById = new Map(semantic.map((s) => [s.workflowId, s.score]));
  } catch {
    semById = new Map();
  }
  const haveSemantic = semById.size > 0;
  const normSem = minMax(DEFAULT_WORKFLOWS.map((w) => semById.get(w.workflowId) ?? 0));

  const results: HybridMatch[] = DEFAULT_WORKFLOWS.map((wf) => {
    const lex = lexById.get(wf.workflowId);
    const lexNorm = normLex(lex?.score ?? 0);
    const semNorm = haveSemantic ? normSem(semById.get(wf.workflowId) ?? 0) : 0;

    // When there's no semantic signal, lean fully on keyword.
    const score = haveSemantic ? W_KEYWORD * lexNorm + W_SEMANTIC * semNorm : lexNorm;

    const hasLex = (lex?.score ?? 0) > 0;
    const hasSem = haveSemantic && (semById.get(wf.workflowId) ?? 0) > 0;
    const method: HybridMatch['method'] = hasLex && hasSem ? 'both' : hasLex ? 'keyword' : 'semantic';

    return {
      workflowId: wf.workflowId,
      name: wf.name,
      category: wf.category,
      score,
      matchedPhrases: lex?.matchedPhrases ?? [],
      method,
    };
  })
    .filter((r) => r.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}
