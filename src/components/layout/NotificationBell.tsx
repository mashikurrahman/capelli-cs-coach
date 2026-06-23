'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminUpdate {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

const SEEN_KEY = 'capelli:seen-updates';

function loadSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); }
  catch { return new Set(); }
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '';
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell() {
  const [updates, setUpdates] = useState<AdminUpdate[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSeen(loadSeen());
    let alive = true;
    fetch('/api/admin/updates')
      .then(r => (r.ok ? r.json() : { updates: [] }))
      .then(d => { if (alive) setUpdates(d.updates ?? []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const unreadCount = updates.filter(u => !seen.has(u.id)).length;

  // Mark everything currently shown as seen (clears the dot).
  const markAllSeen = useCallback(() => {
    const next = new Set(seen);
    updates.forEach(u => next.add(u.id));
    setSeen(next);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...next])); } catch {}
  }, [seen, updates]);

  function toggle() {
    setOpen(o => {
      const nextOpen = !o;
      if (nextOpen && unreadCount > 0) markAllSeen();
      return nextOpen;
    });
  }

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative h-10 w-10 rounded-full text-slate-500 hover:text-slate-900"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-capelli-red ring-2 ring-white" />
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-12 z-20 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {updates.length > 0 && <span className="text-xs text-slate-400">{updates.length}</span>}
          </div>
          {updates.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto mb-2 h-6 w-6 text-slate-300" />
              <p className="text-sm text-slate-400">You're all caught up.</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto custom-scroll">
              {updates.map(u => (
                <li key={u.id} className="flex items-start gap-3 border-b border-slate-50 px-4 py-3 last:border-0">
                  <Megaphone className="mt-0.5 h-4 w-4 flex-shrink-0 text-capelli-info" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{u.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-500">{u.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{timeAgo(u.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
