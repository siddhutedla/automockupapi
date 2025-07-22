import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import { getZohoTokenStatus, clearZohoAccessToken } from '@/lib/zoho-token';
import { ZohoClientKV } from '@/lib/zoho-client-kv';

export async function GET() {
  const requestId = generateRequestId();
  
  console.log('🔍 [TEST-REDIS-TOKENS] Testing Redis token system...');
  console.log('🔍 [TEST-REDIS-TOKENS] Request ID:', requestId);

  try {
    // Check token status
    const tokenStatus = await getZohoTokenStatus();
    
    console.log('🔍 [TEST-REDIS-TOKENS] Token status:', tokenStatus);

    // Test the Redis client
    let testResult = null;
    try {
      const zohoClient = new ZohoClientKV();
      const userInfo = await zohoClient.getUserInfo();
      
      testResult = {
        success: true,
        userInfo: userInfo,
        message: 'Redis token system working correctly'
      };
    } catch (error) {
      testResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Redis token system failed'
      };
    }

    return ApiResponseHandler.success(
      {
        tokenStatus,
        testResult
      },
      'Redis token system test completed',
      requestId
    );
  } catch (error) {
    console.error('❌ [TEST-REDIS-TOKENS] Test failed:', error);
    return ApiResponseHandler.serverError(
      `Failed to test Redis tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId
    );
  }
}

export async function POST() {
  const requestId = generateRequestId();
  
  console.log('🔄 [TEST-REDIS-TOKENS] Clearing Redis token...');
  console.log('🔄 [TEST-REDIS-TOKENS] Request ID:', requestId);

  try {
    await clearZohoAccessToken();
    
    return ApiResponseHandler.success(
      { message: 'Token cleared from Redis' },
      'Token cleared successfully',
      requestId
    );
  } catch (error) {
    console.error('❌ [TEST-REDIS-TOKENS] Failed to clear token:', error);
    return ApiResponseHandler.serverError(
      `Failed to clear token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId
    );
  }
} 