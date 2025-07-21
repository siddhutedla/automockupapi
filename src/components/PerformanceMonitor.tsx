'use client';

import { useState, useEffect } from 'react';
import { Activity, Database, Cpu, HardDrive, Clock, RefreshCw } from 'lucide-react';

interface PerformanceStats {
  cache: {
    totalEntries: number;
    expiredEntries: number;
    memoryUsage: any;
  };
  system: {
    uptime: number;
    memory: any;
    cpu: any;
    platform: string;
    nodeVersion: string;
  };
  timestamp: string;
}

export default function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/performance/stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch stats');
      }
    } catch (error) {
      setError('Failed to fetch performance statistics');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      const response = await fetch('/api/performance/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache' })
      });

      const result = await response.json();
      if (result.success) {
        fetchStats(); // Refresh stats after clearing cache
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-600" />
          Performance Monitor
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Refresh stats"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={clearCache}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            title="Clear cache"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Cache Stats */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Database className="h-4 w-4 text-blue-600 mr-2" />
              <h4 className="text-sm font-medium text-blue-900">Cache</h4>
            </div>
            <div className="space-y-1 text-xs text-blue-700">
              <p>Total Entries: {stats.cache.totalEntries}</p>
              <p>Expired: {stats.cache.expiredEntries}</p>
              <p>Memory: {formatBytes(stats.cache.memoryUsage.heapUsed)}</p>
            </div>
          </div>

          {/* System Memory */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <HardDrive className="h-4 w-4 text-green-600 mr-2" />
              <h4 className="text-sm font-medium text-green-900">Memory</h4>
            </div>
            <div className="space-y-1 text-xs text-green-700">
              <p>Used: {formatBytes(stats.system.memory.heapUsed)}</p>
              <p>Total: {formatBytes(stats.system.memory.heapTotal)}</p>
              <p>External: {formatBytes(stats.system.memory.external)}</p>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Cpu className="h-4 w-4 text-purple-600 mr-2" />
              <h4 className="text-sm font-medium text-purple-900">System</h4>
            </div>
            <div className="space-y-1 text-xs text-purple-700">
              <p>Platform: {stats.system.platform}</p>
              <p>Node: {stats.system.nodeVersion}</p>
              <p>Uptime: {formatUptime(stats.system.uptime)}</p>
            </div>
          </div>

          {/* Last Updated */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Clock className="h-4 w-4 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Last Updated</h4>
            </div>
            <div className="text-xs text-gray-700">
              <p>{new Date(stats.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500 mt-2">Loading stats...</p>
        </div>
      )}
    </div>
  );
} 