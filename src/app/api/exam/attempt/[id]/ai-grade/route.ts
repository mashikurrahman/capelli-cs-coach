import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { GRADER_ROLES } from '@/lib/exam/build-exam';
import { generateJson } from '@/lib/ai/client';

/**
 * AI-assisted grading (suggestions only — never final). Scores each written
 * answer against its model-answer key and returns suggested points + a short
 * rationale for the grader to review and override.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'AGENT';
  if (!GRADER_ROLES.includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: params.id },
    include: { responses: { orderBy: { order: 'asc' }, include: { question: true } } },
  });
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const written = attempt.responses.filter((r) => r.question.type === 'WRITTEN');
  if (written.length === 0) return NextResponse.json({ suggestions: [] });

  const items = written.map((r, i) => (
    `#${i} (max ${r.question.points} pts)
QUESTION: ${r.question.prompt}
MODEL ANSWER / RUBRIC: ${r.question.modelAnswer ?? '(none)'}
STUDENT ANSWER: ${r.writtenAnswer?.trim() || '(left blank)'}`
  )).join('\n\n---\n\n');

  const SYSTEM = `You are a strict but fair Capelli Sport customer-service exam grader.
Score each written answer from 0 to its max points by how well it matches the MODEL ANSWER / RUBRIC — reward the correct routing/action, the key policy, and naming the trap to avoid; a blank or off-policy answer scores 0. Award partial credit. Do not invent policy beyond the rubric. Respond with ONLY valid JSON.`;

  const prompt = `Grade these ${written.length} answers.

${items}

Return JSON exactly:
{"grades":[{"i":0,"points":<integer 0..max>,"rationale":"<one short sentence>"}, ...]}`;

  try {
    const r = await generateJson<{ grades?: { i: number; points: number; rationale?: string }[] }>({
      system: SYSTEM,
      prompt,
      temperature: 0.1,
      maxOutputTokens: 1100,
    });
    const grades = Array.isArray(r.grades) ? r.grades : [];
    const byIndex = new Map(grades.map((g) => [g.i, g]));

    const suggestions = written.map((resp, i) => {
      const g = byIndex.get(i);
      const raw = typeof g?.points === 'number' ? g.points : 0;
      const points = Math.max(0, Math.min(resp.question.points, Math.round(raw)));
      return {
        responseId: resp.id,
        suggestedPoints: points,
        rationale: (g?.rationale ?? '').toString().slice(0, 240),
      };
    });
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ error: 'AI grading is unavailable right now — please grade manually.' }, { status: 502 });
  }
}
