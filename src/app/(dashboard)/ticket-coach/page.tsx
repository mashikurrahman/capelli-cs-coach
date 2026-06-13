import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import { prisma } from '@/lib/db/prisma';
import TicketCoachV2 from '@/components/ticket-coach/TicketCoachV2';

export const metadata: Metadata = { title: 'Ticket Coach' };

export default async function TicketCoachPage() {
  const templates = await prisma.template.findMany({
    where: { status: 'APPROVED' },
    orderBy: [{ sortOrder: 'asc' }],
    select: { id: true, name: true, category: true, keywords: true, placeholders: true, subject: true, body: true },
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Ticket Coach" subtitle="Find the workflow, follow the steps, send the right email" />
      <div className="flex-1 overflow-hidden">
        <TicketCoachV2 templates={templates} />
      </div>
    </div>
  );
}
