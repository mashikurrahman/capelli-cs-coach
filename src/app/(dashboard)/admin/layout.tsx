import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/utils';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = (session?.user as any)?.role;
  if (!['ADMIN', 'TEAM_LEADER', 'TRAINER'].includes(role)) {
    redirect('/dashboard');
  }
  return <>{children}</>;
}
