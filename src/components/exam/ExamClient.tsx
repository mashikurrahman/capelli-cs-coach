'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GraduationCap, Play, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle, ArrowLeft, Timer } from 'lucide-react';
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

function fmtTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

const STATUS_BADGE: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  GRADED: 'bg-slate-100 text-slate-700',
};

interface OpenExam { title: string; timeLimitMin: number | null }

export default function ExamClient({ initialAttempts, bankReady, openExam }: { initialAttempts: AttemptRow[]; bankReady: boolean; openExam: OpenExam | null }) {
  const [phase, setPhase] = useState<'idle' | 'taking' | 'done'>('idle');
  const [loading, setLoading] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  // Timer (E5): anchored to the attempt's server startedAt so it can't be reset.
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [timeLimitMin, setTimeLimitMin] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const autoSubmitRef = useRef(false);

  // Countdown + auto-submit when the clock hits zero.
  useEffect(() => {
    if (phase !== 'taking' || !startedAt || !timeLimitMin) return;
    const deadline = new Date(startedAt).getTime() + timeLimitMin * 60_000;
    const tick = () => {
      const rem = deadline - Date.now();
      setRemainingMs(rem);
      if (rem <= 0 && !autoSubmitRef.current) {
        autoSubmitRef.current = true;
        void submitExam(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, startedAt, timeLimitMin]);

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
      setStartedAt(data.startedAt ?? null);
      setTimeLimitMin(data.timeLimitMin ?? null);
      autoSubmitRef.current = false;
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

  async function submitExam(auto = false) {
    if (!attemptId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/exam/attempt/${attemptId}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        // Read the freshest answers (matters for the auto-submit path).
        body: JSON.stringify({ answers: answersRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit the exam');
      setResult({ ...data, autoSubmitted: auto });
      setPhase('done');
      window.scrollTo(0, 0);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  // ── Review a finished attempt (see mistakes) ────────────────────────────────
  if (reviewId) {
    return <AttemptReview attemptId={reviewId} onBack={() => setReviewId(null)} />;
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
          {result.autoSubmitted && (
            <p className="text-sm text-amber-600 mt-1 inline-flex items-center gap-1"><Timer className="w-4 h-4" /> Time ran out — your exam was submitted automatically.</p>
          )}
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
          <div className="mt-6 flex items-center justify-center gap-3">
            {attemptId && (
              <Button onClick={() => setReviewId(attemptId)} className="bg-capelli-navy hover:bg-blue-900">Review my answers</Button>
            )}
            <Button variant="outline" onClick={() => window.location.reload()}>Back to exam home</Button>
          </div>
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
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Answered <strong className="text-gray-800">{answeredCount}</strong> / {questions.length}
              </span>
              {remainingMs != null && (
                <span className={cn('inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums',
                  remainingMs <= 120_000 ? 'text-capelli-danger' : 'text-gray-700')}>
                  <Timer className="w-4 h-4" /> {fmtTime(remainingMs)}
                </span>
              )}
            </div>
            <Button onClick={() => submitExam(false)} disabled={loading} className="gap-2 bg-capelli-navy hover:bg-blue-900">
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
        <ul className="text-sm text-gray-600 space-y-1 mt-3 mb-4 list-disc pl-5">
          <li>Your paper is drawn at random from the question bank — no two attempts are the same.</li>
          <li>Multiple-choice is graded instantly; your written answers are reviewed by a manager.</li>
          {openExam?.timeLimitMin
            ? <li className="font-medium text-gray-800">You'll have <strong>{openExam.timeLimitMin} minutes</strong> — the exam submits automatically when time runs out, and the clock keeps running if you close the tab.</li>
            : <li>There's no time limit set, but set aside ~45 minutes to finish in one sitting.</li>}
        </ul>

        {openExam ? (
          <div className="mb-4 rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            <span className="font-semibold">Open now:</span> {openExam.title}
            {openExam.timeLimitMin ? <span className="inline-flex items-center gap-1 ml-2"><Timer className="w-3.5 h-3.5" /> {openExam.timeLimitMin} min</span> : null}
          </div>
        ) : (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            No exam is currently open. Your admin needs to open an exam window before you can start.
          </div>
        )}

        {error && <p className="text-sm text-red-600 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />{error}</p>}
        <Button onClick={() => startExam()} disabled={loading || !bankReady || !openExam} size="lg" className="gap-2 bg-capelli-navy hover:bg-blue-900">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {!bankReady ? 'Exam not available yet' : !openExam ? 'No exam open' : 'Start exam'}
        </Button>
        {!bankReady && <p className="text-xs text-amber-600 mt-2">The question bank hasn't been set up yet — ask an admin to seed it.</p>}
      </div>

      {initialAttempts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Your past attempts</h3>
            <p className="text-xs text-gray-500">Click a finished attempt to review your answers and see what you missed.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {initialAttempts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => { if (a.status === 'IN_PROGRESS') startExam(); else setReviewId(a.id); }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors"
              >
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
                  {a.status !== 'IN_PROGRESS' && <span className="text-capelli-navy text-xs">Review →</span>}
                </div>
              </button>
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

interface ReviewResp {
  id: string; order: number; type: 'MCQ' | 'WRITTEN'; competency: string; prompt: string;
  options: string[]; points: number; selectedIndex: number | null; isCorrect: boolean | null;
  correctIndex: number | null; writtenAnswer: string | null; awardedPoints: number | null; graderNote: string | null;
}
interface ReviewBreakdown { competency: string; earned: number; max: number; pct: number }

function AttemptReview({ attemptId, onBack }: { attemptId: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/exam/attempt/${attemptId}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => { if (ok) setData(d); else setErr(d.error || 'Could not load your attempt'); })
      .catch(() => setErr('Could not load your attempt'));
  }, [attemptId]);

  if (err) return <div className="p-6 max-w-2xl mx-auto"><button onClick={onBack} className="text-sm text-gray-500 mb-4 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</button><p className="text-red-600 text-sm">{err}</p></div>;
  if (!data) return <div className="p-10 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;

  const written: ReviewResp[] = data.responses.filter((r: ReviewResp) => r.type === 'WRITTEN');
  const mcq: ReviewResp[] = data.responses.filter((r: ReviewResp) => r.type === 'MCQ');
  const mcqCorrect = mcq.filter((r) => r.isCorrect).length;
  const graded = data.status === 'GRADED';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4 pb-16">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to exam home</button>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
        <h2 className="font-bold text-gray-900 text-lg">Your results</h2>
        {graded && data.totalScore != null ? (
          <p className={cn('text-sm font-semibold mt-1', data.passed ? 'text-capelli-success' : 'text-capelli-danger')}>
            {data.totalScore}/{data.maxScore} — {data.passed ? 'PASSED ✓' : 'Did not pass (80% needed)'}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">Multiple choice: <strong>{data.autoScore}/{data.autoMax}</strong> · written section awaiting manager grading</p>
        )}
      </div>

      {/* Competency breakdown */}
      {Array.isArray(data.breakdown) && data.breakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <h3 className="text-sm font-bold text-capelli-navy mb-2">How you did by topic</h3>
          <div className="space-y-1.5">
            {(data.breakdown as ReviewBreakdown[]).map((b) => (
              <div key={b.competency} className="flex items-center gap-3 text-sm">
                <span className="w-52 flex-shrink-0 text-gray-600 truncate">{b.competency}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', b.pct >= 80 ? 'bg-capelli-success' : b.pct >= 50 ? 'bg-amber-400' : 'bg-red-400')} style={{ width: `${b.pct}%` }} />
                </div>
                <span className="w-14 text-right text-gray-500">{b.earned}/{b.max}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section B — MCQ mistakes */}
      <h3 className="text-sm font-bold text-capelli-navy">Multiple choice — {mcqCorrect}/{mcq.length} correct</h3>
      {mcq.map((r, i) => (
        <div key={r.id} className={cn('bg-white rounded-xl border shadow-card p-4', r.isCorrect ? 'border-gray-200' : 'border-red-200')}>
          <div className="flex items-start gap-2 mb-2">
            {r.isCorrect ? <CheckCircle2 className="w-4 h-4 text-capelli-success flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-capelli-danger flex-shrink-0 mt-0.5" />}
            <p className="text-sm text-gray-800"><span className="font-semibold">Q{written.length + i + 1}.</span> {r.prompt}</p>
          </div>
          <div className="space-y-1 pl-6">
            {r.options.map((opt, oi) => {
              const isCorrect = oi === r.correctIndex;
              const isChosen = oi === r.selectedIndex;
              return (
                <div key={oi} className={cn('text-sm px-2 py-1 rounded flex items-center gap-2',
                  isCorrect && 'bg-green-50 text-green-800 font-medium',
                  isChosen && !isCorrect && 'bg-red-50 text-red-800 line-through')}>
                  <span className="font-semibold">{String.fromCharCode(65 + oi)}.</span>
                  <span>{opt}</span>
                  {isCorrect && <span className="text-xs text-green-700">✓ correct answer</span>}
                  {isChosen && !isCorrect && <span className="text-xs text-red-700 no-underline">← your answer</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Section A — written */}
      <h3 className="text-sm font-bold text-capelli-navy mt-4">Written answers</h3>
      {written.map((r, i) => (
        <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-card p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Q{i + 1} · {r.competency} · {graded ? `${r.awardedPoints ?? 0}/${r.points}` : `${r.points} pts`}</p>
          <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{r.prompt}</p>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">Your answer</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.writtenAnswer || <span className="text-gray-400 italic">(left blank)</span>}</p>
          </div>
          {graded && r.graderNote && (
            <p className="text-xs text-capelli-navy mt-2"><strong>Grader feedback:</strong> {r.graderNote}</p>
          )}
          {!graded && <p className="text-xs text-gray-400 mt-2">Awaiting manager grading.</p>}
        </div>
      ))}
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
