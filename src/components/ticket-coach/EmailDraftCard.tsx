'use client';

import { useMemo, useState } from 'react';
import { Copy, Edit3, Check, Mail, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils/cn';
import { scanSensitive, scanQuality } from '@/lib/guards/email-guards';

interface Props {
  subject: string;
  body: string;
  onEdit: (body: string) => void;
  sessionId: string | null;
}

const PLACEHOLDERS = ['[Customer Name]', '[Order Number]', '[Tracking Number]', '[Return Address]', '[Refund Timeline]', '[Processing Time]', '[Team Store Link]', '[Approved Password]', '[Agent Name]'];

function highlightPlaceholders(text: string): React.ReactNode[] {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) =>
    PLACEHOLDERS.includes(part)
      ? <span key={i} className="bg-yellow-200 text-yellow-800 rounded px-0.5 font-medium">{part}</span>
      : <span key={i}>{part}</span>
  );
}

export default function EmailDraftCard({ subject, body, onEdit, sessionId }: Props) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(body);
  const [copied, setCopied] = useState(false);

  const hasUnfilledPlaceholders = PLACEHOLDERS.some(p => body.includes(p));

  // Guardrails over the live draft: sensitive-data leaks (block) + policy-risky
  // promises learned from real tickets (advisory).
  const draftText = `${subject}\n${isEditing ? editValue : body}`;
  const leak = useMemo(() => scanSensitive(draftText), [draftText]);
  const quality = useMemo(() => scanQuality(draftText), [draftText]);

  async function handleCopy() {
    if (leak.level === 'block') {
      toast({ title: 'Blocked — sensitive content detected', description: 'Remove internal/sensitive data before copying.', variant: 'destructive' });
      return;
    }
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (sessionId) {
      await fetch('/api/ticket-coach/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'email_copied' }),
      }).catch(() => {});
    }

    toast({ title: 'Email copied to clipboard', variant: 'success' });
  }

  function handleSaveEdit() {
    onEdit(editValue);
    setIsEditing(false);
    toast({ title: 'Email updated', description: 'Your changes have been saved for this session.', variant: 'success' });
  }

  return (
    <div className="space-y-4">
      {/* Warning: unfilled placeholders */}
      {hasUnfilledPlaceholders && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Fill in the highlighted placeholders before sending</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              Fields like <span className="font-mono text-xs bg-yellow-200 px-1 rounded">[Customer Name]</span> must be replaced with actual values.
            </p>
          </div>
        </div>
      )}

      {/* Guardrail: sensitive-data leak (blocks copy) */}
      {leak.level === 'block' && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-red-700">
            <ShieldAlert className="w-4 h-4" /> Do not send — sensitive content detected
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {leak.findings.map((f, i) => (
              <li key={i} className={cn('text-xs', f.level === 'block' ? 'text-red-700' : 'text-amber-700')}>• {f.label}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-red-600">Never share club passwords, RO numbers, or internal systems with a customer. Remove it to enable copy.</p>
        </div>
      )}
      {leak.level === 'warn' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700">
            <AlertTriangle className="w-4 h-4" /> Check before sending
          </p>
          <ul className="mt-1 space-y-0.5">
            {leak.findings.map((f, i) => <li key={i} className="text-xs text-amber-700">• {f.label}</li>)}
          </ul>
        </div>
      )}

      {/* Quality coach: policy-risky promises learned from real tickets */}
      {quality.level === 'warn' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-blue-700">
            <AlertTriangle className="w-4 h-4" /> Quality check (learned from real tickets)
          </p>
          <ul className="mt-1 space-y-0.5">
            {quality.findings.map((f, i) => <li key={i} className="text-xs text-blue-700">• {f.label}</li>)}
          </ul>
        </div>
      )}

      {/* Email card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        {/* Email header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50">
          <div className="w-8 h-8 bg-capelli-navy rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">Subject</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{subject}</p>
          </div>
        </div>

        {/* Email body */}
        <div className="p-5">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="min-h-[280px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} size="sm" className="gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditValue(body); setIsEditing(false); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                {highlightPlaceholders(body)}
              </pre>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-2 px-5 pb-4">
            <Button
              onClick={handleCopy}
              size="sm"
              disabled={leak.level === 'block'}
              title={leak.level === 'block' ? 'Resolve the flagged sensitive content before copying' : undefined}
              className={cn('gap-1.5 transition-all', copied && 'bg-capelli-success hover:bg-green-700')}
            >
              {leak.level === 'block'
                ? <><ShieldAlert className="w-3.5 h-3.5" /> Blocked</>
                : copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Email</>}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </Button>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Placeholder Guide</p>
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map(p => (
            <code key={p} className="text-xs bg-yellow-100 text-yellow-800 rounded px-2 py-0.5">{p}</code>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Replace all highlighted fields before sending to the customer.</p>
      </div>
    </div>
  );
}
