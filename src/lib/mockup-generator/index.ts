import sharp from 'sharp';
import { join } from 'path';
import { MockupType, Industry } from '@/types';
import { getIndustryConfig, IndustryConfig } from '@/lib/industry-configs';
import { cacheManager } from '@/lib/cache-manager';

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
  private shirtTemplates: Record<string, string>;

  constructor() {
    this.templatesDir = join(process.cwd(), 'public', 'templates');
    this.shirtTemplates = {
      'tshirt-front': join(process.cwd(), 'public', 'whiteshirtfront.jpg'),
      'tshirt-back': join(process.cwd(), 'public', 'whitetshirtback.jpg'),
      'hoodie-front': join(process.cwd(), 'public', 'whiteshirtfront.jpg'), // Using t-shirt for now
      'hoodie-back': join(process.cwd(), 'public', 'whitetshirtback.jpg'),
      'sweatshirt-front': join(process.cwd(), 'public', 'whiteshirtfront.jpg'),
      'sweatshirt-back': join(process.cwd(), 'public', 'whitetshirtback.jpg'),
      'polo-front': join(process.cwd(), 'public', 'whiteshirtfront.jpg'),
      'polo-back': join(process.cwd(), 'public', 'whitetshirtback.jpg'),
      'tank-top-front': join(process.cwd(), 'public', 'whiteshirtfront.jpg'),
      'tank-top-back': join(process.cwd(), 'public', 'whitetshirtback.jpg')
    };
  }

  async generateMockup(options: MockupGenerationOptions): Promise<MockupResult> {
    try {
      const { logoPath, mockupType, industry, primaryColor, secondaryColor, companyName, tagline } = options;

      // Check cache first
      const cacheKey = cacheManager.generateMockupKey({
        logoPath,
        mockupType,
        industry,
        primaryColor: primaryColor || '#3B82F6',
        secondaryColor: secondaryColor || '#1E40AF',
        companyName: companyName || '',
        tagline: tagline || ''
      });

      const cachedResult = cacheManager.get<MockupResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const mockup = await this.createRealisticMockup({
        logoPath,
        mockupType,
        industry,
        primaryColor,
        secondaryColor,
        companyName,
        tagline
      });

      const result = {
        success: true,
        outputPath: mockup
      };

      // Cache the result
      cacheManager.set(cacheKey, result, 10 * 60 * 1000); // 10 minutes TTL

      return result;
    } catch (error) {
      console.error('Mockup generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async createRealisticMockup(options: MockupGenerationOptions): Promise<string> {
    const { logoPath, mockupType, industry, primaryColor = '#3B82F6', secondaryColor = '#1E40AF', companyName, tagline } = options;

    // Get industry-specific configuration
    const industryConfig = getIndustryConfig(industry);

    // Get the appropriate shirt template
    const templatePath = this.shirtTemplates[mockupType];
    if (!templatePath) {
      throw new Error(`No template found for mockup type: ${mockupType}`);
    }

    // Load and process the shirt template
    const shirtTemplate = await sharp(templatePath)
      .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    // Get template metadata
    const templateMetadata = await sharp(templatePath).metadata();
    const width = templateMetadata.width || 800;
    const height = templateMetadata.height || 1000;

    // Process the logo with realistic effects
    const logoSize = this.getLogoSize(industryConfig.styling.logoSize);
    const processedLogo = await this.processLogoForRealisticApplication(logoPath, logoSize, industryConfig);

    // Create text overlays with realistic styling
    const textOverlays = await this.createRealisticTextOverlays(companyName, tagline, secondaryColor, industryConfig, width, height);

    // Get realistic positioning based on shirt type and layout
    const positioning = this.getRealisticPositioning(mockupType, industryConfig.styling.layout, width, height, logoSize);

    // Apply color tinting to the shirt if needed
    const tintedShirt = await this.applyShirtColorTinting(shirtTemplate, primaryColor);

    // Composite everything together with realistic effects
    const mockup = await sharp(tintedShirt)
      .composite([
        {
          input: processedLogo,
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

  private async processLogoForRealisticApplication(logoPath: string, logoSize: number, industryConfig: IndustryConfig) {
    // Process logo with realistic fabric application effects
    const logo = await sharp(logoPath)
      .resize(logoSize, logoSize, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    // Create a fabric-like texture overlay
    const fabricTexture = await this.createFabricTexture(logoSize, logoSize);
    
    // Blend logo with fabric texture for realistic appearance
    const realisticLogo = await sharp(logo)
      .composite([
        {
          input: fabricTexture,
          blend: 'overlay',
          top: 0,
          left: 0
        }
      ])
      .png()
      .toBuffer();

    return realisticLogo;
  }

  private async createFabricTexture(width: number, height: number) {
    // Create a subtle fabric texture pattern
    const texture = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0.1 }
      }
    })
    .png()
    .toBuffer();

    return texture;
  }

  private async applyShirtColorTinting(shirtTemplate: Buffer, color: string) {
    const rgb = this.hexToRgb(color);
    
    // Apply subtle color tinting to the shirt
    const tinted = await sharp(shirtTemplate)
      .tint({ r: rgb.r, g: rgb.g, b: rgb.b })
      .modulate({ brightness: 1.1, saturation: 0.9 })
      .png()
      .toBuffer();

    return tinted;
  }

  private async createRealisticTextOverlays(companyName: string | undefined, tagline: string | undefined, color: string, industryConfig: IndustryConfig, width: number, height: number) {
    const overlays = [];
    const rgb = this.hexToRgb(color);

    if (companyName) {
      const fontSize = this.getTextSize(industryConfig.styling.textStyle);
      const companyText = await this.createRealisticTextImage(companyName, fontSize, rgb, industryConfig.styling.textStyle);
      overlays.push({
        input: companyText,
        top: Math.floor(height * 0.4),
        left: Math.floor((width - companyText.length * fontSize * 0.6) / 2)
      });
    }

    if (tagline) {
      const fontSize = this.getTextSize(industryConfig.styling.textStyle, true);
      const taglineText = await this.createRealisticTextImage(tagline, fontSize, rgb, industryConfig.styling.textStyle);
      overlays.push({
        input: taglineText,
        top: Math.floor(height * 0.45),
        left: Math.floor((width - taglineText.length * fontSize * 0.6) / 2)
      });
    }

    return overlays;
  }

  private async createRealisticTextImage(text: string, fontSize: number, color: { r: number, g: number, b: number }, textStyle: string) {
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

  private getRealisticPositioning(mockupType: MockupType, layout: string, width: number, height: number, logoSize: number) {
    // Position logo realistically on the shirt based on type and layout
    let logoTop, logoLeft;

    switch (layout) {
      case 'corner':
        logoTop = Math.floor(height * 0.15);
        logoLeft = Math.floor(width * 0.1);
        break;
      case 'full-width':
        logoTop = Math.floor(height * 0.25);
        logoLeft = Math.floor((width - logoSize) / 2);
        break;
      default: // centered
        logoTop = Math.floor(height * 0.25);
        logoLeft = Math.floor((width - logoSize) / 2);
        break;
    }

    // Adjust positioning based on shirt type
    if (mockupType.includes('back')) {
      logoTop = Math.floor(height * 0.2); // Slightly higher on back
    }

    return { logoTop, logoLeft };
  }

  private getLogoSize(size: 'small' | 'medium' | 'large'): number {
    switch (size) {
      case 'small': return 80;
      case 'large': return 150;
      default: return 120;
    }
  }

  private getTextSize(textStyle: string, isTagline = false): number {
    if (isTagline) return 14;
    
    switch (textStyle) {
      case 'bold': return 24;
      case 'elegant': return 20;
      case 'casual': return 22;
      default: return 20;
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