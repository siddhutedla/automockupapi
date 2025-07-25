import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import { ZohoClient } from '@/lib/zoho-client';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return ApiResponseHandler.error('Missing leadId parameter', 400, requestId);
    }

    // Get Zoho tokens from environment variables
    const zohoTokens = {
      access_token: process.env.ZOHO_ACCESS_TOKEN || '',
      refresh_token: process.env.ZOHO_REFRESH_TOKEN || '',
      expires_in: 3600,
      api_domain: process.env.ZOHO_API_DOMAIN || 'www.zohoapis.com',
      token_type: 'Bearer',
      expires_at: Date.now() + 3600000
    };

    if (!zohoTokens.access_token) {
      return ApiResponseHandler.error('Zoho access token not configured', 500, requestId);
    }

    const zohoClient = new ZohoClient(zohoTokens);

    // Download the lead photo
    const imageBuffer = await zohoClient.downloadLeadPhoto(leadId);

    // Return the image as a response
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png', // Default to PNG, could be determined from response headers
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Image download error:', error);
    return ApiResponseHandler.serverError(
      `Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId
    );
  }
} 