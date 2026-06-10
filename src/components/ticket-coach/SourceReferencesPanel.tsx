'use client';

import { BookOpen, AlertTriangle, Info, ExternalLink, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { SourceRef, AgentWarning } from '@/types';

interface Props {
  sources: SourceRef[];
  warnings: AgentWarning[];
  confidence: number;
}

const CONFIDENCE_STYLES = {
  HIGH: 'text-capelli-success border-green-200',
  MEDIUM: 'text-capelli-warning border-yellow-200',
  LOW: 'text-capelli-danger border-red-200',
  UNVERIFIED: 'text-gray-400 border-gray-200',
};

export default function SourceReferencesPanel({ sources, warnings, confidence }: Props) {
  const infoWarnings = warnings.filter(w => w.severity === 'info');
  const normalWarnings = warnings.filter(w => w.severity === 'warning');

  return (
    <div className="p-4 space-y-4">
      {/* Panel title */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700">Source References</h3>
      </div>

      {/* Warnings */}
      {normalWarnings.map((w, i) => (
        <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">{w.message}</p>
        </div>
      ))}

      {/* Source list */}
      {sources.length === 0 ? (
        <div className="text-center py-6">
          <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-xs text-gray-400">No source references found</p>
          <p className="text-xs text-gray-300 mt-1">Upload training documents to enable source citations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((src, i) => {
            const style = CONFIDENCE_STYLES[src.confidence] ?? CONFIDENCE_STYLES.UNVERIFIED;
            return (
              <div key={i} className={cn('bg-white rounded-lg border p-3 space-y-1.5', style.split(' ')[1])}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-700 leading-snug">{src.document_name}</p>
                  <span className={cn('text-[10px] font-bold flex-shrink-0 border rounded px-1.5 py-0.5', style)}>
                    {src.confidence}
                  </span>
                </div>
                {src.section && (
                  <p className="text-xs text-gray-400">§ {src.section}{src.page_number ? ` · p.${src.page_number}` : ''}</p>
                )}
                <p className="text-xs text-gray-600 leading-relaxed">{src.relevant_rule}</p>
                {src.quote && (
                  <blockquote className="border-l-2 border-capelli-navy pl-2 mt-1">
                    <p className="text-xs text-gray-500 italic">"{src.quote}"</p>
                  </blockquote>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No docs notice */}
      {sources.some(s => s.confidence === 'UNVERIFIED') && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">
              Upload your Capelli Sports training documents in <strong>Admin › Upload Docs</strong> to enable evidence-based source citations.
            </p>
          </div>
        </div>
      )}

      {/* Info warnings */}
      {infoWarnings.map((w, i) => (
        <div key={i} className="bg-capelli-infoBg border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-capelli-info flex-shrink-0 mt-0.5" />
          <p className="text-xs text-capelli-info">{w.message}</p>
        </div>
      ))}

      {/* Disclaimer */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-[10px] text-gray-300 leading-relaxed">
          Source citations are based on uploaded training materials. Always verify with your Team Leader for exceptions.
        </p>
      </div>
    </div>
  );
}
