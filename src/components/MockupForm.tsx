'use client';

import { useState, useEffect } from 'react';
import { Industry, MockupType, MockupFormData } from '@/types';
import ImageUpload from './ImageUpload';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface MockupFormProps {
  onSubmit: (data: MockupFormData) => void;
  isLoading?: boolean;
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

const MOCKUP_TYPES: { value: MockupType; label: string }[] = [
  { value: 'tshirt-front', label: 'T-Shirt (Front)' },
  { value: 'tshirt-back', label: 'T-Shirt (Back)' },
  { value: 'hoodie-front', label: 'Hoodie (Front)' },
  { value: 'hoodie-back', label: 'Hoodie (Back)' },
  { value: 'sweatshirt-front', label: 'Sweatshirt (Front)' },
  { value: 'sweatshirt-back', label: 'Sweatshirt (Back)' }
];

export default function MockupForm({ onSubmit, isLoading = false }: MockupFormProps) {
  const [formData, setFormData] = useState<MockupFormData>({
    logo: null,
    industry: 'technology',
    companyName: '',
    tagline: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    mockupTypes: ['tshirt-front']
  });

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleImageUpload = async (file: File) => {
    setUploadStatus('uploading');
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success && result.url) {
        setUploadedImageUrl(result.url);
        setFormData(prev => ({ ...prev, logo: file }));
        setUploadStatus('success');
        
        // Clear success status after 3 seconds
        setTimeout(() => setUploadStatus('idle'), 3000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      setUploadStatus('error');
    }
  };

  const handleImageRemove = () => {
    setUploadedImageUrl('');
    setFormData(prev => ({ ...prev, logo: null }));
    setUploadStatus('idle');
    setUploadError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.logo) {
      setUploadError('Please upload a logo');
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

  // Prevent hydration issues by not rendering until mounted
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

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
            Industry *
          </label>
          <select
            value={formData.industry}
            onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value as Industry }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {INDUSTRIES.map(industry => (
              <option key={industry.value} value={industry.value}>
                {industry.label}
              </option>
            ))}
          </select>
        </div>
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

      {/* Color Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <input
            type="color"
            value={formData.primaryColor}
            onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secondary Color (Optional)
          </label>
          <input
            type="color"
            value={formData.secondaryColor}
            onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>
      </div>

      {/* Mockup Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Mockup Types *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MOCKUP_TYPES.map(type => (
            <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.mockupTypes.includes(type.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      mockupTypes: [...prev.mockupTypes, type.value]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      mockupTypes: prev.mockupTypes.filter(t => t !== type.value)
                    }));
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
        disabled={isLoading || !formData.logo || uploadStatus === 'uploading'}
        className={`
          w-full py-3 px-4 rounded-md font-medium transition-colors
          ${isLoading || !formData.logo || uploadStatus === 'uploading'
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {isLoading ? 'Generating Mockups...' : 'Generate Mockups'}
      </button>
    </form>
  );
} 