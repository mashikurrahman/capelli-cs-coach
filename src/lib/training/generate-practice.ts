/**
 * Turns the labelled scenarios (training video + ~70 real Zendesk tickets) into
 * ready-to-use Training Mode practice cards — so the practice library is
 * populated from real Capelli handling without anyone hand-authoring quizzes.
 *
 * Each card carries a routing question ("which workflow?") and, when the
 * scenario teaches a hard rule (evidence photo, escalation, same-size
 * replacement, no-expedite, no-exchange), a second rule question. The agent's
 * own teaching note becomes the explanation.
 *
 * Pure + deterministic (stable ids, stable option order) so the same scenarios
 * always render the same practice.
 */
import { DEFAULT_WORKFLOWS } from '@/lib/workflows/default-workflows';
import { VIDEO_SCENARIOS, type VideoScenario } from '@/lib/training/video-scenarios';
import { AGENT_SCENARIOS } from '@/lib/training/agent-ticket-scenarios';

export interface PracticeQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PracticeScenario {
  id: string;
  title: string;
  complaint: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  source: string;
  hints: string[];
  explanation: string;
  quizQuestions: PracticeQuestion[];
  isGenerated: true;
}

const NAME_BY_ID = new Map(DEFAULT_WORKFLOWS.map((w) => [w.workflowId, w.name]));
const ALL_NAMES = DEFAULT_WORKFLOWS.map((w) => w.name);

/** Deterministic small hash so option order is stable per scenario. */
function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Pick `n` distractor names (excluding the answer), deterministically by seed. */
function distractors(correct: string, n: number, s: number): string[] {
  const pool = ALL_NAMES.filter((nm) => nm !== correct);
  // rotate the pool by the seed for variety, then take the first n
  const start = s % pool.length;
  const rotated = [...pool.slice(start), ...pool.slice(0, start)];
  return rotated.slice(0, n);
}

function placeOptions(correct: string, others: string[], s: number): { options: string[]; correctIndex: number } {
  const correctIndex = s % (others.length + 1);
  const options = [...others];
  options.splice(correctIndex, 0, correct);
  return { options, correctIndex };
}

function titleFor(sc: VideoScenario): string {
  const base = sc.inquiryType || NAME_BY_ID.get(sc.workflowId) || 'Customer ticket';
  return sc.action && sc.action !== 'None' ? `${base} — ${sc.action}` : base;
}

function difficultyFor(sc: VideoScenario): PracticeScenario['difficulty'] {
  if (sc.escalateTo) return 'ADVANCED';
  if (sc.requiresEvidencePicture || sc.fault === 'capelli') return 'INTERMEDIATE';
  return 'BEGINNER';
}

function hintsFor(sc: VideoScenario): string[] {
  const hints: string[] = [];
  if (sc.fault === 'capelli') hints.push('This reads like a Capelli-side error — check fault before promising anything.');
  if (sc.fault === 'customer') hints.push('This looks like a customer-side choice — confirm before treating it as our error.');
  if (sc.requiresEvidencePicture) hints.push('An evidence photo is required before any replacement/refund action.');
  if (sc.escalateTo) hints.push(`May need escalation (${sc.escalateTo}).`);
  return hints;
}

function ruleQuestion(sc: VideoScenario): PracticeQuestion | null {
  const s = seed(sc.id + ':rule');
  // Evidence-photo rule
  if (sc.requiresEvidencePicture) {
    const correct = 'Request a clear evidence photo before taking any action';
    const others = [
      'Immediately ship a replacement, no photo needed',
      'Refund the order in full right away',
      'Tell the customer to keep the item and reorder',
    ];
    const { options, correctIndex } = placeOptions(correct, others, s);
    return { question: 'What must happen first on this ticket?', options, correctIndex, explanation: sc.note };
  }
  // Same-size replacement rule
  if (sc.action === 'Same Size Only') {
    const correct = 'Hold the line — replacements are the same size only; a size change needs a return + new order';
    const others = [
      'Send the bigger size as the replacement to keep them happy',
      'Offer a direct exchange for the new size',
      'Refund and let them reorder any size for free',
    ];
    const { options, correctIndex } = placeOptions(correct, others, s);
    return { question: 'How do you handle the replacement size request?', options, correctIndex, explanation: sc.note };
  }
  // No-expedite rule
  if (sc.workflowId === 'expedited_shipping') {
    const correct = 'Explain we do not offer expedited shipping and quote the standard processing timeline';
    const others = [
      'Upgrade them to overnight shipping for free',
      'Promise it will arrive before their event',
      'Refund the shipping cost so it ships faster',
    ];
    const { options, correctIndex } = placeOptions(correct, others, s);
    return { question: 'What is the correct response to the rush request?', options, correctIndex, explanation: sc.note };
  }
  // No-exchange rule
  if (sc.workflowId === 'return_exchange') {
    const correct = 'No exchanges — return for a refund, then place a new order in the desired size';
    const others = [
      'Process a direct size exchange',
      'Ship the new size and let them keep both',
      'Tell them the item is non-returnable',
    ];
    const { options, correctIndex } = placeOptions(correct, others, s);
    return { question: 'What is the policy for this size/style request?', options, correctIndex, explanation: sc.note };
  }
  // Label-created reassurance rule
  if (sc.workflowId === 'tracking_not_moving') {
    const correct = 'Reassure that the label prints before shipping and UPS will scan it soon — no hard delivery date';
    const others = [
      'Tell them the package is lost and reship it',
      'Promise a specific delivery date',
      'Offer expedited shipping to make up for it',
    ];
    const { options, correctIndex } = placeOptions(correct, others, s);
    return { question: 'How do you handle a "Label Created / not moving" ticket?', options, correctIndex, explanation: sc.note };
  }
  return null;
}

function toCard(sc: VideoScenario, source: string): PracticeScenario {
  const correctName = NAME_BY_ID.get(sc.workflowId) ?? sc.workflowId;
  const s = seed(sc.id + ':route');
  const { options, correctIndex } = placeOptions(correctName, distractors(correctName, 3, s), s);

  const questions: PracticeQuestion[] = [
    {
      question: 'How should this ticket be routed?',
      options,
      correctIndex,
      explanation: `Route to "${correctName}". ${sc.note}`,
    },
  ];
  const rule = ruleQuestion(sc);
  if (rule) questions.push(rule);

  return {
    id: `gen-${sc.id}`,
    title: titleFor(sc),
    complaint: sc.complaint,
    difficulty: difficultyFor(sc),
    source,
    hints: hintsFor(sc),
    explanation: sc.note,
    quizQuestions: questions,
    isGenerated: true,
  };
}

/** All practice cards generated from the labelled datasets. */
export function generatePracticeScenarios(): PracticeScenario[] {
  return [
    ...VIDEO_SCENARIOS.map((s) => toCard(s, 'Training video')),
    ...AGENT_SCENARIOS.map((s) => toCard(s, 'Real Capelli tickets')),
  ];
}
