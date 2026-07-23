/**
 * Certification-exam assembly + scoring rules.
 *
 * Delivery = randomized balanced bank:
 *  - Section A: one WRITTEN question per competency slot (1..10), chosen at
 *    random among that slot's variants → a balanced 10-question written section.
 *  - Section B: 20 MCQs drawn at random from the whole MCQ pool.
 * Re-sits therefore get a fresh paper automatically.
 */

/** Pass threshold as a percentage of max score. */
export const PASS_PERCENT = 80;

/** The 10 written competency slots (also used by the seed script). */
export const SLOT_LABEL: Record<number, string> = {
  1: 'Shipping & tracking',
  2: 'Processing time / ETA / no-expedite',
  3: 'Defective / wrong item (evidence + replacement)',
  4: 'Returns & exchanges policy',
  5: 'Cancellation & refunds',
  6: 'Ordering help',
  7: 'Club-controlled (links / roster / passwords)',
  8: 'Out of stock',
  9: 'Escalation & leak-trap',
  10: 'Wildcard (multi-issue / spot-the-mistake)',
};
export const WRITTEN_PER_SLOT = 1;
export const MCQ_COUNT = 20;

export interface PoolQuestion {
  id: string;
  type: 'MCQ' | 'WRITTEN';
  slot: number | null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns the ordered list of question ids for one exam attempt:
 * the 10 balanced written questions first, then 20 random MCQs.
 */
export function assembleExam(written: PoolQuestion[], mcq: PoolQuestion[]): string[] {
  const bySlot = new Map<number, PoolQuestion[]>();
  for (const w of written) {
    if (w.slot == null) continue;
    const list = bySlot.get(w.slot);
    if (list) list.push(w);
    else bySlot.set(w.slot, [w]);
  }

  const writtenIds: string[] = [];
  const slots = [...bySlot.keys()].sort((a, b) => a - b);
  for (const slot of slots) {
    const pool = bySlot.get(slot)!;
    for (const q of shuffle(pool).slice(0, WRITTEN_PER_SLOT)) writtenIds.push(q.id);
  }

  const mcqIds = shuffle(mcq).slice(0, MCQ_COUNT).map((m) => m.id);
  return [...writtenIds, ...mcqIds];
}

export function passed(totalScore: number, maxScore: number): boolean {
  if (maxScore <= 0) return false;
  return (totalScore / maxScore) * 100 >= PASS_PERCENT;
}

/** Grader/admin roles that may view all attempts and grade written answers. */
export const GRADER_ROLES = ['ADMIN', 'TEAM_LEADER', 'TRAINER'];

/**
 * E6 — attempt controls. A member may sit a given exam window at most this many
 * times, and once they've passed it the window locks for them (their
 * certification is banked; a re-sit would only risk it). Admins can always open
 * a fresh window for another go.
 */
export const MAX_ATTEMPTS_PER_SESSION = 2;
