import { requireAuth } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import LogsClient from './logs-client';

export default async function AdminLogsPage() {
  const authResult = await requireAuth('admin');
  
  if (!authResult.success || !authResult.user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="mb-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-sky-600/20 to-purple-600/20 border-b border-white/10">
            <h1 className="text-2xl font-bold text-white">System Logs</h1>
            <p className="text-gray-300 mt-1">
              Övervaka och hantera applikationsloggar för debugging och analys
            </p>
          </div>
        </div>
      </div>
      
      <LogsClient />
    </div>
  );
}
