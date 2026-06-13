import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { canUpload } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import os from 'os';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? '52428800'); // 50MB default
// On Vercel/serverless the project filesystem is read-only — only the OS temp
// dir is writable. Default there so uploads don't crash. NOTE: temp storage is
// ephemeral, so for reliable doc ingestion in production use `npm run kb:ingest`
// against the prod DB, or wire object storage (e.g. Supabase Storage).
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(os.tmpdir(), 'capelli-uploads');

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/msword': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-excel': 'XLSX',
  'text/csv': 'CSV',
  'text/plain': 'TXT',
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRole = (session.user as { role: string }).role as any;
    if (!canUpload(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions to upload documents' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) ?? 'GENERAL';
    const title = (formData.get('title') as string) ?? '';
    const notes = (formData.get('notes') as string) ?? '';
    const isSensitive = formData.get('isSensitive') === 'true';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    const mimeType = file.type;
    const fileTypeEnum = ALLOWED_TYPES[mimeType] as 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'TXT';
    if (!fileTypeEnum) {
      return NextResponse.json({ error: 'Unsupported file type. Allowed: PDF, DOCX, XLSX, CSV, TXT' }, { status: 400 });
    }

    // Save to disk
    const uploadDir = path.resolve(UPLOAD_DIR);
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitized}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Create document record
    const doc = await prisma.document.create({
      data: {
        title: title || file.name,
        fileName: file.name,
        fileType: fileTypeEnum,
        filePath,
        fileSize: file.size,
        status: 'PROCESSING',
        isSensitive,
        category: category as any,
        uploadedById: (session.user as { id: string }).id,
        notes: notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: (session.user as { id: string }).id,
        action: 'DOCUMENT_UPLOADED',
        resource: 'document',
        resourceId: doc.id,
        details: { fileName: file.name, fileType: fileTypeEnum, fileSize: file.size } as any,
      },
    });

    return NextResponse.json({ documentId: doc.id, status: 'PROCESSING' });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
