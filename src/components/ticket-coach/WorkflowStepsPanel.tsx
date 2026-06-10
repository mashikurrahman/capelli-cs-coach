'use client';

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { WorkflowAction } from '@/types';

interface Props {
  steps: WorkflowAction[];
  policy: string;
  doRules: string[];
  dontRules: string[];
}

export default function WorkflowStepsPanel({ steps, policy, doRules, dontRules }: Props) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showRules, setShowRules] = useState(true);

  function toggleStep(step: number) {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Policy */}
      {policy && (
        <div className="bg-capelli-infoBg border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-bold text-capelli-info uppercase tracking-wide mb-1">Policy Being Applied</p>
          <p className="text-sm font-semibold text-capelli-navy">{policy}</p>
        </div>
      )}

      {/* Steps */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Step-by-Step Agent Actions</h3>
          <p className="text-xs text-gray-400 mt-0.5">Check each step off as you complete it</p>
        </div>
        <div className="divide-y divide-gray-100">
          {steps.map((step, i) => {
            const isCompleted = completedSteps.has(step.step);
            return (
              <div
                key={i}
                className={cn('p-4 transition-colors cursor-pointer hover:bg-gray-50', isCompleted && 'bg-green-50/50')}
                onClick={() => toggleStep(step.step)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                    isCompleted ? 'bg-capelli-success text-white' : 'bg-gray-100 text-gray-400'
                  )}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : (
                      <span className="text-xs font-bold">{step.step}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn('text-sm font-semibold', isCompleted ? 'text-capelli-success line-through' : 'text-gray-800')}>
                      {step.title}
                    </p>
                    <p className={cn('text-sm mt-0.5', isCompleted ? 'text-gray-400' : 'text-gray-600')}>
                      {step.action}
                    </p>
                    {step.warning && (
                      <div className="mt-2 flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 font-medium">{step.warning}</p>
                      </div>
                    )}
                    {step.is_gate && (
                      <div className="mt-2 inline-flex items-center gap-1 bg-capelli-warningBg text-capelli-warning rounded-full px-2.5 py-0.5 text-xs font-bold">
                        🚧 Gate — must complete before proceeding
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Do/Don't rules */}
      {(doRules?.length > 0 || dontRules?.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-800">Do / Don't Rules</h3>
            {showRules ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showRules && (
            <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doRules?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ThumbsUp className="w-4 h-4 text-capelli-success" />
                    <p className="text-xs font-bold text-capelli-success uppercase">Do</p>
                  </div>
                  <ul className="space-y-1.5">
                    {doRules.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-capelli-success font-bold flex-shrink-0">✓</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {dontRules?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ThumbsDown className="w-4 h-4 text-capelli-danger" />
                    <p className="text-xs font-bold text-capelli-danger uppercase">Don't</p>
                  </div>
                  <ul className="space-y-1.5">
                    {dontRules.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-capelli-danger font-bold flex-shrink-0">✗</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
