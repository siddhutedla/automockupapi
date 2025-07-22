import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import { ZohoClient } from '@/lib/zoho-client';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId') || '6764494000001367215';
  
  try {
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

    // Check for Image_Logo custom field
    const imageLogoField = lead['Image_Logo'];
    
    // Test downloading the Image_Logo file if available
    let downloadTest = null;
    if (imageLogoField) {
      try {
        let fileUrl: string;
        let fileName: string = 'logo.png';
        
        // Handle different response formats
        if (typeof imageLogoField === 'string') {
          // Direct URL format
          fileUrl = imageLogoField;
        } else if (typeof imageLogoField === 'object' && imageLogoField !== null) {
          // Object format with link_url
          const logoObj = imageLogoField as Record<string, unknown>;
          fileUrl = logoObj.link_url as string || logoObj.download_url as string;
          fileName = logoObj.name as string || 'logo.png';
        } else {
          throw new Error('Invalid Image_Logo field format');
        }
        
        if (!fileUrl) {
          throw new Error('No file URL found in Image_Logo field');
        }
        
        const imageBuffer = await zohoClient.downloadCustomFile(fileUrl);
        downloadTest = {
          success: true,
          fileUrl,
          fileName,
          fileSize: imageBuffer.length,
          message: 'Image_Logo download successful'
        };
      } catch (downloadError) {
        downloadTest = {
          success: false,
          error: downloadError instanceof Error ? downloadError.message : 'Download failed'
        };
      }
    }
    
    const result = {
      leadId,
      leadFound: true,
      hasImageLogoField: !!imageLogoField,
      imageLogoField,
      downloadTest,
      allFields: Object.keys(lead),
      sampleFields: {
        First_Name: lead['First_Name'],
        Last_Name: lead['Last_Name'],
        Email: lead['Email'],
        Company: lead['Company'],
        Image_Logo: imageLogoField
      }
    };

    return ApiResponseHandler.success(
      result,
      'Lead test completed',
      requestId
    );

  } catch (error) {
    console.error('Lead test error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      leadId: leadId
    });
    return ApiResponseHandler.serverError(
      `Failed to test lead: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId
    );
  }
} 