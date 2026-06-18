'use client';

import { useMemo, useState } from 'react';
import { Copy, Check, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { scanSensitive, detectTampering } from '@/lib/guards/email-guards';

interface Props {
  name: string;
  subject?: string | null;
  body: string;
  placeholders: string[];
  /** Optional initial values (e.g. order number pulled from a ticket). */
  initialValues?: Record<string, string>;
  compact?: boolean;
}

function renderBody(body: string, values: Record<string, string>): string {
  return body.replace(/\[([^\]]+)\]/g, (match, name) => {
    const v = values[name];
    return v && v.trim() ? v : match;
  });
}

export default function TemplateFiller({ name, subject, body, placeholders, initialValues = {}, compact }: Props) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [manual, setManual] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const rendered = useMemo(() => renderBody(body, values), [body, values]);
  const renderedSubject = useMemo(
    () => (subject ? renderBody(subject, values) : null),
    [subject, values]
  );
  const finalText = manual ?? rendered;
  const remaining = placeholders.filter(p => !values[p]?.trim());

  // ── Guardrails ──────────────────────────────────────────────────────────────
  // Scan the full outgoing text (subject + body) for sensitive leaks; detect if
  // the verbatim template wording was changed by hand.
  const scan = useMemo(() => {
    const full = renderedSubject ? `${renderedSubject}\n${finalText}` : finalText;
    return scanSensitive(full);
  }, [renderedSubject, finalText]);
  const tamper = useMemo(
    () => (manual !== null ? detectTampering(body, finalText) : { tampered: false, missing: [] }),
    [manual, body, finalText]
  );

  function setValue(key: string, val: string) {
    setValues(v => ({ ...v, [key]: val }));
    // If the agent hasn't hand-edited yet, inputs keep driving the preview live.
  }

  const copyBlocked = scan.level === 'block';

  async function copy() {
    if (copyBlocked) return;
    const text = renderedSubject ? `Subject: ${renderedSubject}\n\n${finalText}` : finalText;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className={cn('grid gap-5', compact ? 'grid-cols-1' : 'lg:grid-cols-[320px_1fr]')}>
      {/* Fill-in fields */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Fill in the details</h3>
          {placeholders.length > 0 && (
            <span className="text-xs text-gray-400">{placeholders.length - remaining.length}/{placeholders.length}</span>
          )}
        </div>

        {placeholders.length === 0 ? (
          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
            This template has no fields to fill — just copy it as-is.
          </p>
        ) : (
          <div className="space-y-2.5">
            {placeholders.map(p => (
              <div key={p}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{p}</label>
                <input
                  value={values[p] ?? ''}
                  onChange={e => setValue(p, e.target.value)}
                  placeholder={p}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all"
                />
              </div>
            ))}
          </div>
        )}

        {manual !== null && (
          <button
            onClick={() => setManual(null)}
            className="flex items-center gap-1.5 text-xs text-capelli-navy hover:underline"
          >
            <RotateCcw className="w-3 h-3" /> Re-apply fields (discard manual edits)
          </button>
        )}
      </div>

      {/* Live preview (editable) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Email preview</h3>
          <button
            onClick={copy}
            disabled={copyBlocked}
            title={copyBlocked ? 'Resolve the flagged content before copying' : undefined}
            className={cn(
              'press inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-colors',
              copyBlocked ? 'bg-red-400 cursor-not-allowed'
                : copied ? 'bg-capelli-success' : 'bg-capelli-navy hover:bg-capelli-navyLight'
            )}
          >
            {copyBlocked
              ? <ShieldAlert className="w-3.5 h-3.5" />
              : copied
                ? <Check className="w-3.5 h-3.5 animate-check-bounce" />
                : <Copy className="w-3.5 h-3.5" />}
            {copyBlocked ? 'Blocked' : copied ? 'Copied!' : 'Copy email'}
          </button>
        </div>

        {/* Guardrail: sensitive-data leak scan */}
        {scan.level === 'block' && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
              <ShieldAlert className="w-3.5 h-3.5" /> Do not send — sensitive content detected
            </p>
            <ul className="mt-1 space-y-0.5">
              {scan.findings.map((f, i) => (
                <li key={i} className={cn('text-xs', f.level === 'block' ? 'text-red-700' : 'text-amber-700')}>• {f.label}</li>
              ))}
            </ul>
            <p className="mt-1.5 text-[11px] text-red-600">Never share club passwords, RO numbers, or internal systems with a customer. Remove it to enable copy.</p>
          </div>
        )}
        {scan.level === 'warn' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" /> Check before sending
            </p>
            <ul className="mt-1 space-y-0.5">
              {scan.findings.map((f, i) => <li key={i} className="text-xs text-amber-700">• {f.label}</li>)}
            </ul>
          </div>
        )}

        {/* Guardrail: template tampering */}
        {tamper.tampered && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" /> You changed the template wording
            </p>
            <p className="mt-0.5 text-[11px] text-amber-700">
              Templates must be sent as-is — only fill the [fields]. Use “Re-apply fields” to restore the standard wording.
            </p>
          </div>
        )}

        {renderedSubject && (
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <span className="font-semibold">Subject:</span> {renderedSubject}
          </div>
        )}

        <textarea
          value={finalText}
          onChange={e => setManual(e.target.value)}
          spellCheck
          className="w-full min-h-[420px] rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed
                     font-sans whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300
                     transition-all custom-scroll"
        />

        {remaining.length > 0 && manual === null && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Still to fill: {remaining.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
