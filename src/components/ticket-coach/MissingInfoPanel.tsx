'use client';

import { ClipboardList, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { MissingInfoItem } from '@/types';

interface Props { missing: MissingInfoItem[] }

export default function MissingInfoPanel({ missing }: Props) {
  const required = missing.filter(m => m.is_required);
  const optional = missing.filter(m => !m.is_required);

  if (missing.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-capelli-success mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-700">No missing information detected</h3>
        <p className="text-sm text-gray-400 mt-1">All required details appear to be available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Required */}
      {required.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-card overflow-hidden">
          <div className="flex items-center gap-2 p-4 bg-red-50 border-b border-red-100">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Required Information Missing ({required.length})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {required.map((item, i) => (
              <MissingItem key={i} item={item} isRequired />
            ))}
          </div>
        </div>
      )}

      {/* Optional */}
      {optional.length > 0 && (
        <div className="bg-white rounded-xl border border-yellow-200 shadow-card overflow-hidden">
          <div className="flex items-center gap-2 p-4 bg-yellow-50 border-b border-yellow-100">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Helpful Information (Optional, {optional.length})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {optional.map((item, i) => (
              <MissingItem key={i} item={item} isRequired={false} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-capelli-infoBg rounded-xl border border-blue-200 p-4">
        <p className="text-sm text-capelli-info">
          <strong>What to do:</strong> The customer email draft in Step 5 will automatically request the missing required information. Do not send a resolution email until required items are confirmed.
        </p>
      </div>
    </div>
  );
}

function MissingItem({ item, isRequired }: { item: MissingInfoItem; isRequired: boolean }) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${isRequired ? 'bg-red-400' : 'bg-yellow-400'}`} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">{item.field}</p>
          <p className="text-xs text-gray-500 mt-0.5">{item.reason}</p>
          {item.how_to_get && (
            <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-600">
                <span className="font-medium text-capelli-navy">How to get it: </span>
                {item.how_to_get}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
