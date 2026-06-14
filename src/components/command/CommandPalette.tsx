'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, CornerDownLeft, FileText, LayoutDashboard, Bot, BookOpen,
  GraduationCap, ShieldCheck, Settings, Upload, Users, BarChart3,
  Sparkles, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { COMMAND_PALETTE_OPEN } from './command-events';
import { getRecentTemplates, type RecentTemplate } from '@/lib/recents';
import { Clock } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  group: string;
  keywords?: string;
  hint?: string;
  icon: React.ReactNode;
  perform: () => void;
}

interface NavDef {
  href: string;
  label: string;
  keywords: string;
  icon: React.ReactNode;
  roles?: string[];
}

const NAV: NavDef[] = [
  { href: '/dashboard', label: 'Dashboard', keywords: 'home overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/ticket-coach', label: 'Ticket Coach', keywords: 'workflow steps complaint', icon: <Bot className="h-4 w-4" /> },
  { href: '/workflows', label: 'Workflow Library', keywords: 'process guides', icon: <BookOpen className="h-4 w-4" /> },
  { href: '/email-templates', label: 'Email Templates', keywords: 'canned replies messages', icon: <FileText className="h-4 w-4" /> },
  { href: '/knowledge-base', label: 'Knowledge Base', keywords: 'docs search policy', icon: <Search className="h-4 w-4" /> },
  { href: '/training', label: 'Training Mode', keywords: 'practice scenarios learn', icon: <GraduationCap className="h-4 w-4" /> },
  { href: '/qa-review', label: 'QA Review', keywords: 'quality audit', icon: <ShieldCheck className="h-4 w-4" />, roles: ['ADMIN', 'TEAM_LEADER', 'QA'] },
  { href: '/admin', label: 'Admin Overview', keywords: 'settings admin', icon: <Settings className="h-4 w-4" />, roles: ['ADMIN', 'TEAM_LEADER'] },
  { href: '/admin/upload', label: 'Upload Docs', keywords: 'documents files import', icon: <Upload className="h-4 w-4" />, roles: ['ADMIN', 'TRAINER'] },
  { href: '/admin/users', label: 'Manage Users', keywords: 'accounts team members', icon: <Users className="h-4 w-4" />, roles: ['ADMIN'] },
  { href: '/admin/analytics', label: 'Analytics', keywords: 'metrics reports stats', icon: <BarChart3 className="h-4 w-4" />, roles: ['ADMIN', 'TEAM_LEADER'] },
];

interface TemplateLite { id: string; name: string; category: string | null }

async function fetchTemplates(): Promise<TemplateLite[]> {
  const res = await fetch('/api/templates');
  if (!res.ok) return [];
  return (await res.json()).templates ?? [];
}

