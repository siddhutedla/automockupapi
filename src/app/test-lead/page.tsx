'use client';

import { useState } from 'react';
import { TestTube, CheckCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  leadId: string;
  leadFound: boolean;
  photoTest: {
    success: boolean;
    leadId?: string;
    fileSize?: number;
    message?: string;
    error?: string;
  } | null;
  allFields: string[];
  sampleFields: Record<string, unknown>;
}

export default function TestLeadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState('');

  const testLead = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/test-lead?leadId=6764494000001367215');
      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to test lead');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <TestTube className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-black">Test Lead ID Functionality</h1>
          <p className="text-black mt-2">Testing lead ID: 6764494000001367215</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={testLead}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testing Lead...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Test Lead ID
              </>
            )}
          </button>

          {error && (
            <div className="flex items-center text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Lead Test Completed!</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-black mb-2">Test Results:</h3>
                <div className="space-y-2 text-sm text-black !text-black">
                  <div className="text-black"><strong>Lead ID:</strong> {result.leadId}</div>
                  <div className="text-black"><strong>Lead Found:</strong> {result.leadFound ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {result.photoTest && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-black mb-2">Photo Test:</h3>
                  <div className="space-y-2 text-sm text-black !text-black">
                    <div className="text-black"><strong>Status:</strong> {result.photoTest.success ? 'Success' : 'Failed'}</div>
                    {result.photoTest.success ? (
                      <>
                        <div className="text-black"><strong>Lead ID:</strong> {result.photoTest.leadId}</div>
                        <div className="text-black"><strong>File Size:</strong> {result.photoTest.fileSize} bytes</div>
                        <div className="text-black"><strong>Message:</strong> {result.photoTest.message}</div>
                        <div className="mt-4 text-black">
                          <strong>Downloaded Photo:</strong>
                          <div className="mt-2">
                            <img 
                              src={`/api/test-lead/image?leadId=${encodeURIComponent(result.leadId)}`}
                              alt="Lead Photo"
                              className="max-w-full h-auto max-h-64 border border-gray-300 rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-black"><strong>Error:</strong> {result.photoTest.error}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-black mb-2">Sample Fields:</h3>
                <div className="space-y-1 text-sm text-black !text-black">
                  {Object.entries(result.sampleFields).map(([key, value]) => (
                    <div key={key} className="text-black">
                      <strong>{key}:</strong> {value ? String(value) : 'null'}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-black mb-2">All Available Fields ({result.allFields.length}):</h3>
                <div className="text-xs text-black max-h-32 overflow-y-auto">
                  {result.allFields.join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-black mb-2">What this test does:</h3>
          <ol className="text-xs text-black space-y-1">
            <li>1. Fetches the lead with ID: 3000000038009</li>
            <li>2. Attempts to download the lead&apos;s photo</li>
            <li>3. Displays the photo if successful</li>
            <li>4. Shows photo test results and lead details</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 