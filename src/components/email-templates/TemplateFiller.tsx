'use client';

import { useMemo, useState } from 'react';
import { Copy, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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

  function setValue(key: string, val: string) {
    setValues(v => ({ ...v, [key]: val }));
    // If the agent hasn't hand-edited yet, inputs keep driving the preview live.
  }

  async function copy() {
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
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                       bg-capelli-navy text-white hover:bg-capelli-navyLight transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy email'}
          </button>
        </div>

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
