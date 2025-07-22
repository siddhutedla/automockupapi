import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import { ZohoClientKV } from '@/lib/zoho-client-kv';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId') || '6764494000001367215';
  
  console.log('🔍 [TEST-LEAD] Starting test for lead ID:', leadId);
  console.log('🔍 [TEST-LEAD] Request ID:', requestId);

  try {
    console.log('🔍 [TEST-LEAD] Testing lead ID:', leadId);
    
    // Create KV-based Zoho client (no need to pass tokens)
    const zohoClient = new ZohoClientKV();

    console.log('🔍 [TEST-LEAD] Created ZohoClient, fetching lead...');
    const lead = await zohoClient.getLead(leadId);

    console.log('🔍 [TEST-LEAD] Lead data received:', {
      leadFound: !!lead,
      leadKeys: lead ? Object.keys(lead) : [],
      leadId: lead?.id
    });
    console.log('🔍 [TEST-LEAD] Full lead data:', lead);

    if (!lead) {
      console.error('❌ [TEST-LEAD] Lead not found');
      return ApiResponseHandler.error('Lead not found', 404, requestId);
    }

    console.log('🔍 [TEST-LEAD] Lead found, attempting to download photo...');
    
    let photoTest = null;
    try {
      console.log('🔍 [TEST-LEAD] Attempting to download lead photo...');
      const photoBuffer = await zohoClient.downloadLeadPhoto(leadId);
      console.log('🔍 [TEST-LEAD] Photo downloaded successfully, size:', photoBuffer.length, 'bytes');

      photoTest = {
        success: true,
        leadId,
        fileSize: photoBuffer.length,
        message: 'Lead photo download successful'
      };
    } catch (photoError) {
      console.error('❌ [TEST-LEAD] Photo download failed:', photoError);
      photoTest = {
        success: false,
        error: photoError instanceof Error ? photoError.message : 'Photo download failed'
      };
    }

    const result = {
      leadId,
      leadFound: true,
      photoTest,
      allFields: Object.keys(lead),
      sampleFields: {
        First_Name: lead['First_Name'],
        Last_Name: lead['Last_Name'],
        Email: lead['Email'],
        Company: lead['Company'],
        Id: lead['id']
      }
    };

    console.log('🔍 [TEST-LEAD] Final result:', {
      leadId: result.leadId,
      leadFound: result.leadFound,
      photoTestSuccess: result.photoTest?.success,
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