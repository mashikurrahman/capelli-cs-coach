import { AlertTriangle, Siren, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { AgentWarning } from '@/types';

export default function RiskWarningBanner({ warnings }: { warnings: AgentWarning[] }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((w, i) => {
        if (w.severity === 'critical') return (
          <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <Siren className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">Critical Warning</p>
              <p className="text-sm text-red-700">{w.message}</p>
              {w.rule && <p className="text-xs text-red-500 mt-1">Rule: {w.rule}</p>}
            </div>
          </div>
        );
        if (w.severity === 'warning') return (
          <div key={i} className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700">{w.message}</p>
          </div>
        );
        return (
          <div key={i} className="flex items-start gap-3 bg-capelli-infoBg border border-blue-200 rounded-xl p-3">
            <Info className="w-4 h-4 text-capelli-info flex-shrink-0 mt-0.5" />
            <p className="text-sm text-capelli-info">{w.message}</p>
          </div>
        );
      })}
    </div>
  );
}
