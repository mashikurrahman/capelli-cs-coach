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
  { href: '/admin/upload', label: 'Document Upload', desc: 'Upload and process training materials', icon: Upload, color: 'text-blue-600', bg: 'bg-blue-50', roles: ['ADMIN', 'TEAM_LEADER', 'TRAINER'] },
  { href: '/admin/users', label: 'User Management', desc: 'Add, edit, and deactivate team members', icon: Users, color: 'text-green-600', bg: 'bg-green-50', roles: ['ADMIN', 'TEAM_LEADER'] },
  { href: '/admin/analytics', label: 'Analytics', desc: 'View team performance metrics', icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50', roles: ['ADMIN', 'TEAM_LEADER'] },
  { href: '/admin/settings', label: 'Settings', desc: 'App configuration and integrations', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-50', roles: ['ADMIN'] },
];

export default function AdminOverview({ role, stats, recentLogs }: Props) {
  const visibleLinks = adminLinks.filter(l => l.roles.includes(role));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-capelli-navy" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage documents, users, and system settings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Users', value: stats.users, icon: Users, color: 'text-capelli-navy', bg: 'bg-blue-50' },
          { label: 'Processed Docs', value: stats.docs, icon: FileText, color: 'text-capelli-success', bg: 'bg-green-50' },
          { label: 'Sessions (30d)', value: stats.sessions, icon: Ticket, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Unresolved', value: stats.unresolved, icon: AlertTriangle, color: 'text-capelli-warning', bg: 'bg-yellow-50' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-gray-200 shadow-card p-5"
          >
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Admin links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleLinks.map(link => (
          <Link key={link.href} href={link.href}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 shadow-card p-5 flex items-center gap-4 hover:border-capelli-navy cursor-pointer transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl ${link.bg} flex items-center justify-center flex-shrink-0`}>
                <link.icon className={`w-6 h-6 ${link.color}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 group-hover:text-gray-900">{link.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-capelli-navy transition-colors" />
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Recent audit log */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Audit Log</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentLogs.length === 0 ? (
            <p className="p-5 text-sm text-gray-400 text-center">No audit log entries yet</p>
          ) : (
            recentLogs.map(log => (
              <div key={log.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{log.user?.name ?? 'Unknown'}</span>
                    {' '}<span className="text-gray-500">·</span>{' '}
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{log.action}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{log.resource}{log.resourceId ? ` #${log.resourceId.slice(-8)}` : ''}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
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
