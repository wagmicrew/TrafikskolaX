'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  category: string;
  message: string;
  metadata?: any;
  userId?: string;
}

export default function LoggingDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    level: 'all',
    category: 'all',
    search: ''
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs?action=files');
      if (response.ok) {
        const data = await response.json();
        if (data.files && data.files.length > 0) {
          // Read the most recent log file
          const recentFile = data.files[0];
          const logsResponse = await fetch(`/api/admin/logs?action=read&filename=${recentFile}&lines=100`);
          if (logsResponse.ok) {
            const logsData = await logsResponse.json();
            setLogs(logsData.logs || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      try {
        const response = await fetch('/api/admin/logs', {
          method: 'DELETE',
        });
        if (response.ok) {
          setLogs([]);
        }
      } catch (error) {
        console.error('Failed to clear logs:', error);
      }
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filter.level === 'all' || log.level === filter.level;
    const matchesCategory = filter.category === 'all' || log.category === filter.category;
    const matchesSearch = !filter.search || log.message.toLowerCase().includes(filter.search.toLowerCase());
    return matchesLevel && matchesCategory && matchesSearch;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">System Logs & Debug</h1>
          <button
            onClick={clearLogs}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Clear Logs
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={filter.level}
                onChange={(e) => setFilter(prev => ({ ...prev, level: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filter.category}
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Categories</option>
                <option value="email">Email</option>
                <option value="auth">Authentication</option>
                <option value="booking">Booking</option>
                <option value="payment">Payment</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search logs..."
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Log Entries */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              Log Entries ({filteredLogs.length})
            </h2>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No log entries found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredLogs.map((log, index) => (
                  <div key={`${log.id}-${index}`} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {log.category}
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">
                          {log.message}
                        </p>
                        {log.metadata && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                              View metadata
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Email Debug Section */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Email Configuration Debug</h2>
          </div>
          <div className="p-4">
            <button
              onClick={() => window.location.href = '/api/admin/email-debug'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Check Email Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
