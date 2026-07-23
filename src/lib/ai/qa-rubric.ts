/**
 * A1 — Automated QA rubric.
 *
 * Scores a handled ticket session against the same failure modes the guardrails
 * enforce, so a reviewer gets an AI pre-screen (scores + risk flags) to confirm
 * or adjust rather than starting from a blank form. The human still owns the
 * saved review.
 */
import { generateJson } from './client';
import { SYSTEM_IDENTITY, LEARNED_PLAYBOOK } from './prompts';

export interface QaRubricInput {
  complaint: string;
  workflowName?: string | null;
  primaryIssue?: string | null;
  customerEmail?: string | null; // the drafted customer-facing email
  internalNote?: string | null;
  agentNotes?: string | null;
}

export type QaStatus = 'APPROVED' | 'NEEDS_REVISION' | 'FLAGGED';
export type QaRisk = 'low' | 'medium' | 'high';

export interface QaRubricResult {
  scores: { accuracy: number; policy: number; tone: number; completeness: number; zendesk: number };
  overall: number;
  riskLevel: QaRisk;
  suggestedStatus: QaStatus;
  issues: string[];
  summary: string;
}

const DIMENSIONS = `Score each dimension 0–100 (100 = flawless, 80 = solid, 60 = borderline, below 50 = a real problem):
- accuracy: was the right issue identified and the right workflow/route chosen for this complaint?
- policy: does the handling respect the guardrails? Penalise hard for: promising an ETA/delivery date, offering an exchange (policy is return-for-refund + new order), issuing a replacement without a required evidence photo, replacing in a different size, sharing an RO number / club password / internal contact with the customer, promising a change/cancel before checking OBD/Wave, blind-reshipping a wrong-club decoration.
- tone: professional, empathetic, acknowledges the SPECIFIC failure rather than a generic apology; no over-promising.
- completeness: requests the missing info/photos it needs, sets the right expectation, includes a follow-up/next step.
- zendesk: internal note is complete (issue, systems checked, policy, actions, next step), status is sensible, nothing left blank.`;

export async function scoreTicketQuality(input: QaRubricInput): Promise<QaRubricResult> {
  const prompt = `${SYSTEM_IDENTITY}

${LEARNED_PLAYBOOK}

You are acting as a QA reviewer. Grade how well the agent handled this ticket.

[TICKET]
Customer complaint: "${input.complaint}"
Identified issue: ${input.primaryIssue || 'not recorded'}
Workflow used: ${input.workflowName || 'not recorded'}
Agent notes: ${input.agentNotes || 'none'}

[CUSTOMER-FACING EMAIL DRAFT]
${input.customerEmail?.trim() || '(no email was drafted for this session)'}

[INTERNAL ZENDESK NOTE]
${input.internalNote?.trim() || '(no internal note was drafted for this session)'}

[RUBRIC]
${DIMENSIONS}

If no email/note was drafted, judge accuracy + policy from the routing and note that drafts were missing under completeness/zendesk (do not invent content).

Return ONLY valid JSON, no markdown:
{
  "scores": { "accuracy": <0-100>, "policy": <0-100>, "tone": <0-100>, "completeness": <0-100>, "zendesk": <0-100> },
  "overall": <0-100 overall quality>,
  "riskLevel": "low" | "medium" | "high",
  "suggestedStatus": "APPROVED" | "NEEDS_REVISION" | "FLAGGED",
  "issues": ["<specific, concrete problems found — empty array if none>"],
  "summary": "<1-2 sentence QA verdict>"
}

Guidance: FLAGGED + high risk when a guardrail was broken (e.g. promised ETA, shared internal info, offered exchange). NEEDS_REVISION for missing info/weak tone. APPROVED only when it's genuinely send-ready.`;

  const raw = await generateJson<Partial<QaRubricResult>>({
    prompt,
    temperature: 0.1,
    maxOutputTokens: 900,
  });

  return normalize(raw);
}

const clamp = (n: unknown): number => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
};

function normalize(raw: Partial<QaRubricResult>): QaRubricResult {
  const s = raw.scores ?? ({} as any);
  const scores = {
    accuracy: clamp(s.accuracy),
    policy: clamp(s.policy),
    tone: clamp(s.tone),
    completeness: clamp(s.completeness),
    zendesk: clamp(s.zendesk),
  };
  const avg = Math.round((scores.accuracy + scores.policy + scores.tone + scores.completeness + scores.zendesk) / 5);
  const overall = raw.overall != null ? clamp(raw.overall) : avg;

  const risk: QaRisk = raw.riskLevel === 'high' || raw.riskLevel === 'medium' || raw.riskLevel === 'low' ? raw.riskLevel : 'low';
  const status: QaStatus =
    raw.suggestedStatus === 'APPROVED' || raw.suggestedStatus === 'NEEDS_REVISION' || raw.suggestedStatus === 'FLAGGED'
      ? raw.suggestedStatus
      : overall >= 85 ? 'APPROVED' : overall >= 60 ? 'NEEDS_REVISION' : 'FLAGGED';

  return {
    scores,
    overall,
    riskLevel: risk,
    suggestedStatus: status,
    issues: Array.isArray(raw.issues) ? raw.issues.filter((x): x is string => typeof x === 'string').slice(0, 12) : [],
    summary: typeof raw.summary === 'string' ? raw.summary : '',
  };
}
