import { createClient } from 'redis';

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

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    await redisClient.connect();
  }
  return redisClient;
}

/**
 * Get Zoho access token from Redis or refresh if needed
 */
export async function getZohoAccessToken(): Promise<string> {
  try {
    const redis = await getRedisClient();
    
    // STEP 1: Try to get from Redis
    const token = await redis.get('zoho_access_token');

    if (token) {
      console.log('✅ [ZOHO-TOKEN] Found valid token in Redis');
      return token; // ✅ Found in Redis, return it
    }

    console.log('🔄 [ZOHO-TOKEN] No token in Redis, refreshing...');

    // STEP 2: Not found or expired, refresh it
    const newToken = await refreshAccessToken();

    // STEP 3: Save it back to Redis with 1 hour expiry
    await redis.setEx('zoho_access_token', 3600, newToken);

    console.log('✅ [ZOHO-TOKEN] New token saved to Redis');
    return newToken;
  } catch (error) {
    console.error('❌ [ZOHO-TOKEN] Error getting access token:', error);
    throw new Error(`Failed to get Zoho access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Refresh Zoho access token using refresh token
 */
async function refreshAccessToken(): Promise<string> {
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

  console.log('🔄 [ZOHO-TOKEN] Refreshing access token...');

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as RefreshError;
    console.error('❌ [ZOHO-TOKEN] Token refresh failed:', {
      status: response.status,
      error: error.error,
      description: error.error_description
    });
    throw new Error(`Token refresh failed: ${error.error} - ${error.error_description || 'Unknown error'}`);
  }

  const tokenData = data as TokenResponse;
  
  console.log('✅ [ZOHO-TOKEN] Token refreshed successfully:', {
    expiresIn: tokenData.expires_in,
    apiDomain: tokenData.api_domain,
    tokenType: tokenData.token_type
  });

  return tokenData.access_token;
}

/**
 * Clear the stored access token (useful for testing)
 */
export async function clearZohoAccessToken(): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.del('zoho_access_token');
    console.log('✅ [ZOHO-TOKEN] Access token cleared from Redis');
  } catch (error) {
    console.error('❌ [ZOHO-TOKEN] Error clearing access token:', error);
  }
}

/**
 * Get token status from Redis
 */
export async function getZohoTokenStatus(): Promise<{
  hasToken: boolean;
  hasRedisUrl: boolean;
}> {
  try {
    const redis = await getRedisClient();
    const token = await redis.get('zoho_access_token');

    return {
      hasToken: !!token,
      hasRedisUrl: !!process.env.REDIS_URL,
    };
  } catch {
    return {
      hasToken: false,
      hasRedisUrl: !!process.env.REDIS_URL,
    };
  }
} 