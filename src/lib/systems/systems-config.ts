/**
 * One-click systems launcher config. Each target either deep-links into the
 * real system (when its base URL is configured) or falls back to a copy-the-
 * lookup-value + instruction, so the launcher is useful even before the real
 * URLs/feeds are wired in.
 *
 * Configure via env (client-readable, so they must be NEXT_PUBLIC_*):
 *   NEXT_PUBLIC_BIGCOMMERCE_URL   e.g. https://store-xxxx.mybigcommerce.com/manage
 *   NEXT_PUBLIC_SAP_URL           web-SAP entry point, if any (often blank — SAP is desktop)
 *   NEXT_PUBLIC_ROLO_EMAIL        refunds queue address for the ROLO escalation mailto
 *   NEXT_PUBLIC_REFUND_CC         manager address to CC on refund escalations
 *   NEXT_PUBLIC_CLUB_STORE_URL    base team-store URL ({club} is replaced with the club name)
 */

export interface LaunchContext {
  orderNumber?: string;
  clubName?: string;
  /** Pre-built body for the ROLO refund mailto (the internal note). */
  noteBody?: string;
  ticketRef?: string;
}

export interface SystemResult {
  /** Open this URL in a new tab. */
  href?: string;
  /** When there's no URL: copy this value, then follow the hint. */
  copy?: string;
  /** Always-shown one-liner on what to do in this system. */
  hint: string;
  /** False when the target needs configuration/data we don't have yet. */
  configured: boolean;
}

export interface SystemTarget {
  id: string;
  label: string;
  /** Resolve the launch action for the given ticket context. */
  resolve: (ctx: LaunchContext) => SystemResult;
}

// NOTE: Next.js only inlines NEXT_PUBLIC_* vars into the client bundle via
// *static* property access — a dynamic process.env[key] resolves to undefined
// in the browser. So each var must be referenced literally here.
const CFG = {
  bigcommerce: (process.env.NEXT_PUBLIC_BIGCOMMERCE_URL ?? '').trim(),
  sap: (process.env.NEXT_PUBLIC_SAP_URL ?? '').trim(),
  roloEmail: (process.env.NEXT_PUBLIC_ROLO_EMAIL ?? '').trim(),
  refundCc: (process.env.NEXT_PUBLIC_REFUND_CC ?? '').trim(),
  clubStore: (process.env.NEXT_PUBLIC_CLUB_STORE_URL ?? '').trim(),
};

export const SYSTEM_TARGETS: SystemTarget[] = [
  {
    id: 'bigcommerce',
    label: 'BigCommerce',
    resolve: (ctx) => {
      const base = CFG.bigcommerce;
      if (base && ctx.orderNumber) {
        return {
          href: `${base.replace(/\/$/, '')}/orders?keyword=${encodeURIComponent(ctx.orderNumber)}`,
          hint: `Find order ${ctx.orderNumber} → check shipment / tracking.`,
          configured: true,
        };
      }
      if (base) return { href: base, hint: 'Open the order admin and search the order.', configured: true };
      return { copy: ctx.orderNumber, hint: 'Open BigCommerce and search the order number.', configured: false };
    },
  },
  {
    id: 'sap',
    label: 'SAP · VA05',
    resolve: (ctx) => {
      const base = CFG.sap;
      if (base) return { href: base, hint: 'Run VA05 → look up the order / delivery status.', configured: true };
      return { copy: ctx.orderNumber, hint: 'Open SAP → VA05, paste the order number, check delivery status.', configured: false };
    },
  },
  {
    id: 'rolo',
    label: 'Email ROLO (refund)',
    resolve: (ctx) => {
      const to = CFG.roloEmail;
      const cc = CFG.refundCc;
      const subject = `Refund request${ctx.orderNumber ? ` — order ${ctx.orderNumber}` : ''}${ctx.ticketRef ? ` (ticket ${ctx.ticketRef})` : ''}`;
      if (to) {
        const params = new URLSearchParams();
        if (cc) params.set('cc', cc);
        params.set('subject', subject);
        if (ctx.noteBody) params.set('body', ctx.noteBody);
        return { href: `mailto:${to}?${params.toString()}`, hint: 'Sends the refund request to ROLO with the order/ticket prefilled.', configured: true };
      }
      return { copy: subject, hint: 'Email the ROLO refunds queue (CC your manager) with the order # and ticket #.', configured: false };
    },
  },
  {
    id: 'club-store',
    label: 'Club team store',
    resolve: (ctx) => {
      const base = CFG.clubStore;
      if (base && ctx.clubName) {
        return { href: base.replace('{club}', encodeURIComponent(ctx.clubName)), hint: `Open ${ctx.clubName}'s store / player-link admin.`, configured: true };
      }
      return { copy: ctx.clubName, hint: 'Club-managed — look up this club\'s store; never share the club password.', configured: false };
    },
  },
];
