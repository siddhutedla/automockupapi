'use client';

import { MockupResponse } from '@/types';
import { Download, ExternalLink, Calendar } from 'lucide-react';

interface MockupResultsProps {
  results: MockupResponse;
}

export default function MockupResults({ results }: MockupResultsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMockupTypeLabel = (type: string) => {
    return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDownloadAll = async () => {
    for (const mockup of results.mockups) {
      await handleDownload(mockup.url, `mockup-${mockup.type}.png`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-900">Mockup Set #{results.id}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Calendar className="h-3 w-3 text-blue-600" />
              <p className="text-xs text-blue-700">{formatDate(results.createdAt)}</p>
            </div>
          </div>
          <button
            onClick={handleDownloadAll}
            className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>Download All</span>
          </button>
        </div>
      </div>

      {/* Mockups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.mockups.map((mockup, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="relative group">
              <img
                src={mockup.url}
                alt={getMockupTypeLabel(mockup.type)}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                  <button
                    onClick={() => window.open(mockup.url, '_blank')}
                    className="p-2 bg-white rounded text-gray-700 hover:text-blue-600 transition-colors"
                    title="View full size"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(mockup.url, `mockup-${mockup.type}.png`)}
                    className="p-2 bg-white rounded text-gray-700 hover:text-green-600 transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-900">
                {getMockupTypeLabel(mockup.type)}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Click to view or download
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {results.mockups.length} mockup{results.mockups.length !== 1 ? 's' : ''} generated
            </p>
            <p className="text-xs text-gray-500 mt-1">
              All mockups are ready for download
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => window.open(`/api/mockups/history`, '_blank')}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              View History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 