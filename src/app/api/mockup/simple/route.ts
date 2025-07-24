import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ZohoClientKV } from '@/lib/zoho-client-kv';

// Register the Roboto Mono font
const fontPath = path.join(process.cwd(), 'public', 'RobotoMono.ttf');
if (fs.existsSync(fontPath)) {
  registerFont(fontPath, { family: 'Roboto Mono' });
}

// Ensure temp directory exists
const tempDir = path.join(process.cwd(), 'public', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Cleanup function to remove old files
function cleanupOldFiles() {
  const files = fs.readdirSync(tempDir);
  const now = Date.now();
  const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
  
  files.forEach(file => {
    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtime.getTime() > twoMinutes) {
      fs.unlinkSync(filePath);
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, leadID } = body;

    if (!company || !leadID) {
      return NextResponse.json({ error: 'Company and LeadID are required' }, { status: 400 });
    }

    // Cleanup old files first
    cleanupOldFiles();

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
    
    // Save front mockup
    const frontBuffer = frontCanvas.toBuffer('image/png');
    const frontFilename = `${uuidv4()}.png`;
    const frontFilePath = path.join(tempDir, frontFilename);
    fs.writeFileSync(frontFilePath, frontBuffer);
    
    mockups.push({
      type: 'front',
      imageUrl: `${baseUrl}/temp/${frontFilename}`
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
    
    // Save back mockup
    const backBuffer = backCanvas.toBuffer('image/png');
    const backFilename = `${uuidv4()}.png`;
    const backFilePath = path.join(tempDir, backFilename);
    fs.writeFileSync(backFilePath, backBuffer);
    
    mockups.push({
      type: 'back',
      imageUrl: `${baseUrl}/temp/${backFilename}`
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