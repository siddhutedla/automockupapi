import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import { ZohoClient } from '@/lib/zoho-client';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId') || '6764494000001367215';
  
  console.log('🔍 [TEST-LEAD] Starting test for lead ID:', leadId);
  console.log('🔍 [TEST-LEAD] Request ID:', requestId);

  try {
    console.log('🔍 [TEST-LEAD] Testing lead ID:', leadId);
    
    // Get Zoho tokens from environment variables
    const zohoTokens = {
      access_token: process.env.ZOHO_ACCESS_TOKEN || '',
      refresh_token: process.env.ZOHO_REFRESH_TOKEN || '',
      expires_in: 3600,
      api_domain: process.env.ZOHO_API_DOMAIN || 'www.zohoapis.com',
      token_type: 'Bearer',
      expires_at: 0 // Force token refresh check
    };

    console.log('🔍 [TEST-LEAD] Zoho tokens configured:', {
      hasAccessToken: !!zohoTokens.access_token,
      hasRefreshToken: !!zohoTokens.refresh_token,
      apiDomain: zohoTokens.api_domain
    });

    if (!zohoTokens.access_token) {
      console.error('❌ [TEST-LEAD] Zoho access token not configured');
      return ApiResponseHandler.error('Zoho access token not configured. Please set ZOHO_ACCESS_TOKEN in your environment variables.', 500, requestId);
    }

    const zohoClient = new ZohoClient(zohoTokens);

    console.log('🔍 [TEST-LEAD] Created ZohoClient, fetching lead...');
    const lead = await zohoClient.getLead(leadId);

    console.log('🔍 [TEST-LEAD] Lead data received:', {
      leadFound: !!lead,
      leadKeys: lead ? Object.keys(lead) : [],
      leadId: lead?.id
    });
    console.log('🔍 [TEST-LEAD] Full lead data:', lead);

    if (!lead) {
      console.error('❌ [TEST-LEAD] Lead not found');
      return ApiResponseHandler.error('Lead not found', 404, requestId);
    }

    console.log('🔍 [TEST-LEAD] Lead found, attempting to download photo...');
    
    let photoTest = null;
    try {
      console.log('🔍 [TEST-LEAD] Attempting to download lead photo...');
      const photoBuffer = await zohoClient.downloadLeadPhoto(leadId);
      console.log('🔍 [TEST-LEAD] Photo downloaded successfully, size:', photoBuffer.length, 'bytes');

      photoTest = {
        success: true,
        leadId,
        fileSize: photoBuffer.length,
        message: 'Lead photo download successful'
      };
    } catch (photoError) {
      console.error('❌ [TEST-LEAD] Photo download failed:', photoError);
      photoTest = {
        success: false,
        error: photoError instanceof Error ? photoError.message : 'Photo download failed'
      };
    }

    const result = {
      leadId,
      leadFound: true,
      photoTest,
      allFields: Object.keys(lead),
      sampleFields: {
        First_Name: lead['First_Name'],
        Last_Name: lead['Last_Name'],
        Email: lead['Email'],
        Company: lead['Company'],
        Id: lead['id']
      }
    };

    console.log('🔍 [TEST-LEAD] Final result:', {
      leadId: result.leadId,
      leadFound: result.leadFound,
      photoTestSuccess: result.photoTest?.success,
      fieldCount: result.allFields.length
    });

    console.log('✅ [TEST-LEAD] Test completed successfully');
    return ApiResponseHandler.success(
      result,
      'Lead test completed',
      requestId
    );

  } catch (error) {
    console.error('❌ [TEST-LEAD] Lead test error:', error);
    console.error('❌ [TEST-LEAD] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      leadId: leadId,
      requestId: requestId
    });
    return ApiResponseHandler.serverError(
      `Failed to test lead: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId
    );
  }
} 