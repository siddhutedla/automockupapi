'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react';

interface ZohoStatus {
  environment: string;
  tokenRefresh: string;
  accessToken: string;
  apiDomain: string;
  expiresIn: number;
  tokenType: string;
}

export default function ZohoStatusPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<ZohoStatus | null>(null);
  const [error, setError] = useState('');

  const checkZohoStatus = async () => {
    setIsLoading(true);
    setError('');
    setStatus(null);

    try {
      const response = await fetch('/api/zoho-status');
      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
      } else {
        setError(data.error || 'Failed to check Zoho status');
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
          <Settings className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-black">Zoho Configuration Status</h1>
          <p className="text-black mt-2">Check if Zoho CRM is properly configured</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={checkZohoStatus}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking Status...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Zoho Status
              </>
            )}
          </button>

          {error && (
            <div className="flex items-center text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {status && (
            <div className="space-y-4">
              <div className="flex items-center text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Zoho Configuration is Working!</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-black mb-2">Configuration Status:</h3>
                <div className="space-y-2 text-sm text-black">
                  <div className="flex justify-between">
                    <span>Environment Variables:</span>
                    <span className="text-green-600">{status.environment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Token Refresh:</span>
                    <span className="text-green-600">{status.tokenRefresh}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Token:</span>
                    <span className="text-green-600">{status.accessToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>API Domain:</span>
                    <span>{status.apiDomain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Token Type:</span>
                    <span>{status.tokenType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expires In:</span>
                    <span>{status.expiresIn} seconds</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-black mb-2">Required Environment Variables:</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-xs text-black">
                <div><strong>ZOHO_CLIENT_ID:</strong> Your Zoho OAuth client ID</div>
                <div><strong>ZOHO_CLIENT_SECRET:</strong> Your Zoho OAuth client secret</div>
                <div><strong>ZOHO_REFRESH_TOKEN:</strong> Your Zoho refresh token</div>
                <div><strong>ZOHO_API_DOMAIN:</strong> Zoho API domain (usually www.zohoapis.com)</div>
              </div>
            </div>
            
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h4>
              <ol className="text-xs text-blue-800 space-y-1">
                <li>1. Create a Zoho OAuth application in your Zoho Developer Console</li>
                <li>2. Get your Client ID and Client Secret</li>
                <li>3. Generate a refresh token using the OAuth flow</li>
                <li>4. Add these values to your .env.local file</li>
                <li>5. Restart your development server</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 