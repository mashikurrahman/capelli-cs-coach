'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, BookOpen, FileText, FileSpreadsheet, FileCode2, Loader2, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface SearchResult {
  id: string;
  content: string;
  sectionHeading: string | null;
  pageNumber: number | null;
  documentId: string;
  document: { id: string; title: string; fileName: string; category: string } | null;
  similarity?: number;
}

export default function KnowledgeBase() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      const res = await fetch(`/api/knowledge-base/search?q=${encodeURIComponent(q)}&limit=12`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Semantic search across all uploaded Capelli training materials
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="e.g. How to handle a return request for customized items?"
            className="pl-9"
            autoFocus
          />
        </div>
        <Button type="submit" disabled={loading} className="gap-2 bg-capelli-navy hover:bg-blue-900">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </Button>
      </form>

      {/* Tips */}
      {!searched && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Search Tips</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'Return policy for customized items',
              'OBD wave order process',
              'Team store password reset',
              'How to handle damaged goods',
              'Zendesk tags for refunds',
              'Escalation procedure steps',
            ].map(tip => (
              <button
                key={tip}
                onClick={() => { setQ(tip); }}
                className="text-left text-xs text-capelli-navy hover:text-blue-900 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-capelli-navy transition-colors flex items-center gap-2"
              >
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                {tip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-24" />
          ))}
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No results found for "{q}"</p>
          <p className="text-sm text-gray-400 mt-1">
            Try different keywords, or upload more training documents in Admin › Upload Docs.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-medium">{results.length} results for "{q}"</p>
          {results.map((r, i) => (
            <ResultCard key={r.id} result={r} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ result: r, index }: { result: SearchResult; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2">
            <FileIcon type={r.document?.category} />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {r.document?.title ?? 'Unknown Document'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {r.sectionHeading && <span>§ {r.sectionHeading}</span>}
                {r.pageNumber && <span> · Page {r.pageNumber}</span>}
              </p>
            </div>
          </div>
          {r.similarity !== undefined && (
            <Badge variant={r.similarity > 0.8 ? 'success' : r.similarity > 0.6 ? 'warning' : 'secondary'} className="flex-shrink-0 text-xs">
              {Math.round(r.similarity * 100)}% match
            </Badge>
          )}
        </div>

        <p className={cn('text-sm text-gray-600 leading-relaxed', !expanded && 'line-clamp-3')}>
          {r.content}
        </p>

        {r.content.length > 200 && (
          <button
            onClick={() => setExpanded(p => !p)}
            className="text-xs text-capelli-navy hover:underline mt-1"
          >
            {expanded ? 'Show less' : 'Show full text'}
          </button>
        )}
      </div>
    </div>
  );
}

function FileIcon({ type }: { type?: string }) {
  if (type === 'ZENDESK_TAGS' || type === 'CLUBS_PASSWORDS') return <FileSpreadsheet className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />;
  if (type === 'PRACTICE_QUESTIONS') return <FileCode2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />;
  return <FileText className="w-4 h-4 text-capelli-navy flex-shrink-0 mt-0.5" />;
}
