'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Ticket, CheckCircle2, TrendingUp, BookOpen,
  ArrowRight, AlertTriangle, Clock, Activity,
  Megaphone, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, formatIssueCategory, getRiskColor } from '@/lib/utils/helpers';

interface Props {
  userName: string;
  role: string;
  stats: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    avgConfidence: number;
    docCount: number;
  };
  recentSessions: any[];
  updates: any[];
}

const statCards = [
  { key: 'totalSessions', label: 'Tickets This Month', icon: Ticket, color: 'text-capelli-navy', tint: 'bg-blue-50' },
  { key: 'completedSessions', label: 'Completed', icon: CheckCircle2, color: 'text-capelli-success', tint: 'bg-green-50' },
  { key: 'completionRate', label: 'Completion Rate', icon: TrendingUp, color: 'text-capelli-warning', tint: 'bg-amber-50', suffix: '%' },
  { key: 'avgConfidence', label: 'Avg. AI Confidence', icon: Activity, color: 'text-purple-600', tint: 'bg-purple-50', suffix: '%' },
];

export default function DashboardHome({ userName, role, stats, recentSessions, updates }: Props) {
  const firstName = userName.split(' ')[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-panel surface-panel-hover overflow-hidden"
      >
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div className="max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              <span className="h-2 w-2 rounded-full bg-capelli-success" />
              Operational snapshot
            </p>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 md:text-4xl">
              Good {getTimeGreeting()}, {firstName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500 md:text-base">
              Your customer service workspace is ready. Review activity, open a ticket, or jump into the workflow library.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="surface-muted px-4 py-3">
              <p className="text-xs text-slate-500">Knowledge base docs</p>
              <p className="text-xl font-semibold text-slate-900">{stats.docCount}</p>
            </div>
            <Link href="/ticket-coach">
              <Button size="lg" className="group gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/25 border-0 transition-all duration-300 hover:-translate-y-0.5">
                <Ticket className="h-5 w-5" />
                New Ticket
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {updates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-2"
        >
          {updates.map(u => (
            <div key={u.id} className="surface-panel surface-panel-hover flex items-start gap-3 border-blue-200/60 bg-blue-50/80 p-4">
              <Megaphone className="mt-0.5 h-5 w-5 flex-shrink-0 text-capelli-info" />
              <div>
                <p className="text-sm font-semibold text-capelli-info">{u.title}</p>
                <p className="mt-0.5 text-sm text-slate-600">{u.message}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.article
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 + 0.08 }}
            className="surface-panel surface-panel-hover p-5"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.tint}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="font-heading text-3xl font-bold text-slate-900">
              {(stats as any)[card.key]}{card.suffix ?? ''}
            </p>
            <p className="mt-1 text-xs text-slate-500">{card.label}</p>
          </motion.article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="surface-panel surface-panel-hover overflow-hidden lg:col-span-2"
        >
          <div className="flex items-center justify-between border-b border-slate-100/80 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent Tickets</h2>
            <Link href="/ticket-coach" className="inline-flex items-center gap-1 text-xs font-medium text-capelli-navy hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Ticket className="mx-auto mb-2 h-8 w-8 text-slate-200" />
              <p className="text-sm text-slate-500">No tickets yet this month</p>
              <Link href="/ticket-coach">
                <Button variant="outline" size="sm" className="mt-4">Start first ticket</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50/80">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {s.primaryIssue ? formatIssueCategory(s.primaryIssue) : 'Unknown Issue'}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(new Date(s.createdAt))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.confidenceScore && <span className="text-xs text-slate-500">{s.confidenceScore}%</span>}
                    {s.riskLevel && (
                      <Badge variant={getRiskBadge(s.riskLevel)} className="text-xs">
                        {s.riskLevel}
                      </Badge>
                    )}
                    <Badge variant={getStatusBadge(s.status)} className="text-xs">
                      {s.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="space-y-3"
        >
          <div className="surface-panel surface-panel-hover p-5">
            <h2 className="text-sm font-semibold text-slate-900">Quick Access</h2>
            <div className="mt-3 space-y-2">
              {quickLinks(role).map(link => (
                <Link key={link.href} href={link.href}>
                  <div className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-slate-50 hover:translate-x-0.5">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${link.tint}`}>
                      <link.icon className={`h-4 w-4 ${link.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 group-hover:text-capelli-navy">{link.label}</p>
                      <p className="text-xs text-slate-400">{link.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {stats.docCount === 0 && (
            <div className="surface-muted border-amber-200/70 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">No training documents</p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    Upload Capelli training materials so the AI can cite policies correctly.
                  </p>
                  {['ADMIN', 'TEAM_LEADER', 'TRAINER'].includes(role) && (
                    <Link href="/admin/upload">
                      <Button variant="warning" size="sm" className="mt-3 text-xs">Upload documents</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.aside>
      </div>
    </div>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getRiskBadge(risk: string) {
  if (risk === 'HIGH') return 'danger' as const;
  if (risk === 'MEDIUM') return 'warning' as const;
  return 'success' as const;
}

function getStatusBadge(status: string) {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'ESCALATED') return 'danger' as const;
  if (status === 'QA_PENDING') return 'purple' as const;
  return 'secondary' as const;
}

function quickLinks(role: string) {
  const links = [
    { href: '/ticket-coach', label: 'Ticket Coach', desc: 'Analyze a new ticket', icon: Ticket, tint: 'bg-blue-50', color: 'text-capelli-navy' },
    { href: '/workflows', label: 'Workflow Library', desc: 'Browse all 30 workflows', icon: BookOpen, tint: 'bg-green-50', color: 'text-capelli-success' },
    { href: '/knowledge-base', label: 'Knowledge Base', desc: 'Search training materials', icon: Activity, tint: 'bg-purple-50', color: 'text-purple-600' },
    { href: '/training', label: 'Training Mode', desc: 'Practice with scenarios', icon: TrendingUp, tint: 'bg-amber-50', color: 'text-amber-600' },
  ];

  if (['ADMIN', 'TEAM_LEADER'].includes(role)) {
    links.push({ href: '/admin/upload', label: 'Upload Documents', desc: 'Add training materials', icon: BookOpen, tint: 'bg-slate-100', color: 'text-slate-600' });
  }

  return links;
}
