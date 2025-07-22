'use client';

import { useState } from 'react';
import { TestTube, CheckCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  leadId: string;
  leadFound: boolean;
  hasAttachments: boolean;
  attachmentCount: number;
  attachments: Record<string, unknown>[];
  downloadTest: {
    success: boolean;
    attachmentId?: string;
    fileName?: string;
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
      const response = await fetch('/api/test-lead?leadId=6764494000001367196');
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
          <h1 className="text-2xl font-bold text-gray-900">Test Lead ID Functionality</h1>
          <p className="text-gray-600 mt-2">Testing lead ID: 6764494000001367196</p>
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
                <h3 className="text-sm font-medium text-gray-900 mb-2">Test Results:</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Lead ID:</strong> {result.leadId}</div>
                  <div><strong>Lead Found:</strong> {result.leadFound ? 'Yes' : 'No'}</div>
                  <div><strong>Has Attachments:</strong> {result.hasAttachments ? 'Yes' : 'No'}</div>
                  <div><strong>Attachment Count:</strong> {result.attachmentCount}</div>
                </div>
              </div>

              {result.downloadTest && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Download Test:</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Status:</strong> {result.downloadTest.success ? 'Success' : 'Failed'}</div>
                    {result.downloadTest.success ? (
                      <>
                        <div><strong>File Name:</strong> {result.downloadTest.fileName}</div>
                        <div><strong>File Size:</strong> {result.downloadTest.fileSize} bytes</div>
                        <div><strong>Message:</strong> {result.downloadTest.message}</div>
                        {result.downloadTest.attachmentId && (
                          <div className="mt-4">
                            <strong>Downloaded Image:</strong>
                            <div className="mt-2">
                              <img 
                                src={`/api/test-lead/image?leadId=${result.leadId}&attachmentId=${result.downloadTest.attachmentId}`}
                                alt="Downloaded attachment"
                                className="max-w-full h-auto max-h-64 border border-gray-300 rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div><strong>Error:</strong> {result.downloadTest.error}</div>
                    )}
                  </div>
                </div>
              )}

              {result.attachments && result.attachments.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Attachments ({result.attachments.length}):</h3>
                  <div className="space-y-2 text-sm">
                    {result.attachments.map((attachment: Record<string, unknown>, index: number) => (
                      <div key={index} className="border border-gray-200 rounded p-2">
                        <div><strong>ID:</strong> {String(attachment.id || 'N/A')}</div>
                        <div><strong>File Name:</strong> {String(attachment.File_Name || 'N/A')}</div>
                        <div><strong>File Type:</strong> {String(attachment.File_Type || 'N/A')}</div>
                        <div><strong>Size:</strong> {String(attachment.Size || 'N/A')} bytes</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Sample Fields:</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(result.sampleFields).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {value ? String(value) : 'null'}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">All Available Fields ({result.allFields.length}):</h3>
                <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                  {result.allFields.join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">What this test does:</h3>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. Fetches the lead with ID: 6764494000001367196</li>
            <li>2. Lists all attachments for the lead</li>
            <li>3. Finds the first image attachment (logo)</li>
            <li>4. Downloads and displays the image</li>
            <li>5. Shows attachment details and download test results</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 