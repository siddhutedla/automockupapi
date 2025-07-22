'use client';

import { useState } from 'react';
import { Lock, ExternalLink } from 'lucide-react';

export default function InitiateOAuthPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password === 'banana_split_yummy') {
      // Redirect to OAuth with password
      window.location.href = `/api/auth/zoho?password=${password}`;
    } else {
      setError('Incorrect password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <Lock className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Initiate Zoho OAuth
          </h1>
          <p className="text-gray-600">
            Enter the password to start the OAuth flow
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
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Starting OAuth...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Start OAuth Flow
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            What happens next:
          </h3>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. You&apos;ll be redirected to Zoho for authorization</li>
            <li>2. After authorizing, you&apos;ll get your OAuth tokens</li>
            <li>3. Copy the tokens to your .env file</li>
            <li>4. Your Zoho integration will be ready!</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 