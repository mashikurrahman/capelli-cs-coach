'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, XCircle, Clock, Loader2, ArrowLeft, ShieldCheck, Download, Plus, Lock, Unlock, Sparkles, FileText, BarChart3, Award, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useToast } from '@/components/ui/use-toast';
import QuestionBank from '@/components/exam/QuestionBank';

interface AttemptRow {
  id: string; taker: string; email: string; status: string; sessionTitle: string | null;
  autoScore: number | null; autoMax: number; writtenScore: number | null; writtenMax: number;
  totalScore: number | null; maxScore: number; passed: boolean | null;
  startedAt: string; submittedAt: string | null; gradedAt: string | null;
}
interface Stats { bankSize: number; awaitingGrading: number; graded: number; passed: number }
interface SessionRow { id: string; title: string; isOpen: boolean; timeLimitMin: number | null; attemptCount: number; createdAt: string }
interface Breakdown { competency: string; earned: number; max: number; pct: number }
interface Resp {
  id: string; order: number; type: 'MCQ' | 'WRITTEN'; competency: string; prompt: string;
  options: string[]; points: number; selectedIndex: number | null; isCorrect: boolean | null;
  correctIndex: number | null; writtenAnswer: string | null; awardedPoints: number | null;
  graderNote: string | null; modelAnswer: string | null;
}

