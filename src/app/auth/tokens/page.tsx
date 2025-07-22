'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle, AlertCircle, ExternalLink, Lock } from 'lucide-react';

interface TokenData {
  access_token: string;
  refresh_token: string;
  api_domain: string;
  expires_in: number;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokensParam = urlParams.get('tokens');
    const passwordParam = urlParams.get('password');
    
    if (tokensParam && passwordParam) {
      // Auto-authenticate if password is provided in URL
      if (passwordParam === 'banana_split_yummy') {
        setIsAuthenticated(true);
        try {
          const decodedTokens = JSON.parse(decodeURIComponent(tokensParam));
          setTokens(decodedTokens);
        } catch (error) {
          console.error('Failed to parse tokens:', error);
        }
      }
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'banana_split_yummy') {
      setIsAuthenticated(true);
      setError('');
      
      // Parse tokens from URL if available
      const urlParams = new URLSearchParams(window.location.search);
      const tokensParam = urlParams.get('tokens');
      if (tokensParam) {
        try {
          const decodedTokens = JSON.parse(decodeURIComponent(tokensParam));
          setTokens(decodedTokens);
        } catch (error) {
          console.error('Failed to parse tokens:', error);
        }
      }
    } else {
      setError('Incorrect password');
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyEnvBlock = () => {
    if (!tokens) return;
    
    const envBlock = `ZOHO_ACCESS_TOKEN=${tokens.access_token}
ZOHO_REFRESH_TOKEN=${tokens.refresh_token}
ZOHO_API_DOMAIN=${tokens.api_domain}`;
    
    navigator.clipboard.writeText(envBlock);
    setCopied('env');
    setTimeout(() => setCopied(null), 2000);
  };

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <Lock className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Protected Tokens Page
            </h1>
            <p className="text-gray-600">
              Enter the password to view OAuth tokens
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Lock className="h-4 w-4 mr-2" />
              Unlock Tokens
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              This page is protected to keep your OAuth tokens secure.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokens) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              No Tokens Found
            </h1>
            <p className="text-gray-600 mb-6">
              Please complete the OAuth flow first.
            </p>
            <Link
              href="/api/auth/zoho"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Start OAuth Flow
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            OAuth Tokens Received!
          </h1>
          <p className="text-gray-600">
            Add these tokens to your <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">
              ⚠️ Important: Copy these tokens now!
            </h3>
            <p className="text-xs text-yellow-800">
              This page will only show the tokens once. Make sure to copy them to your .env file.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 mb-2">
              Environment Variables
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <code className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded flex-1 mr-2">
                  ZOHO_ACCESS_TOKEN={tokens.access_token}
                </code>
                <button
                  onClick={() => copyToClipboard(`ZOHO_ACCESS_TOKEN=${tokens.access_token}`, 'access')}
                  className="p-1 text-green-600 hover:text-green-800"
                  title="Copy access token"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <code className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded flex-1 mr-2">
                  ZOHO_REFRESH_TOKEN={tokens.refresh_token}
                </code>
                <button
                  onClick={() => copyToClipboard(`ZOHO_REFRESH_TOKEN=${tokens.refresh_token}`, 'refresh')}
                  className="p-1 text-green-600 hover:text-green-800"
                  title="Copy refresh token"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <code className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded flex-1 mr-2">
                  ZOHO_API_DOMAIN={tokens.api_domain}
                </code>
                <button
                  onClick={() => copyToClipboard(`ZOHO_API_DOMAIN=${tokens.api_domain}`, 'domain')}
                  className="p-1 text-green-600 hover:text-green-800"
                  title="Copy API domain"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <button
              onClick={copyEnvBlock}
              className="mt-3 w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy All to Clipboard
            </button>
            
            {copied === 'env' && (
              <p className="text-xs text-green-600 mt-2 text-center">All tokens copied!</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Token Details
            </h3>
            <div className="text-xs text-blue-800 space-y-1">
              <p>• Access Token: {tokens.access_token.substring(0, 20)}...</p>
              <p>• Refresh Token: {tokens.refresh_token.substring(0, 20)}...</p>
              <p>• API Domain: {tokens.api_domain}</p>
              <p>• Expires In: {tokens.expires_in} seconds</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Go to Homepage
          </Link>
          
          <a
            href="/api/test-lead"
            className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Test Zoho Integration
          </a>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Next Steps:
          </h3>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. Copy the tokens above to your .env file</li>
            <li>2. Restart your development server</li>
            <li>3. Test the integration using the button above</li>
            <li>4. Your Zoho CRM integration is now ready!</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 