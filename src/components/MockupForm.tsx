'use client';

import { useState, useEffect } from 'react';
import { MockupFormData, MockupType, Industry, LogoPosition } from '@/types';
import ImageUpload from './ImageUpload';
import IndustrySelector from './IndustrySelector';
import LogoPositionSelector from './LogoPositionSelector';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface MockupFormProps {
  onSubmit: (data: MockupFormData) => void;
  isLoading?: boolean;
  onChange?: (data: MockupFormData) => void;
  onImageUpload?: (file: File) => void;
}



export default function MockupForm({ onSubmit, isLoading = false, onChange, onImageUpload }: MockupFormProps) {
  const [mounted, setMounted] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string>('');

  const [formData, setFormData] = useState<MockupFormData>({
    logo: null,
    industry: 'technology',
    companyName: '',
    tagline: '',
    mockupTypes: [],
    logoPosition: 'center' as LogoPosition,
    leadID: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Call onChange when form data changes
  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  const handleImageUpload = async (file: File) => {
    console.log('MockupForm: handleImageUpload called with file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    setUploadStatus('uploading');
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('MockupForm: Sending upload request');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      console.log('MockupForm: Upload response status:', response.status);
      
      if (!response.ok) {
        console.log('MockupForm: Response not ok, status:', response.status);
        const errorText = await response.text();
        console.log('MockupForm: Error response text:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('MockupForm: Upload response:', result);

      if (result.success && result.data?.url) {
        console.log('MockupForm: Upload successful, setting URL:', result.data.url);
        setUploadedImageUrl(result.data.url);
        setFormData(prev => ({ ...prev, logo: file, logoUrl: result.data.url }));
        setUploadStatus('success');
        
        // Call onImageUpload if provided
        if (onImageUpload) {
          onImageUpload(file);
        }
        
        // Clear success status after 3 seconds
        setTimeout(() => setUploadStatus('idle'), 3000);
      } else {
        console.log('MockupForm: Upload failed:', result.error);
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('MockupForm: Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      setUploadStatus('error');
    }
  };

  const handleImageRemove = () => {
    setUploadedImageUrl('');
    setFormData(prev => ({ ...prev, logo: null, logoUrl: undefined }));
    setUploadStatus('idle');
    setUploadError('');
  };

  const handleIndustryChange = (industry: Industry) => {
    setFormData(prev => ({ ...prev, industry }));
  };

  const handleMockupTypeChange = (types: MockupType[]) => {
    setFormData(prev => ({ ...prev, mockupTypes: types }));
  };

  const handleLogoPositionChange = (position: LogoPosition) => {
    setFormData(prev => ({ ...prev, logoPosition: position }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if either logo is uploaded or leadID is provided
    if (!formData.logo && !formData.leadID?.trim()) {
      setUploadError('Please either upload a logo or provide a Zoho CRM Lead ID');
      return;
    }

    if (!formData.companyName.trim()) {
      setUploadError('Please enter a company name');
      return;
    }

    if (formData.mockupTypes.length === 0) {
      setUploadError('Please select at least one mockup type');
      return;
    }

    setUploadError('');
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Upload Status */}
      {uploadStatus === 'success' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <p className="text-sm text-green-700">Logo uploaded successfully!</p>
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Your Logo *
        </label>
        <ImageUpload
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
          currentImage={uploadedImageUrl}
        />
      </div>

      {/* Zoho CRM Lead ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zoho CRM Lead ID (Optional)
        </label>
        <input
          type="text"
          value={formData.leadID}
          onChange={(e) => setFormData(prev => ({ ...prev, leadID: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter Zoho CRM Lead ID to fetch logo from custom field"
        />
        <p className="text-xs text-gray-500 mt-1">
          If provided, the logo will be fetched from the lead&apos;s &quot;Image Logo&quot; custom field instead of uploading
        </p>
      </div>

      {/* Company Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Enter your company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tagline (Optional)
          </label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your company tagline..."
          />
        </div>
      </div>

      {/* Industry Selection */}
      <IndustrySelector
        selectedIndustry={formData.industry}
        onIndustryChange={handleIndustryChange}
        onMockupTypeChange={handleMockupTypeChange}
      />

      {/* Logo Position Selection */}
      {mounted && (
        <LogoPositionSelector
          selectedPosition={formData.logoPosition || 'center'}
          onPositionChange={handleLogoPositionChange}
        />
      )}

      {/* Mockup Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mockup Types *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { value: 'tshirt-front', label: 'T-Shirt Front' },
            { value: 'tshirt-back', label: 'T-Shirt Back' },
            { value: 'hoodie-front', label: 'Hoodie Front' },
            { value: 'hoodie-back', label: 'Hoodie Back' },
            { value: 'sweatshirt-front', label: 'Sweatshirt Front' },
            { value: 'sweatshirt-back', label: 'Sweatshirt Back' },
            { value: 'polo-front', label: 'Polo Front' },
            { value: 'polo-back', label: 'Polo Back' },
            { value: 'tank-top-front', label: 'Tank Top Front' },
            { value: 'tank-top-back', label: 'Tank Top Back' }
          ].map((type) => (
            <label key={type.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.mockupTypes.includes(type.value as MockupType)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleMockupTypeChange([...formData.mockupTypes, type.value as MockupType]);
                  } else {
                    handleMockupTypeChange(formData.mockupTypes.filter(t => t !== type.value));
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Generating Mockups...' : 'Generate Mockups'}
      </button>
    </form>
  );
} 