export default function CommandPalette() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? 'AGENT';

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState<RecentTemplate[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Templates load lazily the first time the palette opens, then cache.
  const { data: templates = [] } = useQuery({
    queryKey: ['palette-templates'],
    queryFn: fetchTemplates,
    enabled: open && !!session?.user,
    staleTime: 5 * 60 * 1000,
  });

  function close() { setOpen(false); }

  function go(href: string) {
    close();
    router.push(href);
  }

  // Open via ⌘K / Ctrl+K, the custom event, and "/" (when not typing). Esc closes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    function onOpen() { setOpen(true); }
    window.addEventListener('keydown', onKey);
    window.addEventListener(COMMAND_PALETTE_OPEN, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(COMMAND_PALETTE_OPEN, onOpen);
    };
  }, []);

  // Reset + focus + refresh recents each time it opens.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setRecents(getRecentTemplates());
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();

    const base: CommandItem[] = [];

    // Recent templates — only when not actively searching, for instant return
    // to whatever the agent was last working on.
    if (!q) {
      for (const r of recents) {
        base.push({
          id: `recent-${r.id}`, group: 'Recent', label: r.name,
          keywords: `${r.category ?? ''} recent template`, hint: r.category ?? undefined,
          icon: <Clock className="h-4 w-4" />, perform: () => go(`/email-templates/${r.id}`),
        });
      }
    }

    // Quick actions
    base.push({
      id: 'action-new-ticket', group: 'Actions', label: 'Start a new ticket',
      keywords: 'coach analyze complaint new', icon: <Bot className="h-4 w-4" />,
      hint: 'Ticket Coach', perform: () => go('/ticket-coach'),
    });

    // Navigation (role-filtered)
    for (const n of NAV) {
      if (n.roles && !n.roles.includes(role)) continue;
      base.push({
        id: `nav-${n.href}`, group: 'Go to', label: n.label,
        keywords: n.keywords, icon: n.icon, perform: () => go(n.href),
      });
    }

    // Email templates (deep link)
    for (const t of templates) {
      base.push({
        id: `tpl-${t.id}`, group: 'Email Templates', label: t.name,
        keywords: `${t.category ?? ''} template email`, hint: t.category ?? undefined,
        icon: <FileText className="h-4 w-4" />, perform: () => go(`/email-templates/${t.id}`),
      });
    }

    const filtered = q
      ? base.filter(i => (i.label + ' ' + (i.keywords ?? '')).toLowerCase().includes(q))
      : base;

    // Dynamic KB search always available when there's a query.
    if (q) {
      filtered.unshift({
        id: 'action-kb-search', group: 'Actions',
        label: `Search knowledge base for “${query.trim()}”`,
        icon: <Search className="h-4 w-4" />, hint: 'Enter',
        perform: () => go(`/knowledge-base?q=${encodeURIComponent(query.trim())}`),
      });
    }

    return filtered;
  }, [query, role, templates, recents]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clamp active index when the list shrinks.
  useEffect(() => { setActive(a => Math.min(a, Math.max(0, items.length - 1))); }, [items.length]);

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); items[active]?.perform(); }
  }

  // Keep the active row visible.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  // Group the filtered items in order, but keep a flat index for keyboard nav.
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, { item: CommandItem; idx: number }[]>();
    items.forEach((item, idx) => {
      if (!map.has(item.group)) { map.set(item.group, []); order.push(item.group); }
      map.get(item.group)!.push({ item, idx });
    });
    return order.map(g => ({ group: g, rows: map.get(g)! }));
  }, [items]);

  if (!session?.user) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh] no-print"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            role="dialog" aria-modal="true" aria-label="Command palette"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="glass-strong relative w-full max-w-xl overflow-hidden rounded-2xl"
          >
            {/* Input */}
            <div className="flex items-center gap-3 border-b border-slate-200/70 px-4">
              <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={onInputKeyDown}
                placeholder="Search templates, pages, or actions…"
                className="h-14 flex-1 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <kbd className="hidden flex-shrink-0 rounded-md border border-slate-200 bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:block">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[52vh] overflow-y-auto px-2 py-2 custom-scroll">
              {items.length === 0 ? (
                <div className="px-3 py-10 text-center">
                  <Sparkles className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                  <p className="text-sm text-slate-500">No matches. Try a different word.</p>
                </div>
              ) : (
                groups.map(({ group, rows }) => (
                  <div key={group} className="mb-1">
                    <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {group}
                    </p>
                    {rows.map(({ item, idx }) => (
                      <button
                        key={item.id}
                        type="button"
                        data-idx={idx}
                        onMouseMove={() => setActive(idx)}
                        onClick={() => item.perform()}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                          active === idx ? 'bg-capelli-navy text-white' : 'text-slate-700 hover:bg-slate-100'
                        )}
                      >
                        <span className={cn('flex-shrink-0', active === idx ? 'text-white' : 'text-slate-400')}>
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.hint && (
                          <span className={cn('flex-shrink-0 text-[11px]', active === idx ? 'text-blue-100' : 'text-slate-400')}>
                            {item.hint}
                          </span>
                        )}
                        {active === idx && <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-blue-100" />}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center justify-between border-t border-slate-200/70 bg-white/40 px-4 py-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <CornerDownLeft className="h-3 w-3" /> to select
              </span>
              <span>↑ ↓ to navigate · esc to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
