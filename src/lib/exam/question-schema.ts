import { z } from 'zod';

// Shared validation for the question-bank editor (create + edit). Kept out of
// the route files because Next.js only allows handler exports from those.
export const questionSchema = z.object({
  type: z.enum(['MCQ', 'WRITTEN']),
  competency: z.string().trim().min(1).max(160),
  slot: z.number().int().min(1).max(10).nullable().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  prompt: z.string().trim().min(1),
  options: z.array(z.string().trim()).optional(),
  correctIndex: z.number().int().min(0).max(3).nullable().optional(),
  modelAnswer: z.string().trim().nullable().optional(),
  points: z.number().int().min(1).max(20).optional(),
}).superRefine((v, ctx) => {
  if (v.type === 'MCQ') {
    const opts = (v.options ?? []).filter((o) => o.length > 0);
    if (opts.length < 2) ctx.addIssue({ code: 'custom', message: 'Give at least 2 answer options', path: ['options'] });
    if (opts.length > 4) ctx.addIssue({ code: 'custom', message: 'At most 4 answer options', path: ['options'] });
    if (v.correctIndex == null || v.correctIndex >= opts.length) {
      ctx.addIssue({ code: 'custom', message: 'Mark which option is correct', path: ['correctIndex'] });
    }
  } else {
    if (v.slot == null) ctx.addIssue({ code: 'custom', message: 'Pick a competency slot (1–10)', path: ['slot'] });
  }
});
