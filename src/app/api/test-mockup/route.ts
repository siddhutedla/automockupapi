import { NextRequest } from 'next/server';
import { ApiResponseHandler, generateRequestId } from '@/lib/api-response';
import sharp from 'sharp';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    console.log('🧪 [TEST-MOCKUP] Testing mockup generation...');
    
    // Create a simple test logo (colored square)
    const testLogo = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 } // Red square
      }
    })
    .png()
    .toBuffer();
    
    console.log('✅ [TEST-MOCKUP] Test logo created, size:', testLogo.length, 'bytes');
    
    // T-shirt templates
    const frontTemplate = join(process.cwd(), 'public', 'whiteshirtfront.jpg');
    const backTemplate = join(process.cwd(), 'public', 'whitetshirtback.jpg');
    
    console.log('🎨 [TEST-MOCKUP] Template paths:', { frontTemplate, backTemplate });
    
    // Check if templates exist
    const fs = await import('fs/promises');
    try {
      await fs.access(frontTemplate);
      await fs.access(backTemplate);
      console.log('✅ [TEST-MOCKUP] Template files found');
    } catch (error) {
      console.error('❌ [TEST-MOCKUP] Template files not found:', error);
      return ApiResponseHandler.error('T-shirt templates not found', 500, requestId);
    }
    
    // Generate front mockup
    console.log('🎨 [TEST-MOCKUP] Generating front mockup...');
    const frontMockup = await sharp(frontTemplate)
      .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
      .composite([
        {
          input: testLogo,
          top: 300, // Center vertically
          left: 300  // Center horizontally
        }
      ])
      .png()
      .toBuffer();
    
    console.log('✅ [TEST-MOCKUP] Front mockup generated, size:', frontMockup.length, 'bytes');
    
    // Generate back mockup
    console.log('🎨 [TEST-MOCKUP] Generating back mockup...');
    const backMockup = await sharp(backTemplate)
      .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
      .composite([
        {
          input: testLogo,
          top: 300, // Center vertically
          left: 300  // Center horizontally
        }
      ])
      .png()
      .toBuffer();
    
    console.log('✅ [TEST-MOCKUP] Back mockup generated, size:', backMockup.length, 'bytes');
    
    // Convert to base64
    const frontBase64 = `data:image/png;base64,${frontMockup.toString('base64')}`;
    const backBase64 = `data:image/png;base64,${backMockup.toString('base64')}`;
    
    console.log('✅ [TEST-MOCKUP] Base64 conversion completed');
    
    const result = {
      success: true,
      mockups: [
        { type: 'tshirt-front', base64: frontBase64 },
        { type: 'tshirt-back', base64: backBase64 }
      ]
    };
    
    console.log('✅ [TEST-MOCKUP] Test completed successfully');
    
    return ApiResponseHandler.success(
      result,
      'Test mockup generation successful',
      requestId
    );
    
  } catch (error) {
    console.error('❌ [TEST-MOCKUP] Test failed:', error);
    return ApiResponseHandler.serverError('Test mockup generation failed', requestId);
  }
} 