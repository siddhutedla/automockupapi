import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import { MockupResponse } from '@/types';

// In-memory storage for demo purposes
// In production, this would be a database
const mockupHistory: MockupResponse[] = [];

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const industry = searchParams.get('industry');
    const mockupType = searchParams.get('mockupType');

    // Filter mockups based on query parameters
    let filteredHistory = [...mockupHistory];
    
    if (industry) {
      filteredHistory = filteredHistory.filter(mockup => 
        mockup.mockups.some(m => m.type.includes(industry))
      );
    }
    
    if (mockupType) {
      filteredHistory = filteredHistory.filter(mockup => 
        mockup.mockups.some(m => m.type === mockupType)
      );
    }

    // Sort by creation date (newest first)
    filteredHistory.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredHistory.slice(startIndex, endIndex);

    return ApiResponseHandler.paginated(
      paginatedData,
      page,
      limit,
      filteredHistory.length,
      requestId
    );

  } catch (error) {
    console.error('Error fetching mockup history:', error);
    return ApiResponseHandler.serverError('Failed to fetch mockup history', requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['id', 'mockups', 'createdAt'];
    const errors = [];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        errors.push(`${field} is required`);
      }
    }
    
    if (errors.length > 0) {
      return ApiResponseHandler.validationError(errors, requestId);
    }

    // Add to history
    const mockupResponse: MockupResponse = {
      id: body.id,
      mockups: body.mockups,
      createdAt: body.createdAt
    };

    mockupHistory.push(mockupResponse);

    // Keep only last 100 entries for demo
    if (mockupHistory.length > 100) {
      mockupHistory.splice(0, mockupHistory.length - 100);
    }

    return ApiResponseHandler.success(
      mockupResponse,
      'Mockup added to history',
      requestId
    );

  } catch (error) {
    console.error('Error adding mockup to history:', error);
    return ApiResponseHandler.serverError('Failed to add mockup to history', requestId);
  }
} 