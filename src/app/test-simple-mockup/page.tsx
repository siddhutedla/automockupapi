'use client';

import { useState } from 'react';
import { SimpleMockup, SimpleMockupResponse } from '@/types';

export default function TestSimpleMockup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimpleMockupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testMockup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/mockup/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: 'ACME CORP',
          leadID: '6764494000001367215'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to generate mockup');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = (mockup: SimpleMockup) => {
    return `data:image/png;base64,${mockup.base64}`;
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test Simple Mockup API</h1>
      
      <button
        onClick={testMockup}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {loading ? 'Generating...' : 'Generate Mockups'}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">Success!</h3>
          <p>{result.message}</p>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.mockups.map((mockup: SimpleMockup, index: number) => (
              <div key={index} className="bg-white p-4 rounded border">
                <h4 className="font-bold mb-2 capitalize">{mockup.type} Mockup</h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Filename:</strong> {mockup.filename}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Base64 Length:</strong> {mockup.base64.length} characters
                </p>
                <img 
                  src={getImageSrc(mockup)} 
                  alt={`${mockup.type} mockup`}
                  className="border border-gray-300 rounded w-full"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 