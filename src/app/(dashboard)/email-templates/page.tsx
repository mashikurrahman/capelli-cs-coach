import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import { prisma } from '@/lib/db/prisma';
import EmailTemplates from '@/components/email-templates/EmailTemplates';

export const metadata: Metadata = { title: 'Email Templates' };

export default async function EmailTemplatesPage() {
  const templates = await prisma.template.findMany({
    where: { status: 'APPROVED' },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      category: true,
      keywords: true,
      placeholders: true,
    },
  });

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Email Templates"
        subtitle="Approved customer email and internal note templates — copy and personalize"
      />
      <div className="flex-1 overflow-y-auto">
        <EmailTemplates templates={templates as any} />
      </div>
    </div>
  );
}
