import { NextRequest } from 'next/server';
import { MockupRequest, MockupResponse } from '@/types';
import { MockupGenerator } from '@/lib/mockup-generator';
import { ApiResponseHandler, generateRequestId, validateRequiredFields } from '@/lib/api-response';
import { ZohoClient } from '@/lib/zoho-client';
import { join } from 'path';
import { writeFile as writeFileAsync } from 'fs/promises';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body: MockupRequest = await request.json();
    
    console.log('Mockup API received:', body);
    
    // Validate required fields - either logoUrl or leadID must be provided
    const requiredFields = ['industry', 'companyName', 'mockupTypes'];
    const validationErrors = validateRequiredFields(body as unknown, requiredFields);
    
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      return ApiResponseHandler.validationError(validationErrors, requestId);
    }

    // Check if either logoUrl or leadID is provided
    if (!body.logoUrl && !body.leadID) {
      return ApiResponseHandler.error('Either logoUrl or leadID must be provided', 400, requestId);
    }

    // Validate mockup types array
    if (!Array.isArray(body.mockupTypes) || body.mockupTypes.length === 0) {
      return ApiResponseHandler.error('At least one mockup type must be selected', 400, requestId);
    }

    // Validate mockup types
    const validMockupTypes = [
      'tshirt-front', 'tshirt-back', 'hoodie-front', 'hoodie-back',
      'sweatshirt-front', 'sweatshirt-back', 'polo-front', 'polo-back',
      'tank-top-front', 'tank-top-back'
    ];

    const invalidTypes = body.mockupTypes.filter(type => !validMockupTypes.includes(type));
    if (invalidTypes.length > 0) {
      return ApiResponseHandler.error(
        `Invalid mockup types: ${invalidTypes.join(', ')}`,
        400,
        requestId
      );
    }

    // Validate industry
    const validIndustries = [
      'technology', 'healthcare', 'finance', 'education', 'retail',
      'food-beverage', 'fashion', 'sports', 'entertainment', 'other'
    ];

    if (!validIndustries.includes(body.industry)) {
      return ApiResponseHandler.error(
        `Invalid industry: ${body.industry}`,
        400,
        requestId
      );
    }

    let logoPath: string;

    // Handle logo from Zoho CRM lead custom field
    if (body.leadID) {
      try {
        // Get Zoho tokens from environment or session
        const zohoTokens = {
          access_token: process.env.ZOHO_ACCESS_TOKEN || '',
          refresh_token: process.env.ZOHO_REFRESH_TOKEN || '',
          expires_in: 3600,
          api_domain: process.env.ZOHO_API_DOMAIN || 'www.zohoapis.com',
          token_type: 'Bearer',
          expires_at: Date.now() + 3600000
        };

        const zohoClient = new ZohoClient(zohoTokens);
        
        // Fetch the lead to get the Image_Logo field
        const lead = await zohoClient.getLead(body.leadID);
        
        if (!lead) {
          return ApiResponseHandler.error('Lead not found', 404, requestId);
        }

        // Check for Image_Logo custom field
        const imageLogoField = lead['Image_Logo'];
        
        if (!imageLogoField) {
          return ApiResponseHandler.error('No Image_Logo field found for the specified lead', 404, requestId);
        }

        // Download the Image_Logo file
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
          return ApiResponseHandler.error('Invalid Image_Logo field format', 400, requestId);
        }
        
        if (!fileUrl) {
          return ApiResponseHandler.error('No file URL found in Image_Logo field', 404, requestId);
        }

        const imageBuffer = await zohoClient.downloadCustomFile(fileUrl);
        
        // Save to uploads directory
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = fileName.split('.').pop() || 'png';
        const filename = `zoho-logo-${timestamp}-${randomString}.${fileExtension}`;
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        logoPath = join(uploadsDir, filename);
        
        await writeFileAsync(logoPath, imageBuffer);
        
        console.log('Logo downloaded from Zoho CRM Image_Logo field:', filename);
        
      } catch (error) {
        console.error('Error fetching logo from Zoho CRM Image_Logo field:', error);
        return ApiResponseHandler.error('Failed to fetch logo from Zoho CRM Image_Logo field', 500, requestId);
      }
    } else {
      // Use provided logoUrl
      logoPath = join(process.cwd(), 'public', body.logoUrl!);
      
      // Check if logo file exists
      const fs = await import('fs/promises');
      try {
        await fs.access(logoPath);
      } catch {
        return ApiResponseHandler.notFound('Logo file not found', requestId);
      }
    }
    
    // Create mockup generator instance
    const generator = new MockupGenerator();
    
    // Generate all requested mockups
    const results = await generator.generateAllMockups({
      logoPath,
      industry: body.industry,
      mockupTypes: body.mockupTypes,
      companyName: body.companyName,
      tagline: body.tagline,
      logoPosition: body.logoPosition
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

    // Create response with generated mockups
    const mockupResponse: MockupResponse = {
      id: `mockup-${Date.now()}`,
      mockups: results.map((result, index) => ({
        type: body.mockupTypes[index],
        url: result.outputPath!
      })),
      createdAt: new Date().toISOString()
    };

    // Save to history (async, don't wait for it)
    try {
      await fetch(`${request.nextUrl.origin}/api/mockups/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockupResponse)
      });
    } catch (error) {
      console.error('Failed to save to history:', error);
      // Don't fail the request if history save fails
    }

    return ApiResponseHandler.success(
      mockupResponse,
      'Mockups generated successfully',
      requestId
    );

  } catch (error) {
    console.error('Mockup generation error:', error);
    return ApiResponseHandler.serverError('Mockup generation failed', requestId);
  }
} 