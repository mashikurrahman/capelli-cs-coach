'use client';

import { useSession } from 'next-auth/react';
import { Bell, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchVal, setSearchVal] = useState('');

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/knowledge-base?q=${encodeURIComponent(searchVal.trim())}`);
    }
  }

  return (
    <header className="no-print sticky top-0 z-10 flex h-18 items-center gap-4 border-b border-white/70 bg-white/72 px-6 backdrop-blur-xl">
      <div className="flex-1 min-w-0">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-capelli-navy" />
          Live workspace
        </div>
        <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
      </div>

      <form onSubmit={onSearch} className="hidden items-center md:flex">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Search knowledge base..."
            className="w-72 rounded-full border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-4 text-sm shadow-sm transition-all duration-200 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
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
