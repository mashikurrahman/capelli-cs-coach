'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Users, MessageSquare, X, Minus, Maximize2 } from 'lucide-react';
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

const SEEN_KEY = 'teamchat:lastSeen';

function readLastSeen(): number {
  if (typeof window === 'undefined') return 0;
  const v = window.localStorage.getItem(SEEN_KEY);
  return v ? Number(v) : 0;
}

export default function FloatingChat() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string })?.id;
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [lastSeen, setLastSeen] = useState<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate lastSeen from localStorage after mount (avoids SSR mismatch).
  useEffect(() => { setLastSeen(readLastSeen()); }, []);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat'],
    queryFn: fetchMessages,
    // Poll quickly while the dock is open, relax when it's tucked away.
    refetchInterval: open ? 4000 : 10000,
    refetchOnWindowFocus: true,
    enabled: !!session?.user,
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

  // Unread = messages from other people newer than what we've already seen.
  const unread = useMemo(() => {
    if (!messages.length) return 0;
    return messages.filter(
      m => m.userId !== myId && new Date(m.createdAt).getTime() > lastSeen
    ).length;
  }, [messages, myId, lastSeen]);

  function markSeen() {
    const latest = messages.length
      ? new Date(messages[messages.length - 1].createdAt).getTime()
      : Date.now();
    setLastSeen(latest);
    if (typeof window !== 'undefined') window.localStorage.setItem(SEEN_KEY, String(latest));
  }

  // While open, keep marking messages as seen as they stream in.
  useEffect(() => {
    if (open && messages.length) markSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, messages]);

  // Stick to the newest message + focus the composer when opening.
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open, messages]);

  // Esc closes the dock.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sendMutation.isPending) return;
    setDraft('');
    sendMutation.mutate(body);
  }

  // The full-page /chat view is the "expanded" experience — no dock there,
  // and the dock is only for authenticated app pages.
  if (!session?.user || pathname === '/chat') return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 no-print sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="flex h-[min(560px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-br from-capelli-navy to-slate-900 px-4 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-green-400" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">Team Chat</p>
                  <p className="text-[11px] text-slate-300">Internal room · live</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => router.push('/chat')}
                  title="Open full view"
                  aria-label="Open full view"
                  className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  title="Minimize"
                  aria-label="Minimize chat"
                  className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3 custom-scroll">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="py-10 text-center text-sm text-slate-400">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="py-14 text-center">
                    <Users className="mx-auto mb-3 h-9 w-9 text-slate-300" />
                    <p className="text-sm text-slate-500">No messages yet.<br />Say hello to the team 👋</p>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const mine = m.userId === myId;
                    const prev = messages[i - 1];
                    const grouped = prev && prev.userId === m.userId &&
                      new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
                    return (
                      <div key={m.id} className={cn('flex gap-2', mine && 'flex-row-reverse', grouped && 'mt-0.5')}>
                        <div className="w-7 flex-shrink-0">
                          {!grouped && (
                            <div className={cn('flex h-7 w-7 items-center justify-center rounded-full', ROLE_COLORS[m.userRole] ?? 'bg-slate-400')}>
                              <span className="text-[10px] font-semibold text-white">{getInitials(m.userName)}</span>
                            </div>
                          )}
                        </div>
                        <div className={cn('flex min-w-0 max-w-[80%] flex-col', mine && 'items-end')}>
                          {!grouped && (
                            <div className={cn('mb-0.5 flex items-baseline gap-2', mine && 'flex-row-reverse')}>
                              <span className="text-[11px] font-semibold text-slate-700">{mine ? 'You' : m.userName}</span>
                              <span className="text-[10px] text-slate-400">{formatRelativeTime(new Date(m.createdAt))}</span>
                            </div>
                          )}
                          <div className={cn(
                            'whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-sm',
                            mine ? 'rounded-tr-sm bg-capelli-navy text-white' : 'rounded-tl-sm border border-slate-200 bg-white text-slate-800'
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
            <form onSubmit={handleSend} className="border-t border-slate-200 bg-white px-3 py-2.5">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder="Message the team…"
                  className="max-h-28 flex-1 resize-none overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  title="Send message"
                  disabled={!draft.trim() || sendMutation.isPending}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-capelli-navy text-white transition-colors hover:bg-capelli-navyLight disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {sendMutation.isError && (
                <p className="mt-1 text-xs text-red-600">Couldn’t send. Try again.</p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.92 }}
        aria-label={open ? 'Close team chat' : 'Open team chat'}
        title="Team Chat"
        className={cn(
          'relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-blue-600/30 transition-colors',
          open ? 'bg-slate-700 hover:bg-slate-800' : 'bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800'
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.15 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="msg" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.15 }}>
              <MessageSquare className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge + attention pulse (only while closed) */}
        {!open && unread > 0 && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/40" />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-capelli-red px-1 text-[11px] font-bold leading-none text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
}
