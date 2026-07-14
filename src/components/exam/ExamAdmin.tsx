'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, XCircle, Clock, Loader2, ArrowLeft, ShieldCheck, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useToast } from '@/components/ui/use-toast';

interface AttemptRow {
  id: string; taker: string; email: string; status: string;
  autoScore: number | null; autoMax: number; writtenScore: number | null; writtenMax: number;
  totalScore: number | null; maxScore: number; passed: boolean | null;
  startedAt: string; submittedAt: string | null; gradedAt: string | null;
}
interface Stats { bankSize: number; awaitingGrading: number; graded: number; passed: number }
interface Resp {
  id: string; order: number; type: 'MCQ' | 'WRITTEN'; competency: string; prompt: string;
  options: string[]; points: number; selectedIndex: number | null; isCorrect: boolean | null;
  correctIndex: number | null; writtenAnswer: string | null; awardedPoints: number | null;
  graderNote: string | null; modelAnswer: string | null;
}

export default function ExamAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/exam/admin');
    const data = await res.json();
    if (res.ok) { setStats(data.stats); setAttempts(data.attempts); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  if (openId) {
    return <GradePanel attemptId={openId} onBack={() => { setOpenId(null); load(); }} />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat icon={<ClipboardList className="w-4 h-4 text-capelli-navy" />} label="Bank questions" value={stats.bankSize} tone="bg-capelli-navy/10" />
          <Stat icon={<Clock className="w-4 h-4 text-blue-600" />} label="Awaiting grading" value={stats.awaitingGrading} tone="bg-blue-100" />
          <Stat icon={<CheckCircle2 className="w-4 h-4 text-capelli-success" />} label="Graded" value={stats.graded} tone="bg-green-100" />
          <Stat icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />} label="Passed" value={stats.passed} tone="bg-emerald-100" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Attempts</h3>
        {attempts.some((a) => a.status !== 'IN_PROGRESS') && (
          <a
            href="/api/exam/admin/export"
            className="press inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-capelli-navy text-white hover:bg-blue-900 transition-colors"
          >
            <Download className="w-4 h-4" /> Download full report (.doc)
          </a>
        )}
      </div>

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
                      {a.status !== 'IN_PROGRESS' && (
                        <a
                          href={`/api/exam/admin/export?attemptId=${a.id}`}
                          title="Download this answer sheet"
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
        <h2 className="font-bold text-gray-900">{data.taker?.name}</h2>
        <p className="text-sm text-gray-500">
          Multiple choice (auto): <strong className="text-gray-800">{data.autoScore}/{data.autoMax}</strong> · Written max {data.writtenMax} · Pass mark 80%
        </p>
      </div>

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
