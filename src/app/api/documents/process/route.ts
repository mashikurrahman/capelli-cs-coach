import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { canUpload } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { parseDocument } from '@/lib/ai/document-processor';
import { storeEmbedding, embed } from '@/lib/ai/embeddings';
import { z } from 'zod';

const schema = z.object({ documentId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRole = (session.user as { role: string }).role as any;
    if (!canUpload(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { documentId } = schema.parse(body);

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (doc.uploadedById !== (session.user as { id: string }).id) {
      // Allow admins/team leaders to process any doc
      const role = (session.user as { role: string }).role;
      if (role !== 'ADMIN' && role !== 'TEAM_LEADER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Parse the document
    const { chunks, pageCount } = await parseDocument(doc.filePath, doc.fileType);

    if (chunks.length === 0) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ error: 'No content extracted from document' }, { status: 422 });
    }

    // Delete existing chunks if re-processing
    await prisma.documentChunk.deleteMany({ where: { documentId } });

    // Store chunks with embeddings
    const stored: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkRecord = await prisma.documentChunk.create({
        data: {
          documentId,
          chunkIndex: i,
          content: chunk.content,
          pageNumber: chunk.pageNumber ?? null,
          sectionHeading: chunk.sectionHeading ?? null,
          topic: chunk.topic ?? null,
          tokenCount: Math.ceil(chunk.content.length / 4),
          isSensitive: doc.isSensitive,
        },
      });

      // Embed and store vector
      try {
        await storeEmbedding(chunkRecord.id, chunk.content);
        stored.push(chunkRecord.id);
      } catch (embedErr) {
        console.warn(`Embedding failed for chunk ${i}:`, embedErr);
      }
    }

    // Mark document as processed
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'PROCESSED',
        pageCount: pageCount ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: (session.user as { id: string }).id,
        action: 'DOCUMENT_PROCESSED',
        resource: 'document',
        resourceId: documentId,
        details: { chunks: chunks.length, embedded: stored.length } as any,
      },
    });

    return NextResponse.json({
      ok: true,
      chunks: chunks.length,
      embedded: stored.length,
      pageCount: pageCount ?? null,
    });
  } catch (err) {
    console.error('Processing error:', err);
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
