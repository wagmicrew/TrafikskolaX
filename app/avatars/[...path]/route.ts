import { NextRequest, NextResponse } from 'next/server';
import { join, normalize } from 'path';
import { stat, readFile } from 'fs/promises';

function sanitizePath(input: string): string {
  // Prevent path traversal
  return input.replace(/\\/g, '/').replace(/\.\.+/g, '');
}

function getContentType(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const rel = sanitizePath((params.path || []).join('/'));
    const avatarsDir = join(process.cwd(), 'public', 'avatars');
    const filePath = normalize(join(avatarsDir, rel));

    let data: Buffer;
    let contentType = getContentType(rel.split('.').pop() || '');
    try {
      const s = await stat(filePath);
      if (!s.isFile()) throw new Error('Not a file');
      data = await readFile(filePath);
    } catch {
      // Fallback to default image in /public/images
      const fallbackPath = join(process.cwd(), 'public', 'images', 'din-logo-small.png');
      data = await readFile(fallbackPath);
      contentType = 'image/png';
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}


