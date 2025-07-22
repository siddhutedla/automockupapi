'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Copy, ExternalLink } from 'lucide-react';

export default function AuthSuccessPage() {
  const [domain, setDomain] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setDomain(urlParams.get('domain') || '');
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            OAuth Success!
          </h1>
          <p className="text-gray-600 mb-6">
            Your Zoho CRM integration is now connected.
          </p>
        </div>

        {domain && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-green-900 mb-2">
              API Domain
            </h3>
            <div className="flex items-center justify-between">
              <code className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
                {domain}
              </code>
              <button
                onClick={() => copyToClipboard(domain)}
                className="ml-2 p-1 text-green-600 hover:text-green-800"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-1">Copied!</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Go to Homepage
          </Link>
          
          <a
            href="/test-zoho"
            className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Test Zoho Integration
          </a>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            What you can do now:
          </h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Fetch contacts from Zoho CRM</li>
            <li>• Create new contacts</li>
            <li>• Access leads and accounts</li>
            <li>• Use the Zoho API in your app</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 