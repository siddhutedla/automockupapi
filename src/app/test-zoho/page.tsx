'use client';

import { useState } from 'react';
import { Zap, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestZohoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [error, setError] = useState('');

  const initiateOAuth = async () => {
    setIsLoading(true);
    setError('');
    setAuthUrl('');

    try {
      const response = await fetch('/api/auth/zoho');
      const result = await response.json();

      if (result.success) {
        setAuthUrl(result.data.authUrl);
      } else {
        setError(result.error || 'Failed to get OAuth URL');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToZoho = () => {
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <Zap className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Zoho CRM OAuth Test</h1>
          <p className="text-gray-600 mt-2">Test the OAuth integration</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={initiateOAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Getting OAuth URL...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Get OAuth URL
              </>
            )}
          </button>

          {error && (
            <div className="flex items-center text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {authUrl && (
            <div className="space-y-3">
              <div className="flex items-center text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">OAuth URL Generated!</span>
              </div>
              
              <button
                onClick={redirectToZoho}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Go to Zoho OAuth
              </button>
              
              <div className="text-xs text-gray-500">
                <p>Or copy this URL:</p>
                <code className="block mt-1 p-2 bg-gray-100 rounded text-xs break-all">
                  {authUrl}
                </code>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">What happens next?</h3>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. Click &quot;Go to Zoho OAuth&quot; to authorize</li>
            <li>2. Zoho will redirect back to your callback URL</li>
            <li>3. Your app will receive access tokens</li>
            <li>4. You can then use the Zoho CRM API</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 