import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId, validateRequiredFields } from '@/lib/api-response';
import { ZohoClient } from '@/lib/zoho-client';
import { MockupGenerator } from '@/lib/mockup-generator';
import { join } from 'path';
import { writeFile as writeFileAsync } from 'fs/promises';
import { readFile } from 'fs/promises';

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

    // Get Zoho tokens from environment
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
    
    // Create mockup generator instance
    const generator = new MockupGenerator();
    
    // Generate t-shirt front and back mockups
    const mockupTypes: ('tshirt-front' | 'tshirt-back')[] = ['tshirt-front', 'tshirt-back'];
    const results = await generator.generateAllMockups({
      logoPath,
      industry: 'other', // Default industry
      mockupTypes,
      companyName: body.company,
      logoPosition: 'center'
    });

    // Check if all mockups were generated successfully
    const failedResults = results.filter(result => !result.success);
    if (failedResults.length > 0) {
      const errorMessages = failedResults.map(r => r.error).join(', ');
      return ApiResponseHandler.error(
        `Failed to generate some mockups: ${errorMessages}`,
        500,
        requestId
      );
    }

    // Convert mockups to base64
    const mockupsWithBase64 = await Promise.all(
      results.map(async (result, index) => {
        const mockupType = mockupTypes[index] as 'tshirt-front' | 'tshirt-back';
        const filePath = join(process.cwd(), 'public', result.outputPath!);
        
        // Read the file and convert to base64
        const fileBuffer = await readFile(filePath);
        const base64 = fileBuffer.toString('base64');
        
        return {
          type: mockupType,
          base64: `data:image/png;base64,${base64}`
        };
      })
    );

    const response: SimpleMockupResponse = {
      success: true,
      mockups: mockupsWithBase64
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