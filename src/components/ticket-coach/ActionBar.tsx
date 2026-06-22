'use client';

import { useMemo, useState } from 'react';
import {
  Zap, Clock, Scale, ExternalLink, Copy, Check, Truck, FileText,
  RefreshCw, AlertTriangle, CheckCircle2, Ban, ShieldQuestion,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { WorkflowDefinition } from '@/lib/workflows/default-workflows';
import { getDecisionHint } from '@/lib/workflows/decision-hints';
import {
  processingClock, changeEligibility, buildInternalNote, type Eligibility,
} from '@/lib/workflows/action-logic';
import { SYSTEM_TARGETS, type LaunchContext } from '@/lib/systems/systems-config';
import { detectCarrier, trackingUrl } from '@/lib/systems/carriers';

interface Props {
  workflow: WorkflowDefinition;
  complaint: string;
  orderNumber?: string;
  clubName?: string;
}

const CLOCK_STYLE: Record<string, string> = {
  'in-window': 'border-green-200 bg-green-50 text-green-800',
  'due-soon': 'border-amber-200 bg-amber-50 text-amber-800',
  'overdue': 'border-red-200 bg-red-50 text-red-800',
  'future': 'border-amber-200 bg-amber-50 text-amber-800',
  'invalid': 'border-gray-200 bg-gray-50 text-gray-600',
};

const ELIG_STYLE: Record<Eligibility, { cls: string; icon: React.ReactNode }> = {
  allowed: { cls: 'border-green-200 bg-green-50 text-green-800', icon: <CheckCircle2 className="w-4 h-4" /> },
  conditional: { cls: 'border-amber-200 bg-amber-50 text-amber-800', icon: <AlertTriangle className="w-4 h-4" /> },
  blocked: { cls: 'border-red-200 bg-red-50 text-red-800', icon: <Ban className="w-4 h-4" /> },
  'n/a': { cls: 'border-gray-200 bg-gray-50 text-gray-600', icon: <ShieldQuestion className="w-4 h-4" /> },
};

/** Workflows where the 5-week clock is meaningful. */
const TIME_SENSITIVE = new Set([
  'order_status_eta', 'expedited_shipping', 'order_change', 'order_cancellation',
  'partial_shipment', 'replacement_order',
]);

export default function ActionBar({ workflow, complaint, orderNumber, clubName }: Props) {
  const hint = getDecisionHint(workflow.workflowId);

  const [order, setOrder] = useState(orderNumber ?? '');
  const [club, setClub] = useState(clubName ?? '');
  const [orderDate, setOrderDate] = useState('');
  const [tracking, setTracking] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const clock = useMemo(() => processingClock(orderDate), [orderDate]);
  const elig = useMemo(() => changeEligibility(workflow.workflowId, clock), [workflow.workflowId, clock]);
  const showClock = TIME_SENSITIVE.has(workflow.workflowId);

  const note = useMemo(
    () => buildInternalNote({ workflowName: workflow.name, workflowId: workflow.workflowId, hint, orderNumber: order, clubName: club, complaint, clock }),
    [workflow.name, workflow.workflowId, hint, order, club, complaint, clock]
  );
  const [noteText, setNoteText] = useState<string | null>(null);
  const finalNote = noteText ?? note;

  const launchCtx: LaunchContext = { orderNumber: order || undefined, clubName: club || undefined, noteBody: finalNote };
  const carrier = useMemo(() => detectCarrier(tracking), [tracking]);
  const trackUrl = useMemo(() => trackingUrl(tracking, carrier), [tracking, carrier]);

  async function copy(key: string, text?: string) {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(c => (c === key ? null : c)), 1500); } catch {}
  }

  return (
    <div className="rounded-xl border border-capelli-navy/30 bg-gradient-to-br from-blue-50/70 to-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-capelli-navy" />
        <h3 className="text-sm font-semibold text-capelli-navy">Action bar</h3>
        <span className="text-xs text-gray-400">· the app does the lookup — you act</span>
      </div>

      {/* Context inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input value={order} onChange={e => setOrder(e.target.value)} placeholder="Order #"
          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        <input value={club} onChange={e => setClub(e.target.value)} placeholder="Club / team"
          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        {showClock && (
          <label className="col-span-2 sm:col-span-1 flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}
              className="w-full bg-transparent focus:outline-none" aria-label="Order date" />
          </label>
        )}
        <div className="relative col-span-2 sm:col-span-1">
          <Truck className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Tracking #"
            className="w-full rounded-lg border border-gray-200 pl-7 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
      </div>

      {/* Processing clock */}
      {showClock && orderDate && (
        <div className={cn('rounded-lg border p-2.5 text-xs', CLOCK_STYLE[clock.state])}>
          <p className="flex items-center gap-1.5 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {clock.state === 'overdue' ? `Past the 5-week window — week ${clock.weeks}`
              : clock.state === 'future' ? 'Order date is in the future'
              : clock.state === 'invalid' ? 'Enter the order date'
              : `Week ${clock.weeks} of 5 · ~${clock.weeksLeft} week(s) left`}
          </p>
          <p className="mt-0.5 leading-snug">{clock.recommendation}</p>
        </div>
      )}

      {/* Change / cancel eligibility */}
      {elig && (
        <div className={cn('rounded-lg border p-2.5 text-xs', ELIG_STYLE[elig.eligibility].cls)}>
          <p className="flex items-center gap-1.5 font-semibold">{ELIG_STYLE[elig.eligibility].icon} {elig.title}</p>
          <p className="mt-0.5 leading-snug">{elig.detail}</p>
        </div>
      )}

      {/* Fault + fulfillment quick read */}
      {hint && (hint.fault && hint.fault !== 'none' || (hint.fulfillment && hint.fulfillment !== 'unknown')) && (
        <div className="flex flex-wrap gap-2">
          {hint.fault && hint.fault !== 'none' && (
            <span className={cn('inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 border',
              hint.fault === 'capelli' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600')}>
              <Scale className="w-3 h-3" /> {hint.fault === 'capelli' ? 'Capelli fault — we make it right' : 'Customer error — no Capelli liability'}
            </span>
          )}
          {hint.fulfillment && hint.fulfillment !== 'unknown' && (
            <span className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 border bg-blue-50 border-blue-200 text-capelli-info">
              Usually {hint.fulfillment} · {hint.fulfillment === 'FBB' ? 'Bangladesh' : 'USA'}
            </span>
          )}
        </div>
      )}

      {/* Systems launcher */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1.5">Open the system</p>
        <div className="flex flex-wrap gap-2">
          {SYSTEM_TARGETS.map(t => {
            const r = t.resolve(launchCtx);
            const key = `sys-${t.id}`;
            if (r.href) {
              return (
                <a key={t.id} href={r.href} target="_blank" rel="noopener noreferrer" title={r.hint}
                  className="inline-flex items-center gap-1.5 text-xs bg-white hover:bg-blue-50 border border-blue-200 text-capelli-navy rounded-lg px-2.5 py-1.5 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> {t.label}
                </a>
              );
            }
            return (
              <button key={t.id} type="button" onClick={() => copy(key, r.copy)} title={r.hint}
                className="inline-flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg px-2.5 py-1.5 transition-colors">
                {copied === key ? <Check className="w-3.5 h-3.5 text-capelli-success" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                {t.label}
              </button>
            );
          })}
          {/* Tracking launcher (public carrier pages) */}
          {trackUrl ? (
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" title={`Track with ${carrier}`}
              className="inline-flex items-center gap-1.5 text-xs bg-white hover:bg-blue-50 border border-blue-200 text-capelli-navy rounded-lg px-2.5 py-1.5 transition-colors">
              <Truck className="w-3.5 h-3.5" /> Track ({carrier})
            </a>
          ) : tracking.trim() ? (
            <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-2.5 py-1.5">
              <Truck className="w-3.5 h-3.5" /> Carrier not recognised
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[11px] text-gray-400">
          Grey buttons need their system URL configured (env) — they copy the lookup value for now. Tracking opens the carrier directly.
        </p>
      </div>

      {/* Internal note generator */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500"><FileText className="w-3.5 h-3.5" /> Internal note (not the customer reply)</p>
          <div className="flex items-center gap-2">
            {noteText !== null && (
              <button type="button" onClick={() => setNoteText(null)} className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-capelli-navy">
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            )}
            <button type="button" onClick={() => copy('note', finalNote)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-capelli-navy hover:underline">
              {copied === 'note' ? <Check className="w-3 h-3 text-capelli-success" /> : <Copy className="w-3 h-3" />}
              {copied === 'note' ? 'Copied' : 'Copy note'}
            </button>
          </div>
        </div>
        <textarea
          value={finalNote}
          onChange={e => setNoteText(e.target.value)}
          spellCheck
          className="w-full min-h-[110px] rounded-lg border border-gray-200 bg-white p-2.5 text-xs font-mono leading-relaxed
                     whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-blue-500/30 custom-scroll"
        />
      </div>
    </div>
  );
}
