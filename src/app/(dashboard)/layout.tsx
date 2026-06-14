import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/utils';
import Sidebar from '@/components/layout/Sidebar';
import FloatingChat from '@/components/chat/FloatingChat';
import CommandPalette from '@/components/command/CommandPalette';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto custom-scroll">
          {children}
        </main>
      </div>
      {/* Team chat lives as a floating dock on every page, not in the sidebar. */}
      <FloatingChat />
      {/* Global ⌘K / Ctrl+K command palette. */}
      <CommandPalette />
    </div>
  );
}
