'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle,
  XCircle, Info, BookOpen, Tag, Send, FileText, Siren, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/cn';
import { STEP_NAMES, formatIssueCategory, getRiskColor, getConfidenceColor } from '@/lib/utils/helpers';
import type { AnalysisResult as AR, TicketInput } from '@/types';

import IssueDetectionCard from './IssueDetectionCard';
import MissingInfoPanel from './MissingInfoPanel';
import SystemChecksPanel from './SystemChecksPanel';
import WorkflowStepsPanel from './WorkflowStepsPanel';
import EmailDraftCard from './EmailDraftCard';
import InternalNoteCard from './InternalNoteCard';
import ZendeskAssistPanel from './ZendeskAssistPanel';
import PreSendChecklist from './PreSendChecklist';
import CompletionCard from './CompletionCard';
import SourceReferencesPanel from './SourceReferencesPanel';
import RiskWarningBanner from './RiskWarningBanner';

interface Props {
  analysis: AR;
  sessionId: string | null;
  input: TicketInput;
  onNewTicket: () => void;
}

const STEP_COUNT = 9;

export default function AnalysisResult({ analysis, sessionId, input, onNewTicket }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedChecks, setCompletedChecks] = useState<Record<string, boolean>>({});
  const [emailContent, setEmailContent] = useState(analysis.customer_email_draft);
  const [noteContent, setNoteContent] = useState(analysis.internal_note_draft);
  const [allChecksPassed, setAllChecksPassed] = useState(false);

  const risk = getRiskColor(analysis.risk_level);
  const conf = getConfidenceColor(analysis.confidence_score);
  const progress = Math.round(((currentStep + 1) / STEP_COUNT) * 100);

  function handleCheckToggle(key: string, checked: boolean) {
    const updated = { ...completedChecks, [key]: checked };
    setCompletedChecks(updated);
    const allRequired = analysis.pre_send_checklist
      .filter(c => c.is_required)
      .every(c => updated[c.key]);
    setAllChecksPassed(allRequired);
  }

  const criticalWarnings = analysis.agent_warnings?.filter(w => w.severity === 'critical') ?? [];

  const stepComponents = [
    <IssueDetectionCard key="step-0" analysis={analysis} />,
    <MissingInfoPanel key="step-1" missing={analysis.missing_information} />,
    <SystemChecksPanel key="step-2" systems={analysis.systems_to_check} />,
    <WorkflowStepsPanel key="step-3" steps={analysis.step_by_step_actions} policy={analysis.policy_to_apply} doRules={analysis.do_rules} dontRules={analysis.dont_rules} />,
    <EmailDraftCard key="step-4" subject={analysis.email_subject} body={emailContent} onEdit={setEmailContent} sessionId={sessionId} />,
    <InternalNoteCard key="step-5" body={noteContent} onEdit={setNoteContent} sessionId={sessionId} />,
    <ZendeskAssistPanel key="step-6" tags={analysis.zendesk_tags} status={analysis.ticket_status} escalation={analysis.escalation_needed} escalationReason={analysis.escalation_reason} />,
    <PreSendChecklist key="step-7" checklist={analysis.pre_send_checklist} completedChecks={completedChecks} onToggle={handleCheckToggle} emailBody={emailContent} allPassed={allChecksPassed} sessionId={sessionId} />,
    <CompletionCard key="step-8" analysis={analysis} sessionId={sessionId} onNewTicket={onNewTicket} />,
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Step Navigator */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Progress header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Progress</span>
            <span className="text-xs font-bold text-capelli-navy">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Steps list */}
        <div className="flex-1 overflow-y-auto py-2">
          {STEP_NAMES.map((name, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <button
                key={name}
                onClick={() => setCurrentStep(idx)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors',
                  isCurrent && 'bg-capelli-infoBg border-r-2 border-capelli-navy',
                  isCompleted && !isCurrent && 'text-capelli-success',
                  !isCurrent && !isCompleted && 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                )}
              >
                <span className={cn(
                  'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  isCompleted ? 'bg-capelli-success text-white' : isCurrent ? 'bg-capelli-navy text-white' : 'bg-gray-100 text-gray-400'
                )}>
                  {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                </span>
                <span className={cn('text-xs font-medium', isCurrent && 'text-capelli-navy font-semibold')}>
                  {name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Risk summary */}
        <div className="p-3 border-t border-gray-100">
          <div className={cn('rounded-lg p-2.5 text-xs', risk.bg, risk.text)}>
            <p className="font-semibold capitalize">⚠ Risk: {analysis.risk_level}</p>
            {analysis.escalation_needed && (
              <p className="mt-0.5 opacity-80">Escalation needed</p>
            )}
          </div>
        </div>
      </div>

      {/* Center: Active Step */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Critical warnings banner */}
        {criticalWarnings.length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <Siren className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-700">Critical Warnings</p>
              {criticalWarnings.map((w, i) => (
                <p key={i} className="text-sm text-red-600">{w.message}</p>
              ))}
            </div>
          </div>
        )}

        {/* Step header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 font-medium">Step {currentStep + 1} of {STEP_COUNT}</p>
            <h2 className="text-lg font-bold text-gray-900">{STEP_NAMES[currentStep]}</h2>
          </div>
          <Button variant="outline" size="sm" onClick={onNewTicket} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            New Ticket
          </Button>
        </div>

        {/* Active step component */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {stepComponents[currentStep]}
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < STEP_COUNT - 1 && (
            <Button
              size="sm"
              onClick={() => setCurrentStep(s => Math.min(STEP_COUNT - 1, s + 1))}
              className="gap-1"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Right: Source References */}
      <div className="w-72 flex-shrink-0 border-l border-gray-200 overflow-y-auto bg-gray-50/50">
        <SourceReferencesPanel
          sources={analysis.source_references}
          warnings={analysis.agent_warnings ?? []}
          confidence={analysis.confidence_score}
        />
      </div>
    </div>
  );
}
