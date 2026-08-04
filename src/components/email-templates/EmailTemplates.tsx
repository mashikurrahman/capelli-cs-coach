'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Mail, ChevronRight, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { COMPLAINT_CATEGORIES } from '@/lib/templates/email-templates';

interface Template {
  id: string;
  name: string;
  category: string | null;
  complaints: string[];
  keywords: string[];
  placeholders: string[];
}

export default function EmailTemplates({ templates }: { templates: Template[] }) {
  const [q, setQ] = useState('');
  const [activeCat, setActiveCat] = useState<string>('All');

  const complaintsOf = (t: Template) => (t.complaints?.length ? t.complaints : ['General / Policy']);

  // Category rail in the canonical complaint order, with per-bucket counts.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of templates) for (const c of complaintsOf(t)) counts.set(c, (counts.get(c) ?? 0) + 1);
    const ordered = COMPLAINT_CATEGORIES.filter(c => counts.has(c)).map(c => [c, counts.get(c)!] as [string, number]);
    // Any stray bucket not in the canonical list, appended.
    for (const [c, n] of counts) if (!COMPLAINT_CATEGORIES.includes(c as any)) ordered.push([c, n]);
    return ordered;
  }, [templates]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return templates.filter(t => {
      if (activeCat !== 'All' && !complaintsOf(t).includes(activeCat)) return false;
      if (!needle) return true;
      return (
        t.name.toLowerCase().includes(needle) ||
        complaintsOf(t).some(c => c.toLowerCase().includes(needle)) ||
        t.keywords.some(k => k.toLowerCase().includes(needle))
      );
    });
  }, [templates, q, activeCat]);

  // Group by complaint (canonical order). A template appears under each of its
  // complaint buckets; when a bucket is selected, only that bucket shows.
  const grouped = useMemo(() => {
    const order = activeCat === 'All' ? categories.map(([c]) => c) : [activeCat];
    return order
      .map(cat => [cat, filtered.filter(t => complaintsOf(t).includes(cat))] as [string, Template[]])
      .filter(([, items]) => items.length > 0);
  }, [filtered, categories, activeCat]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by complaint, template name, or keyword…"
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
                  {items.map((t, i) => (
                    <Link
                      key={t.id}
                      href={`/email-templates/${t.id}`}
                      style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                      className="group flex animate-fade-up items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 shadow-card p-4
                                 [animation-fill-mode:backwards] hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-card-hover transition-all"
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
