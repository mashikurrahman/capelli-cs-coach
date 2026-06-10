'use client';

import { useState } from 'react';
import { Copy, Edit3, Check, StickyNote, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils/cn';

interface Props {
  body: string;
  onEdit: (body: string) => void;
  sessionId: string | null;
}

export default function InternalNoteCard({ body, onEdit, sessionId }: Props) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(body);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Internal note copied', variant: 'success' });
  }

  function handleSave() {
    onEdit(editValue);
    setIsEditing(false);
    toast({ title: 'Note updated', variant: 'success' });
  }

  return (
    <div className="space-y-4">
      <div className="bg-capelli-purpleBg border border-purple-200 rounded-xl p-4">
        <p className="text-sm text-capelli-purple font-medium">
          🔒 This is an <strong>internal Zendesk note</strong> — it will NOT be visible to the customer.
          Always add this note before changing ticket status or sending a reply.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        {/* Note header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-purple-50">
          <div className="w-8 h-8 bg-capelli-purple rounded-lg flex items-center justify-center flex-shrink-0">
            <StickyNote className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-capelli-purple">Internal Zendesk Note</p>
            <p className="text-xs text-purple-400">Add this to the Zendesk ticket before sending your reply</p>
          </div>
        </div>

        {/* Note body */}
        <div className="p-5">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="min-h-[240px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm" className="gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setEditValue(body); setIsEditing(false); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
              {body}
            </pre>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2 px-5 pb-4">
            <Button
              onClick={handleCopy}
              variant="default"
              size="sm"
              className={cn('gap-1.5', copied && 'bg-capelli-success hover:bg-green-700')}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Note'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </Button>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-xs text-yellow-800">
          <strong>Reminder:</strong> Add the internal note FIRST, then change the ticket status, then send your reply.
          Never submit an Open ticket without an internal note.
        </p>
      </div>
    </div>
  );
}
