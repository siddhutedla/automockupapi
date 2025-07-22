import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ApiResponseHandler, generateRequestId, validateFileType, validateFileSize } from '@/lib/api-response';
import { LogoVectorizer } from '@/lib/vectorizer';

const ALLOWED_FILE_TYPES = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml'
];
const MAX_FILE_SIZE_MB = 5; // 5MB limit

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    console.log('Upload API called');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('File received:', {
      name: file?.name,
      type: file?.type,
      size: file?.size,
      exists: !!file
    });

    if (!file) {
      console.log('No file provided');
      return ApiResponseHandler.error('No file provided', 400, requestId);
    }

    // Validate file type
    console.log('Validating file type:', file.type, 'Allowed:', ALLOWED_FILE_TYPES);
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];
    const fileExtensionForValidation = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validateFileType(file, ALLOWED_FILE_TYPES) && !allowedExtensions.includes(fileExtensionForValidation)) {
      console.log('File type validation failed');
      return ApiResponseHandler.error(
        `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
        400,
        requestId
      );
    }

    // Validate file size
    console.log('Validating file size:', file.size, 'Max:', MAX_FILE_SIZE_MB * 1024 * 1024);
    if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
      console.log('File size validation failed');
      return ApiResponseHandler.error(
        `File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB`,
        400,
        requestId
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    console.log('Uploads directory:', uploadsDir);
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.') + 1);
    const filename = `logo-${timestamp}-${randomString}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    console.log('Saving file:', filepath);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${filename}`;

    console.log('Upload successful:', publicUrl);

    // Check if the uploaded file is vector format
    const isVector = await LogoVectorizer.isVectorFormat(filepath);
    const qualityInfo = isVector ? 'Vector format - High quality maintained' : 'Raster format - Enhanced quality processing available';

    return ApiResponseHandler.success(
      { 
        url: publicUrl, 
        filename, 
        size: file.size,
        isVector,
        qualityInfo
      },
      'File uploaded successfully',
      requestId
    );

  } catch (error) {
    console.error('Upload error:', error);
    return ApiResponseHandler.serverError('Failed to upload file', requestId);
  }
} 