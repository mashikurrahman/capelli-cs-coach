import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import TicketCoach from '@/components/ticket-coach/TicketCoach';

export const metadata: Metadata = { title: 'Ticket Coach' };

export default function TicketCoachPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Ticket Coach"
        subtitle="Paste a customer message and get guided step by step"
      />
      <TicketCoach />
    </div>
  );
}
