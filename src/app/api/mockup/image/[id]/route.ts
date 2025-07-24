import { NextRequest, NextResponse } from 'next/server';
import { createClient, RedisClientType } from 'redis';

// Create Redis client
let redisClient: RedisClientType | null = null;
try {
  if (process.env.REDIS_URL) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    redisClient.connect().catch((err: Error) => {
      console.log('⚠️ Redis connection failed:', err.message);
      redisClient = null;
    });
  }
} catch {
  console.log('⚠️ Redis client creation failed');
  redisClient = null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!redisClient || !redisClient.isReady) {
      return NextResponse.json({ error: 'Redis not available' }, { status: 503 });
    }

    // Get the base64 image from Redis
    const base64Data = await redisClient.get(`mockup:${id}`);

    if (!base64Data) {
      return NextResponse.json({ error: 'Image not found or expired' }, { status: 404 });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Return the image
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
} 