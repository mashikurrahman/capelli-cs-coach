'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Quote, Clock, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Guide } from '@/lib/guides/guides';

function assetUrl(guideId: string, file: string) {
  return `/api/guides/asset?guide=${encodeURIComponent(guideId)}&file=${encodeURIComponent(file)}`;
}

export default function VisualGuide({ guide, className }: { guide: Guide; className?: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const step = guide.steps[i];
  const total = guide.steps.length;
  const imgSrc = assetUrl(guide.id, step.image);
  const videoSrc = step.video ? assetUrl(guide.id, step.video) : null;

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white overflow-hidden', className)}>
      {/* Clip (preferred) or screenshot */}
      <div className="relative bg-gray-900 group">
        {videoSrc ? (
          <video
            key={videoSrc}
            src={videoSrc}
            poster={imgSrc}
            controls
            preload="none"
            playsInline
            className="w-full max-h-[420px] object-contain bg-gray-900"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgSrc} alt={step.title} className="w-full max-h-[420px] object-contain bg-gray-900" />
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Maximize2 className="w-3 h-3" /> Zoom
            </button>
          </>
        )}
        {step.timestamp && (
          <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] text-white/90">
            <Clock className="w-3 h-3" /> {step.timestamp}
          </span>
        )}
      </div>

      {/* Step content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-capelli-navy text-xs font-bold text-white">{step.n}</span>
          <h4 className="text-sm font-semibold text-gray-900">{step.title}</h4>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{step.instruction}</p>
        {step.narration && (
          <p className="mt-2 flex gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs italic text-gray-500">
            <Quote className="w-3.5 h-3.5 flex-shrink-0 text-gray-300" /> “{step.narration}”
          </p>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
        <button
          type="button"
          onClick={() => setI((v) => Math.max(0, v - 1))}
          disabled={i === 0}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        <div className="flex items-center gap-1.5">
          {guide.steps.map((s, idx) => (
            <button
              key={s.n}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Step ${s.n}`}
              className={cn('h-1.5 rounded-full transition-all', idx === i ? 'w-5 bg-capelli-navy' : 'w-1.5 bg-gray-200 hover:bg-gray-300')}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setI((v) => Math.min(total - 1, v + 1))}
          disabled={i === total - 1}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom lightbox */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-overlay-in"
          onClick={() => setZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} alt={step.title} className="max-h-[92vh] max-w-[95vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          <button
            type="button"
            onClick={() => setZoom(false)}
            className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/25"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      )}
    </div>
  );
}
