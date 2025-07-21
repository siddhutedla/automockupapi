interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key for mockup generation
  generateMockupKey(options: {
    logoPath: string;
    mockupType: string;
    industry: string;
    primaryColor: string;
    secondaryColor: string;
    companyName: string;
    tagline: string;
  }): string {
    const { logoPath, mockupType, industry, primaryColor, secondaryColor, companyName, tagline } = options;
    return `mockup:${mockupType}:${industry}:${primaryColor}:${secondaryColor}:${companyName}:${tagline}:${logoPath}`;
  }

  // Generate cache key for industry config
  generateIndustryKey(industry: string): string {
    return `industry:${industry}`;
  }

  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    return {
      totalEntries: entries.length,
      expiredEntries: entries.filter(([_, entry]) => now - entry.timestamp > entry.ttl).length,
      memoryUsage: process.memoryUsage()
    };
  }
}

// Global cache instance
export const cacheManager = new CacheManager(); 