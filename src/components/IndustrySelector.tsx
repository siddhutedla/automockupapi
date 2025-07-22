'use client';

import { useState } from 'react';
import { Industry, MockupType } from '@/types';
import { getIndustryConfig, getRecommendedColors, getRecommendedMockupTypes } from '@/lib/industry-configs';

interface IndustrySelectorProps {
  selectedIndustry: Industry;
  onIndustryChange: (industry: Industry) => void;
  onMockupTypeChange: (types: MockupType[]) => void;
}

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'food-beverage', label: 'Food & Beverage' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'sports', label: 'Sports' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' }
];

export default function IndustrySelector({
  selectedIndustry,
  onIndustryChange,
  onMockupTypeChange
}: IndustrySelectorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const industryConfig = getIndustryConfig(selectedIndustry);
  const recommendedColors = getRecommendedColors(selectedIndustry);
  const recommendedMockupTypes = getRecommendedMockupTypes(selectedIndustry);

  const handleIndustryChange = (industry: Industry) => {
    onIndustryChange(industry);
    
    // Auto-apply recommended colors and mockup types
    const newColors = getRecommendedColors(industry);
    const newMockupTypes = getRecommendedMockupTypes(industry);
    
    // onColorChange(newColors.primary, newColors.secondary); // Removed color change
    onMockupTypeChange(newMockupTypes);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Industry *
        </label>
        <select
          value={selectedIndustry}
          onChange={(e) => handleIndustryChange(e.target.value as Industry)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {INDUSTRIES.map(industry => (
            <option key={industry.value} value={industry.value}>
              {industry.label}
            </option>
          ))}
        </select>
      </div>

      {/* Industry Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-blue-900">
            {industryConfig.name} - {industryConfig.description}
          </h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {showDetails && (
          <div className="space-y-3">
            {/* Recommended Colors */}
            <div>
              <h5 className="text-xs font-medium text-blue-800 mb-2">Recommended Colors</h5>
              <div className="flex flex-wrap gap-2">
                {industryConfig.primaryColors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => {/* Removed color change */}}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: color }}
                    title={`Primary: ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Recommended Mockup Types */}
            <div>
              <h5 className="text-xs font-medium text-blue-800 mb-2">Recommended Mockup Types</h5>
              <div className="flex flex-wrap gap-1">
                {industryConfig.recommendedMockupTypes.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>

            {/* Styling Info */}
            <div>
              <h5 className="text-xs font-medium text-blue-800 mb-2">Styling</h5>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• Logo Size: {industryConfig.styling.logoSize}</p>
                <p>• Text Style: {industryConfig.styling.textStyle}</p>
                <p>• Layout: {industryConfig.styling.layout}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 