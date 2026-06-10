import DocumentUpload from '@/components/admin/DocumentUpload';
import { prisma } from '@/lib/db/prisma';

export const metadata = { title: 'Upload Documents — Capelli CS Coach' };

export default async function UploadPage() {
  const documents = await prisma.document.findMany({
    include: {
      uploadedBy: { select: { name: true } },
      _count: { select: { chunks: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return <DocumentUpload initialDocuments={documents as any[]} />;
}
