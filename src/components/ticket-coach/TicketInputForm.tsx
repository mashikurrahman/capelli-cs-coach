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
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="surface-panel overflow-hidden border-slate-200/70">
          <div className="border-b border-slate-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.96))] p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-capelli-navy text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">New Ticket Coach Session</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Paste the customer message and get a focused, source-backed workflow in a cleaner interface.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Issue detection', 'Missing info', 'Email draft', 'Escalation check', 'Zendesk tags'].map(feature => (
                    <span key={feature} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6 md:p-8">
            <div className="surface-muted p-5">
              <Label htmlFor="complaint" className="mb-3 block text-sm font-semibold text-slate-800">
                Customer Message / Complaint *
              </Label>
              <Textarea
                id="complaint"
                {...register('complaint')}
                placeholder="Paste or type the customer's email, Zendesk message, voicemail summary, or chat message here..."
                className="min-h-[180px] text-sm"
              />
              {errors.complaint && (
                <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.complaint.message}
                </p>
              )}

              <div className="mt-4">
                <p className="mb-2 text-xs text-slate-400">Quick examples</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_COMPLAINTS.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setValue('complaint', ex)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-left text-xs text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                    >
                      {ex.slice(0, 45)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="surface-panel surface-panel-hover p-4">
                <Label htmlFor="orderNumber" className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                  Order Number
                </Label>
                <Input
                  id="orderNumber"
                  {...register('orderNumber')}
                  placeholder="e.g. CS12345"
                  className="text-sm"
                />
              </div>
              <div className="surface-panel surface-panel-hover p-4">
                <Label htmlFor="clubTeamName" className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                  Club / Team Name
                </Label>
                <Input
                  id="clubTeamName"
                  {...register('clubTeamName')}
                  placeholder="e.g. FC United"
                  className="text-sm"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-800"
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showAdvanced ? 'Hide' : 'Show'} additional context
            </button>

            {showAdvanced && (
              <div className="surface-panel surface-panel-hover space-y-4 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase text-slate-500">Channel</Label>
                    <select
                      {...register('channel')}
                      className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2 text-sm shadow-sm transition-all duration-200 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-ring"
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
                  <Label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                    Your Notes
                  </Label>
                  <Textarea
                    {...register('agentNotes')}
                    placeholder="Any context you want to add (customer history, previous tickets, etc.)"
                    className="min-h-[90px] text-sm"
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                    Screenshot / Photo Description
                  </Label>
                  <Input
                    {...register('screenshotDescription')}
                    placeholder="e.g. Customer sent photo of damaged jersey and size tag"
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-700">Analysis failed</p>
                <p className="mt-0.5 text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" size="xl" className="w-full gap-2">
              <Send className="h-5 w-5" />
              Analyze ticket and get workflow guide
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
