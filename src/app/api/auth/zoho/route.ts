import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';

// Zoho CRM OAuth Configuration
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID || '';
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || '';
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI || 'https://automockupapi-git-main-siddhutedlas-projects.vercel.app/api/auth/zoho/callback';

export async function GET() {
  const requestId = generateRequestId();
  
  try {
    // Generate authorization URL for Zoho CRM
    const authUrl = new URL('https://accounts.zoho.com/oauth/v2/auth');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', ZOHO_CLIENT_ID);
    authUrl.searchParams.set('scope', 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL');
    authUrl.searchParams.set('redirect_uri', ZOHO_REDIRECT_URI);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    
    // Generate state parameter for security
    const state = 'oauth_state_' + Date.now();
    
    return ApiResponseHandler.success(
      {
        authUrl: authUrl.toString(),
        state,
        clientId: ZOHO_CLIENT_ID,
        redirectUri: ZOHO_REDIRECT_URI
      },
      'Zoho CRM OAuth authorization URL generated',
      requestId
    );
    
  } catch (error) {
    console.error('Zoho OAuth error:', error);
    return ApiResponseHandler.serverError('Failed to generate OAuth URL', requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await request.json();
    const { code, state } = body;
    
    if (!code) {
      return ApiResponseHandler.error('Authorization code is required', 400, requestId);
    }
    
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        code,
        redirect_uri: ZOHO_REDIRECT_URI,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Zoho token exchange error:', tokenData);
      return ApiResponseHandler.error('Failed to exchange authorization code', 400, requestId);
    }
    
    // Store tokens securely (in production, use a secure database)
    console.log('OAuth tokens received:', {
      access_token: tokenData.access_token ? '***' : 'missing',
      refresh_token: tokenData.refresh_token ? '***' : 'missing',
      api_domain: tokenData.api_domain
    });
    
    return ApiResponseHandler.success(
      {
        message: 'OAuth tokens received successfully',
        apiDomain: tokenData.api_domain,
        expiresIn: tokenData.expires_in
      },
      'Zoho CRM OAuth authentication successful',
      requestId
    );
    
  } catch (error) {
    console.error('Zoho OAuth callback error:', error);
    return ApiResponseHandler.serverError('OAuth callback failed', requestId);
  }
} 