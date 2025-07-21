'use client';

import { useState } from 'react';
import { MockupFormData, MockupResponse } from '@/types';
import MockupForm from '@/components/MockupForm';
import MockupPreview from '@/components/MockupPreview';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [mockupResult, setMockupResult] = useState<MockupResponse | null>(null);
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

  const handleFormSubmit = async (formData: MockupFormData) => {
    setIsLoading(true);
    setMockupResult(null);

    try {
      // First upload the image if we have a file
      let logoUrl = '';
      if (formData.logo) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.logo);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }
        logoUrl = uploadResult.url;
      }

      // Generate mockups
      const mockupResponse = await fetch('/api/mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logoUrl,
          industry: formData.industry,
          companyName: formData.companyName,
          tagline: formData.tagline,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          mockupTypes: formData.mockupTypes,
        }),
      });

      const result = await mockupResponse.json();
      
      if (result.success) {
        setMockupResult(result.data);
      } else {
        throw new Error(result.error || 'Mockup generation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate mockups: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (newFormData: MockupFormData) => {
    setFormData(newFormData);
  };

  const handleImageUpload = (file: File) => {
    // Handle image upload and update the URL
    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        setUploadedImageUrl(result.url);
      }
    })
    .catch(error => {
      console.error('Upload error:', error);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Auto Mockup Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your logo and create professional mockups for t-shirts, hoodies, and more. 
            Perfect for branding, marketing, and promotional materials.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Create Your Mockups
              </h2>
              <MockupForm 
                onSubmit={handleFormSubmit} 
                isLoading={isLoading}
                onChange={handleFormChange}
                onImageUpload={handleImageUpload}
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <MockupPreview
                logoUrl={uploadedImageUrl}
                companyName={formData.companyName}
                tagline={formData.tagline}
                primaryColor={formData.primaryColor}
                secondaryColor={formData.secondaryColor}
                selectedMockupTypes={formData.mockupTypes}
              />
            </div>
          </div>
        </div>

        {/* Results Section */}
        {mockupResult && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Generated Mockups
            </h2>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Generated on: {new Date(mockupResult.createdAt).toLocaleString()}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockupResult.mockups.map((mockup, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {mockup.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <img
                      src={mockup.url}
                      alt={`Mockup ${mockup.type}`}
                      className="w-full h-auto rounded"
                    />
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => window.open(mockup.url, '_blank')}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View Full Size
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = mockup.url;
                          link.download = `mockup-${mockup.type}.png`;
                          link.click();
                        }}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
