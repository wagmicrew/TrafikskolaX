import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAuth('admin');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Ingen fil vald' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ogiltigt filformat. Endast JPEG, PNG, GIF och WebP stöds.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Filen är för stor. Maxstorlek är 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `sideditor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${fileExtension}`;
    const filePath = path.join(process.cwd(), 'public', 'images', fileName);

    // Ensure images directory exists
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    try {
      await mkdir(imagesDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/images/${fileName}`;

    return NextResponse.json({
      success: true,
      location: publicUrl,
      message: 'Bild uppladdad framgångsrikt',
      fileName: fileName,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Kunde inte ladda upp bilden' },
      { status: 500 }
    );
  }
}
