'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, RotateCcw, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { AnalysisResult } from '@/types';

interface Props {
  analysis: AnalysisResult;
  sessionId: string | null;
  onNewTicket: () => void;
}

export default function CompletionCard({ analysis, sessionId, onNewTicket }: Props) {
  const { toast } = useToast();
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [comment, setComment] = useState('');

  async function submitFeedback(rating: string) {
    if (!sessionId) return;
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, rating, comment }),
      });
      setFeedbackGiven(true);
      toast({ title: 'Thanks for your feedback!', variant: 'success' });
    } catch {
      toast({ title: 'Could not submit feedback', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-5">
      {/* Success card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-white rounded-xl border-2 border-capelli-success shadow-card p-8 text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-capelli-success" />
            </div>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Ticket Coach Complete</h2>
        <p className="text-gray-500 mt-1 text-sm">
          You have been guided through all {9} steps for this ticket.
        </p>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-lg font-bold text-capelli-navy">{analysis.confidence_score}%</p>
            <p className="text-xs text-gray-400">Confidence</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-lg font-bold text-gray-700 capitalize">{analysis.risk_level}</p>
            <p className="text-xs text-gray-400">Risk Level</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-lg font-bold text-gray-700">{analysis.ticket_status}</p>
            <p className="text-xs text-gray-400">Ticket Status</p>
          </div>
        </div>
      </motion.div>

      {/* Final reminders */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Final Checklist Reminder</h3>
        <div className="space-y-2">
          {[
            '✓ Internal note added to Zendesk ticket',
            '✓ Customer email sent / queued',
            '✓ Zendesk tags filled',
            '✓ Ticket status set correctly',
            analysis.escalation_needed ? '⚠ Escalation sent to Team Leader' : '✓ No escalation required',
          ].map((item, i) => (
            <p key={i} className="text-sm text-gray-600 flex items-center gap-2">
              {item}
            </p>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {!feedbackGiven ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Was this guidance helpful?</h3>
          <p className="text-xs text-gray-400 mb-3">Your feedback helps improve the Ticket Coach for the whole team.</p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Optional: Tell us what could be improved…"
            className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3 h-16"
          />
          <div className="flex gap-3">
            <Button
              variant="success"
              size="sm"
              onClick={() => submitFeedback('CORRECT')}
              className="gap-1.5 flex-1"
            >
              <ThumbsUp className="w-4 h-4" />
              Helpful & Accurate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => submitFeedback('PARTIALLY_CORRECT')}
              className="gap-1.5 flex-1"
            >
              <MessageSquare className="w-4 h-4" />
              Partially Helpful
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => submitFeedback('INCORRECT')}
              className="gap-1.5 flex-1"
            >
              <ThumbsDown className="w-4 h-4" />
              Incorrect
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-sm text-capelli-success font-medium">Thank you for your feedback!</p>
        </div>
      )}

      {/* New ticket button */}
      <Button
        onClick={onNewTicket}
        variant="outline"
        size="lg"
        className="w-full gap-2"
      >
        <RotateCcw className="w-5 h-5" />
        Start New Ticket
      </Button>
    </div>
  );
}
