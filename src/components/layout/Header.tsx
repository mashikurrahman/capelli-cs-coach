'use client';

import { useSession } from 'next-auth/react';
import { Bell, Search } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 no-print">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>

      {/* Global search */}
      <form onSubmit={onSearch} className="hidden md:flex items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="search"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Search knowledge base…"
            className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg w-64
                       focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 focus:bg-white transition-all"
          />
        </div>
      </form>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative">
          <Bell className="w-4 h-4" />
        </button>

        {session?.user && (
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-7 h-7 rounded-full bg-capelli-navy flex items-center justify-center">
              <span className="text-xs text-white font-semibold">
                {(session.user.name ?? 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
