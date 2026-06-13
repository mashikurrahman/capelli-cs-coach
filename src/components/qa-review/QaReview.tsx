'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck, Search, Clock, Flag, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
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
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNREVIEWED' | 'FLAGGED'>('ALL');

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
                  <tr key={s.id} className="hover:bg-gray-50/60">
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
