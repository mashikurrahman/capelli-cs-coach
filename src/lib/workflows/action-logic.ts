/**
 * Action-bar logic — the lookups/decisions the Action Bar makes *for* the agent
 * so they act instead of calculating:
 *  - the 5-week processing clock (order age → the correct status answer),
 *  - change/cancel eligibility (is it still possible, or locked?),
 *  - a standard internal-note draft (kept separate from the customer email).
 *
 * All pure functions — no network, no DOM — so they're trivially testable and
 * safe to run on the client.
 */
import type { DecisionHint } from '@/lib/workflows/decision-hints';

/** Capelli standard processing window. */
export const PROCESSING_WEEKS = 5;
const MS_PER_DAY = 86_400_000;

export type ClockState = 'in-window' | 'due-soon' | 'overdue' | 'future' | 'invalid';

export interface ProcessingClock {
  state: ClockState;
  days: number;
  weeks: number;
  /** Whole weeks remaining until the 5-week mark (0 when past). */
  weeksLeft: number;
  /** One-line recommendation the agent can act on. */
  recommendation: string;
}

/** Days between an order date and "now" (date-only, local). */
export function processingClock(orderDateISO: string, now: Date = new Date()): ProcessingClock {
  if (!orderDateISO) return { state: 'invalid', days: 0, weeks: 0, weeksLeft: PROCESSING_WEEKS, recommendation: 'Enter the order date to check the 5-week clock.' };
  const start = new Date(orderDateISO + 'T00:00:00');
  if (Number.isNaN(start.getTime())) return { state: 'invalid', days: 0, weeks: 0, weeksLeft: PROCESSING_WEEKS, recommendation: 'Order date not recognised.' };

  const days = Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY);
  const weeks = Math.max(0, Math.floor(days / 7));
  const weeksLeft = Math.max(0, PROCESSING_WEEKS - weeks);

  if (days < 0) return { state: 'future', days, weeks: 0, weeksLeft: PROCESSING_WEEKS, recommendation: 'Order date is in the future — double-check it.' };
  if (days >= PROCESSING_WEEKS * 7) {
    return { state: 'overdue', days, weeks, weeksLeft: 0,
      recommendation: `Past the ${PROCESSING_WEEKS}-week window (week ${weeks}). If still not shipped, check tracking and escalate rather than quoting more processing time.` };
  }
  if (weeksLeft <= 1) {
    return { state: 'due-soon', days, weeks, weeksLeft,
      recommendation: `Week ${weeks} of ${PROCESSING_WEEKS} — nearly due. Reassure it's almost out of processing; confirm tracking before promising a date.` };
  }
  return { state: 'in-window', days, weeks, weeksLeft,
    recommendation: `Within processing — week ${weeks} of ${PROCESSING_WEEKS} (~${weeksLeft} weeks left). Quote the standard ${PROCESSING_WEEKS}-week timeline; do not promise expedite.` };
}

export type Eligibility = 'allowed' | 'conditional' | 'blocked' | 'n/a';

export interface EligibilityResult {
  eligibility: Eligibility;
  title: string;
  detail: string;
}

/**
 * Whether the requested change/cancel is still possible for this workflow,
 * factoring in the processing clock. Mirrors the rules the trainer taught.
 */
export function changeEligibility(workflowId: string, clock?: ProcessingClock): EligibilityResult | null {
  switch (workflowId) {
    case 'add_items':
      return { eligibility: 'blocked', title: 'Adding items is not possible',
        detail: 'We cannot add to an existing order. Send the template asking them to place a new order.' };

    case 'order_change': {
      // Number/size change: needs coach confirmation AND order not yet in production.
      const late = clock && (clock.state === 'overdue' || clock.weeks >= 3);
      return { eligibility: 'conditional', title: 'Change only with coach confirmation',
        detail: late
          ? 'Likely already in production — verify in SAP before promising anything. If in production, the change cannot be made.'
          : 'Verify the order is not in production, put it on hold (email Ops), and ask the customer to CC their coach to confirm.' };
    }

    case 'order_cancellation': {
      const late = clock && (clock.state === 'overdue' || clock.weeks >= 3);
      return { eligibility: 'conditional', title: 'Cancel only if not fulfilled/delivered',
        detail: late
          ? 'Past several weeks — confirm it is NOT in the FBB list and NOT delivered in SAP before cancelling. If shipped, route to returns instead.'
          : 'Confirm it is not in the FBB list and not delivered in SAP, cancel on BigCommerce, then email ROLO for the refund (CC manager + ticket #).' };
    }

    case 'replacement_order':
      return { eligibility: 'allowed', title: 'Replacement allowed (Capelli error)',
        detail: 'Create a replacement order on BigCommerce to the same address; note the replacement # next to the original. Keep Open until it ships.' };

    case 'return_exchange':
      return { eligibility: 'blocked', title: 'No exchanges',
        detail: 'We do not exchange. Send the return policy — the customer returns for a refund and reorders the correct item.' };

    default:
      return null;
  }
}

export interface NoteContext {
  workflowName: string;
  workflowId: string;
  hint?: DecisionHint;
  orderNumber?: string;
  clubName?: string;
  complaint?: string;
  clock?: ProcessingClock;
}

const FAULT_LABEL: Record<string, string> = { capelli: 'Capelli error', customer: 'Customer error', none: '—' };

/**
 * Builds a standard *internal* note (never the customer reply). Captures status,
 * fault, escalation, fulfillment and the key next step so the ticket is closed
 * the way the team expects — and so the leak-guard never lets it mix into an email.
 */
export function buildInternalNote(ctx: NoteContext): string {
  const { hint } = ctx;
  const lines: string[] = [];
  lines.push(`[Internal] ${ctx.workflowName}`);
  if (ctx.orderNumber) lines.push(`Order: ${ctx.orderNumber}`);
  if (ctx.clubName) lines.push(`Club: ${ctx.clubName}`);
  if (hint?.fulfillment && hint.fulfillment !== 'unknown') {
    lines.push(`Fulfillment: ${hint.fulfillment} (${hint.fulfillment === 'FBB' ? 'Bangladesh' : 'USA'})`);
  }
  if (hint?.fault && hint.fault !== 'none') lines.push(`Fault: ${FAULT_LABEL[hint.fault]}`);
  if (hint?.status) lines.push(`Status set: ${hint.status}`);
  if (hint?.escalateTo) lines.push(`Escalated to: ${hint.escalateTo}`);
  if (hint?.requiresEvidencePicture) lines.push('Evidence picture requested from customer.');

  const next = hint?.notes?.[0];
  if (next) lines.push(`Action / next step: ${next}`);
  if (ctx.clock && (ctx.clock.state === 'overdue' || ctx.clock.state === 'in-window' || ctx.clock.state === 'due-soon')) {
    lines.push(`Order age: week ${ctx.clock.weeks} of ${PROCESSING_WEEKS}.`);
  }
  return lines.join('\n');
}
