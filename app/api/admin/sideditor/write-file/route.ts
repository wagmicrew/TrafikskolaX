import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, content } = await request.json();

    if (!filePath || typeof content !== 'string') {
      return NextResponse.json({ error: 'File path and content are required' }, { status: 400 });
    }

    // Security check - only allow access to app directory files
    const resolvedPath = path.resolve(process.cwd(), filePath);
    const allowedBasePath = path.resolve(process.cwd(), 'app');

    if (!resolvedPath.startsWith(allowedBasePath)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Ensure directory exists
    const dir = path.dirname(resolvedPath);
    try {
      await fs.access(dir);
    } catch {
      // Create directory if it doesn't exist
      await fs.mkdir(dir, { recursive: true });
    }

    // Create backup of existing file
    try {
      const existingContent = await fs.readFile(resolvedPath, 'utf-8');
      const backupPath = `${resolvedPath}.backup.${Date.now()}`;
      await fs.writeFile(backupPath, existingContent);
    } catch {
      // File doesn't exist, no backup needed
    }

    // Write the new content
    await fs.writeFile(resolvedPath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'File saved successfully',
      filePath,
      lastModified: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error writing file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
