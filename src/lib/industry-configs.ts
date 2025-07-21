import { Industry, MockupType } from '@/types';

export interface IndustryConfig {
  name: string;
  description: string;
  primaryColors: string[];
  secondaryColors: string[];
  recommendedMockupTypes: MockupType[];
  styling: {
    logoSize: 'small' | 'medium' | 'large';
    textStyle: 'bold' | 'elegant' | 'casual';
    layout: 'centered' | 'corner' | 'full-width';
  };
}

export const INDUSTRY_CONFIGS: Record<Industry, IndustryConfig> = {
  technology: {
    name: 'Technology',
    description: 'Modern, clean designs for tech companies and startups',
    primaryColors: ['#3B82F6', '#1E40AF', '#6366F1', '#8B5CF6', '#06B6D4'],
    secondaryColors: ['#1E293B', '#475569', '#64748B', '#94A3B8'],
    recommendedMockupTypes: ['tshirt-front', 'hoodie-front', 'polo-front'],
    styling: {
      logoSize: 'medium',
      textStyle: 'bold',
      layout: 'centered'
    }
  },
  healthcare: {
    name: 'Healthcare',
    description: 'Professional and trustworthy designs for medical organizations',
    primaryColors: ['#059669', '#047857', '#0D9488', '#0891B2', '#0EA5E9'],
    secondaryColors: ['#1E293B', '#374151', '#4B5563'],
    recommendedMockupTypes: ['polo-front', 'tshirt-front', 'sweatshirt-front'],
    styling: {
      logoSize: 'medium',
      textStyle: 'elegant',
      layout: 'centered'
    }
  },
  finance: {
    name: 'Finance',
    description: 'Sophisticated designs for financial institutions',
    primaryColors: ['#1E293B', '#334155', '#475569', '#64748B', '#0F172A'],
    secondaryColors: ['#F59E0B', '#D97706', '#B45309', '#92400E'],
    recommendedMockupTypes: ['polo-front', 'tshirt-front', 'hoodie-front'],
    styling: {
      logoSize: 'medium',
      textStyle: 'elegant',
      layout: 'centered'
    }
  },
  education: {
    name: 'Education',
    description: 'Engaging designs for schools and educational institutions',
    primaryColors: ['#DC2626', '#EA580C', '#D97706', '#059669', '#0D9488'],
    secondaryColors: ['#1E293B', '#374151', '#4B5563'],
    recommendedMockupTypes: ['tshirt-front', 'hoodie-front', 'sweatshirt-front'],
    styling: {
      logoSize: 'large',
      textStyle: 'casual',
      layout: 'full-width'
    }
  },
  retail: {
    name: 'Retail',
    description: 'Vibrant designs for retail and e-commerce businesses',
    primaryColors: ['#DC2626', '#EA580C', '#D97706', '#059669', '#0D9488'],
    secondaryColors: ['#1E293B', '#374151', '#4B5563'],
    recommendedMockupTypes: ['tshirt-front', 'tank-top-front', 'hoodie-front'],
    styling: {
      logoSize: 'medium',
      textStyle: 'casual',
      layout: 'centered'
    }
  },
  'food-beverage': {
    name: 'Food & Beverage',
    description: 'Appetizing designs for restaurants and food businesses',
    primaryColors: ['#DC2626', '#EA580C', '#D97706', '#059669', '#0D9488'],
    secondaryColors: ['#1E293B', '#374151', '#4B5563'],
    recommendedMockupTypes: ['tshirt-front', 'tank-top-front', 'polo-front'],
    styling: {
      logoSize: 'large',
      textStyle: 'casual',
      layout: 'centered'
    }
  },
  fashion: {
    name: 'Fashion',
    description: 'Trendy designs for fashion and lifestyle brands',
    primaryColors: ['#8B5CF6', '#A855F7', '#C084FC', '#F472B6', '#EC4899'],
    secondaryColors: ['#1E293B', '#374151', '#4B5563'],
    recommendedMockupTypes: ['tshirt-front', 'tank-top-front', 'hoodie-front'],
    styling: {
      logoSize: 'medium',
      textStyle: 'elegant',
      layout: 'corner'
    }
  },
  sports: {
    name: 'Sports',
    description: 'Dynamic designs for sports teams and athletic brands',
    primaryColors: ['#DC2626', '#EA580C', '#D97706', '#059669', '#0D9488'],
    secondaryColors: ['#1E293B', '#374151', '#4B5563'],
    recommendedMockupTypes: ['tshirt-front', 'tank-top-front', 'hoodie-front'],
    styling: {
      logoSize: 'large',
      textStyle: 'bold',
      layout: 'centered'
    }
  },
  entertainment: {
    name: 'Entertainment',
    description: 'Creative designs for entertainment and media companies',
    primaryColors: ['#8B5CF6', '#A855F7', '#C084FC', '#F472B6', '#EC4899'],
    secondaryColors: ['#1E293B', '#374151', '#4B5563'],
    recommendedMockupTypes: ['tshirt-front', 'hoodie-front', 'tank-top-front'],
    styling: {
      logoSize: 'large',
      textStyle: 'casual',
      layout: 'full-width'
    }
  },
  other: {
    name: 'Other',
    description: 'Versatile designs for any business type',
    primaryColors: ['#3B82F6', '#1E40AF', '#6366F1', '#8B5CF6', '#06B6D4'],
    secondaryColors: ['#1E293B', '#475569', '#64748B', '#94A3B8'],
    recommendedMockupTypes: ['tshirt-front', 'polo-front', 'hoodie-front'],
    styling: {
      logoSize: 'medium',
      textStyle: 'bold',
      layout: 'centered'
    }
  }
};

export function getIndustryConfig(industry: Industry): IndustryConfig {
  return INDUSTRY_CONFIGS[industry];
}

export function getRecommendedColors(industry: Industry): { primary: string; secondary: string } {
  const config = getIndustryConfig(industry);
  return {
    primary: config.primaryColors[0],
    secondary: config.secondaryColors[0]
  };
}

export function getRecommendedMockupTypes(industry: Industry): MockupType[] {
  const config = getIndustryConfig(industry);
  return config.recommendedMockupTypes;
} 