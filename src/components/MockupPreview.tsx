'use client';

import { useState, useEffect, useCallback } from 'react';
import { MockupType } from '@/types';

interface MockupPreviewProps {
  logoUrl?: string;
  companyName?: string;
  tagline?: string;
  primaryColor: string;
  secondaryColor?: string;
  selectedMockupTypes: MockupType[];
}

export default function MockupPreview({
  logoUrl,
  companyName,
  tagline,
  primaryColor,
  secondaryColor,
  selectedMockupTypes
}: MockupPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const generatePreview = useCallback(async () => {
    try {
      const response = await fetch('/api/mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logoUrl,
          industry: 'technology',
          companyName: companyName || 'Your Company',
          tagline: tagline || '',
          primaryColor,
          secondaryColor,
          mockupTypes: [selectedMockupTypes[0]], // Just preview the first selected type
        }),
      });

      const result = await response.json();
      
      if (result.success && result.data.mockups.length > 0) {
        setPreviewUrl(result.data.mockups[0].url);
      }
    } catch (error) {
      console.error('Preview generation error:', error);
    }
  }, [logoUrl, companyName, tagline, primaryColor, secondaryColor, selectedMockupTypes]);

  useEffect(() => {
    if (logoUrl && selectedMockupTypes.length > 0) {
      // Create a simple preview by generating a mockup
      generatePreview();
    }
  }, [logoUrl, selectedMockupTypes, generatePreview]);

  if (!logoUrl || selectedMockupTypes.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">Upload a logo and select mockup types to see a preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Preview</h3>
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Mockup preview"
            className="w-full h-auto rounded-lg border border-gray-200"
          />
          <div className="mt-2 text-sm text-gray-600">
            Preview of: {selectedMockupTypes[0].replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Generating preview...</p>
        </div>
      )}
    </div>
  );
} 