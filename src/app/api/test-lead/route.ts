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
      expires_at: Date.now() + 3600000
    };

    console.log('🔍 [TEST-LEAD] Zoho tokens configured:', {
      hasAccessToken: !!zohoTokens.access_token,
      hasRefreshToken: !!zohoTokens.refresh_token,
      apiDomain: zohoTokens.api_domain,
      accessTokenLength: zohoTokens.access_token.length
    });

    if (!zohoTokens.access_token) {
      console.error('❌ [TEST-LEAD] No Zoho access token configured');
      return ApiResponseHandler.error('Zoho access token not configured. Please set ZOHO_ACCESS_TOKEN in your environment variables.', 500, requestId);
    }

    const zohoClient = new ZohoClient(zohoTokens);
    
    console.log('🔍 [TEST-LEAD] Created ZohoClient, fetching lead...');
    
    // Fetch the lead
    const lead = await zohoClient.getLead(leadId);
    
    console.log('🔍 [TEST-LEAD] Lead data received:', {
      leadFound: !!lead,
      leadKeys: lead ? Object.keys(lead) : [],
      leadId: lead?.id,
      hasImageLogo: !!lead?.['Image_Logo']
    });
    
    console.log('🔍 [TEST-LEAD] Full lead data:', lead);

    if (!lead) {
      console.error('❌ [TEST-LEAD] Lead not found');
      return ApiResponseHandler.error('Lead not found', 404, requestId);
    }

    console.log('🔍 [TEST-LEAD] Lead found, checking for Image_Logo field...');

    // Check for Image_Logo custom field
    const imageLogoField = lead['Image_Logo'];
    
    console.log('🔍 [TEST-LEAD] Image_Logo field:', {
      exists: !!imageLogoField,
      type: typeof imageLogoField,
      value: imageLogoField
    });
    
    // Test downloading the Image_Logo file if available
    let downloadTest = null;
    if (imageLogoField) {
      console.log('🔍 [TEST-LEAD] Image_Logo field found, attempting download...');
      
      try {
        let fileUrl: string;
        let fileName: string = 'logo.png';
        
        console.log('🔍 [TEST-LEAD] Processing Image_Logo field format...');
        
        // Handle different response formats
        if (typeof imageLogoField === 'string') {
          // Direct URL format
          fileUrl = imageLogoField;
          console.log('🔍 [TEST-LEAD] String format detected, fileUrl:', fileUrl);
        } else if (typeof imageLogoField === 'object' && imageLogoField !== null) {
          // Object format with link_url
          const logoObj = imageLogoField as Record<string, unknown>;
          fileUrl = logoObj.link_url as string || logoObj.download_url as string;
          fileName = logoObj.name as string || 'logo.png';
          console.log('🔍 [TEST-LEAD] Object format detected:', {
            linkUrl: logoObj.link_url,
            downloadUrl: logoObj.download_url,
            name: logoObj.name,
            resolvedFileUrl: fileUrl,
            resolvedFileName: fileName
          });
        } else {
          console.error('❌ [TEST-LEAD] Invalid Image_Logo field format:', typeof imageLogoField);
          throw new Error('Invalid Image_Logo field format');
        }
        
        if (!fileUrl) {
          console.error('❌ [TEST-LEAD] No file URL found in Image_Logo field');
          throw new Error('No file URL found in Image_Logo field');
        }
        
        console.log('🔍 [TEST-LEAD] Attempting to download file from URL:', fileUrl);
        const imageBuffer = await zohoClient.downloadCustomFile(fileUrl);
        console.log('🔍 [TEST-LEAD] File downloaded successfully, size:', imageBuffer.length, 'bytes');
        
        downloadTest = {
          success: true,
          fileUrl,
          fileName,
          fileSize: imageBuffer.length,
          message: 'Image_Logo download successful'
        };
      } catch (downloadError) {
        console.error('❌ [TEST-LEAD] Download failed:', downloadError);
        downloadTest = {
          success: false,
          error: downloadError instanceof Error ? downloadError.message : 'Download failed'
        };
      }
    } else {
      console.log('🔍 [TEST-LEAD] No Image_Logo field found in lead');
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

    console.log('🔍 [TEST-LEAD] Final result:', {
      leadId: result.leadId,
      leadFound: result.leadFound,
      hasImageLogoField: result.hasImageLogoField,
      downloadTestSuccess: result.downloadTest?.success,
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