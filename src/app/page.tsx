'use client';

import { useState } from 'react';
import { MockupFormData, MockupResponse } from '@/types';
import MockupForm from '@/components/MockupForm';
import MockupResults from '@/components/MockupResults';
import MockupHistory from '@/components/MockupHistory';
import { FileText, History } from 'lucide-react';

export default function Home() {
  const [results, setResults] = useState<MockupResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  const handleSubmit = async (formData: MockupFormData) => {
    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logoUrl: formData.logoUrl || '',
          industry: formData.industry,
          companyName: formData.companyName,
          tagline: formData.tagline,
          mockupTypes: formData.mockupTypes,
          logoPosition: formData.logoPosition || 'center',
          leadID: formData.leadID || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResults(result.data);
        setActiveTab('form'); // Stay on form tab to show results
      } else {
        setError(result.error || 'Failed to generate mockups');
      }
    } catch (error) {
      console.error('Error generating mockups:', error);
      setError('Failed to generate mockups. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMockup = (mockup: MockupResponse) => {
    setResults(mockup);
    setActiveTab('form');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">
              Create Your Mockups
            </h1>
            <p className="text-lg text-black">
              Generate professional apparel mockups with your logo and branding
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button
                onClick={() => setActiveTab('form')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'form'
                    ? 'bg-blue-600 text-white'
                    : 'text-black hover:text-gray-900'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Create Mockups</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'text-black hover:text-gray-900'
                }`}
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form or History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {activeTab === 'form' ? (
                <div>
                  <h2 className="text-xl font-semibold text-black mb-6">
                    Generate New Mockups
                  </h2>
                  <MockupForm
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                  />
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold text-black mb-6">
                    Mockup History
                  </h2>
                  <MockupHistory onSelectMockup={handleSelectMockup} />
                </div>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-black mb-6">
                {results ? 'Generated Mockups' : 'Preview'}
              </h2>
              {results ? (
                <MockupResults results={results} />
              ) : (
                <div className="text-center py-12 text-black">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">No mockups yet</p>
                  <p className="text-sm">
                    {activeTab === 'form' 
                      ? 'Fill out the form and generate your first mockup'
                      : 'Select a mockup from history to view it here'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
