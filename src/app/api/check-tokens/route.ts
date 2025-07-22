import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import { TokenRefreshService } from '@/lib/token-refresh';

export async function GET() {
  const requestId = generateRequestId();
  
  console.log('🔍 [CHECK-TOKENS] Checking token status...');
  console.log('🔍 [CHECK-TOKENS] Request ID:', requestId);

  try {
    // Check current environment variables
    const currentTokens = {
      hasAccessToken: !!process.env.ZOHO_ACCESS_TOKEN,
      hasRefreshToken: !!process.env.ZOHO_REFRESH_TOKEN,
      hasClientId: !!process.env.ZOHO_CLIENT_ID,
      hasClientSecret: !!process.env.ZOHO_CLIENT_SECRET,
      accessTokenLength: process.env.ZOHO_ACCESS_TOKEN?.length || 0,
      refreshTokenLength: process.env.ZOHO_REFRESH_TOKEN?.length || 0,
      apiDomain: process.env.ZOHO_API_DOMAIN || 'not set'
    };

    console.log('🔍 [CHECK-TOKENS] Current token status:', currentTokens);

    // Try to refresh tokens
    let refreshResult = null;
    try {
      const tokenData = await TokenRefreshService.refreshAccessToken();
      refreshResult = {
        success: true,
        expiresIn: tokenData.expires_in,
        apiDomain: tokenData.api_domain,
        tokenType: tokenData.token_type
      };
      console.log('✅ [CHECK-TOKENS] Token refresh successful');
    } catch (refreshError) {
      refreshResult = {
        success: false,
        error: refreshError instanceof Error ? refreshError.message : 'Unknown error'
      };
      console.error('❌ [CHECK-TOKENS] Token refresh failed:', refreshError);
    }
    
    return ApiResponseHandler.success(
      {
        currentTokens,
        refreshResult
      },
      'Token status checked',
      requestId
    );
  } catch (error) {
    console.error('❌ [CHECK-TOKENS] Error checking tokens:', error);
    return ApiResponseHandler.serverError(
      `Failed to check tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId
    );
  }
} 