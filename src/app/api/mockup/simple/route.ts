import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs';
import { ZohoClientKV } from '@/lib/zoho-client-kv';

// Register the Roboto Mono font (optional)
try {
  const fontPath = path.join(process.cwd(), 'public', 'RobotoMono.ttf');
  if (fs.existsSync(fontPath)) {
    registerFont(fontPath, { family: 'Roboto Mono' });
    console.log('✅ Font registered successfully');
  } else {
    console.log('⚠️ Font file not found, using system font');
  }
} catch (error) {
  console.log('⚠️ Font registration failed, using system font:', error);
}

// Create a simple placeholder logo using canvas
function createPlaceholderLogo(): Buffer {
  const canvas = createCanvas(100, 100);
  const ctx = canvas.getContext('2d');
  
  // Red background
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(0, 0, 100, 100);
  
  // White text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LOGO', 50, 50);
  
  return canvas.toBuffer('image/png');
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, leadID } = body;

    if (!company || !leadID) {
      return NextResponse.json({ error: 'Company and LeadID are required' }, { status: 400 });
    }

    // Load t-shirt templates first
    const frontTemplatePath = path.join(process.cwd(), 'public', 'whiteshirtfront.jpg');
    const backTemplatePath = path.join(process.cwd(), 'public', 'whitetshirtback.jpg');
    
    if (!fs.existsSync(frontTemplatePath) || !fs.existsSync(backTemplatePath)) {
      return NextResponse.json({ error: 'T-shirt templates not found' }, { status: 500 });
    }

    // Try to get logo from Zoho, fallback to placeholder
    let logoBuffer: Buffer;
    let logoSource = 'placeholder';
    
    try {
      // Create Zoho client and get lead data
      const zohoClient = new ZohoClientKV();
      
      let lead;
      try {
        lead = await zohoClient.getLead(leadID);
        console.log('✅ Lead data retrieved:', lead ? 'Found' : 'Not found');
      } catch (error) {
        console.error('❌ Error getting lead:', error);
        throw new Error('Failed to get lead data');
      }
      
      if (!lead || Object.keys(lead).length === 0) {
        throw new Error('Lead not found or has no data');
      }

      // Download lead photo
      try {
        logoBuffer = await zohoClient.downloadLeadPhoto(leadID);
        console.log('✅ [SIMPLE-MOCKUP] Lead photo downloaded, size:', logoBuffer.length, 'bytes');
        logoSource = 'zoho';
      } catch (error) {
        console.error('Failed to download lead photo:', error);
        throw new Error('Failed to download lead photo');
      }
    } catch (error) {
      console.log('⚠️ Using placeholder logo due to Zoho error:', error);
      // Use generated placeholder logo
      logoBuffer = createPlaceholderLogo();
      logoSource = 'placeholder';
    }

    const mockups = [];

    // Generate front mockup
    const frontTemplate = await loadImage(frontTemplatePath);
    const frontCanvas = createCanvas(frontTemplate.width, frontTemplate.height);
    const frontCtx = frontCanvas.getContext('2d');
    
    // Draw the base template
    frontCtx.drawImage(frontTemplate, 0, 0);
    
    // Load and draw the logo
    const logoImage = await loadImage(logoBuffer);
    
    // Front logo: right chest, smaller
    const frontLogoWidth = 60;
    const frontLogoHeight = 60;
    const frontX = frontTemplate.width * 0.75; // Right side
    const frontY = frontTemplate.height * 0.3; // Upper chest area
    frontCtx.drawImage(logoImage, frontX - frontLogoWidth/2, frontY - frontLogoHeight/2, frontLogoWidth, frontLogoHeight);
    
    // Convert front mockup to base64
    const frontBuffer = frontCanvas.toBuffer('image/png');
    const frontBase64 = frontBuffer.toString('base64');
    
    // Generate back mockup
    const backTemplate = await loadImage(backTemplatePath);
    const backCanvas = createCanvas(backTemplate.width, backTemplate.height);
    const backCtx = backCanvas.getContext('2d');
    
    // Draw the base template
    backCtx.drawImage(backTemplate, 0, 0);
    
    // Back logo: centered, smaller
    const backLogoWidth = 80;
    const backLogoHeight = 80;
    const backX = backTemplate.width * 0.5;
    const backY = backTemplate.height * 0.4;
    backCtx.drawImage(logoImage, backX - backLogoWidth/2, backY - backLogoHeight/2, backLogoWidth, backLogoHeight);

    // Add company name underneath with fallback font
    try {
      backCtx.font = '24px "Roboto Mono", monospace';
    } catch {
      backCtx.font = '24px Arial, sans-serif';
    }
    backCtx.fillStyle = '#000000';
    backCtx.textAlign = 'center';
    backCtx.fillText(company, backX, backY + backLogoHeight/2 + 40);
    
    // Convert back mockup to base64
    const backBuffer = backCanvas.toBuffer('image/png');
    const backBase64 = backBuffer.toString('base64');

    // Return base64 images
    mockups.push({
      type: 'front',
      base64: frontBase64,
      filename: `${company.toLowerCase().replace(/\s+/g, '')}-fronttshirt.png`
    });
    
    mockups.push({
      type: 'back',
      base64: backBase64,
      filename: `${company.toLowerCase().replace(/\s+/g, '')}-backtshirt.png`
    });
    
    return NextResponse.json({ 
      success: true, 
      mockups,
      message: `Mockups generated successfully using ${logoSource} logo.`
    });

  } catch (error) {
    console.error('Error generating mockup:', error);
    return NextResponse.json({ error: 'Failed to generate mockup' }, { status: 500 });
  }
} 