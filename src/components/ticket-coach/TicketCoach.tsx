'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
            className="flex flex-col items-center justify-center h-full gap-6"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-capelli-navy animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800">Analyzing Ticket…</h2>
              <p className="text-gray-500 mt-1 text-sm max-w-sm">
                Searching training materials, identifying the workflow, and preparing your step-by-step guide…
              </p>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-capelli-navy"
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
