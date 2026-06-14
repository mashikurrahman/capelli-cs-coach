'use client';

import { useSession } from 'next-auth/react';
import { Bell, Search, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { openCommandPalette } from '@/components/command/command-events';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent));
  }, []);

  return (
    <header className="glass no-print sticky top-0 z-10 flex h-18 items-center gap-4 px-6">
      <div className="min-w-0 flex-1">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/60 px-2.5 py-1 text-[11px] font-medium text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-capelli-navy" />
          Live workspace
        </div>
        <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
      </div>

      {/* Command palette trigger — looks like search, opens ⌘K */}
      <button
        type="button"
        onClick={openCommandPalette}
        className="press group hidden w-72 items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/60 py-2 pl-3.5 pr-2 text-left text-sm text-slate-400 shadow-sm transition-all hover:border-slate-300 hover:bg-white md:flex"
      >
        <Search className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition-colors group-hover:text-slate-500" />
        <span className="flex-1 truncate">Search or jump to…</span>
        <kbd className="flex-shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        {/* Mobile / narrow: icon-only palette trigger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={openCommandPalette}
          aria-label="Open command palette"
          className="h-10 w-10 rounded-full text-slate-500 hover:text-slate-900 md:hidden"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full text-slate-500 hover:text-slate-900">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-capelli-red" />
        </Button>

        {session?.user && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-capelli-navy shadow-sm">
              <span className="text-xs font-semibold text-white">
                {(session.user.name ?? 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
