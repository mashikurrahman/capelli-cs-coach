'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Mail, ChevronRight, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

interface Template {
  id: string;
  name: string;
  category: string | null;
  keywords: string[];
  placeholders: string[];
}

export default function EmailTemplates({ templates }: { templates: Template[] }) {
  const [q, setQ] = useState('');
  const [activeCat, setActiveCat] = useState<string>('All');

  const categories = useMemo(() => {
    const set = new Map<string, number>();
    for (const t of templates) {
      const c = t.category ?? 'Other';
      set.set(c, (set.get(c) ?? 0) + 1);
    }
    return Array.from(set.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [templates]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return templates.filter(t => {
      if (activeCat !== 'All' && (t.category ?? 'Other') !== activeCat) return false;
      if (!needle) return true;
      return (
        t.name.toLowerCase().includes(needle) ||
        (t.category ?? '').toLowerCase().includes(needle) ||
        t.keywords.some(k => k.toLowerCase().includes(needle))
      );
    });
  }, [templates, q, activeCat]);

  // Group filtered results by category for display
  const grouped = useMemo(() => {
    const map = new Map<string, Template[]>();
    for (const t of filtered) {
      const c = t.category ?? 'Other';
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search templates by name, scenario, or keyword…"
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        {/* Category rail */}
        <aside className="space-y-1">
          <CatButton label="All" count={templates.length} active={activeCat === 'All'} onClick={() => setActiveCat('All')} />
          {categories.map(([cat, n]) => (
            <CatButton key={cat} label={cat} count={n} active={activeCat === cat} onClick={() => setActiveCat(cat)} />
          ))}
        </aside>

        {/* Results */}
        <div className="space-y-6">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
              <Mail className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              No templates match your search.
            </div>
          ) : (
            grouped.map(([cat, items]) => (
              <div key={cat}>
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  <Tag className="w-3.5 h-3.5" /> {cat}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map(t => (
                    <Link
                      key={t.id}
                      href={`/email-templates/${t.id}`}
                      className="group flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 shadow-card p-4
                                 hover:border-blue-200 hover:shadow-card-hover transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-capelli-navy truncate">{t.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t.placeholders.length > 0 ? `${t.placeholders.length} field${t.placeholders.length > 1 ? 's' : ''} to fill` : 'No fields — copy as-is'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-capelli-navy flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CatButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
        active ? 'bg-capelli-navy text-white' : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      <span className="truncate">{label}</span>
      <span className={cn('text-xs', active ? 'text-white/70' : 'text-gray-400')}>{count}</span>
    </button>
  );
}
