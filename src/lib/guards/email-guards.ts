/**
 * Pre-send guardrails for customer emails — catch the costly mistakes before
 * the agent copies the reply:
 *  - leaking internal/sensitive data (club passwords, RO numbers, internal
 *    jargon/teams that must never go to a customer), and
 *  - silently changing the standard wording of a verbatim template.
 */

export type ScanLevel = 'ok' | 'warn' | 'block';

export interface ScanResult {
  level: ScanLevel;
  /** Human-readable reasons, most severe first. */
  findings: { level: 'warn' | 'block'; label: string }[];
}

// High-precision "never send this to a customer" patterns.
const BLOCK_RULES: { re: RegExp; label: string }[] = [
  { re: /\bRO[\s#:-]?\d{3,}\b/i, label: 'Looks like an internal RO number' },
  { re: /\b(pass(?:word|code)|store\s*(?:password|code))\b\s*(?:is|:|=|->|→)?\s*\S{3,}/i, label: 'Looks like a club/store password is being shared' },
  { re: /\b(the\s+(?:password|code)\s+(?:is|=|:)\s*\S+)/i, label: 'A password/code value is present' },
];

// Internal-only terms/teams that shouldn't appear in a customer-facing email.
const WARN_RULES: { re: RegExp; label: string }[] = [
  { re: /\bROLO\b/i, label: 'Mentions ROLO (internal refunds team)' },
  { re: /\bVA05\b/i, label: 'Mentions VA05 (internal SAP transaction)' },
  { re: /\b(FBB|FBPA)\b/, label: 'Mentions FBB/FBPA (internal fulfillment code)' },
  { re: /\bFBB master(?:\s*list)?\b/i, label: 'Mentions the FBB master list (internal)' },
  { re: /\binternal note\b/i, label: 'Mentions an internal note' },
  { re: /\bSAP\b/, label: 'Mentions SAP (internal system)' },
  { re: /\bBigCommerce\b/i, label: 'Mentions BigCommerce (internal system)' },
];

export function scanSensitive(text: string): ScanResult {
  const t = text || '';
  const findings: ScanResult['findings'] = [];
  for (const r of BLOCK_RULES) if (r.re.test(t)) findings.push({ level: 'block', label: r.label });
  for (const r of WARN_RULES) if (r.re.test(t)) findings.push({ level: 'warn', label: r.label });
  const level: ScanLevel = findings.some(f => f.level === 'block') ? 'block'
    : findings.length ? 'warn' : 'ok';
  return { level, findings };
}

/**
 * Detects whether a (possibly hand-edited) email still matches the template's
 * fixed wording. Splits the template on [placeholders] and confirms each
 * non-trivial literal chunk still appears, in order, in the final text.
 */
export function detectTampering(templateBody: string, finalText: string): { tampered: boolean; missing: string[] } {
  if (!templateBody) return { tampered: false, missing: [] };
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const hay = norm(finalText);
  const chunks = templateBody
    .split(/\[[^\]]+\]/)
    .map(c => norm(c))
    .filter(c => c.length >= 12); // ignore tiny/punctuation-only fragments

  const missing: string[] = [];
  let from = 0;
  for (const chunk of chunks) {
    const idx = hay.indexOf(chunk, from);
    if (idx === -1) {
      // try anywhere (order may shift slightly) before declaring it changed
      if (hay.indexOf(chunk) === -1) missing.push(chunk.slice(0, 40));
    } else {
      from = idx + chunk.length;
    }
  }
  return { tampered: missing.length > 0, missing };
}
