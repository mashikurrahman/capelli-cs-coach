'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, ChevronRight, RotateCcw, CheckCircle2, LayoutGrid, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import WorkflowRunner from './WorkflowRunner';
import { matchWorkflows } from '@/lib/workflows/match';
import { cleanComplaint } from '@/lib/text/clean-complaint';
import { DEFAULT_WORKFLOWS, type WorkflowDefinition } from '@/lib/workflows/default-workflows';
import type { TemplateLite } from '@/lib/workflows/match';

type Phase = 'input' | 'pick' | 'run' | 'done';

interface DisplayMatch {
  workflow: WorkflowDefinition;
  matchedPhrases: string[];
  score?: number;
  method?: 'both' | 'keyword' | 'semantic' | 'ai';
}

interface Analysis {
  issues: string[];
  reasoning: string;
  extracted: Record<string, string>;
}

const EXAMPLES = [
  'I ordered a medium jersey but received a large. Order CS12345.',
  'My package says delivered but I never received it.',
  "I want to return this hoodie, it's the wrong size and unworn.",
  'I need to cancel my order, I placed it this morning.',
  "I can't access the team store. What's the password?",
  'The item I ordered is out of stock — what are my options?',
];

export default function TicketCoachV2({ templates }: { templates: TemplateLite[] }) {
  const [phase, setPhase] = useState<Phase>('input');
  const [complaint, setComplaint] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [clubName, setClubName] = useState('');
  const [selected, setSelected] = useState<WorkflowDefinition | null>(null);
  const [browseAll, setBrowseAll] = useState(false);
  const [hybridMatches, setHybridMatches] = useState<DisplayMatch[] | null>(null);
  const [hybridLoading, setHybridLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  // Instant keyword matches (on cleaned text) — shown immediately while the
  // hybrid (keyword + semantic) result is fetched in the background.
  const keywordMatches = useMemo<DisplayMatch[]>(() => {
    const c = complaint.trim();
    if (!c) return [];
    return matchWorkflows(cleanComplaint(c), 4).map(m => ({
      workflow: m.workflow,
      matchedPhrases: m.matchedPhrases,
      method: 'keyword' as const,
    }));
  }, [complaint]);

  // Debounced hybrid match: blends keyword + semantic server-side for accuracy.
  const reqId = useRef(0);
  useEffect(() => {
    const c = complaint.trim();
    if (c.length < 6) { setHybridMatches(null); setHybridLoading(false); setAnalysis(null); return; }
    const id = ++reqId.current;
    setHybridLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch('/api/ticket-coach/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ complaint: c }),
        });
        const data = await res.json();
        if (id !== reqId.current) return; // a newer request superseded this one
        const mapped: DisplayMatch[] = (data.matches ?? [])
          .map((m: { workflowId: string; score: number; matchedPhrases: string[]; method: DisplayMatch['method'] }) => {
            const workflow = DEFAULT_WORKFLOWS.find(w => w.workflowId === m.workflowId);
            return workflow ? { workflow, matchedPhrases: m.matchedPhrases ?? [], score: m.score, method: m.method } : null;
          })
          .filter(Boolean);
        setHybridMatches(mapped);
        // The brain ran on a tricky complaint — surface its understanding and
        // auto-fill any details it pulled out (only into empty fields).
        const a: Analysis | undefined = data.analysis;
        setAnalysis(a ?? null);
        if (a?.extracted) {
          if (a.extracted.orderNumber) setOrderNumber(prev => prev || a.extracted.orderNumber);
          if (a.extracted.clubName) setClubName(prev => prev || a.extracted.clubName);
        }
      } catch {
        if (id === reqId.current) setHybridMatches(null); // fall back to keyword view
      } finally {
        if (id === reqId.current) setHybridLoading(false);
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [complaint]);

  // Prefer the blended result once it arrives; keyword matches cover the gap.
  const matches: DisplayMatch[] = (hybridMatches && hybridMatches.length > 0) ? hybridMatches : keywordMatches;

  const grouped = useMemo(() => {
    const map = new Map<string, WorkflowDefinition[]>();
    for (const wf of [...DEFAULT_WORKFLOWS].sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (!map.has(wf.category)) map.set(wf.category, []);
      map.get(wf.category)!.push(wf);
    }
    return Array.from(map.entries());
  }, []);

  function pick(wf: WorkflowDefinition) { setSelected(wf); setPhase('run'); }

  function reset() {
    setPhase('input'); setComplaint(''); setOrderNumber(''); setClubName('');
    setSelected(null); setBrowseAll(false); setHybridMatches(null); setAnalysis(null);
  }

  function complete() {
    setPhase('done');
    // Fire-and-forget completion log (keeps dashboard metrics alive).
    fetch('/api/ticket-coach/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaint, orderNumber: orderNumber || undefined, clubName: clubName || undefined,
        workflowId: selected?.workflowId, workflowName: selected?.name,
      }),
    }).catch(() => {});
  }

  // ── Run phase ──
  if (phase === 'run' && selected) {
    return (
      <div className="h-full overflow-y-auto custom-scroll">
        <WorkflowRunner
          workflow={selected}
          complaint={complaint}
          orderNumber={orderNumber || undefined}
          clubName={clubName || undefined}
          templates={templates}
          onChangeWorkflow={() => setPhase('pick')}
          onComplete={complete}
        />
      </div>
    );
  }

  // ── Done phase ──
  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-capelli-success" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">Ticket handled</h2>
          <p className="text-sm text-gray-500 mt-1">{selected?.name} completed.</p>
        </div>
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-capelli-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-capelli-navyLight transition-colors">
          <RotateCcw className="w-4 h-4" /> New ticket
        </button>
      </div>
    );
  }

  // ── Input / Pick phase (shared scroll) ──
  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        {/* Complaint input */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <label className="block text-sm font-semibold text-gray-800 mb-2">Customer message</label>
          <textarea
            value={complaint}
            onChange={e => setComplaint(e.target.value)}
            placeholder="Paste the customer's message here…"
            className="w-full min-h-[120px] rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="Order # (optional)"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300" />
            <input value={clubName} onChange={e => setClubName(e.target.value)} placeholder="Club / team (optional)"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {EXAMPLES.map((ex, i) => (
              <button key={i} type="button" onClick={() => setComplaint(ex)}
                className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-capelli-navy border border-gray-200 hover:border-blue-200 rounded-lg px-2.5 py-1 transition-colors text-left">
                {ex.slice(0, 42)}…
              </button>
            ))}
          </div>
        </div>

        {/* AI understanding of a tricky complaint */}
        {analysis && (analysis.issues.length > 0 || analysis.reasoning) && (
          <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Understood by AI
            </p>
            {analysis.issues.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {analysis.issues.map((iss, i) => (
                  <span key={i} className="text-xs bg-white border border-purple-200 text-purple-800 rounded-full px-2.5 py-0.5">{iss}</span>
                ))}
              </div>
            )}
            {analysis.reasoning && <p className="text-xs text-gray-600">{analysis.reasoning}</p>}
            {Object.keys(analysis.extracted).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {Object.entries(analysis.extracted).map(([k, v]) => (
                  <span key={k}><span className="font-medium text-gray-600">{k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}:</span> {v}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Matched workflows */}
        {complaint.trim() && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <Sparkles className="w-4 h-4 text-capelli-navy" /> Matching workflows
                {hybridLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
              </h3>
              <button type="button" onClick={() => setBrowseAll(b => !b)} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-capelli-navy">
                <LayoutGrid className="w-3.5 h-3.5" /> {browseAll ? 'Hide all' : 'Browse all'}
              </button>
            </div>

            {matches.length > 0 ? (
              <div className="space-y-2">
                {(() => {
                  // Only call the top result a confident "Best match" when the
                  // signal is strong (exact keyword hit, both signals agree, or
                  // a high blended score). Otherwise present it as a softer
                  // suggestion so a weak semantic guess never looks authoritative.
                  const top = matches[0];
                  const confident = top.score === undefined || top.method === 'both' || top.method === 'ai' || (top.score ?? 0) >= 0.6;
                  return (<>
                  {!confident && (
                    <p className="text-xs text-amber-600 mb-1">Not certain — review these or Browse all.</p>
                  )}
                  {matches.map(({ workflow, matchedPhrases }, idx) => (
                  <button key={workflow.workflowId} type="button" onClick={() => pick(workflow)}
                    className={cn(
                      'w-full text-left flex items-center justify-between gap-3 bg-white rounded-xl border p-4 transition-all hover:shadow-card-hover',
                      idx === 0 && confident ? 'border-capelli-navy ring-1 ring-capelli-navy/20' : 'border-gray-200 hover:border-blue-200'
                    )}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{workflow.name}</p>
                        {idx === 0 && confident && <span className="text-[10px] font-bold uppercase text-capelli-navy bg-blue-50 px-1.5 py-0.5 rounded">Best match</span>}
                      </div>
                      {matchedPhrases.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">Matched: {matchedPhrases.slice(0, 4).join(', ')}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                  ))}
                  </>);
                })()}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                No automatic match. Pick a workflow below.
              </div>
            )}
          </div>
        )}

        {/* Browse-all workflow library (always available) */}
        {(browseAll || !complaint.trim() || matches.length === 0) && (
          <div className="space-y-4">
            {!complaint.trim() && <p className="text-xs text-gray-400">Or choose a workflow directly:</p>}
            {grouped.map(([cat, items]) => (
              <div key={cat}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">{cat.replace(/_/g, ' ')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map(wf => (
                    <button key={wf.workflowId} type="button" onClick={() => pick(wf)}
                      className="text-left flex items-center justify-between gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 hover:border-blue-200 hover:shadow-card transition-all">
                      <span className="text-sm text-gray-700 truncate">{wf.name}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
