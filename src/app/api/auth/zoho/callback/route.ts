import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';

// Zoho CRM OAuth Configuration
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID || '';
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || '';
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI || 'https://automockupapi-git-main-siddhutedlas-projects.vercel.app/api/auth/zoho/callback';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      console.error('Zoho OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://automockupapi-git-main-siddhutedlas-projects.vercel.app'}/auth/error?error=${error}`
      );
    }
    
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://automockupapi-git-main-siddhutedlas-projects.vercel.app'}/auth/error?error=no_code`
      );
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
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://automockupapi-git-main-siddhutedlas-projects.vercel.app'}/auth/error?error=token_exchange_failed`
      );
    }
    
    // Store tokens securely (in production, use a secure database)
    const tokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      api_domain: tokenData.api_domain,
      token_type: tokenData.token_type,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    };
    
    // Store tokens in session or secure storage
    // For now, we'll redirect with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://automockupapi-git-main-siddhutedlas-projects.vercel.app'}/auth/success?domain=${tokenData.api_domain}`
    );
    
  } catch (error) {
    console.error('Zoho OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://automockupapi-git-main-siddhutedlas-projects.vercel.app'}/auth/error?error=callback_failed`
    );
  }
} 