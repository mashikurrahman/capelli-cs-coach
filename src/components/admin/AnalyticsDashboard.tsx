'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { BarChart2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Activity, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { formatIssueCategory, formatRelativeTime, getRiskColor } from '@/lib/utils/helpers';

async function fetchAnalytics(days: number) {
  const res = await fetch(`/api/analytics?days=${days}`);
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

async function fetchTicketMix() {
  const res = await fetch('/api/analytics/ticket-mix?recentDays=7');
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

const PERIOD_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const CHART_COLORS = ['#003087', '#CC0000', '#28a745', '#ffc107', '#6f42c1', '#17a2b8', '#fd7e14', '#20c997'];

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', days],
    queryFn: () => fetchAnalytics(days),
  });

  const { data: mix } = useQuery({ queryKey: ['ticket-mix'], queryFn: fetchTicketMix });

  const summary = data?.summary ?? {};
  const topIssues: any[] = (data?.topIssues ?? []).map((t: any) => ({
    name: formatIssueCategory(t.issue ?? 'UNKNOWN').replace(/\s+/g, '\n'),
    count: t.count,
    shortName: formatIssueCategory(t.issue ?? 'UNKNOWN').split(' ').slice(0, 2).join(' '),
  }));
  const recentSessions: any[] = data?.recentSessions ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Team performance and usage metrics</p>
        </div>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                days === opt.value
                  ? 'bg-capelli-navy text-white border-capelli-navy'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: summary.totalSessions, icon: Activity, color: 'text-capelli-navy', bg: 'bg-blue-50' },
          { label: 'Completion Rate', value: `${summary.completionRate ?? 0}%`, icon: CheckCircle2, color: 'text-capelli-success', bg: 'bg-green-50' },
          { label: 'Avg Confidence', value: `${summary.avgConfidence ?? 0}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Escalated', value: summary.escalatedSessions, icon: AlertTriangle, color: 'text-capelli-warning', bg: 'bg-yellow-50' },
        ].map((s, i) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            {isLoading ? (
              <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{s.value ?? 0}</p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Top issues chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
        <h2 className="font-semibold text-gray-800 mb-5">Top Issue Types</h2>
        {isLoading ? (
          <div className="h-52 bg-gray-100 rounded-lg animate-pulse" />
        ) : topIssues.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topIssues} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                formatter={(value: any) => [value, 'Sessions']}
                contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {topIssues.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Ticket mix vs baseline (A3) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <div>
            <h2 className="font-semibold text-gray-800">Ticket mix vs baseline</h2>
            <p className="text-xs text-gray-500">Last {mix?.recentDays ?? 7} days ({mix?.totals?.recent ?? 0} tickets) against the all-time mix ({mix?.totals?.allTime ?? 0} tickets).</p>
          </div>
        </div>

        {mix?.spikes?.length > 0 && (
          <div className="my-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1.5"><ArrowUpRight className="w-4 h-4" /> Above baseline this week</p>
            <div className="flex flex-wrap gap-2">
              {mix.spikes.map((r: any) => (
                <span key={r.category} className="text-xs bg-white border border-amber-200 rounded-full px-2.5 py-1 text-amber-900">
                  {formatIssueCategory(r.category)} <strong>+{r.delta}pts</strong> ({r.recentPct}% vs {r.baselinePct}%)
                </span>
              ))}
            </div>
          </div>
        )}

        {!mix ? (
          <div className="h-40 bg-gray-100 rounded-lg animate-pulse mt-3" />
        ) : mix.rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No tickets logged yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {mix.rows.slice(0, 10).map((r: any) => (
              <div key={r.category} className="flex items-center gap-3 text-sm">
                <span className="w-48 flex-shrink-0 text-gray-700 truncate">{formatIssueCategory(r.category)}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-capelli-navy" style={{ width: `${Math.min(100, r.recentPct)}%` }} />
                </div>
                <span className="w-12 text-right tabular-nums text-gray-600">{r.recentPct}%</span>
                <span className={cn('w-16 text-right tabular-nums inline-flex items-center justify-end gap-0.5 text-xs font-medium',
                  r.delta > 0 ? 'text-capelli-danger' : r.delta < 0 ? 'text-capelli-success' : 'text-gray-400')}>
                  {r.delta > 0 ? <TrendingUp className="w-3 h-3" /> : r.delta < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                  {r.delta > 0 ? '+' : ''}{r.delta}
                </span>
              </div>
            ))}
            <p className="text-[11px] text-gray-400 pt-1">Bar = share of last-{mix.recentDays}-day tickets. Right column = change vs the all-time baseline share (points).</p>
          </div>
        )}
      </div>

      {/* Recent sessions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Sessions</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentSessions.length === 0 ? (
            <p className="p-5 text-sm text-gray-400 text-center">No sessions in this period</p>
          ) : (
            recentSessions.map((s: any) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {s.primaryIssue ? formatIssueCategory(s.primaryIssue) : 'Unknown Issue'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.agent?.name} · {formatRelativeTime(new Date(s.createdAt))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.confidenceScore && <span className="text-xs text-gray-500">{s.confidenceScore}%</span>}
                  {s.riskLevel && (
                    <Badge variant={s.riskLevel === 'HIGH' ? 'danger' : s.riskLevel === 'MEDIUM' ? 'warning' : 'success'} className="text-xs">
                      {s.riskLevel}
                    </Badge>
                  )}
                  <Badge variant={s.status === 'COMPLETED' ? 'success' : s.status === 'ESCALATED' ? 'danger' : 'secondary'} className="text-xs">
                    {s.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
