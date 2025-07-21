import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import { cacheManager } from '@/lib/cache-manager';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const cacheStats = cacheManager.getStats();
    
    // Get system performance metrics
    const performanceStats = {
      cache: cacheStats,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      timestamp: new Date().toISOString()
    };

    return ApiResponseHandler.success(
      performanceStats,
      'Performance statistics retrieved',
      requestId
    );

  } catch (error) {
    console.error('Error fetching performance stats:', error);
    return ApiResponseHandler.serverError('Failed to fetch performance statistics', requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear-cache':
        cacheManager.clear();
        return ApiResponseHandler.success(
          { message: 'Cache cleared successfully' },
          'Cache cleared',
          requestId
        );
      
      case 'get-cache-stats':
        const stats = cacheManager.getStats();
        return ApiResponseHandler.success(
          stats,
          'Cache statistics retrieved',
          requestId
        );
      
      default:
        return ApiResponseHandler.error('Invalid action', 400, requestId);
    }

  } catch (error) {
    console.error('Error processing performance action:', error);
    return ApiResponseHandler.serverError('Failed to process performance action', requestId);
  }
} 