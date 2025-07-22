import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import { ZohoClient } from '@/lib/zoho-client';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId') || '6764494000001367196';

    console.log('Testing lead ID:', leadId);

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
      return ApiResponseHandler.error('Zoho access token not configured. Please set ZOHO_ACCESS_TOKEN in your environment variables.', 500, requestId);
    }

    const zohoClient = new ZohoClient(zohoTokens);
    
    // Fetch the lead
    const lead = await zohoClient.getLead(leadId);
    
    console.log('Lead data:', lead);

    if (!lead) {
      return ApiResponseHandler.error('Lead not found', 404, requestId);
    }

    // Get lead attachments
    const attachments = await zohoClient.getLeadAttachments(leadId);
    
    const result = {
      leadId,
      leadFound: true,
      hasAttachments: attachments && attachments.length > 0,
      attachmentCount: attachments ? attachments.length : 0,
      attachments: attachments || [],
      allFields: Object.keys(lead),
      sampleFields: {
        First_Name: lead['First_Name'],
        Last_Name: lead['Last_Name'],
        Email: lead['Email'],
        Company: lead['Company']
      }
    };

    return ApiResponseHandler.success(
      result,
      'Lead test completed',
      requestId
    );

  } catch (error) {
    console.error('Lead test error:', error);
    return ApiResponseHandler.serverError(
      `Failed to test lead: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId
    );
  }
} 