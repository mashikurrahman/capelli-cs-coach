'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2, Circle, AlertTriangle, ArrowLeft, ListChecks, Mail,
  Tag, ShieldCheck, ThumbsUp, ThumbsDown, Search, ClipboardList, Copy, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import TemplateFiller from '@/components/email-templates/TemplateFiller';
import { matchTemplates, type TemplateLite } from '@/lib/workflows/match';
import type { WorkflowDefinition } from '@/lib/workflows/default-workflows';

interface Props {
  workflow: WorkflowDefinition;
  complaint: string;
  orderNumber?: string;
  clubName?: string;
  templates: TemplateLite[];
  onChangeWorkflow: () => void;
  onComplete: () => void;
}

function Section({ icon, title, children, hint }: { icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-capelli-navy">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {hint && <span className="text-xs text-gray-400">· {hint}</span>}
      </div>
      {children}
    </section>
  );
}

export default function WorkflowRunner({ workflow, complaint, orderNumber, clubName, templates, onChangeWorkflow, onComplete }: Props) {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [checkedPreSend, setCheckedPreSend] = useState<Record<string, boolean>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateLite | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const suggested = useMemo(
    () => matchTemplates(complaint, workflow, templates, 6),
    [complaint, workflow, templates]
  );

  const searchResults = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    if (!q) return [];
    return templates
      .filter(t => t.name.toLowerCase().includes(q) || (t.category ?? '').toLowerCase().includes(q) || t.keywords.some(k => k.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [templateSearch, templates]);

  const requiredSteps = workflow.steps.filter(s => s.isRequired);
  const allRequiredDone = requiredSteps.every(s => checkedSteps[s.stepNumber]);
  const requiredPreSend = workflow.preSendChecklist.filter(c => c.isRequired);
  const allPreSendDone = requiredPreSend.every(c => checkedPreSend[c.key]);
  const doneCount = workflow.steps.filter(s => checkedSteps[s.stepNumber]).length;
  const progress = Math.round((doneCount / workflow.steps.length) * 100);

  const initialValues: Record<string, string> = {};
  if (orderNumber) { initialValues['Order Number'] = orderNumber; initialValues['Order Numbers'] = orderNumber; }
  if (clubName) initialValues['Club Name'] = clubName;

  async function copyTag(tag: string) {
    try { await navigator.clipboard.writeText(tag); setCopiedTag(tag); setTimeout(() => setCopiedTag(c => (c === tag ? null : c)), 1500); } catch {}
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={onChangeWorkflow} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-capelli-navy mb-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Change workflow
          </button>
          <h2 className="text-xl font-bold text-gray-900">{workflow.name}</h2>
          {workflow.whenToUse[0] && <p className="text-sm text-gray-500 mt-0.5">{workflow.whenToUse[0]}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs font-bold text-capelli-navy">{progress}%</span>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-capelli-navy transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Do / Don't guardrails */}
      {(workflow.doRules.length > 0 || workflow.dontRules.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {workflow.doRules.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-green-700 mb-1.5"><ThumbsUp className="w-3.5 h-3.5" /> Do</p>
              <ul className="space-y-1">
                {workflow.doRules.map((r, i) => <li key={i} className="text-xs text-green-800 leading-snug">• {r}</li>)}
              </ul>
            </div>
          )}
          {workflow.dontRules.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1.5"><ThumbsDown className="w-3.5 h-3.5" /> Don't</p>
              <ul className="space-y-1">
                {workflow.dontRules.map((r, i) => <li key={i} className="text-xs text-red-800 leading-snug">• {r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Required info + systems */}
      {(workflow.requiredInfo.length > 0 || workflow.systemChecks.length > 0) && (
        <Section icon={<ClipboardList className="w-4 h-4" />} title="Before you start">
          {workflow.requiredInfo.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-1">Information needed:</p>
              <div className="flex flex-wrap gap-1.5">
                {workflow.requiredInfo.map((info, i) => (
                  <span key={i} className="text-xs bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-600">{info}</span>
                ))}
              </div>
            </div>
          )}
          {workflow.systemChecks.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Systems to check:</p>
              <div className="flex flex-wrap gap-1.5">
                {workflow.systemChecks.map((s, i) => (
                  <span key={i} className="text-xs bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5 text-capelli-info font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Steps checklist */}
      <Section icon={<ListChecks className="w-4 h-4" />} title="Steps" hint={`${doneCount}/${workflow.steps.length} done`}>
        <ol className="space-y-2">
          {workflow.steps.map(step => {
            const done = !!checkedSteps[step.stepNumber];
            return (
              <li key={step.stepNumber}>
                <button
                  type="button"
                  onClick={() => setCheckedSteps(s => ({ ...s, [step.stepNumber]: !s[step.stepNumber] }))}
                  className={cn(
                    'w-full text-left flex gap-3 rounded-lg border p-3 transition-colors',
                    done ? 'bg-green-50/60 border-green-200' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {done ? <CheckCircle2 className="w-5 h-5 text-capelli-success flex-shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium', done ? 'text-gray-500 line-through' : 'text-gray-800')}>
                      {step.stepNumber}. {step.title}
                      {step.isRequired && <span className="ml-2 text-[10px] font-semibold text-capelli-navy uppercase">required</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                    {step.agentAction && <p className="text-xs text-capelli-info mt-1">→ {step.agentAction}</p>}
                    {step.warning && (
                      <p className="text-xs text-amber-600 mt-1 flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {step.warning}</p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* Customer email */}
      <Section icon={<Mail className="w-4 h-4" />} title="Customer email" hint="official templates — fill & copy">
        {!selectedTemplate ? (
          <div className="space-y-3">
            {suggested.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Suggested templates:</p>
                <div className="flex flex-wrap gap-2">
                  {suggested.map(t => (
                    <button key={t.id} type="button" onClick={() => setSelectedTemplate(t)}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-capelli-navy border border-blue-200 rounded-lg px-3 py-1.5 transition-colors">
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)}
                placeholder="…or search all templates"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300" />
            </div>
            {searchResults.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {searchResults.map(t => (
                  <button key={t.id} type="button" onClick={() => { setSelectedTemplate(t); setTemplateSearch(''); }}
                    className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
                    {t.name} <span className="text-gray-400">· {t.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-800">{selectedTemplate.name}</p>
              <button type="button" onClick={() => setSelectedTemplate(null)} className="text-xs text-gray-500 hover:text-capelli-navy">
                ← Pick a different template
              </button>
            </div>
            <TemplateFiller
              name={selectedTemplate.name}
              subject={selectedTemplate.subject}
              body={selectedTemplate.body}
              placeholders={selectedTemplate.placeholders}
              initialValues={initialValues}
              compact
            />
          </div>
        )}
      </Section>

      {/* Zendesk tags */}
      {workflow.zendeskTags.length > 0 && (
        <Section icon={<Tag className="w-4 h-4" />} title="Zendesk tags">
          <div className="flex flex-wrap gap-2">
            {workflow.zendeskTags.map((t, i) => (
              <button key={i} type="button" onClick={() => copyTag(t.tagName)}
                className="inline-flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 font-mono transition-colors">
                {copiedTag === t.tagName ? <Check className="w-3 h-3 text-capelli-success" /> : <Copy className="w-3 h-3 text-gray-400" />}
                {t.tagName}{t.isRequired && <span className="text-[10px] text-capelli-navy">*</span>}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Suggested status: <span className="font-medium text-gray-600">{workflow.ticketStatus}</span></p>
        </Section>
      )}

      {/* Pre-send checklist */}
      {workflow.preSendChecklist.length > 0 && (
        <Section icon={<ShieldCheck className="w-4 h-4" />} title="Before you send">
          <div className="space-y-2">
            {workflow.preSendChecklist.map(c => {
              const done = !!checkedPreSend[c.key];
              return (
                <label key={c.key} className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={done} onChange={e => setCheckedPreSend(s => ({ ...s, [c.key]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-capelli-navy focus:ring-capelli-navy" />
                  <span className="text-sm text-gray-700">
                    {c.label}{c.isRequired && <span className="text-capelli-navy"> *</span>}
                    {c.warning && done === false && <span className="block text-xs text-amber-600 mt-0.5">{c.warning}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </Section>
      )}

      {/* Finish */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-gray-500">
          {allRequiredDone && allPreSendDone ? 'All required steps complete.' : 'Complete required steps (*) to finish.'}
        </p>
        <button
          type="button"
          onClick={onComplete}
          disabled={!allRequiredDone || !allPreSendDone}
          className="inline-flex items-center gap-2 rounded-xl bg-capelli-navy px-5 py-2.5 text-sm font-medium text-white
                     hover:bg-capelli-navyLight disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" /> Mark ticket handled
        </button>
      </div>
    </div>
  );
}
