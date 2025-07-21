import sharp from 'sharp';
import { join } from 'path';
import { MockupType } from '@/types';

export interface MockupGenerationOptions {
  logoPath: string;
  mockupType: MockupType;
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
      const { logoPath, mockupType, primaryColor, secondaryColor, companyName, tagline } = options;

      // For now, we'll create a simple mockup by overlaying the logo on a colored background
      // In a real implementation, you would have actual clothing templates
      const mockup = await this.createSimpleMockup({
        logoPath,
        mockupType,
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

  private async createSimpleMockup(options: MockupGenerationOptions): Promise<string> {
    const { logoPath, mockupType, primaryColor = '#3B82F6', secondaryColor = '#1E40AF', companyName, tagline } = options;

    // Create a mockup background (simulating a t-shirt/hoodie)
    const width = 800;
    const height = 1000;
    
    // Create background with primary color
    const background = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 59, g: 130, b: 246, alpha: 1 } // Blue background
      }
    })
    .png()
    .toBuffer();

    // Process the logo
    const logo = await sharp(logoPath)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    // Create the mockup by compositing logo onto background
    const mockup = await sharp(background)
      .composite([
        {
          input: logo,
          top: 300,
          left: 300
        }
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