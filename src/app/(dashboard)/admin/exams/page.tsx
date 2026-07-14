import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import { getSession } from '@/lib/auth/utils';
import ExamAdmin from '@/components/exam/ExamAdmin';

export const metadata: Metadata = { title: 'Exam Results' };

const ALLOWED = ['ADMIN', 'TEAM_LEADER', 'TRAINER'];

export default async function ExamAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  const role = (session.user as { role: string }).role;
  if (!ALLOWED.includes(role)) redirect('/dashboard');

  return (
    <div className="flex flex-col h-full">
      <Header title="Exam Results" subtitle="Grade written answers and track certification across the team" />
      <div className="flex-1 overflow-y-auto">
        <ExamAdmin />
      </div>
    </div>
  );
}
