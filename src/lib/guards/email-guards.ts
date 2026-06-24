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
  // Internal shorthand seen in real Zendesk internal notes — must never go out.
  { re: /\bRO\s*#?\s*\d{3,}\b/i, label: 'Mentions an internal RO (replacement order) number' },
  { re: /\bOBD\b/, label: 'Mentions OBD (internal fulfillment code)' },
  { re: /\bWave\s*[#-]?\s*\d{3,}\b/i, label: 'Mentions an internal Wave number' },
  { re: /\bemailed\s+(DM|GT|RI|RN|BD|Dan|Roy|Hani|SH|operations|planning)\b/i, label: 'Contains an internal escalation note (emailed DM/GT/Dan/…)' },
  { re: /\b(do not respond|don'?t respond)\b/i, label: 'Contains an internal "do not respond" instruction' },
  { re: /\bawaiting\s+(BD'?s?|DM'?s?)\s+approval\b/i, label: 'Mentions internal approval (BD/DM)' },
];

/**
 * Pre-send DRAFT-QUALITY guard. Catches the costly handling mistakes seen across
 * ~70 real Capelli tickets — promising things the policy doesn't allow — directly
 * in the outgoing wording. Advisory only (never blocks copy): it coaches the
 * agent before the customer gets a promise we can't keep.
 *
 * Each rule fires only on an AFFIRMATIVE construction and is suppressed when the
 * correct policy phrasing ("we do not offer…") is present, to avoid nagging on
 * emails that are already right.
 */
const QUALITY_RULES: { re: RegExp; unless?: RegExp; label: string }[] = [
  {
    re: /\bexchange (it|them|this|that|the item|your)\b/i,
    unless: /\b(no exchange|don'?t offer exchange|do not offer exchange|cannot exchange|can'?t exchange|return (?:it )?for (?:a )?refund)\b/i,
    label: 'Looks like it offers an exchange — policy is no exchanges (return for refund + new order)',
  },
  {
    re: /\b(we (?:can|will|'ll|are able to)\s+(?:expedite|rush|overnight)|(?:expedite|rush)\s+(?:your|the|this)\s+(?:order|shipment|shipping))\b/i,
    unless: /\b(do not|don'?t|cannot|can'?t|unable to|no)\s+(?:offer\s+)?(?:expedite|expedited|rush)\b/i,
    label: 'Looks like it promises expedited/rush shipping — we do not offer expedited shipping',
  },
  {
    re: /\b(will (?:arrive|be delivered|be there)|delivered by|arrive by|arrive on|guaranteed? (?:to|by)|guarantee delivery)\b/i,
    label: 'Promises a specific delivery date/guarantee — give the standard timeline + tracking instead',
  },
  {
    re: /\b(replacement|replace|reship|send (?:you )?a new)\b[^.]{0,60}\b(different|larger|bigger|smaller) size\b/i,
    label: 'Offers a replacement in a different size — replacements are same-size only (size change = return + new order)',
  },
  {
    re: /\b(different|larger|bigger|smaller) size\b[^.]{0,40}\b(replacement|replace|reship)\b/i,
    label: 'Offers a replacement in a different size — replacements are same-size only (size change = return + new order)',
  },
];

/**
 * Advisory quality scan of an outgoing customer email. Returns warn-level
 * findings for policy-risky promises; never returns 'block'.
 */
export function scanQuality(text: string): ScanResult {
  const t = text || '';
  const findings: ScanResult['findings'] = [];
  const seen = new Set<string>();
  for (const r of QUALITY_RULES) {
    if (!r.re.test(t)) continue;
    if (r.unless && r.unless.test(t)) continue;
    if (seen.has(r.label)) continue;
    seen.add(r.label);
    findings.push({ level: 'warn', label: r.label });
  }
  return { level: findings.length ? 'warn' : 'ok', findings };
}

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
