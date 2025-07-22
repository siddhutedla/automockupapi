import { NextRequest } from 'next/server';
import { MockupRequest, MockupResponse } from '@/types';
import { MockupGenerator } from '@/lib/mockup-generator';
import { ApiResponseHandler, generateRequestId, validateRequiredFields } from '@/lib/api-response';
import { join } from 'path';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body: MockupRequest = await request.json();
    
    console.log('Mockup API received:', body);
    
    // Validate required fields
    const requiredFields = ['logoUrl', 'industry', 'companyName', 'mockupTypes'];
    const validationErrors = validateRequiredFields(body, requiredFields);
    
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      return ApiResponseHandler.validationError(validationErrors, requestId);
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

    // Convert logo URL to file path
    const logoPath = join(process.cwd(), 'public', body.logoUrl);
    
    // Check if logo file exists
    const fs = await import('fs/promises');
    try {
      await fs.access(logoPath);
    } catch (error) {
      return ApiResponseHandler.notFound('Logo file not found', requestId);
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