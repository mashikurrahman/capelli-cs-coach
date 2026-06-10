'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TicketInput } from '@/types';

const schema = z.object({
  complaint: z.string().min(10, 'Please enter the customer message (min 10 characters)'),
  orderNumber: z.string().optional(),
  clubTeamName: z.string().optional(),
  channel: z.string().optional(),
  agentNotes: z.string().optional(),
  screenshotDescription: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const EXAMPLE_COMPLAINTS = [
  'Hi, I ordered a medium jersey but received a large. My order number is CS12345. Please help.',
  'My package says delivered but I never received it. I have been waiting 10 days. Tracking is stuck.',
  "I want to return this hoodie. It's the wrong size and I haven't worn it yet. Tags are still on.",
  'The player name on my jersey is spelled wrong. It should be "Johnson" not "Jonson".',
  "I need to cancel my order. I placed it this morning and I don't need it anymore.",
  "I can't access the team store. What's the password for FC United?",
];

interface Props {
  onAnalyze: (input: TicketInput) => void;
  error: string | null;
}

export default function TicketInputForm({ onAnalyze, error }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { channel: 'ZENDESK' },
  });

  function onSubmit(data: FormData) {
    onAnalyze({
      complaint: data.complaint,
      orderNumber: data.orderNumber || undefined,
      clubTeamName: data.clubTeamName || undefined,
      channel: data.channel || undefined,
      agentNotes: data.agentNotes || undefined,
      screenshotDescription: data.screenshotDescription || undefined,
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* Title card */}
        <div className="bg-gradient-to-r from-capelli-navy to-capelli-navyLight rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">New Ticket Coach Session</h2>
              <p className="text-blue-200 text-sm">Paste the customer message and get your complete guided workflow</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {['Identifies issue type', 'Shows missing info', 'Generates email', 'Checks escalation', 'Suggests Zendesk tags'].map(feature => (
              <span key={feature} className="text-xs bg-white/10 text-white/80 px-2.5 py-1 rounded-full">
                ✓ {feature}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Main complaint input */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
            <Label htmlFor="complaint" className="text-sm font-semibold text-gray-800 block mb-3">
              Customer Message / Complaint *
            </Label>
            <Textarea
              id="complaint"
              {...register('complaint')}
              placeholder="Paste or type the customer's email, Zendesk message, voicemail summary, or chat message here…

Example: 'Hi, I ordered a medium jersey but received a large. My order is CS12345. I need this fixed ASAP.'"
              className="min-h-[160px] text-sm font-mono"
            />
            {errors.complaint && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.complaint.message}
              </p>
            )}

            {/* Example complaints */}
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">Quick examples:</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_COMPLAINTS.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setValue('complaint', ex)}
                    className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-capelli-navy border border-gray-200 hover:border-blue-200 rounded-lg px-2.5 py-1 transition-colors text-left"
                  >
                    {ex.slice(0, 45)}…
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4">
              <Label htmlFor="orderNumber" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">
                Order Number (if available)
              </Label>
              <Input
                id="orderNumber"
                {...register('orderNumber')}
                placeholder="e.g. CS12345"
                className="text-sm"
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4">
              <Label htmlFor="clubTeamName" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">
                Club / Team Name (if applicable)
              </Label>
              <Input
                id="clubTeamName"
                {...register('clubTeamName')}
                placeholder="e.g. FC United"
                className="text-sm"
              />
            </div>
          </div>

          {/* Advanced options toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAdvanced ? 'Hide' : 'Show'} additional context (channel, agent notes, screenshots)
          </button>

          {showAdvanced && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Channel</Label>
                  <select
                    {...register('channel')}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="ZENDESK">Zendesk</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone</option>
                    <option value="CHAT">Chat</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">
                  Your Notes (not sent to AI for PII safety)
                </Label>
                <Textarea
                  {...register('agentNotes')}
                  placeholder="Any context you want to add (customer history, previous tickets, etc.)"
                  className="text-sm min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">
                  Screenshot / Photo Description
                </Label>
                <Input
                  {...register('screenshotDescription')}
                  placeholder="e.g. 'Customer sent photo of damaged jersey and size tag'"
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Analysis Failed</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button type="submit" size="xl" className="w-full gap-2 text-base">
            <Send className="w-5 h-5" />
            Analyze Ticket & Get Workflow Guide
          </Button>
        </form>
      </div>
    </div>
  );
}
