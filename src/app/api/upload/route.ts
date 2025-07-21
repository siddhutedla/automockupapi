import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ApiResponseHandler, generateRequestId, validateFileType, validateFileSize } from '@/lib/api-response';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE_MB = 5; // 5MB limit

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return ApiResponseHandler.error('No file provided', 400, requestId);
    }

    // Validate file type
    if (!validateFileType(file, ALLOWED_FILE_TYPES)) {
      return ApiResponseHandler.error(
        `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
        400,
        requestId
      );
    }

    // Validate file size
    if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
      return ApiResponseHandler.error(
        `File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB`,
        400,
        requestId
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const filename = `logo-${timestamp}-${randomString}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${filename}`;

    return ApiResponseHandler.success(
      { url: publicUrl, filename, size: file.size },
      'File uploaded successfully',
      requestId
    );

  } catch (error) {
    console.error('Upload error:', error);
    return ApiResponseHandler.serverError('Failed to upload file', requestId);
  }
} 