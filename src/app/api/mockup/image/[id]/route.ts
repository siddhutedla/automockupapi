import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

// Create Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

async function initializeRedis() {
  if (!process.env.REDIS_URL) {
    console.log('⚠️ REDIS_URL not found');
    return null;
  }

  try {
    const client = createClient({
      url: process.env.REDIS_URL
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await client.connect();
    console.log('✅ Redis client connected successfully');
    return client;
  } catch (error) {
    console.log('⚠️ Redis connection failed:', error);
    return null;
  }
}

// Initialize Redis on module load
initializeRedis().then(client => {
  redisClient = client;
});

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