import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const filename = `${timestamp}-${originalName}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and process with sharp
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate image and get metadata
    let imageMetadata;
    try {
      imageMetadata = await sharp(buffer).metadata();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid image file' },
        { status: 400 }
      );
    }

    // Check minimum dimensions
    if (imageMetadata.width && imageMetadata.width < 100) {
      return NextResponse.json(
        { success: false, error: 'Image width must be at least 100px' },
        { status: 400 }
      );
    }

    if (imageMetadata.height && imageMetadata.height < 100) {
      return NextResponse.json(
        { success: false, error: 'Image height must be at least 100px' },
        { status: 400 }
      );
    }

    // Process image with sharp (resize and optimize)
    const processedImage = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 90 })
      .toBuffer();

    // Save processed image
    await writeFile(filepath, processedImage);

    const url = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      metadata: {
        originalSize: file.size,
        processedSize: processedImage.length,
        dimensions: {
          width: imageMetadata.width,
          height: imageMetadata.height
        }
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
} 