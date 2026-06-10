import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { semanticSearch } from '@/lib/ai/embeddings';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') ?? '10');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await semanticSearch(q.trim(), limit);

    // Enrich with document metadata
    const docIds = [...new Set(results.map(r => r.documentId))];
    const docs = await prisma.document.findMany({
      where: { id: { in: docIds } },
      select: { id: true, title: true, fileName: true, category: true },
    });
    const docMap = Object.fromEntries(docs.map(d => [d.id, d]));

    const enriched = results.map(r => ({
      ...r,
      document: docMap[r.documentId] ?? null,
    }));

    return NextResponse.json({ results: enriched, query: q });
  } catch (err) {
    console.error('KB search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
