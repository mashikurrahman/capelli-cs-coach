'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Search, Clock, Flag, CheckCircle2, AlertTriangle, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useToast } from '@/components/ui/use-toast';
import { formatIssueCategory, getRiskColor } from '@/lib/utils/helpers';

interface ReviewStub {
  overallScore: number;
  status: 'PENDING' | 'APPROVED' | 'NEEDS_REVISION' | 'FLAGGED';
}

interface SessionRow {
  id: string;
  primaryIssue: string | null;
  confidenceScore: number | null;
  riskLevel: string | null;
  status: string;
  createdAt: string;
  agent: { name: string | null };
  qaReviews: ReviewStub[];
}

interface Props {
  sessions: SessionRow[];
  stats: { totalReviewed: number; pending: number; flagged: number };
}

const REVIEW_BADGE: Record<string, string> = {
  APPROVED: 'bg-capelli-successBg text-capelli-success',
  PENDING: 'bg-capelli-warningBg text-capelli-warning',
  NEEDS_REVISION: 'bg-capelli-infoBg text-capelli-info',
  FLAGGED: 'bg-capelli-dangerBg text-capelli-danger',
};

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
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

export default function QaReview({ sessions, stats }: Props) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNREVIEWED' | 'FLAGGED'>('ALL');
  const [openId, setOpenId] = useState<string | null>(null);

  if (openId) {
    return <ReviewPanel sessionId={openId} onBack={() => setOpenId(null)} onSaved={() => { setOpenId(null); router.refresh(); }} />;
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sessions.filter(s => {
      const review = s.qaReviews[0];
      if (filter === 'UNREVIEWED' && review) return false;
      if (filter === 'FLAGGED' && review?.status !== 'FLAGGED') return false;
      if (!needle) return true;
      return (
        (s.agent.name ?? '').toLowerCase().includes(needle) ||
        formatIssueCategory(s.primaryIssue ?? '').toLowerCase().includes(needle)
      );
    });
  }, [sessions, q, filter]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<CheckCircle2 className="w-4 h-4 text-capelli-success" />} label="Total reviews completed" value={stats.totalReviewed} tone="bg-capelli-successBg" />
        <StatCard icon={<Clock className="w-4 h-4 text-capelli-warning" />} label="Reviews pending" value={stats.pending} tone="bg-capelli-warningBg" />
        <StatCard icon={<Flag className="w-4 h-4 text-capelli-danger" />} label="Flagged" value={stats.flagged} tone="bg-capelli-dangerBg" />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by agent or issue type…"
            className="pl-9"
          />
        </div>
        <p className="text-xs text-gray-400 sm:hidden">Tap a row to review it.</p>
        <div className="flex gap-2">
          {(['ALL', 'UNREVIEWED', 'FLAGGED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'text-sm px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap',
                filter === f
                  ? 'bg-capelli-navy text-white border-capelli-navy'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              )}
            >
              {f === 'ALL' ? 'All' : f === 'UNREVIEWED' ? 'Unreviewed' : 'Flagged'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
          <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          No ticket sessions match this view.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => {
                const risk = getRiskColor(s.riskLevel ?? 'low');
                const review = s.qaReviews[0];
                return (
                  <tr key={s.id} onClick={() => setOpenId(s.id)} className="hover:bg-blue-50/40 cursor-pointer">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.agent.name ?? 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.primaryIssue ? formatIssueCategory(s.primaryIssue) : '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.confidenceScore != null ? `${s.confidenceScore}%` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', risk.badge)}>
                        {(s.riskLevel ?? 'low').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {review ? (
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', REVIEW_BADGE[review.status])}>
                          {review.status.replace('_', ' ').toLowerCase()} · {review.overallScore}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Not reviewed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const DIMS = [
  { key: 'accuracyScore', label: 'Accuracy', hint: 'Right issue + workflow' },
  { key: 'policyScore', label: 'Policy', hint: 'Guardrails respected' },
  { key: 'toneScore', label: 'Tone', hint: 'Professional & specific' },
  { key: 'completenessScore', label: 'Completeness', hint: 'Asked for what it needs' },
  { key: 'zendeskScore', label: 'Zendesk note', hint: 'Note + status + tags' },
] as const;

type ScoreKey = typeof DIMS[number]['key'];
const STATUSES = ['APPROVED', 'NEEDS_REVISION', 'FLAGGED', 'PENDING'] as const;
const RISKS = ['LOW', 'MEDIUM', 'HIGH'] as const;

function ReviewPanel({ sessionId, onBack, onSaved }: { sessionId: string; onBack: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    accuracyScore: 80, policyScore: 80, toneScore: 80, completenessScore: 80, zendeskScore: 80,
  });
  const [risk, setRisk] = useState<typeof RISKS[number]>('LOW');
  const [status, setStatus] = useState<typeof STATUSES[number]>('APPROVED');
  const [issues, setIssues] = useState('');
  const [notes, setNotes] = useState('');

  const overall = useMemo(
    () => Math.round((scores.accuracyScore + scores.policyScore + scores.toneScore + scores.completenessScore + scores.zendeskScore) / 5),
    [scores]
  );

  useEffect(() => {
    fetch(`/api/qa/review/${sessionId}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) { setErr(d.error || 'Could not load this session'); return; }
        setDetail(d);
        if (d.review) {
          setScores({
            accuracyScore: d.review.accuracyScore, policyScore: d.review.policyScore, toneScore: d.review.toneScore,
            completenessScore: d.review.completenessScore, zendeskScore: d.review.zendeskScore,
          });
          setRisk(d.review.riskLevel ?? 'LOW');
          setStatus(d.review.status ?? 'APPROVED');
          setIssues((d.review.issues ?? []).join('\n'));
          setNotes(d.review.notes ?? '');
        }
      })
      .catch(() => setErr('Could not load this session'));
  }, [sessionId]);

  async function preScreen() {
    setAiBusy(true);
    const res = await fetch(`/api/qa/review/${sessionId}/auto`, { method: 'POST' });
    const d = await res.json();
    setAiBusy(false);
    if (!res.ok) { toast({ title: d.error || 'AI pre-screen unavailable', variant: 'destructive' }); return; }
    setScores({
      accuracyScore: d.scores.accuracy, policyScore: d.scores.policy, toneScore: d.scores.tone,
      completenessScore: d.scores.completeness, zendeskScore: d.scores.zendesk,
    });
    setRisk((d.riskLevel ?? 'low').toUpperCase());
    setStatus(d.suggestedStatus ?? 'NEEDS_REVISION');
    setIssues((d.issues ?? []).join('\n'));
    if (d.summary) setNotes((prev) => prev ? prev : `AI: ${d.summary}`);
    toast({ title: 'AI pre-screened — review and adjust before saving', variant: 'success' });
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/qa/review/${sessionId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...scores, overallScore: overall, riskLevel: risk, status,
        issues: issues.split('\n').map((s) => s.trim()).filter(Boolean),
        notes: notes.trim() || undefined,
      }),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) { toast({ title: 'QA review saved', variant: 'success' }); onSaved(); }
    else toast({ title: d.error || 'Could not save', variant: 'destructive' });
  }

  if (err) return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={onBack} className="text-sm text-gray-500 mb-4 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
      <p className="text-red-600 text-sm">{err}</p>
    </div>
  );
  if (!detail) return <div className="p-10 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4 pb-16">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to QA list</button>

      {/* Context */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold text-gray-900">{detail.agent}</h2>
            <p className="text-xs text-gray-500">
              {detail.primaryIssue ? formatIssueCategory(detail.primaryIssue) : 'Uncategorized'}
              {detail.workflowName ? ` · ${detail.workflowName}` : ''}
              {detail.confidenceScore != null ? ` · ${detail.confidenceScore}% confidence` : ''}
            </p>
          </div>
          <Button onClick={preScreen} disabled={aiBusy} variant="outline" className="gap-1.5 flex-shrink-0">
            {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-capelli-navy" />}
            AI pre-screen
          </Button>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Customer complaint</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg border border-gray-200 p-3">{detail.complaint}</p>
        </div>
        {detail.customerEmail && (
          <details className="rounded-lg border border-gray-200 p-3">
            <summary className="text-xs font-semibold text-gray-500 cursor-pointer">Drafted customer email{detail.emailSubject ? ` — ${detail.emailSubject}` : ''}</summary>
            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{detail.customerEmail}</p>
          </details>
        )}
        {detail.internalNote && (
          <details className="rounded-lg border border-gray-200 p-3">
            <summary className="text-xs font-semibold text-gray-500 cursor-pointer">Internal Zendesk note</summary>
            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{detail.internalNote}</p>
          </details>
        )}
        {!detail.customerEmail && !detail.internalNote && (
          <p className="text-xs text-amber-600">No drafts were saved for this session — score the routing and note that below.</p>
        )}
        {detail.review && (
          <p className="text-xs text-gray-400">Last reviewed by {detail.review.reviewer ?? 'someone'} · {detail.review.overallScore}/100 · {String(detail.review.status).replace('_', ' ').toLowerCase()}</p>
        )}
      </div>

      {/* Rubric */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-capelli-navy">Rubric</h3>
          <span className="text-sm text-gray-500">Overall <strong className={cn(overall >= 85 ? 'text-capelli-success' : overall >= 60 ? 'text-capelli-warning' : 'text-capelli-danger')}>{overall}/100</strong></span>
        </div>
        {DIMS.map((d) => (
          <div key={d.key} className="flex items-center gap-3">
            <div className="w-40 flex-shrink-0">
              <p className="text-sm text-gray-700">{d.label}</p>
              <p className="text-[11px] text-gray-400">{d.hint}</p>
            </div>
            <input
              type="range" min={0} max={100} step={5} value={scores[d.key]}
              onChange={(e) => setScores((p) => ({ ...p, [d.key]: Number(e.target.value) }))}
              className="flex-1 accent-capelli-navy"
            />
            <span className="w-10 text-right text-sm font-semibold tabular-nums text-gray-700">{scores[d.key]}</span>
          </div>
        ))}
      </div>

      {/* Verdict */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-semibold text-gray-500">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').toLowerCase()}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-semibold text-gray-500">Risk</label>
            <select value={risk} onChange={(e) => setRisk(e.target.value as any)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {RISKS.map((r) => <option key={r} value={r}>{r.toLowerCase()}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500">Issues found (one per line)</label>
          <textarea value={issues} onChange={(e) => setIssues(e.target.value)} placeholder="e.g. Promised a delivery date — guardrail breach"
            className="mt-1 w-full min-h-[70px] rounded-lg border border-gray-200 p-3 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500">Reviewer notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional summary / coaching note"
            className="mt-1 w-full min-h-[60px] rounded-lg border border-gray-200 p-3 text-sm" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onBack} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2 bg-capelli-navy hover:bg-blue-900">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save review
          </Button>
        </div>
      </div>
    </div>
  );
}
