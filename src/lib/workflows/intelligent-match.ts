/**
 * Intelligent understanding layer (server-only).
 *
 * For tricky / ambiguous / multi-issue complaints that keyword + embedding
 * matching can't confidently place, this asks the LLM to *decompose* the
 * message, extract concrete details, and choose the best-fitting workflow(s) —
 * constrained strictly to the real workflow list so it can never invent a
 * response. Returns null on any failure so callers fall back to the hybrid.
 */
import { generateJson } from '@/lib/ai/client';
import { DEFAULT_WORKFLOWS } from './default-workflows';
import { cleanComplaint } from '@/lib/text/clean-complaint';

export interface IntelligentResult {
  issues: string[];
  primary: string | null;
  secondary: string[];
  confidence: number;
  reasoning: string;
  extracted: {
    orderNumber?: string;
    size?: string;
    product?: string;
    clubName?: string;
    requestedResolution?: string;
  };
}

const VALID_IDS = new Set(DEFAULT_WORKFLOWS.map((w) => w.workflowId));

function catalog(): string {
  return DEFAULT_WORKFLOWS.map((w) => {
    const when = w.whenToUse?.[0] || w.triggerPhrases.slice(0, 5).join(', ');
    return `- ${w.workflowId}: ${w.name} — ${when}`;
  }).join('\n');
}

const SYSTEM = `You are the routing brain for Capelli Sport (a soccer team apparel company) Customer Service.
Capelli sells team kits/jerseys through password-protected club team stores and a parent site; orders go through BigCommerce/Shopify and SAP fulfillment (OBD/wave, FBB/FBPA).
Your job: read a customer message, understand the real intent even when it is messy, vague, emotional, or contains several issues at once, and route it to the best-fitting workflow(s).
Rules:
- Choose ONLY from the workflow IDs provided. NEVER invent an ID, a policy, or an email.
- A message can contain multiple issues. List each issue briefly; pick the single most important as "primary" and the rest as "secondary".
- Distinguish who is at fault: customer error (e.g. ordered wrong size) vs Capelli error (e.g. shipped wrong/defective) — they route to different workflows.
- Extract concrete details only if clearly present (order number, size, product, club/team, requested resolution). Leave a field out if not present.
- If truly nothing fits, set "primary" to null.
- Respond with ONLY valid JSON. No prose, no markdown.`;

export async function intelligentMatch(rawComplaint: string): Promise<IntelligentResult | null> {
  const complaint = cleanComplaint(rawComplaint);
  if (!complaint || complaint.length < 3) return null;

  const prompt = `Available workflows:
${catalog()}

Customer message:
"""
${complaint}
"""

Return JSON exactly in this shape:
{"issues":["short phrase per distinct issue"],"primary":"workflow_id_or_null","secondary":["workflow_id"],"confidence":0.0,"reasoning":"one short sentence","extracted":{"orderNumber":"","size":"","product":"","clubName":"","requestedResolution":""}}`;

  try {
    const r = await generateJson<Partial<IntelligentResult>>({
      system: SYSTEM,
      prompt,
      temperature: 0.1,
      maxOutputTokens: 600,
    });

    const primary = r.primary && VALID_IDS.has(r.primary) ? r.primary : null;
    const secondary = Array.isArray(r.secondary)
      ? r.secondary.filter((id) => typeof id === 'string' && VALID_IDS.has(id) && id !== primary)
      : [];

    const rawExtracted = (r.extracted ?? {}) as Record<string, unknown>;
    const extracted: IntelligentResult['extracted'] = {};
    for (const key of ['orderNumber', 'size', 'product', 'clubName', 'requestedResolution'] as const) {
      const v = rawExtracted[key];
      if (v && String(v).trim() && !/^(n\/?a|none|unknown|null)$/i.test(String(v).trim())) {
        extracted[key] = String(v).trim();
      }
    }

    return {
      issues: Array.isArray(r.issues) ? r.issues.filter((s) => typeof s === 'string' && s.trim()).slice(0, 4) : [],
      primary,
      secondary: secondary.slice(0, 3),
      confidence: typeof r.confidence === 'number' ? Math.max(0, Math.min(1, r.confidence)) : 0.5,
      reasoning: typeof r.reasoning === 'string' ? r.reasoning.trim().slice(0, 300) : '',
      extracted,
    };
  } catch {
    return null;
  }
}
