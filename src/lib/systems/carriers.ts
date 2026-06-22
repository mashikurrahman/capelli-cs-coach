/**
 * Carrier detection + public tracking URLs. Lets the Action Bar turn a raw
 * tracking number into a one-click "open the carrier with this number" link,
 * so the agent never has to guess the carrier or hand-type the number.
 *
 * These are public tracking endpoints (no auth, no internal data), so they work
 * out of the box — unlike the internal systems in systems-config.ts.
 */

export type Carrier = 'UPS' | 'USPS' | 'FedEx' | 'DHL' | 'unknown';

const RULES: { carrier: Carrier; re: RegExp }[] = [
  // UPS: 1Z + 16 alphanumerics
  { carrier: 'UPS', re: /^1Z[0-9A-Z]{16}$/i },
  // FedEx: 12 or 15 digits (also 20/22 for SmartPost handled by USPS below)
  { carrier: 'FedEx', re: /^\d{12}$|^\d{15}$/ },
  // USPS: 20–22 digits, or the 9-leading 22-digit IMpb format
  { carrier: 'USPS', re: /^(9\d{19,21}|\d{20,22})$/ },
  // DHL: 10 digits
  { carrier: 'DHL', re: /^\d{10}$/ },
];

export function detectCarrier(trackingRaw: string): Carrier {
  const t = (trackingRaw || '').replace(/[\s-]/g, '');
  if (!t) return 'unknown';
  for (const r of RULES) if (r.re.test(t)) return r.carrier;
  return 'unknown';
}

/** Public tracking URL for a number, or null if the carrier can't be inferred. */
export function trackingUrl(trackingRaw: string, carrier?: Carrier): string | null {
  const t = (trackingRaw || '').replace(/[\s-]/g, '');
  if (!t) return null;
  const c = carrier && carrier !== 'unknown' ? carrier : detectCarrier(t);
  switch (c) {
    case 'UPS': return `https://www.ups.com/track?tracknum=${encodeURIComponent(t)}`;
    case 'USPS': return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(t)}`;
    case 'FedEx': return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(t)}`;
    case 'DHL': return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(t)}`;
    default: return null;
  }
}
