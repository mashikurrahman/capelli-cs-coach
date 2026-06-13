/**
 * Deterministic workflow + template matching for the Ticket Coach.
 * No AI / no network — pure keyword scoring against the workflow trigger
 * phrases and template keywords. Fast and fully predictable; the agent
 * always sees ranked suggestions and can override.
 */
import { DEFAULT_WORKFLOWS, type WorkflowDefinition } from './default-workflows';

export interface WorkflowMatch {
  workflow: WorkflowDefinition;
  score: number;
  matchedPhrases: string[];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function matchWorkflows(complaint: string, limit = 4): WorkflowMatch[] {
  const text = ' ' + normalize(complaint) + ' ';
  const results: WorkflowMatch[] = DEFAULT_WORKFLOWS.map(workflow => {
    const matchedPhrases: string[] = [];
    let score = 0;
    for (const phrase of workflow.triggerPhrases) {
      const p = normalize(phrase);
      if (!p) continue;
      if (text.includes(' ' + p + ' ') || text.includes(p)) {
        matchedPhrases.push(phrase);
        // Multi-word phrases are stronger signals than single keywords.
        score += Math.min(4, p.split(' ').length + 1);
      }
    }
    return { workflow, score, matchedPhrases };
  })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || a.workflow.sortOrder - b.workflow.sortOrder);

  return results.slice(0, limit);
}

export interface TemplateLite {
  id: string;
  name: string;
  category: string | null;
  keywords: string[];
  placeholders: string[];
  subject: string | null;
  body: string;
}

/**
 * Rank templates for a given complaint + (optional) chosen workflow,
 * by keyword overlap. Returns the best suggestions; the agent can still
 * search the full library.
 */
export function matchTemplates(
  complaint: string,
  workflow: WorkflowDefinition | null,
  templates: TemplateLite[],
  limit = 6
): TemplateLite[] {
  const hay = normalize(
    [complaint, workflow?.name, ...(workflow?.triggerPhrases ?? [])].filter(Boolean).join(' ')
  );

  const scored = templates.map(t => {
    let score = 0;
    for (const kw of t.keywords) {
      const k = normalize(kw);
      if (k && hay.includes(k)) score += Math.min(3, k.split(' ').length + 1);
    }
    // light boost if the template name words appear in the complaint
    for (const word of normalize(t.name).split(' ')) {
      if (word.length > 3 && hay.includes(word)) score += 1;
    }
    return { t, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.t);
}
