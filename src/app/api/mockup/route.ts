import { NextRequest, NextResponse } from 'next/server';
import { MockupRequest, MockupResponse } from '@/types';
import { MockupGenerator } from '@/lib/mockup-generator';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const body: MockupRequest = await request.json();
    
    // Validate required fields
    if (!body.logoUrl || !body.industry || !body.companyName || !body.mockupTypes.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert logo URL to file path
    const logoPath = join(process.cwd(), 'public', body.logoUrl);
    
    // Create mockup generator instance
    const generator = new MockupGenerator();
    
    // Generate all requested mockups
    const results = await generator.generateAllMockups({
      logoPath,
      industry: body.industry,
      mockupTypes: body.mockupTypes,
      primaryColor: body.primaryColor,
      secondaryColor: body.secondaryColor,
      companyName: body.companyName,
      tagline: body.tagline
    });

    // Check if all mockups were generated successfully
    const failedResults = results.filter(result => !result.success);
    if (failedResults.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to generate some mockups: ${failedResults.map(r => r.error).join(', ')}` 
        },
        { status: 500 }
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

    return NextResponse.json({
      success: true,
      data: mockupResponse
    });

  } catch (error) {
    console.error('Mockup generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Mockup generation failed' },
      { status: 500 }
    );
  }
} 