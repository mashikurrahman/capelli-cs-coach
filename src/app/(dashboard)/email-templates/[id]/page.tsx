import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import { prisma } from '@/lib/db/prisma';
import TemplateFiller from '@/components/email-templates/TemplateFiller';
import RecordRecentTemplate from '@/components/email-templates/RecordRecentTemplate';

export const metadata: Metadata = { title: 'Email Template' };

export default async function TemplateDetailPage({ params }: { params: { id: string } }) {
  const template = await prisma.template.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, category: true, subject: true, body: true, placeholders: true },
  });

  if (!template) notFound();

  return (
    <div className="flex flex-col h-full">
      <RecordRecentTemplate id={template.id} name={template.name} category={template.category} />
      <Header title={template.name} subtitle={template.category ?? 'Email template'} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto">
          <Link
            href="/email-templates"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-capelli-navy mb-5"
          >
            <ArrowLeft className="w-4 h-4" /> All templates
          </Link>
          <TemplateFiller
            name={template.name}
            subject={template.subject}
            body={template.body}
            placeholders={template.placeholders}
          />
        </div>
      </div>
    </div>
  );
}
