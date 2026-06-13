'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getInitials, formatRelativeTime } from '@/lib/utils/helpers';

interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  userName: string;
  userRole: string;
}

async function fetchMessages(): Promise<ChatMessage[]> {
  const res = await fetch('/api/chat');
  if (!res.ok) throw new Error('Failed to load messages');
  return (await res.json()).messages;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-capelli-red',
  TEAM_LEADER: 'bg-capelli-purple',
  TRAINER: 'bg-capelli-warning',
  QA: 'bg-capelli-info',
  AGENT: 'bg-capelli-blue',
};

export default function TeamChat() {
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string })?.id;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat'],
    queryFn: fetchMessages,
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error('Failed to send');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat'] }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sendMutation.isPending) return;
    setDraft('');
    sendMutation.mutate(body);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 custom-scroll">
        <div className="max-w-3xl mx-auto space-y-3">
          {isLoading ? (
            <div className="text-center text-sm text-gray-400 py-10">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No messages yet. Say hello to the team 👋</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const mine = m.userId === myId;
              const prev = messages[i - 1];
              const grouped = prev && prev.userId === m.userId &&
                new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
              return (
                <div key={m.id} className={cn('flex gap-2.5', mine && 'flex-row-reverse', grouped && 'mt-0.5')}>
                  <div className="w-8 flex-shrink-0">
                    {!grouped && (
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', ROLE_COLORS[m.userRole] ?? 'bg-gray-400')}>
                        <span className="text-xs text-white font-semibold">{getInitials(m.userName)}</span>
                      </div>
                    )}
                  </div>
                  <div className={cn('min-w-0 max-w-[78%]', mine && 'items-end flex flex-col')}>
                    {!grouped && (
                      <div className={cn('flex items-baseline gap-2 mb-0.5', mine && 'flex-row-reverse')}>
                        <span className="text-xs font-semibold text-gray-700">{mine ? 'You' : m.userName}</span>
                        <span className="text-[10px] text-gray-400">{formatRelativeTime(new Date(m.createdAt))}</span>
                      </div>
                    )}
                    <div className={cn(
                      'rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words',
                      mine ? 'bg-capelli-navy text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                    )}>
                      {m.body}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="border-t border-gray-200 bg-white px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Message the team…  (Enter to send, Shift+Enter for newline)"
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 focus:bg-white transition-all
                       max-h-32 overflow-y-auto"
          />
          <button
            type="submit"
            aria-label="Send message"
            title="Send message"
            disabled={!draft.trim() || sendMutation.isPending}
            className="flex-shrink-0 h-10 w-10 rounded-xl bg-capelli-navy text-white flex items-center justify-center
                       hover:bg-capelli-navyLight disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {sendMutation.isError && (
          <p className="max-w-3xl mx-auto text-xs text-red-600 mt-1.5">Couldn’t send. Try again.</p>
        )}
      </form>
    </div>
  );
}
