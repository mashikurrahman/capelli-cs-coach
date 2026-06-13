import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import TeamChat from '@/components/chat/TeamChat';

export const metadata: Metadata = { title: 'Team Chat' };

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Team Chat"
        subtitle="Internal team room — coordinate on tickets in real time"
      />
      <div className="flex-1 overflow-hidden">
        <TeamChat />
      </div>
    </div>
  );
}
