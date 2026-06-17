/**
 * Decision hints — "how the team actually closes this ticket" — derived from the
 * labelled training-video scenarios and surfaced in the Ticket Coach. This turns
 * the video knowledge into in-the-moment guidance: not just *which* workflow, but
 * the status to set, who to escalate to, whether an evidence picture is needed,
 * and the fault attribution that changes the routing.
 */
import { VIDEO_SCENARIOS, type Fault, type TicketStatus } from '@/lib/training/video-scenarios';

export interface DecisionHint {
  requiresEvidencePicture: boolean;
  escalateTo?: string;
  status?: TicketStatus;
  fault?: Fault;
  notes: string[];
}

const byWorkflow = new Map<string, DecisionHint>();

for (const s of VIDEO_SCENARIOS) {
  const h = byWorkflow.get(s.workflowId) ?? { requiresEvidencePicture: false, notes: [] };
  if (s.requiresEvidencePicture) h.requiresEvidencePicture = true;
  if (s.escalateTo && !h.escalateTo) h.escalateTo = s.escalateTo;
  if (!h.status) h.status = s.status;
  if (!h.fault) h.fault = s.fault;
  if (s.note && !h.notes.includes(s.note)) h.notes.push(s.note);
  byWorkflow.set(s.workflowId, h);
}

export function getDecisionHint(workflowId: string): DecisionHint | undefined {
  return byWorkflow.get(workflowId);
}
