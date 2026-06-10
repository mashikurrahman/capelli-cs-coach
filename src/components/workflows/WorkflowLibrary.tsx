'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Tag, ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatIssueCategory } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils/cn';

const CATEGORIES = [
  'ALL', 'RETURN_EXCHANGE', 'ORDER_ISSUES', 'SHIPPING', 'TEAM_STORE', 'ACCOUNT', 'PRODUCT', 'OTHER'
];

async function fetchWorkflows(q: string) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  const res = await fetch(`/api/workflows?${params}`);
  if (!res.ok) throw new Error('Failed to load workflows');
  return res.json();
}

export default function WorkflowLibrary() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['workflows', debouncedQ],
    queryFn: () => fetchWorkflows(debouncedQ),
  });

  function handleSearch(val: string) {
    setQ(val);
    clearTimeout((window as any).__wfSearch);
    (window as any).__wfSearch = setTimeout(() => setDebouncedQ(val), 350);
  }

  const workflows = data?.workflows ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workflow Library</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          All 30 Capelli CS workflows — click any card to expand full details
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={q}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search workflows by name or issue type…"
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No workflows found. Run the database seed to load default workflows.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf: any) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              isExpanded={expanded === wf.id}
              onToggle={() => setExpanded(prev => prev === wf.id ? null : wf.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkflowCard({ workflow: wf, isExpanded, onToggle }: { workflow: any; isExpanded: boolean; onToggle: () => void }) {
  return (
    <motion.div
      layout
      className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden"
    >
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-capelli-navy/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-capelli-navy">#{wf.sortOrder ?? '?'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{wf.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {wf.whenToUse?.[0] ?? formatIssueCategory(wf.category)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={wf.status === 'APPROVED' ? 'approved' : wf.status === 'ARCHIVED' ? 'archived' : 'draft'}>
            {wf.status}
          </Badge>
          {wf._count?.sessions > 0 && (
            <span className="text-xs text-gray-400">{wf._count.sessions} uses</span>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100"
          >
            <div className="p-5 space-y-5">
              {/* When to use / not use */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wf.whenToUse?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-capelli-success mb-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> WHEN TO USE
                    </p>
                    <ul className="space-y-1">
                      {wf.whenToUse.map((item: string, i: number) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-green-400 flex-shrink-0 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {wf.doNotUseWhen?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-capelli-danger mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> DO NOT USE WHEN
                    </p>
                    <ul className="space-y-1">
                      {wf.doNotUseWhen.map((item: string, i: number) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-red-400 flex-shrink-0 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Steps */}
              {wf.steps?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2">STEPS ({wf.steps.length})</p>
                  <div className="space-y-2">
                    {wf.steps.map((step: any) => (
                      <div key={step.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                        <span className="w-5 h-5 rounded-full bg-capelli-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {step.stepNumber}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{step.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                          {step.warning && (
                            <p className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1 mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> {step.warning}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {wf.zendeskTags?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> ZENDESK TAGS
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {wf.zendeskTags.map((tag: any) => (
                      <span key={tag.id} className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        tag.isApproved ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      )}>
                        {tag.tagName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Common mistakes */}
              {wf.commonMistakes?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-capelli-danger mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> COMMON MISTAKES TO AVOID
                  </p>
                  <ul className="space-y-1">
                    {wf.commonMistakes.map((m: any) => (
                      <li key={m.id} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-red-400 flex-shrink-0 mt-0.5">✗</span>
                        {m.mistake}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
