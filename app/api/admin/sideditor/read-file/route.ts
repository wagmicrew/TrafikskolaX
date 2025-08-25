import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Security check - only allow access to app directory files
    const resolvedPath = path.resolve(process.cwd(), filePath);
    const allowedBasePath = path.resolve(process.cwd(), 'app');

    if (!resolvedPath.startsWith(allowedBasePath)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if file exists
    try {
      await fs.access(resolvedPath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const content = await fs.readFile(resolvedPath, 'utf-8');

    return NextResponse.json({
      content,
      filePath,
      lastModified: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
