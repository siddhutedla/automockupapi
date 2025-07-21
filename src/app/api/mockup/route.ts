import { NextRequest, NextResponse } from 'next/server';
import { MockupRequest, MockupResponse } from '@/types';

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

    // For now, return a mock response
    // In later steps, we'll implement actual mockup generation
    const mockResponse: MockupResponse = {
      id: `mockup-${Date.now()}`,
      mockups: body.mockupTypes.map(type => ({
        type,
        url: body.logoUrl // Placeholder - will be replaced with actual mockup
      })),
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: mockResponse
    });

  } catch (error) {
    console.error('Mockup generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Mockup generation failed' },
      { status: 500 }
    );
  }
} 