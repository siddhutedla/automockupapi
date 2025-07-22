import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import { TokenRefreshService } from '@/lib/token-refresh';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  console.log('🔄 [REFRESH-TOKENS] Starting token refresh...');
  console.log('🔄 [REFRESH-TOKENS] Request ID:', requestId);

  try {
    const tokenData = await TokenRefreshService.refreshAccessToken();
    
    console.log('✅ [REFRESH-TOKENS] Token refresh completed successfully');
    
    return ApiResponseHandler.success(
      {
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        api_domain: tokenData.api_domain,
        token_type: tokenData.token_type,
        expires_at: TokenRefreshService.calculateExpiryTime(tokenData.expires_in)
      },
      'Tokens refreshed successfully',
      requestId
    );
  } catch (error) {
    console.error('❌ [REFRESH-TOKENS] Token refresh failed:', error);
    return ApiResponseHandler.serverError(
      `Failed to refresh tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId
    );
  }
} 