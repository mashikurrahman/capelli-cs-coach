'use client';

import { useMemo, useState } from 'react';
import { GraduationCap, Play, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface AttemptRow {
  id: string; status: string;
  autoScore: number | null; autoMax: number; writtenScore: number | null; writtenMax: number;
  totalScore: number | null; maxScore: number; passed: boolean | null;
  startedAt: string; submittedAt: string | null; gradedAt: string | null;
}
interface Question {
  id: string; order: number; type: 'MCQ' | 'WRITTEN'; competency: string;
  prompt: string; options: string[]; points: number;
  selectedIndex?: number | null; writtenAnswer?: string | null;
}
type Answer = { selectedIndex?: number; writtenAnswer?: string };

const STATUS_BADGE: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  GRADED: 'bg-slate-100 text-slate-700',
};

export default function ExamClient({ initialAttempts, bankReady }: { initialAttempts: AttemptRow[]; bankReady: boolean }) {
  const [phase, setPhase] = useState<'idle' | 'taking' | 'done'>('idle');
  const [loading, setLoading] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = useMemo(
    () => questions.filter((q) => {
      const a = answers[q.id];
      return q.type === 'MCQ' ? a?.selectedIndex != null : (a?.writtenAnswer ?? '').trim().length > 0;
    }).length,
    [questions, answers]
  );

  async function startExam() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/exam/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start the exam');
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      const seed: Record<string, Answer> = {};
      for (const q of data.questions as Question[]) {
        if (q.selectedIndex != null) seed[q.id] = { selectedIndex: q.selectedIndex };
        if (q.writtenAnswer) seed[q.id] = { writtenAnswer: q.writtenAnswer };
      }
      setAnswers(seed);
      setPhase('taking');
      window.scrollTo(0, 0);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function submitExam() {
    if (!attemptId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/exam/attempt/${attemptId}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit the exam');
      setResult(data);
      setPhase('done');
      window.scrollTo(0, 0);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  // ── Result screen ──────────────────────────────────────────────────────────
  if (phase === 'done' && result) {
    const awaiting = result.awaitingGrading;
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-8 text-center">
          {awaiting ? (
            <Clock className="w-14 h-14 text-blue-500 mx-auto mb-3" />
          ) : result.passed ? (
            <CheckCircle2 className="w-14 h-14 text-capelli-success mx-auto mb-3" />
          ) : (
            <XCircle className="w-14 h-14 text-capelli-danger mx-auto mb-3" />
          )}
          <h2 className="text-2xl font-bold text-gray-900">Exam submitted</h2>
          <p className="text-gray-500 mt-1">
            Auto-graded multiple choice: <span className="font-semibold text-gray-800">{result.autoScore} / {result.autoMax}</span>
          </p>
          {awaiting ? (
            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
              Your <strong>written section</strong> is now with a manager for grading. Your final score and
              pass/fail will appear here once it's reviewed.
            </div>
          ) : (
            <div className={cn('mt-4 rounded-xl border p-4 text-sm', result.passed ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800')}>
              Final score: <strong>{result.autoScore} / {result.maxScore}</strong> — {result.passed ? 'PASSED ✓' : 'Did not pass (80% required)'}
            </div>
          )}
          <Button className="mt-6" onClick={() => window.location.reload()}>Back to exam home</Button>
        </div>
      </div>
    );
  }

  // ── Taking the exam ──────────────────────────────────────────────────────────
  if (phase === 'taking') {
    const written = questions.filter((q) => q.type === 'WRITTEN');
    const mcq = questions.filter((q) => q.type === 'MCQ');
    return (
      <div className="p-6 max-w-3xl mx-auto pb-28">
        <SectionHeading title="Section A — Scenarios" sub="Answer in the voice of the agent handling the ticket." />
        {written.map((q, i) => (
          <QuestionCard key={q.id} n={i + 1} q={q} answer={answers[q.id]} onChange={(a) => setAnswers((p) => ({ ...p, [q.id]: a }))} />
        ))}

        <SectionHeading title="Section B — Multiple Choice" sub="Choose the single best answer." />
        {mcq.map((q, i) => (
          <QuestionCard key={q.id} n={written.length + i + 1} q={q} answer={answers[q.id]} onChange={(a) => setAnswers((p) => ({ ...p, [q.id]: a }))} />
        ))}

        {error && <p className="text-sm text-red-600 mt-4 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />{error}</p>}

        {/* Sticky submit bar */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur px-6 py-3 no-print">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500">
              Answered <strong className="text-gray-800">{answeredCount}</strong> / {questions.length}
            </span>
            <Button onClick={submitExam} disabled={loading} className="gap-2 bg-capelli-navy hover:bg-blue-900">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Submit exam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Idle / home ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-capelli-navy/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-capelli-navy" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Capelli CS Certification Exam</h2>
            <p className="text-sm text-gray-500">30 questions · 10 written scenarios + 20 multiple choice · pass mark 80%</p>
          </div>
        </div>
        <ul className="text-sm text-gray-600 space-y-1 mt-3 mb-5 list-disc pl-5">
          <li>Your paper is drawn at random from the question bank — no two attempts are the same.</li>
          <li>Multiple-choice is graded instantly; your written answers are reviewed by a manager.</li>
          <li>You can't pause once you start, so set aside ~45 minutes.</li>
        </ul>
        {error && <p className="text-sm text-red-600 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />{error}</p>}
        <Button onClick={startExam} disabled={loading || !bankReady} size="lg" className="gap-2 bg-capelli-navy hover:bg-blue-900">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {bankReady ? 'Start exam' : 'Exam not available yet'}
        </Button>
        {!bankReady && <p className="text-xs text-amber-600 mt-2">The question bank hasn't been set up yet — ask an admin to seed it.</p>}
      </div>

      {initialAttempts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
          <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Your past attempts</h3></div>
          <div className="divide-y divide-gray-100">
            {initialAttempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_BADGE[a.status] ?? 'bg-gray-100 text-gray-600')}>
                    {a.status === 'IN_PROGRESS' ? 'In progress' : a.status === 'SUBMITTED' ? 'Awaiting grading' : 'Graded'}
                  </span>
                  <span className="text-gray-500">{new Date(a.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-3">
                  {a.status === 'GRADED' && a.totalScore != null ? (
                    <span className={cn('font-semibold', a.passed ? 'text-capelli-success' : 'text-capelli-danger')}>
                      {a.totalScore}/{a.maxScore} · {a.passed ? 'PASS' : 'FAIL'}
                    </span>
                  ) : a.status === 'SUBMITTED' ? (
                    <span className="text-gray-500">MCQ {a.autoScore}/{a.autoMax} · written pending</span>
                  ) : (
                    <span className="text-amber-600">Resume →</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mt-6 mb-3 first:mt-0">
      <h3 className="text-base font-bold text-capelli-navy">{title}</h3>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  );
}

function QuestionCard({ n, q, answer, onChange }: { n: number; q: Question; answer?: Answer; onChange: (a: Answer) => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 mb-3">
      <div className="flex items-start gap-2 mb-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-capelli-navy text-white text-xs font-bold flex items-center justify-center">{n}</span>
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{q.prompt}</p>
      </div>
      {q.type === 'MCQ' ? (
        <div className="space-y-2 pl-8">
          {q.options.map((opt, i) => {
            const selected = answer?.selectedIndex === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange({ selectedIndex: i })}
                className={cn(
                  'w-full text-left p-3 rounded-lg border text-sm transition-all flex items-start gap-2',
                  selected ? 'border-capelli-navy bg-blue-50 text-capelli-navy' : 'border-gray-200 hover:border-capelli-navy hover:bg-blue-50/40'
                )}
              >
                <span className="font-semibold">{String.fromCharCode(65 + i)}.</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="pl-8">
          <textarea
            value={answer?.writtenAnswer ?? ''}
            onChange={(e) => onChange({ writtenAnswer: e.target.value })}
            placeholder="Type your answer — route, action, and the trap to avoid…"
            className="w-full min-h-[110px] rounded-lg border border-gray-200 p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300"
          />
        </div>
      )}
    </div>
  );
}
