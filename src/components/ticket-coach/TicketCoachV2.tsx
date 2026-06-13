'use client';

import { useMemo, useState } from 'react';
import { Sparkles, ChevronRight, RotateCcw, CheckCircle2, LayoutGrid, Wand2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import WorkflowRunner from './WorkflowRunner';
import { matchWorkflows } from '@/lib/workflows/match';
import { DEFAULT_WORKFLOWS, type WorkflowDefinition } from '@/lib/workflows/default-workflows';
import type { TemplateLite } from '@/lib/workflows/match';

type Phase = 'input' | 'pick' | 'run' | 'done';

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
  const [smartMatches, setSmartMatches] = useState<WorkflowDefinition[] | null>(null);
  const [smartLoading, setSmartLoading] = useState(false);

  const matches = useMemo(() => (complaint.trim() ? matchWorkflows(complaint, 4) : []), [complaint]);

  async function runSmartMatch() {
    if (!complaint.trim() || smartLoading) return;
    setSmartLoading(true);
    setSmartMatches(null);
    try {
      const res = await fetch('/api/ticket-coach/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint }),
      });
      const data = await res.json();
      const ids: string[] = (data.matches ?? []).map((m: { workflowId: string }) => m.workflowId);
      const wfs = ids.map(id => DEFAULT_WORKFLOWS.find(w => w.workflowId === id)).filter(Boolean) as WorkflowDefinition[];
      setSmartMatches(wfs);
    } catch {
      setSmartMatches([]);
    } finally {
      setSmartLoading(false);
    }
  }

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
    setSelected(null); setBrowseAll(false); setSmartMatches(null);
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

        {/* Matched workflows */}
        {complaint.trim() && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <Sparkles className="w-4 h-4 text-capelli-navy" /> Matching workflows
              </h3>
              <div className="flex items-center gap-3">
                <button type="button" onClick={runSmartMatch} disabled={smartLoading}
                  className="inline-flex items-center gap-1.5 text-xs text-capelli-navy hover:underline disabled:opacity-50">
                  {smartLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Smart match
                </button>
                <button type="button" onClick={() => setBrowseAll(b => !b)} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-capelli-navy">
                  <LayoutGrid className="w-3.5 h-3.5" /> {browseAll ? 'Hide all' : 'Browse all'}
                </button>
              </div>
            </div>

            {/* Smart (semantic) match results */}
            {smartMatches && smartMatches.length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs text-capelli-navy font-medium flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5" /> Smart match results</p>
                {smartMatches.map(wf => (
                  <button key={wf.workflowId} type="button" onClick={() => pick(wf)}
                    className="w-full text-left flex items-center justify-between gap-3 bg-white rounded-xl border border-purple-200 p-4 hover:shadow-card-hover transition-all">
                    <p className="text-sm font-semibold text-gray-800">{wf.name}</p>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
            {smartMatches && smartMatches.length === 0 && !smartLoading && (
              <p className="mb-3 text-xs text-gray-400">Smart match found nothing — browse all workflows below.</p>
            )}

            {matches.length > 0 ? (
              <div className="space-y-2">
                {matches.map(({ workflow, matchedPhrases }, idx) => (
                  <button key={workflow.workflowId} type="button" onClick={() => pick(workflow)}
                    className={cn(
                      'w-full text-left flex items-center justify-between gap-3 bg-white rounded-xl border p-4 transition-all hover:shadow-card-hover',
                      idx === 0 ? 'border-capelli-navy ring-1 ring-capelli-navy/20' : 'border-gray-200 hover:border-blue-200'
                    )}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{workflow.name}</p>
                        {idx === 0 && <span className="text-[10px] font-bold uppercase text-capelli-navy bg-blue-50 px-1.5 py-0.5 rounded">Best match</span>}
                      </div>
                      {matchedPhrases.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">Matched: {matchedPhrases.slice(0, 4).join(', ')}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                ))}
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
