import { NextRequest, NextResponse } from 'next/server';

// Zoho CRM OAuth Configuration
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID || '';
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || '';
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI || 'https://automockupapi-git-main-siddhutedlas-projects.vercel.app/api/auth/zoho/callback';

export async function GET(request: NextRequest) {
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
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
    console.log('OAuth tokens received:', {
      access_token: tokenData.access_token ? '***' : 'missing',
      refresh_token: tokenData.refresh_token ? '***' : 'missing',
      api_domain: tokenData.api_domain
    });
    
    // Redirect to tokens page with the actual tokens and password protection
    const tokens = encodeURIComponent(JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      api_domain: tokenData.api_domain,
      expires_in: tokenData.expires_in
    }));
    
    const password = 'banana_split_yummy';
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://automockupapi-git-main-siddhutedlas-projects.vercel.app'}/auth/tokens?tokens=${tokens}&password=${password}`
    );
    
  } catch (error) {
    console.error('Zoho OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://automockupapi-git-main-siddhutedlas-projects.vercel.app'}/auth/error?error=callback_failed`
    );
  }
} 