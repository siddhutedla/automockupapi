interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  api_domain: string;
  token_type: string;
}

interface RefreshError {
  error: string;
  error_description?: string;
}

export class TokenRefreshService {
  private static readonly REFRESH_URL = 'https://accounts.zoho.com/oauth/v2/token';

  /**
   * Refresh the OAuth access token using the refresh token
   */
  static async refreshAccessToken(): Promise<TokenResponse> {
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

    // Validate required environment variables
    if (!clientId) {
      throw new Error('ZOHO_CLIENT_ID environment variable is not set');
    }
    if (!clientSecret) {
      throw new Error('ZOHO_CLIENT_SECRET environment variable is not set');
    }
    if (!refreshToken) {
      throw new Error('ZOHO_REFRESH_TOKEN environment variable is not set');
    }

    console.log('🔄 [TOKEN-REFRESH] Attempting to refresh access token...');

    try {
      const response = await fetch(this.REFRESH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as RefreshError;
        console.error('❌ [TOKEN-REFRESH] Token refresh failed:', {
          status: response.status,
          error: error.error,
          description: error.error_description
        });
        throw new Error(`Token refresh failed: ${error.error} - ${error.error_description || 'Unknown error'}`);
      }

      const tokenData = data as TokenResponse;
      
      console.log('✅ [TOKEN-REFRESH] Token refreshed successfully:', {
        expiresIn: tokenData.expires_in,
        apiDomain: tokenData.api_domain,
        tokenType: tokenData.token_type
      });

      return tokenData;
    } catch (error) {
      console.error('❌ [TOKEN-REFRESH] Network error during token refresh:', error);
      throw new Error(`Network error during token refresh: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update environment variables with new tokens
   * Note: This is for development/testing purposes
   * In production, you'd want to store tokens securely
   */
  static async refreshAndUpdateTokens(): Promise<void> {
    try {
      const tokenData = await this.refreshAccessToken();
      
      // Update environment variables (this works in development)
      process.env.ZOHO_ACCESS_TOKEN = tokenData.access_token;
      if (tokenData.refresh_token) {
        process.env.ZOHO_REFRESH_TOKEN = tokenData.refresh_token;
      }
      if (tokenData.api_domain) {
        process.env.ZOHO_API_DOMAIN = tokenData.api_domain;
      }

      console.log('✅ [TOKEN-REFRESH] Environment variables updated with new tokens');
    } catch (error) {
      console.error('❌ [TOKEN-REFRESH] Failed to refresh and update tokens:', error);
      throw error;
    }
  }

  /**
   * Check if current access token is expired or about to expire
   */
  static isTokenExpired(tokenExpiryTime?: number): boolean {
    if (!tokenExpiryTime) {
      // If no expiry time is known, assume it's expired
      return true;
    }

    // Check if token expires in the next 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() > (tokenExpiryTime - bufferTime);
  }

  /**
   * Get token expiry time from expires_in (seconds)
   */
  static calculateExpiryTime(expiresIn: number): number {
    return Date.now() + (expiresIn * 1000);
  }
} 