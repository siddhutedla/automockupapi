import sharp from 'sharp';
import potrace from 'potrace';
import { writeFile } from 'fs/promises';

export interface VectorizationOptions {
  threshold?: number; // 0-255, default 128
  turdSize?: number; // minimum area for a path, default 2
  alphaMax?: number; // corner threshold, default 1
  optTolerance?: number; // optimization tolerance, default 0.2
  colorMode?: 'black' | 'color' | 'grayscale';
  maxColors?: number; // maximum colors for vectorization, default 4
}

export class LogoVectorizer {
  /**
   * Count unique colors in an image
   */
  private static async countColors(imageBuffer: Buffer): Promise<number> {
    try {
      const image = sharp(imageBuffer);
      const { data } = await image.raw().toBuffer({ resolveWithObject: true });
      
      const colors = new Set<string>();
      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        colors.add(`${r},${g},${b}`);
      }
      
      return colors.size;
    } catch {
      console.error('Color counting failed');
      return 0;
    }
  }

  /**
   * Auto-vectorize a raster logo to SVG format (only if 4 or fewer colors)
   */
  static async autoVectorize(
    logoPath: string, 
    options: VectorizationOptions = {}
  ): Promise<string | null> {
    try {
      console.log('Starting auto-vectorization for:', logoPath);
      
      // Step 1: Check color count
      const imageBuffer = await sharp(logoPath).png().toBuffer();
      const colorCount = await this.countColors(imageBuffer);
      const maxColors = options.maxColors || 4;
      
      console.log(`Logo has ${colorCount} colors, max for vectorization: ${maxColors}`);
      
      if (colorCount > maxColors) {
        console.log('Too many colors, keeping as raster');
        return null; // Return null to indicate raster should be used
      }
      
      // Step 2: Pre-process the image for better vectorization
      const processedImage = await this.preprocessForVectorization(logoPath, options);
      
      // Step 3: Convert to vector using potrace
      const svg = await this.potraceToSVG(processedImage, options);
      
      console.log('Auto-vectorization completed successfully');
      return svg;
    } catch (error) {
      console.error('Auto-vectorization failed:', error);
      return null; // Return null to indicate raster should be used
    }
  }

  /**
   * Pre-process image for optimal vectorization
   */
  private static async preprocessForVectorization(
    logoPath: string, 
    options: VectorizationOptions
  ): Promise<Buffer> {
    const { colorMode = 'black' } = options;
    
    let processedImage = sharp(logoPath);
    
    // Remove background if it's white/transparent
    processedImage = processedImage.removeAlpha();
    
    if (colorMode === 'black') {
      // Convert to black and white for clean vectorization
      processedImage = processedImage
        .grayscale()
        .threshold(options.threshold || 128);
    } else if (colorMode === 'grayscale') {
      // Keep grayscale for subtle vectorization
      processedImage = processedImage.grayscale();
    }
    // For color mode, keep original colors
    
    // Enhance edges for better vectorization
    processedImage = processedImage
      .sharpen()
      .png();
    
    return await processedImage.toBuffer();
  }

  /**
   * Convert image buffer to SVG using potrace
   */
  private static async potraceToSVG(
    imageBuffer: Buffer, 
    options: VectorizationOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const trace = new potrace.Potrace();
      
      trace.loadImage(imageBuffer, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        trace.setParameters({
          threshold: options.threshold || 128,
          turdSize: options.turdSize || 2,
          alphaMax: options.alphaMax || 1,
          optTolerance: options.optTolerance || 0.2
        });

        const svg = trace.getSVG();
        resolve(svg);
      });
    });
  }

  /**
   * Convert logo to high-quality PNG with vector-like quality
   */
  static async enhanceLogoQuality(
    logoPath: string, 
    targetSize: number
  ): Promise<Buffer> {
    try {
      // Use high-quality interpolation for better quality
      return await sharp(logoPath)
        .resize(targetSize, targetSize, {
          fit: 'inside',
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3
        })
        .png()
        .toBuffer();
    } catch {
      console.error('Logo enhancement failed');
      throw new Error('Failed to enhance logo quality');
    }
  }

  /**
   * Check if logo is already in vector format
   */
  static async isVectorFormat(logoPath: string): Promise<boolean> {
    try {
      const metadata = await sharp(logoPath).metadata();
      return logoPath.toLowerCase().endsWith('.svg') || metadata.format === 'svg';
    } catch {
      return false;
    }
  }

  /**
   * Save vectorized SVG to file
   */
  static async saveVectorizedLogo(
    logoPath: string,
    outputPath: string,
    options: VectorizationOptions = {}
  ): Promise<string> {
    const svg = await this.autoVectorize(logoPath, options);
    if (svg) {
      await writeFile(outputPath, svg);
      return outputPath;
    } else {
      console.warn('Logo is in raster format, cannot save as SVG.');
      return logoPath; // Return original path if raster
    }
  }
} 