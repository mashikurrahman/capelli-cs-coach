/**
 * Per-competency scoring for the exam — turns a graded attempt into a
 * strengths/weaknesses profile so retraining can be targeted.
 *
 * Written questions carry their competency slot label; all MCQs are grouped
 * under "Multiple choice". Points earned = graded/auto points; max = question
 * points.
 */

export interface BreakdownRow {
  competency: string;
  earned: number;
  max: number;
  pct: number; // 0..100, rounded
}

interface RespLike {
  type: 'MCQ' | 'WRITTEN';
  competency: string;
  points: number;
  awardedPoints: number | null;
  isCorrect?: boolean | null;
}

const MCQ_LABEL = 'Multiple choice';

export function competencyBreakdown(responses: RespLike[]): BreakdownRow[] {
  const acc = new Map<string, { earned: number; max: number }>();
  for (const r of responses) {
    const key = r.type === 'MCQ' ? MCQ_LABEL : r.competency;
    const earned = r.awardedPoints ?? (r.isCorrect ? r.points : 0);
    const cur = acc.get(key) ?? { earned: 0, max: 0 };
    cur.earned += earned;
    cur.max += r.points;
    acc.set(key, cur);
  }
  return [...acc.entries()]
    .map(([competency, v]) => ({
      competency,
      earned: v.earned,
      max: v.max,
      pct: v.max ? Math.round((v.earned / v.max) * 100) : 0,
    }))
    // written competencies first (alpha), MCQ last
    .sort((a, b) => (a.competency === MCQ_LABEL ? 1 : b.competency === MCQ_LABEL ? -1 : a.competency.localeCompare(b.competency)));
}

/** Average % per competency across many attempts (team weak-area view). */
export function teamWeakAreas(perAttempt: BreakdownRow[][]): BreakdownRow[] {
  const acc = new Map<string, { earned: number; max: number }>();
  for (const rows of perAttempt) {
    for (const r of rows) {
      const cur = acc.get(r.competency) ?? { earned: 0, max: 0 };
      cur.earned += r.earned;
      cur.max += r.max;
      acc.set(r.competency, cur);
    }
  }
  return [...acc.entries()]
    .map(([competency, v]) => ({ competency, earned: v.earned, max: v.max, pct: v.max ? Math.round((v.earned / v.max) * 100) : 0 }))
    .sort((a, b) => a.pct - b.pct); // weakest first
}
