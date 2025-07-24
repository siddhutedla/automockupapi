'use client';

import { useState } from 'react';

export default function TestSimpleMockup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);

  const testMockup = async () => {
    setLoading(true);
    setError(null);
    setFrontImageUrl(null);
    setBackImageUrl(null);

    try {
      // Generate front mockup
      const frontResponse = await fetch('/api/mockup/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: 'ACME CORP',
          leadID: '6764494000001367215',
          type: 'front'
        }),
      });

      if (!frontResponse.ok) {
        const errorData = await frontResponse.json();
        throw new Error(errorData.error || 'Failed to generate front mockup');
      }

      const frontBlob = await frontResponse.blob();
      const frontUrl = URL.createObjectURL(frontBlob);
      setFrontImageUrl(frontUrl);

      // Generate back mockup
      const backResponse = await fetch('/api/mockup/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: 'ACME CORP',
          leadID: '6764494000001367215',
          type: 'back'
        }),
      });

      if (!backResponse.ok) {
        const errorData = await backResponse.json();
        throw new Error(errorData.error || 'Failed to generate back mockup');
      }

      const backBlob = await backResponse.blob();
      const backUrl = URL.createObjectURL(backBlob);
      setBackImageUrl(backUrl);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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

      {(frontImageUrl || backImageUrl) && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">Success!</h3>
          <p>Mockups generated successfully as binary files.</p>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {frontImageUrl && (
              <div className="bg-white p-4 rounded border">
                <h4 className="font-bold mb-2">Front Mockup</h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Filename:</strong> acmecorp-fronttshirt.png
                </p>
                <img 
                  src={frontImageUrl} 
                  alt="Front mockup"
                  className="border border-gray-300 rounded w-full"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
              </div>
            )}
            
            {backImageUrl && (
              <div className="bg-white p-4 rounded border">
                <h4 className="font-bold mb-2">Back Mockup</h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Filename:</strong> acmecorp-backtshirt.png
                </p>
                <img 
                  src={backImageUrl} 
                  alt="Back mockup"
                  className="border border-gray-300 rounded w-full"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 