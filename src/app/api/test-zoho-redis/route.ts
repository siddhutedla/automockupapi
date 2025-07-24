import { NextResponse } from 'next/server';
import { getZohoTokenStatus } from '@/lib/zoho-token';
import { ZohoClientKV } from '@/lib/zoho-client-kv';

export async function GET() {
  try {
    // Test Redis connection and Zoho token status
    const tokenStatus = await getZohoTokenStatus();
    
    // Test Zoho API connection
    let zohoTest: { success: boolean; error?: string; data?: Record<string, unknown> } = { success: false, error: 'Not tested' };
    
    if (tokenStatus.hasToken) {
      try {
        const zohoClient = new ZohoClientKV();
        const userInfo = await zohoClient.getUserInfo();
        zohoTest = { 
          success: true, 
          data: { 
            hasData: !!userInfo,
            dataType: typeof userInfo
          } 
        };
      } catch (error) {
        zohoTest = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      redis: {
        hasRedisUrl: tokenStatus.hasRedisUrl,
        hasToken: tokenStatus.hasToken,
        redisUrl: process.env.REDIS_URL ? 'Configured' : 'Not configured'
      },
      zoho: {
        clientId: process.env.ZOHO_CLIENT_ID ? 'Configured' : 'Not configured',
        clientSecret: process.env.ZOHO_CLIENT_SECRET ? 'Configured' : 'Not configured',
        refreshToken: process.env.ZOHO_REFRESH_TOKEN ? 'Configured' : 'Not configured',
        apiTest: zohoTest
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL || 'Not set'
      }
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 