'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils/cn';
import { getInitials } from '@/lib/utils/helpers';
import {
  Bot, BookOpen, FileText, Search, GraduationCap, ShieldCheck,
  LayoutDashboard, Settings, LogOut, ChevronLeft, ChevronRight,
  Upload, Users, BarChart3, MessageSquare,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/ticket-coach', label: 'Ticket Coach', icon: <Bot className="w-4 h-4" />, badge: 'CORE' },
  { href: '/workflows', label: 'Workflow Library', icon: <BookOpen className="w-4 h-4" /> },
  { href: '/email-templates', label: 'Email Templates', icon: <FileText className="w-4 h-4" /> },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: <Search className="w-4 h-4" /> },
  { href: '/training', label: 'Training Mode', icon: <GraduationCap className="w-4 h-4" /> },
  { href: '/chat', label: 'Team Chat', icon: <MessageSquare className="w-4 h-4" /> },
  { href: '/qa-review', label: 'QA Review', icon: <ShieldCheck className="w-4 h-4" />, roles: ['ADMIN', 'TEAM_LEADER', 'QA'] },
];

const adminItems: NavItem[] = [
  { href: '/admin', label: 'Admin Overview', icon: <Settings className="w-4 h-4" />, roles: ['ADMIN', 'TEAM_LEADER'] },
  { href: '/admin/upload', label: 'Upload Docs', icon: <Upload className="w-4 h-4" />, roles: ['ADMIN', 'TRAINER'] },
  { href: '/admin/users', label: 'Manage Users', icon: <Users className="w-4 h-4" />, roles: ['ADMIN'] },
  { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, roles: ['ADMIN', 'TEAM_LEADER'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const role = (session?.user as { role?: string })?.role ?? 'AGENT';

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  function canSee(item: NavItem) {
    if (!item.roles) return true;
    return item.roles.includes(role);
  }

  return (
    <aside
      className={cn(
        'relative z-20 flex h-screen flex-col border-r border-white/5 bg-slate-950/80 text-white shadow-sidebar backdrop-blur-3xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] no-print',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b border-white/10', collapsed ? 'justify-center px-0' : 'gap-3 px-5')}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20">
          <Bot className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-semibold leading-tight text-white">Capelli</p>
            <p className="text-xs text-slate-400">CS Coach</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-14 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 custom-scroll">
        {/* Main nav */}
        <div className="space-y-0.5">
          {navItems.filter(canSee).map(item => (
            <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
          ))}
        </div>

        {/* Admin section */}
        {adminItems.some(canSee) && (
          <>
            {!collapsed && (
              <p className="mb-1 mt-5 px-3 text-xs font-semibold uppercase text-slate-400">
                Admin
              </p>
            )}
            {collapsed && <div className="my-3 border-t border-white/10" />}
            <div className="space-y-0.5">
              {adminItems.filter(canSee).map(item => (
                <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User profile + logout */}
      <div className="border-t border-white/10 p-2">
        {!collapsed && session?.user && (
          <div className="mb-1 flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-capelli-blue">
              <span className="text-xs font-semibold text-white">
                {getInitials(session.user.name ?? 'U')}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">{session.user.name}</p>
              <p className="truncate text-xs text-slate-400">{role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 transition-all duration-300 hover:translate-x-1 hover:bg-white/10 hover:text-white',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}

function NavLink({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        'sidebar-item group',
        active && 'active',
        collapsed && 'justify-center px-0 py-2.5'
      )}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!collapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {!collapsed && item.badge && (
        <span className="rounded-full bg-capelli-red px-1.5 py-0.5 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
