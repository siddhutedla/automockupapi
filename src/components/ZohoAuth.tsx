'use client';

import { useState, useEffect } from 'react';
import { Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ZohoAuthProps {
  onAuthSuccess?: (data: any) => void;
  onAuthError?: (error: string) => void;
}

export default function ZohoAuth({ onAuthSuccess, onAuthError }: ZohoAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [authData, setAuthData] = useState<any>(null);

  const initiateOAuth = async () => {
    setIsLoading(true);
    setAuthStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/zoho');
      const result = await response.json();

      if (result.success) {
        // Redirect to Zoho OAuth URL
        window.location.href = result.data.authUrl;
      } else {
        throw new Error(result.error || 'Failed to initiate OAuth');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'OAuth initiation failed';
      setErrorMessage(errorMsg);
      setAuthStatus('error');
      onAuthError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/zoho/status');
      const result = await response.json();

      if (result.success && result.data.authenticated) {
        setAuthStatus('success');
        setAuthData(result.data);
        onAuthSuccess?.(result.data);
      }
    } catch (error) {
      // Ignore status check errors
    }
  };

  useEffect(() => {
    // Check if we're returning from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    const authError = urlParams.get('auth_error');

    if (authSuccess === 'true') {
      setAuthStatus('success');
      checkAuthStatus();
    } else if (authError) {
      setAuthStatus('error');
      setErrorMessage(authError);
      onAuthError?.(authError);
    }
  }, [onAuthError]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Zap className="h-6 w-6 text-orange-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Zoho CRM Integration</h3>
      </div>

      {authStatus === 'idle' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your Zoho CRM account to access contacts, leads, and accounts for mockup generation.
          </p>
          
          <button
            onClick={initiateOAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Connect Zoho CRM
              </>
            )}
          </button>
        </div>
      )}

      {authStatus === 'loading' && (
        <div className="text-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Redirecting to Zoho...</p>
        </div>
      )}

      {authStatus === 'success' && (
        <div className="space-y-4">
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Connected to Zoho CRM</span>
          </div>
          
          {authData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                API Domain: {authData.apiDomain}
              </p>
              <p className="text-sm text-green-700">
                Expires in: {Math.round(authData.expiresIn / 60)} minutes
              </p>
            </div>
          )}
          
          <button
            onClick={() => setAuthStatus('idle')}
            className="text-sm text-orange-600 hover:text-orange-800 underline"
          >
            Reconnect
          </button>
        </div>
      )}

      {authStatus === 'error' && (
        <div className="space-y-4">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Connection Failed</span>
          </div>
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}
          
          <button
            onClick={() => {
              setAuthStatus('idle');
              setErrorMessage('');
            }}
            className="text-sm text-orange-600 hover:text-orange-800 underline"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
} 