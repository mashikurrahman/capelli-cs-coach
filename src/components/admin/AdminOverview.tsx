'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, FileText, Ticket, AlertTriangle, Upload, Settings, BarChart2, ChevronRight, Shield } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/helpers';

interface Props {
  role: string;
  stats: { users: number; docs: number; sessions: number; unresolved: number };
  recentLogs: any[];
}

const adminLinks = [
  { href: '/admin/upload', label: 'Document Upload', desc: 'Upload and process training materials', icon: Upload, color: 'text-blue-600', tint: 'bg-blue-50', roles: ['ADMIN', 'TEAM_LEADER', 'TRAINER'] },
  { href: '/admin/users', label: 'User Management', desc: 'Add, edit, and deactivate team members', icon: Users, color: 'text-emerald-600', tint: 'bg-emerald-50', roles: ['ADMIN', 'TEAM_LEADER'] },
  { href: '/admin/analytics', label: 'Analytics', desc: 'View team performance metrics', icon: BarChart2, color: 'text-purple-600', tint: 'bg-purple-50', roles: ['ADMIN', 'TEAM_LEADER'] },
  { href: '/admin/settings', label: 'Settings', desc: 'App configuration and integrations', icon: Settings, color: 'text-slate-600', tint: 'bg-slate-100', roles: ['ADMIN'] },
];

export default function AdminOverview({ role, stats, recentLogs }: Props) {
  const visibleLinks = adminLinks.filter(l => l.roles.includes(role));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-capelli-navy" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin Panel</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage documents, users, and system settings</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Active Users', value: stats.users, icon: Users, color: 'text-capelli-navy', tint: 'bg-blue-50' },
          { label: 'Processed Docs', value: stats.docs, icon: FileText, color: 'text-capelli-success', tint: 'bg-green-50' },
          { label: 'Sessions (30d)', value: stats.sessions, icon: Ticket, color: 'text-purple-600', tint: 'bg-purple-50' },
          { label: 'Unresolved', value: stats.unresolved, icon: AlertTriangle, color: 'text-capelli-warning', tint: 'bg-amber-50' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="surface-panel surface-panel-hover p-5"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.tint}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleLinks.map(link => (
          <Link key={link.href} href={link.href} className="group">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="surface-panel surface-panel-hover flex items-center gap-4 p-5"
            >
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${link.tint}`}>
                <link.icon className={`h-6 w-6 ${link.color}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{link.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{link.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-capelli-navy" />
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="surface-panel overflow-hidden">
        <div className="border-b border-slate-100/80 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Recent Audit Log</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentLogs.length === 0 ? (
            <p className="p-5 text-center text-sm text-slate-400">No audit log entries yet</p>
          ) : (
            recentLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50/70">
                <div>
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">{log.user?.name ?? 'Unknown'}</span>
                    {' '}<span className="text-slate-300">.</span>{' '}
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{log.action}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{log.resource}{log.resourceId ? ` #${log.resourceId.slice(-8)}` : ''}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-slate-400">
                  {formatRelativeTime(new Date(log.createdAt))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
