'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import TicketInputForm from './TicketInputForm';
import AnalysisResult from './AnalysisResult';
import type { AnalysisResult as AnalysisResultType, TicketInput } from '@/types';

export type CoachPhase = 'input' | 'analyzing' | 'results';

export default function TicketCoach() {
  const [phase, setPhase] = useState<CoachPhase>('input');
  const [analysis, setAnalysis] = useState<AnalysisResultType | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState<TicketInput | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(ticketInput: TicketInput) {
    setPhase('analyzing');
    setError(null);
    setInput(ticketInput);

    try {
      const resp = await fetch('/api/ticket-coach/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketInput),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? 'Analysis failed. Please try again.');
      }

      const data = await resp.json();
      setAnalysis(data.analysis);
      setSessionId(data.sessionId);
      setPhase('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setPhase('input');
    }
  }

  function handleReset() {
    setPhase('input');
    setAnalysis(null);
    setSessionId(null);
    setInput(null);
    setError(null);
  }

  return (
    <div className="flex-1 overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <TicketInputForm onAnalyze={handleAnalyze} error={error} />
          </motion.div>
        )}

        {phase === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-full flex-col items-center justify-center gap-6 px-6"
          >
            <div className="surface-panel flex h-20 w-20 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-capelli-navy" />
            </div>
            <div className="max-w-md text-center">
              <h2 className="text-xl font-semibold text-slate-900">Analyzing ticket...</h2>
              <p className="mt-1 text-sm text-slate-500">
                Searching training materials, identifying the workflow, and preparing your step-by-step guide...
              </p>
            </div>
            <div className="mt-2 flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-capelli-navy"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'results' && analysis && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <AnalysisResult
              analysis={analysis}
              sessionId={sessionId}
              input={input!}
              onNewTicket={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
