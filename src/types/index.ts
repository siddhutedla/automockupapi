export type Industry = 
  | 'technology'
  | 'healthcare'
  | 'finance'
  | 'education'
  | 'retail'
  | 'food-beverage'
  | 'fashion'
  | 'sports'
  | 'entertainment'
  | 'other';

export type MockupType = 
  | 'tshirt-front'
  | 'tshirt-back'
  | 'hoodie-front'
  | 'hoodie-back'
  | 'sweatshirt-front'
  | 'sweatshirt-back'
  | 'polo-front'
  | 'polo-back'
  | 'tank-top-front'
  | 'tank-top-back';

export type LogoPosition = 
  | 'center'
  | 'left-chest'
  | 'right-chest'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface MockupFormData {
  logo: File | null;
  logoUrl?: string;
  industry: Industry;
  companyName: string;
  tagline?: string;
  mockupTypes: MockupType[];
  logoPosition?: LogoPosition;
}

export interface MockupRequest {
  logoUrl: string;
  industry: Industry;
  companyName: string;
  tagline?: string;
  mockupTypes: MockupType[];
  logoPosition?: LogoPosition;
}

export interface MockupResponse {
  id: string;
  mockups: {
    type: MockupType;
    url: string;
  }[];
  createdAt: string;
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
} 