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
Capelli sells team kits/jerseys through password-protected club team stores and a parent site; orders go through BigCommerce/Shopify and SAP fulfillment (OBD/wave). Fulfillment is FBB (Fulfilled By Bangladesh) or FBPA (Fulfilled By USA); all Shopify/cappellisport.com orders are FBPA.
Your job: read a customer message, understand the real intent even when it is messy, vague, emotional, or contains several issues at once, and route it to the best-fitting workflow(s).

Operating rules (learned from the CS team's own handling):
- Standard processing time for team orders is ~5 weeks. There is NO expedite/rush option — requests to speed up an order route to processing-time/order-status, not a special service.
- NO exchanges — wrong size/style the CUSTOMER ordered is handled as a return for refund (return policy), not an exchange.
- We CANNOT add items to an existing order — the customer must place a new order.
- A player number/name change requires the coach's confirmation; the order is put on hold (Operations) — it is an order change/adjustment, never an instant edit.
- Wrong item, defective, or decoration issues (logo/number/name wrong, peeling, falling off, blank/plain item) require an EVIDENCE PICTURE from the customer before action.
- Team-store passwords and player links are managed by the CLUB — direct the customer to their club administrator; we cannot create links from outside.
- Club-wide billing problems (e.g. a complimentary/free item was charged) are escalated to the internal team, not refunded on the spot.
- Distinguish fault: CUSTOMER error (ordered wrong size, selected "no" for a number, ordered a duplicate) vs CAPELLI error (shipped wrong/defective/mismatched) — they route to different workflows.

Routing rules:
- Choose ONLY from the workflow IDs provided. NEVER invent an ID, a policy, or an email.
- A message can contain multiple issues. List each issue briefly; pick the single most important as "primary" and the rest as "secondary".
- Extract concrete details only if clearly present (order number, size, product, club/team, requested resolution). Leave a field out if not present.
- If truly nothing fits, set "primary" to null.
- Respond with ONLY valid JSON. No prose, no markdown.`;

export async function intelligentMatch(rawComplaint: string): Promise<IntelligentResult | null> {
  const complaint = cleanComplaint(rawComplaint);
  if (!complaint || complaint.length < 3) return null;

  const prompt = `Available workflows:
${catalog()}

Worked examples (how the CS team routes — follow this reasoning):
1. "My kid grew so the shorts don't fit, and while you're at it add socks to the order." → {"issues":["customer ordered wrong size","wants to add an item"],"primary":"customer_wrong_size","secondary":["add_items"],"confidence":0.8,"reasoning":"Customer-fault size issue plus an add-on; we don't add to existing orders.","extracted":{"product":"shorts"}}
2. "You sent a red jersey but I ordered pink." → {"issues":["wrong item shipped"],"primary":"wrong_item_received","secondary":[],"confidence":0.9,"reasoning":"Capelli shipped the wrong item; needs an evidence picture.","extracted":{"product":"jersey"}}
3. "I registered late, can you rush my order so it's here for the tournament?" → {"issues":["wants to speed up the order"],"primary":"expedited_shipping","secondary":[],"confidence":0.85,"reasoning":"No expedite option; route to expedite/processing-time explanation.","extracted":{}}
4. "I need the player link for my son so he can order." → {"issues":["needs a player link"],"primary":"player_link","secondary":[],"confidence":0.85,"reasoning":"Player links are club-managed; refer to the club administrator.","extracted":{}}
5. "Paid weeks ago, nothing in my email, and I can't get into the Rush Maryland store." → {"issues":["order status unknown","can't access team store"],"primary":"order_status_eta","secondary":["team_store_password"],"confidence":0.7,"reasoning":"Two issues: order status plus club-managed store access.","extracted":{"clubName":"Rush Maryland"}}

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
