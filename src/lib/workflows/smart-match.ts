/**
 * Smart matcher: the single entry point the Ticket Coach calls.
 *
 * 1. Run the fast hybrid (keyword + embedding) matcher.
 * 2. If it's confident, return it as-is (no AI cost/latency).
 * 3. If it's uncertain or the message looks tricky/multi-issue, bring in the
 *    intelligent LLM layer to decompose + route, and merge its picks on top.
 *
 * Always degrades to the hybrid result if the LLM is unavailable.
 */
import { hybridMatchWorkflows } from './hybrid-match';
import { intelligentMatch } from './intelligent-match';
import { DEFAULT_WORKFLOWS } from './default-workflows';

export interface SmartMatchItem {
  workflowId: string;
  name: string;
  category: string;
  score: number;
  matchedPhrases: string[];
  method: 'both' | 'keyword' | 'semantic' | 'ai';
}

export interface SmartResult {
  matches: SmartMatchItem[];
  analysis?: {
    issues: string[];
    reasoning: string;
    extracted: Record<string, string>;
  };
}

function meta(id: string) {
  const w = DEFAULT_WORKFLOWS.find((x) => x.workflowId === id);
  return w ? { name: w.name, category: w.category } : null;
}

export async function smartMatchWorkflows(complaint: string, limit = 4): Promise<SmartResult> {
  const hybrid = await hybridMatchWorkflows(complaint, 6);
  const top = hybrid[0];
  const second = hybrid[1];

  // Confident when the leader is strong and clearly ahead of the runner-up.
  const confident = !!top && top.score >= 0.6 && (!second || top.score - second.score >= 0.2);
  const longEnough = complaint.trim().length >= 12;

  // Fast path: trust the hybrid, skip the LLM entirely.
  if (confident || !longEnough) {
    return { matches: hybrid.slice(0, limit) };
  }

  // Tricky path: let the brain decompose and route.
  const ai = await intelligentMatch(complaint);
  if (!ai || (!ai.primary && ai.secondary.length === 0)) {
    return { matches: hybrid.slice(0, limit) };
  }

  const hybridById = new Map(hybrid.map((h) => [h.workflowId, h]));
  const order: string[] = [];
  if (ai.primary) order.push(ai.primary);
  for (const id of ai.secondary) if (!order.includes(id)) order.push(id);
  for (const h of hybrid) if (!order.includes(h.workflowId)) order.push(h.workflowId);

  const aiIds = new Set([ai.primary, ...ai.secondary].filter(Boolean) as string[]);

  const matches: SmartMatchItem[] = order
    .map((id, i) => {
      const m = meta(id);
      if (!m) return null;
      const h = hybridById.get(id);
      const isAI = aiIds.has(id);
      return {
        workflowId: id,
        name: m.name,
        category: m.category,
        // Lead AI pick gets a confident score; others keep their hybrid score.
        score: i === 0 && isAI ? Math.max(top?.score ?? 0, 0.85) : (h?.score ?? 0.45),
        matchedPhrases: h?.matchedPhrases ?? [],
        method: isAI ? 'ai' : (h?.method ?? 'ai'),
      } as SmartMatchItem;
    })
    .filter((x): x is SmartMatchItem => x !== null)
    .slice(0, limit);

  return {
    matches,
    analysis: { issues: ai.issues, reasoning: ai.reasoning, extracted: ai.extracted },
  };
}
