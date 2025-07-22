import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId, validateRequiredFields } from '@/lib/api-response';
import { ZohoClientKV } from '@/lib/zoho-client-kv';
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

    // Create KV-based Zoho client (same as test-lead API)
    const zohoClient = new ZohoClientKV();
    
    // Get lead data
    const lead = await zohoClient.getLead(body.leadID);
    
    if (!lead) {
      return ApiResponseHandler.error('Lead not found', 404, requestId);
    }

    // Download lead photo
    let logoBuffer: Buffer;
    try {
      logoBuffer = await zohoClient.downloadLeadPhoto(body.leadID);
      console.log('✅ [SIMPLE-MOCKUP] Lead photo downloaded, size:', logoBuffer.length, 'bytes');
    } catch (error) {
      console.error('Failed to download lead photo:', error);
      return ApiResponseHandler.error('Failed to download lead photo', 500, requestId);
    }
    
    // Simple mockup generation - directly place logo on t-shirt templates
    const mockups = await generateSimpleMockups(logoBuffer, body.company);
    
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

async function generateSimpleMockups(logoBuffer: Buffer, companyName: string) {
  console.log('🎨 [SIMPLE-MOCKUP] Starting mockup generation...');
  console.log('🎨 [SIMPLE-MOCKUP] Logo buffer size:', logoBuffer.length, 'bytes');
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
    // Process logo for placement - using the same approach as main mockup generator
    console.log('🎨 [SIMPLE-MOCKUP] Processing logo...');
    const processedLogo = await sharp(logoBuffer)
      .resize(120, 120, { fit: 'inside', withoutEnlargement: true }) // Medium size like main generator
      .png()
      .toBuffer();
    
    console.log('✅ [SIMPLE-MOCKUP] Logo processed, size:', processedLogo.length, 'bytes');
    
    // Get template metadata like main generator
    const templateMetadata = await sharp(frontTemplate).metadata();
    const width = templateMetadata.width || 800;
    const height = templateMetadata.height || 1000;
    
    // Load and process shirt templates like main generator
    const frontShirtTemplate = await sharp(frontTemplate)
      .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    
    const backShirtTemplate = await sharp(backTemplate)
      .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    
    // Generate front mockup - logo on right chest, smaller size
    console.log('🎨 [SIMPLE-MOCKUP] Generating front mockup...');
    const frontLogo = await sharp(logoBuffer)
      .resize(50, 50, { fit: 'inside', withoutEnlargement: true }) // Even smaller for right chest
      .png()
      .toBuffer();
    
    const frontMockup = await sharp(frontShirtTemplate)
      .composite([
        {
          input: frontLogo,
          top: Math.round(height * 0.25), // Better chest position
          left: width - 140  // Right side margin
        }
      ])
      .png()
      .toBuffer();
    
    console.log('✅ [SIMPLE-MOCKUP] Front mockup generated, size:', frontMockup.length, 'bytes');
    
    // Generate back mockup - logo in middle, smaller with company name
    console.log('🎨 [SIMPLE-MOCKUP] Generating back mockup...');
    const backLogo = await sharp(logoBuffer)
      .resize(100, 100, { fit: 'inside', withoutEnlargement: true }) // Smaller logo
      .png()
      .toBuffer();
    
    // Create company name text for back mockup - using a different approach
    const textWidth = companyName.length * 12; // Approximate width
    const companyText = await sharp({
      create: {
        width: textWidth + 20,
        height: 30,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([
      {
        input: Buffer.from(`
          <svg width="${textWidth + 20}" height="25">
            <text x="10" y="18" font-family="Arial, sans-serif" font-size="16" fill="black" text-anchor="middle">${companyName}</text>
          </svg>
        `),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toBuffer();
    
    const backMockup = await sharp(backShirtTemplate)
      .composite([
        {
          input: backLogo,
          top: Math.round(height * 0.25), // Center vertically
          left: Math.round((width - 100) / 2)  // Center horizontally
        },
        {
          input: companyText,
          top: Math.round(height * 0.42), // Closer to logo
          left: Math.round((width - (textWidth + 20)) / 2)  // Center horizontally based on actual text width
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