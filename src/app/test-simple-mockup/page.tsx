'use client';

import { useState } from 'react';
import { TestTube, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface SimpleMockupResponse {
  success: boolean;
  mockups: {
    type: 'tshirt-front' | 'tshirt-back';
    buffer: Buffer;
    filename: string;
  }[];
  error?: string;
}

export default function TestSimpleMockupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimpleMockupResponse | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    company: 'Test Company',
    leadID: '6764494000001367215'
  });

  const testSimpleMockup = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/mockup/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to generate mockups');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testMockupGeneration = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/test-mockup');
      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to test mockup generation');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadMockup = (buffer: Buffer, filename: string) => {
    const blob = new Blob([buffer], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <TestTube className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-black">Simple Mockup API Test</h1>
          <p className="text-black mt-2">Test the simplified mockup API with Company and LeadID</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Lead ID
              </label>
              <input
                type="text"
                value={formData.leadID}
                onChange={(e) => setFormData(prev => ({ ...prev, leadID: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter lead ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={testSimpleMockup}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test with Zoho Photo
                </>
              )}
            </button>
            
            <button
              onClick={testMockupGeneration}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Mockup Generation
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Mockups Generated Successfully!</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.mockups.map((mockup, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-black capitalize">
                      {mockup.type.replace('-', ' ')}
                    </h3>
                    <button
                      onClick={() => downloadMockup(mockup.buffer, mockup.filename)}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                  <div className="text-center">
                    <img 
                      src={`data:image/png;base64,${Buffer.from(mockup.buffer).toString('base64')}`}
                      alt={`${mockup.type} mockup`}
                      className="max-w-full h-auto max-h-80 border border-gray-300 rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Buffer size: {mockup.buffer.length} bytes
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">API Response Structure:</h3>
              <pre className="text-xs text-blue-800 overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-black mb-2">API Usage:</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-black mb-2"><strong>Endpoint:</strong> POST /api/mockup/simple</p>
            <p className="text-xs text-black mb-2"><strong>Input:</strong></p>
            <pre className="text-xs text-black bg-white p-2 rounded border">
{`{
  "company": "Company Name",
  "leadID": "Zoho Lead ID"
}`}
            </pre>
            <p className="text-xs text-black mt-2"><strong>Output:</strong> T-shirt front and back mockups as base64</p>
          </div>
        </div>
      </div>
    </div>
  );
} 