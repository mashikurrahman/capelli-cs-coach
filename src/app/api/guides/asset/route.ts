import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { promises as fs } from 'fs';
import path from 'path';
import { GUIDES } from '@/lib/guides/guides';

export const dynamic = 'force-dynamic';

// Serves guide screenshots + short video clips that live outside /public so they
// stay behind login (they contain real customer data). Only files declared in the
// guide data are served, and only to authenticated users. Video is served with
// HTTP range support so the browser can stream/seek smoothly.
const GUIDES_ROOT = path.join(process.cwd(), 'content', 'guides');

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const guideId = req.nextUrl.searchParams.get('guide') ?? '';
  const file = req.nextUrl.searchParams.get('file') ?? '';

  // Validate against the declared guide data — never trust raw paths.
  const guide = GUIDES.find((g) => g.id === guideId);
  const allowed = guide?.steps.some((s) => s.image === file || s.video === file);
  if (!guide || !allowed) return new NextResponse('Not found', { status: 404 });

  const ext = path.extname(file).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new NextResponse('Unsupported', { status: 400 });

  // Resolve and confirm the path stays within the guides root (defense in depth).
  const filePath = path.join(GUIDES_ROOT, guideId, file);
  if (!filePath.startsWith(GUIDES_ROOT)) return new NextResponse('Forbidden', { status: 403 });

  try {
    const data = await fs.readFile(filePath);
    const total = data.length;
    const range = req.headers.get('range');

    // Range request (typical for <video>): return the requested slice as 206.
    if (range) {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      if (m) {
        const start = parseInt(m[1], 10);
        const end = m[2] ? parseInt(m[2], 10) : total - 1;
        if (start <= end && start < total) {
          const chunk = data.subarray(start, end + 1);
          return new NextResponse(chunk, {
            status: 206,
            headers: {
              'Content-Type': contentType,
              'Content-Range': `bytes ${start}-${end}/${total}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': String(chunk.length),
              'Cache-Control': 'private, max-age=3600',
            },
          });
        }
      }
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(total),
        // Private: cached per-user by the browser only, never shared caches.
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
