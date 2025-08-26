"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import toast from 'react-hot-toast';
import { 
  Loader2, 
  Download, 
  Trash2, 
  RefreshCw, 
  Play, 
  Pause, 
  Filter,
  FileText,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
  Activity,
  Database,
  Mail,
  CreditCard,
  Users,
  Settings,
  Clock,
  Eye,
  Search
} from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'payment' | 'booking' | 'email' | 'auth' | 'system';
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

interface LogStats {
  totalFiles: number;
  categories: Record<string, number>;
  totalSize: number;
}

const categoryIcons = {
  payment: CreditCard,
  booking: Activity,
  email: Mail,
  auth: Users,
  system: Settings
};

const levelColors = {
  info: 'bg-blue-100 text-blue-800',
  warn: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  debug: 'bg-gray-100 text-gray-800'
};

const levelIcons = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  debug: Bug
};

export default function LogsClient() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFiles, setLogFiles] = useState<string[]>([]);
  const [logStats, setLogStats] = useState<LogStats | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [maxLines, setMaxLines] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLogFiles();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        if (selectedFile) {
          loadLogFile(selectedFile);
        }
      }, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, selectedFile]);

  useEffect(() => {
    filterLogs();
  }, [logs, selectedCategory, selectedLevel, searchQuery]);

  const loadLogFiles = async () => {
    try {
      const response = await fetch('/api/admin/logs?action=files');
      if (response.ok) {
        const data = await response.json();
        setLogFiles(data.files);
        setLogStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading log files:', error);
      toast.error('Failed to load log files');
    }
  };

  const loadLogFile = async (filename: string) => {
    if (!filename) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/logs?action=read&filename=${filename}&lines=${maxLines}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        
        // Scroll to bottom if auto-refresh is on
        if (autoRefresh && scrollAreaRef.current) {
          setTimeout(() => {
            scrollAreaRef.current?.scrollTo({
              top: scrollAreaRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error loading log file:', error);
      toast.error('Failed to load log file');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(log => log.category === selectedCategory);
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(query) ||
        log.userId?.toLowerCase().includes(query) ||
        log.sessionId?.toLowerCase().includes(query) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(query))
      );
    }

    setFilteredLogs(filtered);
  };

  const clearLogs = async (category?: string) => {
    const confirmMessage = category 
      ? `Are you sure you want to clear all ${category} logs?`
      : 'Are you sure you want to clear ALL logs?';
    
    if (!confirm(confirmMessage)) return;

    try {
      const url = category 
        ? `/api/admin/logs?category=${category}`
        : '/api/admin/logs';
      
      const response = await fetch(url, { method: 'DELETE' });
      
      if (response.ok) {
        toast.success('Logs cleared successfully');
        setLogs([]);
        loadLogFiles();
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Failed to clear logs');
    }
  };

  const downloadLogs = () => {
    if (filteredLogs.length === 0) return;

    const logContent = filteredLogs.map(log => JSON.stringify(log)).join('\n');
    const blob = new Blob([logContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${selectedFile || 'filtered'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('sv-SE');
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Log Viewer</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Log Files
              </CardTitle>
              <CardDescription>
                Select a log file to view its contents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="file-select">Log File</Label>
                  <Select value={selectedFile} onValueChange={(value) => {
                    setSelectedFile(value);
                    loadLogFile(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a log file" />
                    </SelectTrigger>
                    <SelectContent>
                      {logFiles.map(file => (
                        <SelectItem key={file} value={file}>
                          {file}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[120px]">
                  <Label htmlFor="category-filter">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="auth">Authentication</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[120px]">
                  <Label htmlFor="level-filter">Level</Label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[100px]">
                  <Label htmlFor="max-lines">Max Lines</Label>
                  <Input
                    type="number"
                    value={maxLines}
                    onChange={(e) => setMaxLines(parseInt(e.target.value) || 100)}
                    min="10"
                    max="10000"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedFile && loadLogFile(selectedFile)}
                  disabled={loading || !selectedFile}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
                >
                  {autoRefresh ? (
                    <Pause className="w-4 h-4 mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Auto Refresh
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadLogs}
                  disabled={filteredLogs.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => clearLogs()}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                Showing {filteredLogs.length} of {logs.length} log entries
                {autoRefresh && (
                  <Badge variant="outline" className="ml-2">
                    <Activity className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Log Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full" ref={scrollAreaRef}>
                <div className="space-y-2">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {selectedFile ? 'No log entries match your filters' : 'Select a log file to view entries'}
                    </div>
                  ) : (
                    filteredLogs.map((log, index) => {
                      const LevelIcon = levelIcons[log.level];
                      const CategoryIcon = categoryIcons[log.category];
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <LevelIcon className="w-4 h-4 flex-shrink-0" />
                              <CategoryIcon className="w-4 h-4 flex-shrink-0 text-gray-500" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={levelColors[log.level]} variant="secondary">
                                  {log.level.toUpperCase()}
                                </Badge>
                                <Badge variant="outline">
                                  {log.category}
                                </Badge>
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimestamp(log.timestamp)}
                                </span>
                              </div>
                              
                              <p className="text-sm font-medium mb-1">{log.message}</p>
                              
                              {(log.userId || log.sessionId) && (
                                <div className="flex gap-4 text-xs text-gray-600 mb-1">
                                  {log.userId && <span>User: {log.userId}</span>}
                                  {log.sessionId && <span>Session: {log.sessionId}</span>}
                                </div>
                              )}
                              
                              {log.data && (
                                <details className="mt-2">
                                  <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                                    Show data
                                  </summary>
                                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(log.data, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {logStats && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Log Statistics
                  </CardTitle>
                  <CardDescription>
                    Overview of log files and categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{logStats.totalFiles}</div>
                      <div className="text-sm text-gray-600">Total Log Files</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{Object.keys(logStats.categories).length}</div>
                      <div className="text-sm text-gray-600">Categories</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{formatFileSize(logStats.totalSize)}</div>
                      <div className="text-sm text-gray-600">Total Size</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Category Breakdown</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(logStats.categories).map(([category, count]) => {
                        const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons] || Settings;
                        return (
                          <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="w-4 h-4 text-gray-600" />
                              <span className="capitalize text-sm font-medium">{category}</span>
                            </div>
                            <Badge variant="secondary">{count} files</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>
                    Manage log files by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.keys(logStats.categories).map(category => (
                      <Button
                        key={category}
                        variant="outline"
                        size="sm"
                        onClick={() => clearLogs(category)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear {category}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Log Settings
              </CardTitle>
              <CardDescription>
                Configure logging behavior and auto-refresh settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="refresh-interval">Auto-refresh Interval (seconds)</Label>
                  <Input
                    id="refresh-interval"
                    type="number"
                    value={refreshInterval / 1000}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value) * 1000 || 5000)}
                    min="1"
                    max="60"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How often to refresh logs when auto-refresh is enabled
                  </p>
                </div>

                <div>
                  <Label htmlFor="default-max-lines">Default Max Lines</Label>
                  <Input
                    id="default-max-lines"
                    type="number"
                    value={maxLines}
                    onChange={(e) => setMaxLines(parseInt(e.target.value) || 100)}
                    min="10"
                    max="10000"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default number of lines to load from log files
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadLogFiles}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh File List
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadLogs}
                    disabled={filteredLogs.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Current View
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">System Information</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Log Directory: <code className="bg-gray-100 px-1 rounded">./logs/</code></div>
                  <div>Max File Size: <code className="bg-gray-100 px-1 rounded">10MB</code></div>
                  <div>Max Files per Category: <code className="bg-gray-100 px-1 rounded">5</code></div>
                  <div>Auto-rotation: <code className="bg-gray-100 px-1 rounded">Enabled</code></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
