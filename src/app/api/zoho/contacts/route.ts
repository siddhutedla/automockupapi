import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import { ZohoClient } from '@/lib/zoho-client';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '200');
    
    // In a real application, you would get tokens from secure storage
    // For now, we'll return an error if no tokens are configured
    const tokens = {
      access_token: process.env.ZOHO_ACCESS_TOKEN || '',
      refresh_token: process.env.ZOHO_REFRESH_TOKEN || '',
      expires_in: 3600,
      api_domain: process.env.ZOHO_API_DOMAIN || 'www.zohoapis.com',
      token_type: 'Bearer',
      expires_at: Date.now() + 3600000
    };
    
    if (!tokens.access_token) {
      return ApiResponseHandler.error('Zoho tokens not configured', 401, requestId);
    }
    
    const zohoClient = new ZohoClient(tokens);
    const contacts = await zohoClient.getContacts(limit);
    
    return ApiResponseHandler.success(
      {
        contacts,
        total: contacts.length,
        limit
      },
      'Contacts fetched successfully',
      requestId
    );
    
  } catch (error) {
    console.error('Zoho contacts error:', error);
    return ApiResponseHandler.serverError('Failed to fetch contacts', requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await request.json();
    const { contactData } = body;
    
    if (!contactData) {
      return ApiResponseHandler.error('Contact data is required', 400, requestId);
    }
    
    const tokens = {
      access_token: process.env.ZOHO_ACCESS_TOKEN || '',
      refresh_token: process.env.ZOHO_REFRESH_TOKEN || '',
      expires_in: 3600,
      api_domain: process.env.ZOHO_API_DOMAIN || 'www.zohoapis.com',
      token_type: 'Bearer',
      expires_at: Date.now() + 3600000
    };
    
    if (!tokens.access_token) {
      return ApiResponseHandler.error('Zoho tokens not configured', 401, requestId);
    }
    
    const zohoClient = new ZohoClient(tokens);
    const result = await zohoClient.createContact(contactData);
    
    return ApiResponseHandler.success(
      result,
      'Contact created successfully',
      requestId
    );
    
  } catch (error) {
    console.error('Zoho create contact error:', error);
    return ApiResponseHandler.serverError('Failed to create contact', requestId);
  }
} 