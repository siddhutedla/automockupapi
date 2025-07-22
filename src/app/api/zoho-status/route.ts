import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    // Check environment variables
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const accessToken = process.env.ZOHO_ACCESS_TOKEN;
    const apiDomain = process.env.ZOHO_API_DOMAIN;

    const envStatus = {
      ZOHO_CLIENT_ID: !!clientId,
      ZOHO_CLIENT_SECRET: !!clientSecret,
      ZOHO_REFRESH_TOKEN: !!refreshToken,
      ZOHO_ACCESS_TOKEN: !!accessToken,
      ZOHO_API_DOMAIN: !!apiDomain
    };

    const missingVars = Object.entries(envStatus)
      .filter(([, hasValue]) => !hasValue)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return ApiResponseHandler.error(
        `Missing required environment variables: ${missingVars.join(', ')}`,
        500,
        requestId
      );
    }

    // Try to refresh the token to verify it works
    try {
      const { TokenRefreshService } = await import('@/lib/token-refresh');
      const tokenData = await TokenRefreshService.refreshAccessToken();
      
      const status = {
        environment: '✅ Configured',
        tokenRefresh: '✅ Working',
        accessToken: '✅ Valid',
        apiDomain: tokenData.api_domain,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type
      };

      return ApiResponseHandler.success(
        status,
        'Zoho configuration is valid and working',
        requestId
      );
    } catch (error) {
      return ApiResponseHandler.error(
        `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        requestId
      );
    }

  } catch (error) {
    console.error('Error checking Zoho status:', error);
    return ApiResponseHandler.serverError('Failed to check Zoho status', requestId);
  }
} 