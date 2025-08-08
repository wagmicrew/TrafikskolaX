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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto"></div>
          <p className="text-white mt-4">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-sky-600/20 to-purple-600/20 border-b border-white/10">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white">System Logs & Debug</h1>
                  <p className="text-gray-300 mt-1">Övervaka och hantera systemloggar</p>
                </div>
                <button
                  onClick={clearLogs}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Rensa Loggar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">
                Nivå
              </label>
              <select
                value={filter.level}
                onChange={(e) => setFilter(prev => ({ ...prev, level: e.target.value }))}
                className="w-full p-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="all">Alla Nivåer</option>
                <option value="error">Fel</option>
                <option value="warn">Varning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Kategori
              </label>
              <select
                value={filter.category}
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="all">Alla Kategorier</option>
                <option value="email">E-post</option>
                <option value="auth">Autentisering</option>
                <option value="booking">Bokning</option>
                <option value="payment">Betalning</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Sök
              </label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Sök i loggar..."
                className="w-full p-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-white/50"
              />
            </div>
          </div>
        </div>

        {/* Log Entries */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">
              Loggposter ({filteredLogs.length})
            </h2>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-300">
                Inga loggposter hittades
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredLogs.map((log, index) => (
                  <div key={`${log.id}-${index}`} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            log.level === 'error' ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
                            log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                            log.level === 'info' ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30' :
                            'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                          }`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-300">
                            {log.category}
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-white mb-2">
                          {log.message}
                        </p>
                        {log.metadata && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-400 hover:text-gray-200">
                              Visa metadata
                            </summary>
                            <pre className="mt-2 p-2 bg-white/5 rounded text-xs overflow-x-auto text-gray-300 border border-white/10">
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
        <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">E-post Konfiguration Debug</h2>
          </div>
          <div className="p-4">
            <button
              onClick={() => window.location.href = '/api/admin/email-debug'}
              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Kontrollera E-post Konfiguration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
