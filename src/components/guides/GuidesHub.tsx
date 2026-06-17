'use client';

import { useState } from 'react';
import { PlaySquare, ListChecks, ArrowLeft } from 'lucide-react';
import { GUIDES } from '@/lib/guides/guides';
import VisualGuide from './VisualGuide';

export default function GuidesHub() {
  const [activeId, setActiveId] = useState<string | null>(GUIDES.length === 1 ? GUIDES[0].id : null);
  const active = GUIDES.find((g) => g.id === activeId) ?? null;

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PlaySquare className="w-5 h-5 text-capelli-navy" /> Visual Guides
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Step-by-step, screenshot walkthroughs of how the team handles real tickets — straight from the training sessions.
          </p>
        </div>

        {!active && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GUIDES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveId(g.id)}
                className="text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-200 hover:shadow-card-hover transition-all"
              >
                <p className="text-sm font-semibold text-gray-900">{g.title}</p>
                <p className="text-xs text-gray-500 mt-1">{g.summary}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-capelli-navy">
                  <ListChecks className="w-3.5 h-3.5" /> {g.steps.length} steps
                </p>
              </button>
            ))}
          </div>
        )}

        {active && (
          <div className="space-y-3">
            {GUIDES.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-capelli-navy"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> All guides
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">{active.title}</h2>
              <p className="text-sm text-gray-500">{active.scenario}</p>
            </div>
            <VisualGuide guide={active} />
          </div>
        )}
      </div>
    </div>
  );
}
