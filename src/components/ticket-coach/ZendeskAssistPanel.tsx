'use client';

import { Tag, AlertCircle, Info, Siren } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getStatusBadge } from '@/lib/utils/helpers';
import type { ZendeskTagSuggestion } from '@/types';

interface Props {
  tags: ZendeskTagSuggestion[];
  status: string;
  escalation: boolean;
  escalationReason: string;
}

const TAG_CATEGORY_LABELS: Record<string, string> = {
  PRIMARY_CATEGORY: 'Primary Category',
  ISSUE_TYPE: 'Issue Type',
  SUB_ISSUE: 'Sub-Issue',
  ORDER_STATUS: 'Order Status',
  ACTION_TAKEN: 'Action Taken',
  PENDING_REASON: 'Pending Reason',
  ESCALATION: 'Escalation',
  FOLLOW_UP: 'Follow-Up',
  SOLVED_REASON: 'Solved Reason',
  CLUB_TEAM: 'Club / Team',
};

export default function ZendeskAssistPanel({ tags, status, escalation, escalationReason }: Props) {
  const requiredTags = tags.filter(t => t.is_required);
  const optionalTags = tags.filter(t => !t.is_required);
  const unofficialTags = tags.filter(t => !t.is_official);

  return (
    <div className="space-y-4">
      {/* Ticket status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-capelli-purpleBg rounded-lg flex items-center justify-center">
            <Tag className="w-4 h-4 text-capelli-purple" />
          </div>
          <h3 className="font-semibold text-gray-800">Ticket Status</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-sm font-semibold px-3 py-1.5 rounded-lg', getStatusBadge(status))}>
            {status}
          </span>
          <p className="text-sm text-gray-500">
            {status === 'Pending' && 'Set to Pending while waiting for customer information or action.'}
            {status === 'Open' && 'Keep Open while this ticket requires agent action.'}
            {status === 'Solved' && 'Solved — customer issue resolved, no further action needed.'}
            {status === 'On-hold' && 'On-hold while awaiting internal team response.'}
          </p>
        </div>

        {/* Status rules reminder */}
        <div className="mt-3 bg-purple-50 rounded-lg p-3 text-xs space-y-1 text-purple-700">
          <p>⚠ Do NOT set to Solved if customer action is still pending.</p>
          <p>⚠ Do NOT merge a new ticket into an old solved ticket.</p>
          <p>⚠ Do NOT close Pending tickets before 3 follow-up attempts.</p>
        </div>
      </div>

      {/* Escalation */}
      {escalation && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <Siren className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Escalation Required</p>
            <p className="text-sm text-red-700 mt-1">{escalationReason}</p>
            <p className="text-xs text-red-600 mt-2">
              Follow the Escalation Workflow — add internal note, send holding response, then contact Team Leader.
            </p>
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Zendesk Tags</h3>
          <p className="text-xs text-gray-400 mt-0.5">Copy these to the ticket tags field in Zendesk</p>
        </div>

        {/* Unofficial tag warning */}
        {unofficialTags.length > 0 && (
          <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">
              Some tags below could not be confirmed against the official Zendesk tag sheet.
              Verify these with your Team Leader before using.
            </p>
          </div>
        )}

        <div className="p-4 space-y-4">
          {requiredTags.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Required Tags</p>
              <div className="flex flex-wrap gap-2">
                {requiredTags.map((tag, i) => (
                  <TagChip key={i} tag={tag} />
                ))}
              </div>
            </div>
          )}
          {optionalTags.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Optional Tags</p>
              <div className="flex flex-wrap gap-2">
                {optionalTags.map((tag, i) => (
                  <TagChip key={i} tag={tag} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-capelli-infoBg border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-capelli-info flex-shrink-0 mt-0.5" />
          <p className="text-xs text-capelli-info">
            Refer to the Zendesk Tags sheet uploaded in the Admin panel for the official/complete tag list.
            Tags must not be left blank. Missing tags = incomplete documentation.
          </p>
        </div>
      </div>
    </div>
  );
}

function TagChip({ tag }: { tag: ZendeskTagSuggestion }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono cursor-default',
        tag.is_official
          ? 'bg-capelli-purpleBg text-capelli-purple border border-purple-200'
          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      )}
      title={tag.note ?? TAG_CATEGORY_LABELS[tag.category] ?? tag.category}
    >
      <Tag className="w-3 h-3" />
      {tag.tag}
      {!tag.is_official && <span className="text-yellow-500 text-[10px]">?</span>}
    </div>
  );
}
