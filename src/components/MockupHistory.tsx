'use client';

import { useState, useEffect } from 'react';
import { MockupResponse, MockupType } from '@/types';
import { Download, Trash2, Eye, Filter } from 'lucide-react';

interface MockupHistoryProps {
  onSelectMockup?: (mockup: MockupResponse) => void;
}

interface HistoryItem {
  id: string;
  mockups: Array<{
    type: MockupType;
    url: string;
  }>;
  createdAt: string;
}

export default function MockupHistory({ onSelectMockup }: MockupHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState({
    industry: '',
    mockupType: ''
  });

  const fetchHistory = async (pageNum: number = 1, reset: boolean = false) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10'
      });

      if (filters.industry) {
        params.append('industry', filters.industry);
      }
      if (filters.mockupType) {
        params.append('mockupType', filters.mockupType);
      }

      const response = await fetch(`/api/mockups/history?${params}`);
      const result = await response.json();

      if (result.success) {
        if (reset) {
          setHistory(result.data);
        } else {
          setHistory(prev => [...prev, ...result.data]);
        }
        setHasMore(result.pagination.hasNext);
      } else {
        setError(result.error || 'Failed to fetch history');
      }
    } catch (error) {
      setError('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchHistory(1, true);
  }, [filters]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC' // Use UTC to prevent timezone differences
    });
  };

  const getMockupTypeLabel = (type: MockupType) => {
    return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500 mt-2">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => fetchHistory(1, true)}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-700">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Industry</label>
            <select
              value={filters.industry}
              onChange={(e) => handleFilterChange('industry', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Industries</option>
              <option value="technology">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="finance">Finance</option>
              <option value="education">Education</option>
              <option value="retail">Retail</option>
              <option value="food-beverage">Food & Beverage</option>
              <option value="fashion">Fashion</option>
              <option value="sports">Sports</option>
              <option value="entertainment">Entertainment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Mockup Type</label>
            <select
              value={filters.mockupType}
              onChange={(e) => handleFilterChange('mockupType', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="tshirt-front">T-Shirt (Front)</option>
              <option value="tshirt-back">T-Shirt (Back)</option>
              <option value="hoodie-front">Hoodie (Front)</option>
              <option value="hoodie-back">Hoodie (Back)</option>
              <option value="sweatshirt-front">Sweatshirt (Front)</option>
              <option value="sweatshirt-back">Sweatshirt (Back)</option>
              <option value="polo-front">Polo (Front)</option>
              <option value="polo-back">Polo (Back)</option>
              <option value="tank-top-front">Tank Top (Front)</option>
              <option value="tank-top-back">Tank Top (Back)</option>
            </select>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Mockup Set #{item.id}</h4>
                <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSelectMockup?.(item as MockupResponse)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {item.mockups.map((mockup, index) => (
                <div key={index} className="relative group">
                  <img
                    src={mockup.url}
                    alt={getMockupTypeLabel(mockup.type)}
                    className="w-full h-24 object-cover rounded border border-gray-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                      <button
                        onClick={() => handleDownload(mockup.url, `${mockup.type}.png`)}
                        className="p-1 bg-white rounded text-gray-700 hover:text-blue-600 transition-colors"
                        title="Download"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    {getMockupTypeLabel(mockup.type)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {history.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <p>No mockup history found</p>
            <p className="text-sm">Generate your first mockup to see it here</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500 mt-2">Loading...</p>
          </div>
        )}

        {hasMore && !loading && (
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 