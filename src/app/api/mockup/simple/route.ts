import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs';
import { ZohoClientKV } from '@/lib/zoho-client-kv';
import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

// Register the Roboto Mono font
const fontPath = path.join(process.cwd(), 'public', 'RobotoMono.ttf');
if (fs.existsSync(fontPath)) {
  registerFont(fontPath, { family: 'Roboto Mono' });
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
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

    // Create Zoho client and get lead data
    const zohoClient = new ZohoClientKV();
    const lead = await zohoClient.getLead(leadID);
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Download lead photo
    let logoBuffer: Buffer;
    try {
      logoBuffer = await zohoClient.downloadLeadPhoto(leadID);
      console.log('✅ [SIMPLE-MOCKUP] Lead photo downloaded, size:', logoBuffer.length, 'bytes');
    } catch (error) {
      console.error('Failed to download lead photo:', error);
      return NextResponse.json({ error: 'Failed to download lead photo' }, { status: 500 });
    }

    // Load t-shirt templates
    const frontTemplatePath = path.join(process.cwd(), 'public', 'whiteshirtfront.jpg');
    const backTemplatePath = path.join(process.cwd(), 'public', 'whitetshirtback.jpg');
    
    if (!fs.existsSync(frontTemplatePath) || !fs.existsSync(backTemplatePath)) {
      return NextResponse.json({ error: 'T-shirt templates not found' }, { status: 500 });
    }

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
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
    
    // Convert front mockup to base64 and store in Redis
    const frontBuffer = frontCanvas.toBuffer('image/png');
    const frontBase64 = frontBuffer.toString('base64');
    const frontId = uuidv4();
    
    // Store in Redis with 2-minute expiration
    await kv.set(`mockup:${frontId}`, frontBase64, { ex: 120 }); // 120 seconds = 2 minutes
    
    mockups.push({
      type: 'front',
      imageUrl: `${baseUrl}/api/mockup/image/${frontId}`
    });

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

    // Add company name underneath
    backCtx.font = '24px "Roboto Mono", monospace';
    backCtx.fillStyle = '#000000';
    backCtx.textAlign = 'center';
    backCtx.fillText(company, backX, backY + backLogoHeight/2 + 40);
    
    // Convert back mockup to base64 and store in Redis
    const backBuffer = backCanvas.toBuffer('image/png');
    const backBase64 = backBuffer.toString('base64');
    const backId = uuidv4();
    
    // Store in Redis with 2-minute expiration
    await kv.set(`mockup:${backId}`, backBase64, { ex: 120 }); // 120 seconds = 2 minutes
    
    mockups.push({
      type: 'back',
      imageUrl: `${baseUrl}/api/mockup/image/${backId}`
    });

    return NextResponse.json({ 
      success: true, 
      mockups,
      message: 'Mockups generated successfully. Images will be available for 2 minutes.'
    });

  } catch (error) {
    console.error('Error generating mockup:', error);
    return NextResponse.json({ error: 'Failed to generate mockup' }, { status: 500 });
  }
} 