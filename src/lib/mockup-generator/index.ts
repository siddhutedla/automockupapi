import sharp from 'sharp';
import { join } from 'path';
import { MockupType, Industry } from '@/types';
import { getIndustryConfig, IndustryConfig } from '@/lib/industry-configs';

export interface MockupGenerationOptions {
  logoPath: string;
  mockupType: MockupType;
  industry: Industry;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  tagline?: string;
}

export interface MockupResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

export class MockupGenerator {
  private templatesDir: string;

  constructor() {
    this.templatesDir = join(process.cwd(), 'public', 'templates');
  }

  async generateMockup(options: MockupGenerationOptions): Promise<MockupResult> {
    try {
      const { logoPath, mockupType, industry, primaryColor, secondaryColor, companyName, tagline } = options;

      const mockup = await this.createEnhancedMockup({
        logoPath,
        mockupType,
        industry,
        primaryColor,
        secondaryColor,
        companyName,
        tagline
      });

      return {
        success: true,
        outputPath: mockup
      };
    } catch (error) {
      console.error('Mockup generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async createEnhancedMockup(options: MockupGenerationOptions): Promise<string> {
    const { logoPath, mockupType, industry, primaryColor = '#3B82F6', secondaryColor = '#1E40AF', companyName, tagline } = options;

    // Get industry-specific configuration
    const industryConfig = getIndustryConfig(industry);

    // Parse colors
    const primaryRGB = this.hexToRgb(primaryColor);
    const secondaryRGB = this.hexToRgb(secondaryColor);

    // Create mockup background based on type and industry
    const { width, height, background } = await this.createMockupBackground(mockupType, primaryRGB, industryConfig);

    // Process the logo based on industry styling
    const logoSize = this.getLogoSize(industryConfig.styling.logoSize);
    const logo = await sharp(logoPath)
      .resize(logoSize, logoSize, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    // Create text overlays with industry-specific styling
    const textOverlays = await this.createTextOverlays(companyName, tagline, secondaryRGB, industryConfig);

    // Get positioning based on industry layout
    const positioning = this.getPositioning(industryConfig.styling.layout, width, height, logoSize);

    // Composite everything together
    const mockup = await sharp(background)
      .composite([
        {
          input: logo,
          top: positioning.logoTop,
          left: positioning.logoLeft
        },
        ...textOverlays
      ])
      .png()
      .toBuffer();

    // Save the mockup
    const timestamp = Date.now();
    const filename = `mockup-${mockupType}-${timestamp}.png`;
    const outputPath = join(process.cwd(), 'public', 'uploads', filename);
    
    await sharp(mockup).toFile(outputPath);

    return `/uploads/${filename}`;
  }

  private async createMockupBackground(mockupType: MockupType, primaryRGB: { r: number, g: number, b: number }, industryConfig: IndustryConfig) {
    let width = 800;
    let height = 1000;

    // Adjust dimensions based on mockup type
    if (mockupType.includes('hoodie')) {
      height = 1200;
    } else if (mockupType.includes('sweatshirt')) {
      height = 1100;
    }

    // Create gradient background for more realistic look
    const background = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: primaryRGB.r, g: primaryRGB.g, b: primaryRGB.b, alpha: 1 }
      }
    })
    .composite([
      // Add a subtle gradient overlay
      {
        input: await this.createGradientOverlay(width, height, primaryRGB),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toBuffer();

    return { width, height, background };
  }

  private async createGradientOverlay(width: number, height: number, color: { r: number, g: number, b: number }) {
    // Create a subtle gradient for depth
    const gradient = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.1 }
      }
    })
    .png()
    .toBuffer();

    return gradient;
  }

  private async createTextOverlays(companyName: string | undefined, tagline: string | undefined, color: { r: number, g: number, b: number }, industryConfig: IndustryConfig) {
    const overlays = [];

    if (companyName) {
      const fontSize = this.getTextSize(industryConfig.styling.textStyle);
      const companyText = await this.createTextImage(companyName, fontSize, color, industryConfig.styling.textStyle);
      overlays.push({
        input: companyText,
        top: 400,
        left: 200
      });
    }

    if (tagline) {
      const fontSize = this.getTextSize(industryConfig.styling.textStyle, true);
      const taglineText = await this.createTextImage(tagline, fontSize, color, industryConfig.styling.textStyle);
      overlays.push({
        input: taglineText,
        top: 450,
        left: 200
      });
    }

    return overlays;
  }

  private async createTextImage(text: string, fontSize: number, color: { r: number, g: number, b: number }, textStyle: string) {
    // Create a simple text image using Sharp
    // In a production app, you'd use a proper text rendering library
    const textWidth = text.length * fontSize * 0.6;
    const textHeight = fontSize * 1.2;

    const fontWeight = textStyle === 'bold' ? 'bold' : 'normal';
    const fontFamily = textStyle === 'elegant' ? 'Georgia, serif' : 'Arial, sans-serif';

    const textImage = await sharp({
      create: {
        width: Math.ceil(textWidth),
        height: Math.ceil(textHeight),
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([
      {
        input: Buffer.from(`
          <svg width="${textWidth}" height="${textHeight}">
            <text x="0" y="${fontSize}" font-family="${fontFamily}" font-size="${fontSize}" fill="rgb(${color.r}, ${color.g}, ${color.b})" font-weight="${fontWeight}">${text}</text>
          </svg>
        `),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toBuffer();

    return textImage;
  }

  private getLogoSize(size: 'small' | 'medium' | 'large'): number {
    switch (size) {
      case 'small': return 100;
      case 'large': return 200;
      default: return 150;
    }
  }

  private getTextSize(textStyle: string, isTagline = false): number {
    if (isTagline) return 16;
    
    switch (textStyle) {
      case 'bold': return 28;
      case 'elegant': return 24;
      case 'casual': return 26;
      default: return 24;
    }
  }

  private getPositioning(layout: string, width: number, height: number, logoSize: number) {
    switch (layout) {
      case 'corner':
        return {
          logoTop: 50,
          logoLeft: 50
        };
      case 'full-width':
        return {
          logoTop: 200,
          logoLeft: (width - logoSize) / 2
        };
      default: // centered
        return {
          logoTop: 200,
          logoLeft: (width - logoSize) / 2
        };
    }
  }

  private hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
  }

  async generateAllMockups(options: Omit<MockupGenerationOptions, 'mockupType'> & { mockupTypes: MockupType[] }): Promise<MockupResult[]> {
    const results: MockupResult[] = [];

    for (const mockupType of options.mockupTypes) {
      const result = await this.generateMockup({
        ...options,
        mockupType
      });
      results.push(result);
    }

    return results;
  }
} 