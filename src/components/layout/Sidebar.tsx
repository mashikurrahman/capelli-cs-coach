'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils/cn';
import { getInitials } from '@/lib/utils/helpers';
import {
  Bot, BookOpen, FileText, Search, GraduationCap, ShieldCheck,
  LayoutDashboard, Settings, LogOut, ChevronLeft, ChevronRight,
  Upload, Users, BarChart3, Tag,
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
        'flex flex-col h-screen bg-sidebar shadow-sidebar transition-all duration-300 relative z-20 no-print',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-white/10', collapsed ? 'justify-center px-0' : 'px-5 gap-3')}>
        <div className="flex-shrink-0 w-8 h-8 bg-capelli-red rounded-lg flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white text-sm font-bold leading-tight">Capelli</p>
            <p className="text-sidebar-text text-xs">CS Coach</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-14 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-30"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-gray-500" /> : <ChevronLeft className="w-3 h-3 text-gray-500" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 custom-scroll">
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
              <p className="text-xs font-semibold text-sidebar-text/50 uppercase tracking-wider px-3 mt-5 mb-1">
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
      <div className={cn('border-t border-white/10 p-2', collapsed ? '' : '')}>
        {!collapsed && session?.user && (
          <div className="px-3 py-2 flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-capelli-blue flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-white font-semibold">
                {getInitials(session.user.name ?? 'U')}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{session.user.name}</p>
              <p className="text-sidebar-text text-xs truncate">{role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors text-sm',
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
        <span className="text-[10px] font-bold bg-capelli-red text-white px-1.5 py-0.5 rounded">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
