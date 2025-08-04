import { requireAuth } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import LogsClient from './logs-client';

export default async function AdminLogsPage() {
  const authResult = await requireAuth('admin');
  
  if (!authResult.success || !authResult.user) {
    redirect('/');
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Logs</h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage application logs for debugging and analysis
        </p>
      </div>
      
      <LogsClient />
    </div>
  );
}
