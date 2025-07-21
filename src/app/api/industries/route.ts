import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import { INDUSTRY_CONFIGS, getIndustryConfig } from '@/lib/industry-configs';
import { Industry } from '@/types';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry') as Industry;

    if (industry) {
      // Return specific industry configuration
      if (!INDUSTRY_CONFIGS[industry]) {
        return ApiResponseHandler.notFound(`Industry '${industry}' not found`, requestId);
      }

      const config = getIndustryConfig(industry);
      return ApiResponseHandler.success(config, `Configuration for ${config.name}`, requestId);
    }

    // Return all industry configurations
    const industries = Object.entries(INDUSTRY_CONFIGS).map(([key, config]) => ({
      key,
      name: config.name,
      description: config.description,
      primaryColors: config.primaryColors,
      secondaryColors: config.secondaryColors,
      recommendedMockupTypes: config.recommendedMockupTypes,
      styling: config.styling
    }));

    return ApiResponseHandler.success(
      industries,
      'All industry configurations retrieved',
      requestId
    );

  } catch (error) {
    console.error('Error fetching industry configurations:', error);
    return ApiResponseHandler.serverError('Failed to fetch industry configurations', requestId);
  }
} 