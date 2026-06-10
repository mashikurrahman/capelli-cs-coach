'use client';

import { cn } from '@/lib/utils/cn';
import { formatIssueCategory, getRiskColor, getConfidenceColor } from '@/lib/utils/helpers';
import { ISSUE_LABELS } from '@/types';
import { Zap, AlertTriangle, Target, Info } from 'lucide-react';
import type { AnalysisResult } from '@/types';

interface Props { analysis: AnalysisResult }

export default function IssueDetectionCard({ analysis }: Props) {
  const risk = getRiskColor(analysis.risk_level);
  const conf = getConfidenceColor(analysis.confidence_score);

  return (
    <div className="space-y-4">
      {/* Issue summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-capelli-infoBg flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-capelli-info" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Issue Identified</p>
            <h3 className="text-base font-bold text-gray-900 mt-0.5">
              {ISSUE_LABELS[analysis.primary_issue_type] ?? analysis.primary_issue_type}
            </h3>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-700 leading-relaxed">{analysis.issue_summary}</p>
        </div>

        {/* Secondary issues */}
        {analysis.secondary_issue_types.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1.5">Also involves:</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.secondary_issue_types.map(t => (
                <span key={t} className="text-xs bg-capelli-infoBg text-capelli-info rounded-full px-2.5 py-1 font-medium">
                  {ISSUE_LABELS[t] ?? t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Confidence + Risk */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-bold', conf.color)}>{analysis.confidence_score}%</span>
              <span className={cn('text-xs font-medium', conf.color)}>{conf.label}</span>
            </div>
            <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', conf.bar)}
                style={{ width: `${analysis.confidence_score}%` }}
              />
            </div>
          </div>
          <div className={cn('rounded-lg p-3', risk.bg)}>
            <p className="text-xs opacity-70 mb-1">Risk Level</p>
            <span className={cn('text-sm font-bold capitalize', risk.text)}>{analysis.risk_level}</span>
            {analysis.escalation_needed && (
              <p className={cn('text-xs mt-1 opacity-80 font-medium', risk.text)}>⚠ Escalation needed</p>
            )}
          </div>
        </div>
      </div>

      {/* Recommended workflow */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-capelli-warning" />
          <p className="text-sm font-semibold text-gray-700">Recommended Workflow</p>
        </div>
        <p className="text-base font-bold text-capelli-navy">{analysis.workflow_recommended}</p>
        {analysis.policy_to_apply && (
          <p className="text-sm text-gray-500 mt-1">Policy: {analysis.policy_to_apply}</p>
        )}
      </div>

      {/* Decision path */}
      {analysis.decision_path && analysis.decision_path.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">How the workflow was selected</p>
          </div>
          <div className="space-y-2">
            {analysis.decision_path.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-capelli-infoBg text-capelli-info text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence warning */}
      {analysis.confidence_score < 60 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Low Confidence — Team Leader Review Recommended</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              The AI was not able to confidently match this complaint to a specific workflow. Please review with your Team Leader before proceeding.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
