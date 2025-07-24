import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the base64 image from Redis
    const base64Image = await kv.get(`mockup:${id}`);
    
    if (!base64Image) {
      return NextResponse.json({ error: 'Image not found or expired' }, { status: 404 });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image as string, 'base64');
    
    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
} 