'use client';

import { CheckCircle2, XCircle, AlertTriangle, Lock, Unlock, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils/cn';
import { useState } from 'react';
import type { PreSendCheckItem } from '@/types';

interface Props {
  checklist: PreSendCheckItem[];
  completedChecks: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
  emailBody: string;
  allPassed: boolean;
  sessionId: string | null;
}

export default function PreSendChecklist({ checklist, completedChecks, onToggle, emailBody, allPassed, sessionId }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const required = checklist.filter(c => c.is_required);
  const optional = checklist.filter(c => !c.is_required);
  const completedRequired = required.filter(c => completedChecks[c.key]).length;
  const progress = required.length > 0 ? Math.round((completedRequired / required.length) * 100) : 100;

  async function handleCopyEmail() {
    if (!allPassed) return;
    await navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast({ title: '✓ Email copied — all checks passed!', variant: 'success' });
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Pre-Send Safety Check</h3>
          <span className={cn(
            'text-sm font-bold',
            progress === 100 ? 'text-capelli-success' : 'text-capelli-warning'
          )}>
            {completedRequired}/{required.length} required
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', progress === 100 ? 'bg-capelli-success' : 'bg-capelli-warning')}
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 ? (
          <p className="text-sm text-capelli-success font-medium mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            All required checks passed. You may copy and send the email.
          </p>
        ) : (
          <p className="text-sm text-capelli-warning font-medium mt-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            {required.length - completedRequired} required check(s) remaining before you can copy the email.
          </p>
        )}
      </div>

      {/* Required checks */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Required Checks</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {required.map(item => (
            <ChecklistRow
              key={item.key}
              item={item}
              checked={!!completedChecks[item.key]}
              onToggle={checked => onToggle(item.key, checked)}
            />
          ))}
        </div>
      </div>

      {/* Optional checks */}
      {optional.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recommended Checks</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {optional.map(item => (
              <ChecklistRow
                key={item.key}
                item={item}
                checked={!!completedChecks[item.key]}
                onToggle={checked => onToggle(item.key, checked)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Copy gate */}
      <div className={cn(
        'rounded-xl border-2 p-5 transition-all duration-300',
        allPassed ? 'border-capelli-success bg-green-50' : 'border-gray-200 bg-gray-50'
      )}>
        <div className="flex items-center gap-3 mb-3">
          {allPassed
            ? <Unlock className="w-6 h-6 text-capelli-success" />
            : <Lock className="w-6 h-6 text-gray-400" />
          }
          <div>
            <p className={cn('font-semibold', allPassed ? 'text-capelli-success' : 'text-gray-500')}>
              {allPassed ? 'Email Unlocked — Ready to Send' : 'Email Locked — Complete All Required Checks'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {allPassed
                ? 'You have confirmed all required pre-send checks.'
                : 'Check all required items above before copying the customer email.'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleCopyEmail}
          disabled={!allPassed}
          size="lg"
          className={cn('w-full gap-2', allPassed && 'bg-capelli-success hover:bg-green-700')}
        >
          {copied
            ? <><Check className="w-5 h-5" /> Copied!</>
            : <><Copy className="w-5 h-5" /> Copy Email to Clipboard</>
          }
        </Button>
      </div>
    </div>
  );
}

function ChecklistRow({ item, checked, onToggle }: { item: PreSendCheckItem; checked: boolean; onToggle: (v: boolean) => void }) {
  return (
    <label className={cn(
      'flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50',
      checked && 'bg-green-50/50'
    )}>
      <Checkbox
        checked={checked}
        onCheckedChange={v => onToggle(!!v)}
        className="mt-0.5"
      />
      <div className="flex-1">
        <p className={cn('text-sm', checked ? 'text-gray-400 line-through' : 'text-gray-700 font-medium')}>
          {item.label}
        </p>
        {item.warning && !checked && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            {item.warning}
          </p>
        )}
      </div>
      {checked && <CheckCircle2 className="w-4 h-4 text-capelli-success flex-shrink-0 mt-0.5" />}
    </label>
  );
}
