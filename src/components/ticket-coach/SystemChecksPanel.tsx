'use client';

import { Monitor, Database, ShoppingBag, FileSpreadsheet, Store, Phone, BookOpen, Tag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { SystemCheckItem } from '@/types';

const SYSTEM_ICONS: Record<string, React.ReactNode> = {
  ZENDESK: <Monitor className="w-5 h-5" />,
  BIGCOMMERCE: <ShoppingBag className="w-5 h-5" />,
  SHOPIFY: <Store className="w-5 h-5" />,
  SAP: <Database className="w-5 h-5" />,
  TEAM_STORE: <Store className="w-5 h-5" />,
  CONTACT_SHEET: <Phone className="w-5 h-5" />,
  PRODUCT_DIRECTORY: <BookOpen className="w-5 h-5" />,
  ZENDESK_TAGS_SHEET: <Tag className="w-5 h-5" />,
};

const SYSTEM_COLORS: Record<string, string> = {
  ZENDESK: 'text-capelli-info bg-capelli-infoBg border-blue-200',
  BIGCOMMERCE: 'text-green-700 bg-green-50 border-green-200',
  SHOPIFY: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  SAP: 'text-orange-700 bg-orange-50 border-orange-200',
  TEAM_STORE: 'text-purple-700 bg-purple-50 border-purple-200',
  CONTACT_SHEET: 'text-pink-700 bg-pink-50 border-pink-200',
  PRODUCT_DIRECTORY: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  ZENDESK_TAGS_SHEET: 'text-teal-700 bg-teal-50 border-teal-200',
};

const PRIORITY_ORDER = { first: 0, second: 1, optional: 2 } as const;

interface Props { systems: SystemCheckItem[] }

export default function SystemChecksPanel({ systems }: Props) {
  const sorted = [...systems].sort(
    (a, b) => PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] - PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER]
  );

  const firsts = sorted.filter(s => s.priority === 'first');
  const seconds = sorted.filter(s => s.priority === 'second');
  const optionals = sorted.filter(s => s.priority === 'optional');

  return (
    <div className="space-y-4">
      <div className="bg-capelli-infoBg border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-capelli-info font-medium">
          📋 Check these systems in order before responding to the customer.
        </p>
      </div>

      {firsts.length > 0 && (
        <Section label="Check First" systems={firsts} accent="border-l-red-400" />
      )}
      {seconds.length > 0 && (
        <Section label="Then Check" systems={seconds} accent="border-l-yellow-400" />
      )}
      {optionals.length > 0 && (
        <Section label="Also Check (if applicable)" systems={optionals} accent="border-l-gray-300" />
      )}
    </div>
  );
}

function Section({ label, systems, accent }: { label: string; systems: SystemCheckItem[]; accent: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-3">
        {systems.map((s, i) => {
          const colorClass = SYSTEM_COLORS[s.system] ?? 'text-gray-700 bg-gray-50 border-gray-200';
          const icon = SYSTEM_ICONS[s.system] ?? <Database className="w-5 h-5" />;
          return (
            <div
              key={i}
              className={cn('bg-white rounded-xl border border-l-4 shadow-card overflow-hidden', accent)}
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center border', colorClass)}>
                    {icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{s.system.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">{s.why}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 mt-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-capelli-navy">What to check: </span>
                    {s.what_to_check}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
