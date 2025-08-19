"use client";

import React, { useState, useEffect } from "react";
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaDatabase, 
  FaTrash, 
  FaCog, 
  FaPlay,
  FaEye,
  FaSeedling,
  FaBroom
} from "react-icons/fa";
import toast from "react-hot-toast";

interface MigrationResult {
  success: boolean;
  message: string;
  results?: string[];
  error?: string;
  details?: string;
}

interface OperationState {
  isRunning: boolean;
  result: MigrationResult | null;
}

const MigrateClient: React.FC = () => {
  const [setupDb, setSetupDb] = useState<OperationState>({ isRunning: false, result: null });
  const [testData, setTestData] = useState<OperationState>({ isRunning: false, result: null });
  const [cleanup, setCleanup] = useState<OperationState>({ isRunning: false, result: null });
  const [status, setStatus] = useState<OperationState>({ isRunning: false, result: null });

  const showToast = (result: MigrationResult, operation: string) => {
    if (result.success) {
      toast.success(
        <div>
          <div className="flex items-center gap-2">
            <FaCheckCircle /> {operation} Successful
          </div>
          {result.results && result.results.length > 0 && (
            <div className="text-xs mt-1 opacity-80">
              {result.results.slice(0, 2).join(', ')}...
            </div>
          )}
        </div>,
        { duration: 4000 }
      );
    } else {
      toast.error(
        <div>
          <div className="flex items-center gap-2">
            <FaExclamationTriangle /> {operation} Failed
          </div>
          <div className="text-xs mt-1 opacity-80">
            {result.error || result.message}
          </div>
        </div>,
        { duration: 6000 }
      );
    }
  };

  // Database Setup - Schema migration
  const handleSetupDatabase = async () => {
    setSetupDb({ isRunning: true, result: null });
    try {
      const response = await fetch("/api/admin/migrate", {
        method: "POST",
      });

      const result: MigrationResult = await response.json();
      setSetupDb({ isRunning: false, result });
      showToast(result, 'Database Setup');
    } catch (error: any) {
      const result = { success: false, message: 'Network error', error: error.message };
      setSetupDb({ isRunning: false, result });
      showToast(result, 'Database Setup');
    }
  };

  // Test Data Injection
  const handleInjectTestData = async () => {
    setTestData({ isRunning: true, result: null });
    try {
      const response = await fetch("/api/admin/migrate/test-data", {
        method: "POST",
      });

      const result: MigrationResult = await response.json();
      setTestData({ isRunning: false, result });
      showToast(result, 'Test Data Injection');
    } catch (error: any) {
      const result = { success: false, message: 'Network error', error: error.message };
      setTestData({ isRunning: false, result });
      showToast(result, 'Test Data Injection');
    }
  };

  // Clean Test Data (keep admin user)
  const handleCleanTestData = async () => {
    if (!confirm('Are you sure you want to clean all test data? This will remove all data except the admin user.')) {
      return;
    }
    
    setCleanup({ isRunning: true, result: null });
    try {
      const response = await fetch("/api/admin/migrate/cleanup", {
        method: "POST",
      });

      const result: MigrationResult = await response.json();
      setCleanup({ isRunning: false, result });
      showToast(result, 'Database Cleanup');
    } catch (error: any) {
      const result = { success: false, message: 'Network error', error: error.message };
      setCleanup({ isRunning: false, result });
      showToast(result, 'Database Cleanup');
    }
  };

  // Check Database Status
  const handleCheckStatus = async () => {
    setStatus({ isRunning: true, result: null });
    try {
      const response = await fetch("/api/admin/migrate/status", {
        method: "GET",
      });

      const result: MigrationResult = await response.json();
      setStatus({ isRunning: false, result });
      
      toast(
        <div>
          <div className="flex items-center gap-2">
            <FaInfoCircle /> Database Status
          </div>
          <div className="text-xs mt-1 opacity-80">
            {result.message}
          </div>
        </div>,
        { duration: 4000 }
      );
    } catch (error: any) {
      const result = { success: false, message: 'Network error', error: error.message };
      setStatus({ isRunning: false, result });
      showToast(result, 'Status Check');
    }
  };

const OperationCard = ({ 
    title, 
    description, 
    icon, 
    state, 
    onAction, 
    actionText, 
    variant = 'default',
    stats
  }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    state: OperationState;
    onAction: () => void;
    actionText: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    stats?: { label: string; value: string | number; color: string }[];
  }) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'success': return 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200';
        case 'warning': return 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-100 hover:from-yellow-100 hover:to-orange-200';
        case 'danger': return 'border-red-200 bg-gradient-to-br from-red-50 to-pink-100 hover:from-red-100 hover:to-pink-200';
        default: return 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200';
      }
    };

    const getButtonClasses = () => {
      switch (variant) {
        case 'success': return 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-200';
        case 'warning': return 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 shadow-lg shadow-yellow-200';
        case 'danger': return 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg shadow-red-200';
        default: return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200';
      }
    };

    const getIconColor = () => {
      switch (variant) {
        case 'success': return 'text-green-600';
        case 'warning': return 'text-yellow-600';
        case 'danger': return 'text-red-600';
        default: return 'text-blue-600';
      }
    };

    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
        <div className="flex items-start gap-4">
          <div className={`text-4xl p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 ${getIconColor()}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">{description}</p>
            
            {/* Stats */}
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-300">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={onAction}
              disabled={state.isRunning}
              className={`w-full px-6 py-3 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 ${getButtonClasses()}`}
            >
              {state.isRunning ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {icon}
                  <span>{actionText}</span>
                </div>
              )}
            </button>

            {state.result && (
              <div className="mt-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className={`flex items-center gap-2 text-sm font-bold mb-2 ${
                  state.result.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {state.result.success ? (
                    <FaCheckCircle className="text-lg" />
                  ) : (
                    <FaExclamationTriangle className="text-lg" />
                  )}
                  {state.result.message}
                </div>
                
                {state.result.results && state.result.results.length > 0 && (
                  <div className="mt-3">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-300 hover:text-gray-200 font-medium flex items-center gap-2">
                        <FaEye />
                        View Details ({state.result.results.length} operations)
                      </summary>
                      <div className="mt-3 max-h-40 overflow-y-auto bg-white/5 rounded-lg p-3 border border-white/10">
                        <ul className="space-y-1 text-gray-300">
                          {state.result.results.map((result, index) => (
                            <li key={index} className="flex items-start gap-2 p-1">
                              <div className="w-2 h-2 bg-sky-400 rounded-full mt-1.5 flex-shrink-0"></div>
                              <span className="text-xs">{result}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  </div>
                )}
                
                {state.result.error && (
                  <div className="mt-3 text-xs text-red-300 font-mono bg-red-500/10 p-3 rounded-lg border border-red-400/30">
                    <div className="flex items-center gap-2 mb-1 font-bold text-red-400">
                      <FaExclamationTriangle />
                      Error Details:
                    </div>
                    {state.result.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gradient-to-r from-sky-600/20 to-purple-600/20 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <FaDatabase className="text-sky-400" />
                  </div>
                  Database Migration & Management
                </h1>
                <p className="text-gray-300 leading-relaxed max-w-3xl">
                  Hantera din databas schema, injicera testdata och underhålla ditt system med kraftfulla verktyg.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <FaCog className="text-6xl text-sky-400 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
              </div>
            </div>
            
            {/* Status Bar */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-sky-400">4</div>
                <div className="text-sm text-gray-300">Available Operations</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">✓</div>
                <div className="text-sm text-gray-300">Safe to Run</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">∞</div>
                <div className="text-sm text-gray-300">Repeatable</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">⚡</div>
                <div className="text-sm text-gray-300">Fast Execution</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
        <OperationCard
          title="Setup Database"
          description="Run schema migrations, create tables, add indexes, and set up initial lesson types. This is safe to run multiple times."
          icon={<FaCog className="text-blue-600" />}
          state={setupDb}
          onAction={handleSetupDatabase}
          actionText="Run Setup"
          variant="default"
        />

        <OperationCard
          title="Inject Test Data"
          description="Add sample users, bookings, cars, and other test data to help with development and testing."
          icon={<FaSeedling className="text-green-600" />}
          state={testData}
          onAction={handleInjectTestData}
          actionText="Add Test Data"
          variant="success"
        />

        <OperationCard
          title="Clean Test Data"
          description="Remove all test data from the database while preserving the admin user account. Use this to reset to a clean state."
          icon={<FaBroom className="text-red-600" />}
          state={cleanup}
          onAction={handleCleanTestData}
          actionText="Clean Database"
          variant="danger"
        />

        <OperationCard
          title="Check Database Status"
          description="Get information about your current database state, table counts, and system health."
          icon={<FaEye className="text-yellow-600" />}
          state={status}
          onAction={handleCheckStatus}
          actionText="Check Status"
          variant="warning"
        />
      </div>

      <div className="mt-8 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
        <h3 className="text-sm font-semibold text-white mb-2">💡 Usage Tips:</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• <strong>Setup Database</strong> first to ensure all tables and schema are current</li>
          <li>• <strong>Inject Test Data</strong> for development and testing purposes</li>
          <li>• <strong>Clean Test Data</strong> when you want a fresh start (keeps admin user)</li>
          <li>• <strong>Check Status</strong> anytime to see your database health</li>
        </ul>
        </div>
        
      </div>
    </div>
  );
};

export default MigrateClient;

