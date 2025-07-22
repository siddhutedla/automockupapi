import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId, validateRequiredFields } from '@/lib/api-response';
import { ZohoClient } from '@/lib/zoho-client';
import sharp from 'sharp';
import { join } from 'path';
import { writeFile as writeFileAsync, readFile } from 'fs/promises';

interface SimpleMockupRequest {
  company: string;
  leadID: string;
}

interface SimpleMockupResponse {
  success: boolean;
  mockups: {
    type: 'tshirt-front' | 'tshirt-back';
    base64: string;
  }[];
  error?: string;
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body: SimpleMockupRequest = await request.json();
    
    console.log('Simple Mockup API received:', body);
    
    // Validate required fields
    const requiredFields = ['company', 'leadID'];
    const validationErrors = validateRequiredFields(body, requiredFields);
    
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      return ApiResponseHandler.validationError(validationErrors, requestId);
    }

    // Get Zoho tokens using token refresh service
    let zohoTokens;
    try {
      const { TokenRefreshService } = await import('@/lib/token-refresh');
      
      // Check if we have the required environment variables
      const clientId = process.env.ZOHO_CLIENT_ID;
      const clientSecret = process.env.ZOHO_CLIENT_SECRET;
      const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
      
      if (!clientId || !clientSecret || !refreshToken) {
        console.error('Missing Zoho environment variables:', {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
          hasRefreshToken: !!refreshToken
        });
        return ApiResponseHandler.error(
          'Zoho configuration incomplete. Please check ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN environment variables.',
          500,
          requestId
        );
      }

      // Refresh the access token
      const tokenData = await TokenRefreshService.refreshAccessToken();
      
      zohoTokens = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        api_domain: tokenData.api_domain,
        token_type: tokenData.token_type,
        expires_at: TokenRefreshService.calculateExpiryTime(tokenData.expires_in)
      };

      console.log('✅ [SIMPLE-MOCKUP] Zoho tokens configured successfully');
    } catch (error) {
      console.error('❌ [SIMPLE-MOCKUP] Failed to configure Zoho tokens:', error);
      return ApiResponseHandler.error(
        `Failed to configure Zoho tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        requestId
      );
    }

    const zohoClient = new ZohoClient(zohoTokens);
    
    // Get lead data
    const lead = await zohoClient.getLead(body.leadID);
    
    if (!lead) {
      return ApiResponseHandler.error('Lead not found', 404, requestId);
    }

    // Download lead photo
    let logoBuffer: Buffer;
    try {
      logoBuffer = await zohoClient.downloadLeadPhoto(body.leadID);
    } catch (error) {
      console.error('Failed to download lead photo:', error);
      return ApiResponseHandler.error('Failed to download lead photo', 500, requestId);
    }
    
    // Save to uploads directory
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = 'png';
    const filename = `zoho-logo-${timestamp}-${randomString}.${fileExtension}`;
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const logoPath = join(uploadsDir, filename);
    
    await writeFileAsync(logoPath, logoBuffer);
    
    console.log('Logo downloaded from Zoho CRM lead photo:', filename);
    
    // Simple mockup generation - directly place logo on t-shirt templates
    const mockups = await generateSimpleMockups(logoPath, body.company);
    
    const response: SimpleMockupResponse = {
      success: true,
      mockups
    };

    return ApiResponseHandler.success(
      response,
      'Mockups generated successfully',
      requestId
    );

  } catch (error) {
    console.error('Simple mockup generation error:', error);
    return ApiResponseHandler.serverError('Mockup generation failed', requestId);
  }
}

async function generateSimpleMockups(logoPath: string, companyName: string) {
  console.log('🎨 [SIMPLE-MOCKUP] Starting mockup generation...');
  console.log('🎨 [SIMPLE-MOCKUP] Logo path:', logoPath);
  console.log('🎨 [SIMPLE-MOCKUP] Company name:', companyName);
  
  const mockups = [];
  
  // T-shirt templates
  const frontTemplate = join(process.cwd(), 'public', 'whiteshirtfront.jpg');
  const backTemplate = join(process.cwd(), 'public', 'whitetshirtback.jpg');
  
  console.log('🎨 [SIMPLE-MOCKUP] Template paths:', { frontTemplate, backTemplate });
  
  // Check if templates exist
  const fs = await import('fs/promises');
  try {
    await fs.access(frontTemplate);
    await fs.access(backTemplate);
    console.log('✅ [SIMPLE-MOCKUP] Template files found');
  } catch (error) {
    console.error('❌ [SIMPLE-MOCKUP] Template files not found:', error);
    throw new Error('T-shirt templates not found. Please ensure whiteshirtfront.jpg and whitetshirtback.jpg exist in the public directory.');
  }
  
  try {
    // Process logo for placement
    console.log('🎨 [SIMPLE-MOCKUP] Processing logo...');
    const processedLogo = await sharp(logoPath)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    
    console.log('✅ [SIMPLE-MOCKUP] Logo processed, size:', processedLogo.length, 'bytes');
    
    // Generate front mockup
    console.log('🎨 [SIMPLE-MOCKUP] Generating front mockup...');
    const frontMockup = await sharp(frontTemplate)
      .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
      .composite([
        {
          input: processedLogo,
          top: 300, // Center vertically
          left: 300  // Center horizontally
        }
      ])
      .png()
      .toBuffer();
    
    console.log('✅ [SIMPLE-MOCKUP] Front mockup generated, size:', frontMockup.length, 'bytes');
    
    // Generate back mockup
    console.log('🎨 [SIMPLE-MOCKUP] Generating back mockup...');
    const backMockup = await sharp(backTemplate)
      .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
      .composite([
        {
          input: processedLogo,
          top: 300, // Center vertically
          left: 300  // Center horizontally
        }
      ])
      .png()
      .toBuffer();
    
    console.log('✅ [SIMPLE-MOCKUP] Back mockup generated, size:', backMockup.length, 'bytes');
    
    // Convert to base64
    const frontBase64 = `data:image/png;base64,${frontMockup.toString('base64')}`;
    const backBase64 = `data:image/png;base64,${backMockup.toString('base64')}`;
    
    console.log('✅ [SIMPLE-MOCKUP] Base64 conversion completed');
    
    mockups.push(
      { type: 'tshirt-front' as const, base64: frontBase64 },
      { type: 'tshirt-back' as const, base64: backBase64 }
    );
    
    console.log('✅ [SIMPLE-MOCKUP] Mockup generation completed successfully');
    return mockups;
    
  } catch (error) {
    console.error('❌ [SIMPLE-MOCKUP] Error during mockup generation:', error);
    throw new Error(`Mockup generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 