export default function ExamAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showItems, setShowItems] = useState(false);
  const [showBank, setShowBank] = useState(false);

  async function load() {
    setLoading(true);
    const [aRes, sRes] = await Promise.all([fetch('/api/exam/admin'), fetch('/api/exam/sessions')]);
    const aData = await aRes.json();
    const sData = await sRes.json();
    if (aRes.ok) { setStats(aData.stats); setAttempts(aData.attempts); }
    if (sRes.ok) setSessions(sData.sessions ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  if (openId) {
    return <GradePanel attemptId={openId} onBack={() => { setOpenId(null); load(); }} />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <SessionManager sessions={sessions} onChange={load} />

      <div className="flex justify-end">
        <button
          onClick={() => setShowBank((v) => !v)}
          className="press inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Library className="w-4 h-4" /> {showBank ? 'Hide question bank' : 'Manage question bank'}
        </button>
      </div>

      {showBank && <QuestionBank />}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat icon={<ClipboardList className="w-4 h-4 text-capelli-navy" />} label="Bank questions" value={stats.bankSize} tone="bg-capelli-navy/10" />
          <Stat icon={<Clock className="w-4 h-4 text-blue-600" />} label="Awaiting grading" value={stats.awaitingGrading} tone="bg-blue-100" />
          <Stat icon={<CheckCircle2 className="w-4 h-4 text-capelli-success" />} label="Graded" value={stats.graded} tone="bg-green-100" />
          <Stat icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />} label="Passed" value={stats.passed} tone="bg-emerald-100" />
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-gray-800">Attempts</h3>
          <p className="text-xs text-gray-500">Each exam window has its own report above (the <span className="text-capelli-navy font-medium">Report</span> link). The button here covers every exam at once.</p>
        </div>
        {attempts.some((a) => a.status !== 'IN_PROGRESS') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowItems((v) => !v)}
              className="press inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="w-4 h-4" /> {showItems ? 'Hide item analysis' : 'Item analysis'}
            </button>
            <a
              href="/api/exam/admin/export"
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-capelli-navy text-white hover:bg-blue-900 transition-colors"
            >
              <Download className="w-4 h-4" /> All-exams report
            </a>
          </div>
        )}
      </div>

      {showItems && <ItemAnalysisPanel />}

      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : attempts.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No exam attempts yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Team member</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attempts.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{a.taker}</p>
                    <p className="text-xs text-gray-400">{a.email}</p>
                    {a.sessionTitle && <p className="text-xs text-capelli-navy/70 mt-0.5">{a.sessionTitle}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3">
                    {a.status === 'GRADED' && a.totalScore != null ? (
                      <span className={cn('font-semibold', a.passed ? 'text-capelli-success' : 'text-capelli-danger')}>
                        {a.totalScore}/{a.maxScore} · {a.passed ? 'PASS' : 'FAIL'}
                      </span>
                    ) : a.status === 'SUBMITTED' ? (
                      <span className="text-gray-500">MCQ {a.autoScore}/{a.autoMax}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(a.submittedAt ?? a.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {a.status === 'GRADED' && a.passed && (
                        <a
                          href={`/api/exam/certificate?attemptId=${a.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open pass certificate (print / PDF)"
                          className="text-amber-500 hover:text-amber-600"
                        >
                          <Award className="w-4 h-4" />
                        </a>
                      )}
                      {a.status !== 'IN_PROGRESS' && (
                        <a
                          href={`/api/exam/admin/export?attemptId=${a.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open this answer sheet (print / PDF)"
                          className="text-gray-400 hover:text-capelli-navy"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      {a.status === 'SUBMITTED' ? (
                        <Button size="sm" onClick={() => setOpenId(a.id)} className="bg-capelli-navy hover:bg-blue-900">Grade</Button>
                      ) : a.status === 'GRADED' ? (
                        <button onClick={() => setOpenId(a.id)} className="text-sm text-capelli-navy hover:underline">Review</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function GradePanel({ attemptId, onBack }: { attemptId: string; onBack: () => void }) {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [grades, setGrades] = useState<Record<string, { awardedPoints: number; graderNote: string }>>({});
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  async function aiSuggest() {
    setAiBusy(true);
    const res = await fetch(`/api/exam/attempt/${attemptId}/ai-grade`, { method: 'POST' });
    const d = await res.json();
    setAiBusy(false);
    if (!res.ok) { toast({ title: d.error || 'AI grading unavailable', variant: 'destructive' }); return; }
    setGrades((prev) => {
      const next = { ...prev };
      for (const s of d.suggestions as { responseId: string; suggestedPoints: number; rationale: string }[]) {
        next[s.responseId] = { awardedPoints: s.suggestedPoints, graderNote: s.rationale ? `AI: ${s.rationale}` : (next[s.responseId]?.graderNote ?? '') };
      }
      return next;
    });
    toast({ title: 'AI suggested scores — review and adjust before finalizing', variant: 'success' });
  }

  useEffect(() => {
    fetch(`/api/exam/attempt/${attemptId}`).then((r) => r.json()).then((d) => {
      setData(d);
      const seed: Record<string, { awardedPoints: number; graderNote: string }> = {};
      for (const r of d.responses as Resp[]) {
        if (r.type === 'WRITTEN') seed[r.id] = { awardedPoints: r.awardedPoints ?? 0, graderNote: r.graderNote ?? '' };
      }
      setGrades(seed);
    });
  }, [attemptId]);

  if (!data) return <div className="p-10 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;

  const written: Resp[] = data.responses.filter((r: Resp) => r.type === 'WRITTEN');
  const mcq: Resp[] = data.responses.filter((r: Resp) => r.type === 'MCQ');
  const writtenAwarded = Object.values(grades).reduce((s, g) => s + (Number(g.awardedPoints) || 0), 0);
  const projectedTotal = (data.autoScore ?? 0) + writtenAwarded;
  const readOnly = data.status === 'GRADED';

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/exam/attempt/${attemptId}/grade`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grades: Object.entries(grades).map(([responseId, g]) => ({ responseId, awardedPoints: Number(g.awardedPoints) || 0, graderNote: g.graderNote })) }),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) { toast({ title: `Graded — ${d.totalScore}/${d.maxScore} · ${d.passed ? 'PASS' : 'FAIL'}`, variant: 'success' }); onBack(); }
    else toast({ title: d.error || 'Could not save', variant: 'destructive' });
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4 pb-28">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to results</button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-gray-900">{data.taker?.name}</h2>
            <p className="text-sm text-gray-500">
              Multiple choice (auto): <strong className="text-gray-800">{data.autoScore}/{data.autoMax}</strong> · Written max {data.writtenMax} · Pass mark 80%
            </p>
          </div>
          {!readOnly && (
            <Button onClick={aiSuggest} disabled={aiBusy} variant="outline" className="gap-1.5 flex-shrink-0">
              {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-capelli-navy" />}
              Suggest scores with AI
            </Button>
          )}
        </div>
      </div>

      {Array.isArray(data.breakdown) && data.breakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <h3 className="text-sm font-bold text-capelli-navy mb-2">Competency breakdown</h3>
          <div className="space-y-1.5">
            {(data.breakdown as Breakdown[]).map((b) => (
              <div key={b.competency} className="flex items-center gap-3 text-sm">
                <span className="w-56 flex-shrink-0 text-gray-600 truncate">{b.competency}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', b.pct >= 80 ? 'bg-capelli-success' : b.pct >= 50 ? 'bg-amber-400' : 'bg-red-400')} style={{ width: `${b.pct}%` }} />
                </div>
                <span className="w-16 text-right text-gray-500">{b.earned}/{b.max}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Written scores update after you finalize; MCQ competencies reflect auto-grading.</p>
        </div>
      )}

      <h3 className="text-sm font-bold text-capelli-navy">Written answers to grade</h3>
      {written.map((r) => (
        <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-card p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase">{r.competency} · {r.points} pts</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.prompt}</p>

          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">Team member's answer</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.writtenAnswer || <span className="text-gray-400 italic">(left blank)</span>}</p>
          </div>

          {r.modelAnswer && (
            <details className="rounded-lg bg-blue-50/60 border border-blue-100 p-3">
              <summary className="text-xs font-semibold text-capelli-navy cursor-pointer">Model answer / rubric (key)</summary>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{r.modelAnswer}</p>
            </details>
          )}

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Points:</label>
            <input
              type="number" min={0} max={r.points} disabled={readOnly}
              value={grades[r.id]?.awardedPoints ?? 0}
              onChange={(e) => setGrades((p) => ({ ...p, [r.id]: { ...p[r.id], awardedPoints: Math.max(0, Math.min(r.points, Number(e.target.value))) } }))}
              className="w-20 rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:bg-gray-100"
            />
            <span className="text-sm text-gray-400">/ {r.points}</span>
            <input
              type="text" placeholder="Note (optional)" disabled={readOnly}
              value={grades[r.id]?.graderNote ?? ''}
              onChange={(e) => setGrades((p) => ({ ...p, [r.id]: { ...p[r.id], graderNote: e.target.value } }))}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:bg-gray-100"
            />
          </div>
        </div>
      ))}

      <details className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
        <summary className="text-sm font-bold text-capelli-navy cursor-pointer">Multiple-choice breakdown ({mcq.filter((m) => m.isCorrect).length}/{mcq.length} correct)</summary>
        <div className="mt-3 space-y-2">
          {mcq.map((r) => (
            <div key={r.id} className="text-sm flex items-start gap-2">
              {r.isCorrect ? <CheckCircle2 className="w-4 h-4 text-capelli-success flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-capelli-danger flex-shrink-0 mt-0.5" />}
              <div>
                <p className="text-gray-700">{r.prompt}</p>
                <p className="text-xs text-gray-400">
                  Chose {r.selectedIndex != null ? String.fromCharCode(65 + r.selectedIndex) : '—'} · Correct {r.correctIndex != null ? String.fromCharCode(65 + r.correctIndex) : '?'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </details>

      {!readOnly && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500">Projected total: <strong className="text-gray-800">{projectedTotal}/{data.maxScore}</strong></span>
            <Button onClick={save} disabled={saving} className="gap-2 bg-capelli-navy hover:bg-blue-900">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Finalize grade
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionManager({ sessions, onChange }: { sessions: SessionRow[]; onChange: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [limit, setLimit] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!title.trim()) return;
    setBusy(true);
    const res = await fetch('/api/exam/sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), ...(limit ? { timeLimitMin: Number(limit) } : {}) }),
    });
    setBusy(false);
    if (res.ok) { setTitle(''); setLimit(''); toast({ title: 'Exam opened — team members can now take it', variant: 'success' }); onChange(); }
    else toast({ title: 'Could not open the exam', variant: 'destructive' });
  }

  async function toggle(id: string, isOpen: boolean) {
    const res = await fetch('/api/exam/sessions', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isOpen }),
    });
    if (res.ok) onChange();
  }

  const openCount = sessions.filter((s) => s.isOpen).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">Exam windows</h3>
          <p className="text-xs text-gray-500">Open an exam when you want the team to sit it (e.g. twice a week). Members can only start while a window is open.</p>
        </div>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', openCount ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
          {openCount} open
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Exam title, e.g. “Week 27 — Tuesday”"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <input
          value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ''))}
          placeholder="Time limit (min, optional)"
          className="w-full sm:w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <Button onClick={create} disabled={busy || !title.trim()} className="gap-1.5 bg-capelli-navy hover:bg-blue-900">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Open exam
        </Button>
      </div>

      {sessions.length > 0 && (
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {sessions.slice(0, 8).map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', s.isOpen ? 'bg-green-500' : 'bg-gray-300')} />
                <span className="font-medium text-gray-800 truncate">{s.title}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{s.attemptCount} attempt{s.attemptCount === 1 ? '' : 's'}{s.timeLimitMin ? ` · ${s.timeLimitMin} min` : ''}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {s.attemptCount > 0 && (
                  <a
                    href={`/api/exam/admin/export?sessionId=${s.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open the report for “${s.title}” (print / PDF)`}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-capelli-navy hover:bg-blue-50"
                  >
                    <FileText className="w-3.5 h-3.5" /> Report
                  </a>
                )}
                <button
                  onClick={() => toggle(s.id, !s.isOpen)}
                  className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg', s.isOpen ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50')}
                >
                  {s.isOpen ? <><Lock className="w-3.5 h-3.5" /> Close</> : <><Unlock className="w-3.5 h-3.5" /> Reopen</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ItemRow {
  id: string; type: 'MCQ' | 'WRITTEN'; competency: string; prompt: string;
  attempts: number; pct: number; flag: 'hard' | 'easy' | null;
}

function ItemAnalysisPanel() {
  const [data, setData] = useState<{ items: ItemRow[]; totalAttempts: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/exam/admin/item-analysis')
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => { if (ok) setData(d); else setErr(d.error || 'Could not load item analysis'); })
      .catch(() => setErr('Could not load item analysis'));
  }, []);

  const hard = data?.items.filter((i) => i.flag === 'hard') ?? [];
  const easy = data?.items.filter((i) => i.flag === 'easy') ?? [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-capelli-navy" /> Item analysis</h3>
        <p className="text-xs text-gray-500">Across all graded/submitted attempts. <strong>Hard</strong> = ≤40% get it right (training gap or mis-keyed). <strong>Too easy</strong> = ≥95% right (little signal).</p>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {!data && !err && <div className="p-6 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>}

      {data && data.totalAttempts === 0 && <p className="text-sm text-gray-500">No submitted attempts to analyze yet.</p>}

      {data && data.totalAttempts > 0 && (
        <>
          <ItemGroup title={`Hardest questions (${hard.length})`} rows={hard} tone="hard" empty="No questions are failing widely — nice." />
          <ItemGroup title={`Too easy (${easy.length})`} rows={easy} tone="easy" empty="No questions are trivially easy." />
        </>
      )}
    </div>
  );
}

function ItemGroup({ title, rows, tone, empty }: { title: string; rows: ItemRow[]; tone: 'hard' | 'easy'; empty: string }) {
  return (
    <div>
      <h4 className={cn('text-sm font-bold mb-2', tone === 'hard' ? 'text-red-600' : 'text-emerald-600')}>{title}</h4>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">{empty}</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.id} className="flex items-start gap-3 text-sm">
              <span className={cn('flex-shrink-0 w-12 text-right font-semibold tabular-nums', tone === 'hard' ? 'text-red-600' : 'text-emerald-600')}>{r.pct}%</span>
              <div className="min-w-0">
                <p className="text-gray-700 line-clamp-2">{r.prompt}</p>
                <p className="text-xs text-gray-400">{r.type === 'MCQ' ? 'Multiple choice' : 'Written'} · {r.competency} · {r.attempts} answer{r.attempts === 1 ? '' : 's'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4 flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', tone)}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    GRADED: 'bg-slate-100 text-slate-700',
  };
  const label = status === 'IN_PROGRESS' ? 'In progress' : status === 'SUBMITTED' ? 'Awaiting grading' : 'Graded';
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', map[status] ?? 'bg-gray-100 text-gray-600')}>{label}</span>;
}
