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
  { key: 'totalSessions', label: 'Tickets This Month', icon: Ticket, color: 'text-capelli-navy', bg: 'bg-blue-50' },
  { key: 'completedSessions', label: 'Completed', icon: CheckCircle2, color: 'text-capelli-success', bg: 'bg-green-50' },
  { key: 'completionRate', label: 'Completion Rate', icon: TrendingUp, color: 'text-capelli-warning', bg: 'bg-yellow-50', suffix: '%' },
  { key: 'avgConfidence', label: 'Avg. AI Confidence', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50', suffix: '%' },
];

export default function DashboardHome({ userName, role, stats, recentSessions, updates }: Props) {
  const firstName = userName.split(' ')[0];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getTimeGreeting()}, {firstName} 👋
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Welcome back to the Capelli CS Workflow Coach
          </p>
        </div>
        <Link href="/ticket-coach">
          <Button size="lg" className="gap-2 bg-capelli-navy hover:bg-blue-900">
            <Ticket className="w-5 h-5" />
            New Ticket
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </motion.div>

      {/* Admin updates banner */}
      {updates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-2"
        >
          {updates.map((u, i) => (
            <div key={u.id} className="bg-capelli-infoBg border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Megaphone className="w-5 h-5 text-capelli-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-capelli-info text-sm">{u.title}</p>
                <p className="text-sm text-blue-700 mt-0.5">{u.message}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.1 }}
            className="bg-white rounded-xl border border-gray-200 shadow-card p-5"
          >
            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(stats as any)[card.key]}{card.suffix ?? ''}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tickets */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Recent Tickets</h2>
            <Link href="/ticket-coach" className="text-xs text-capelli-navy font-medium hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentSessions.length === 0 ? (
            <div className="p-8 text-center">
              <Ticket className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No tickets yet this month</p>
              <Link href="/ticket-coach">
                <Button variant="outline" size="sm" className="mt-3">Start First Ticket</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentSessions.map(s => (
                <div key={s.id} className="px-5 py-3.5 hover:bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {s.primaryIssue ? formatIssueCategory(s.primaryIssue) : 'Unknown Issue'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(new Date(s.createdAt))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.confidenceScore && (
                      <span className="text-xs text-gray-500">{s.confidenceScore}%</span>
                    )}
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
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Quick Access</h2>
            {quickLinks(role).map(link => (
              <Link key={link.href} href={link.href}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer group">
                  <div className={`w-8 h-8 rounded-lg ${link.bg} flex items-center justify-center flex-shrink-0`}>
                    <link.icon className={`w-4 h-4 ${link.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{link.label}</p>
                    <p className="text-xs text-gray-400">{link.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-500" />
                </div>
              </Link>
            ))}
          </div>

          {/* Training tip */}
          {stats.docCount === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">No Training Documents</p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    Upload Capelli training materials so the AI can cite policies correctly.
                  </p>
                  {['ADMIN', 'TEAM_LEADER', 'TRAINER'].includes(role) && (
                    <Link href="/admin/upload">
                      <Button variant="warning" size="sm" className="mt-2 text-xs">Upload Documents</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
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
    { href: '/ticket-coach', label: 'Ticket Coach', desc: 'Analyze a new ticket', icon: Ticket, bg: 'bg-blue-50', color: 'text-capelli-navy' },
    { href: '/workflows', label: 'Workflow Library', desc: 'Browse all 30 workflows', icon: BookOpen, bg: 'bg-green-50', color: 'text-capelli-success' },
    { href: '/knowledge-base', label: 'Knowledge Base', desc: 'Search training materials', icon: Activity, bg: 'bg-purple-50', color: 'text-purple-600' },
    { href: '/training', label: 'Training Mode', desc: 'Practice with scenarios', icon: TrendingUp, bg: 'bg-yellow-50', color: 'text-yellow-600' },
  ];

  if (['ADMIN', 'TEAM_LEADER'].includes(role)) {
    links.push({ href: '/admin/upload', label: 'Upload Documents', desc: 'Add training materials', icon: BookOpen, bg: 'bg-orange-50', color: 'text-orange-600' });
  }

  return links;
}
