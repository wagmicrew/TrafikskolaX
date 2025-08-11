import { requireAuth } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import StudentHeader from '../StudentHeader'
import { FaEnvelope } from 'react-icons/fa'
import MessagesClient from './messages-client'

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const user = await requireAuth(['student']);
  if (!user) redirect('/');
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="px-6 pt-8">
        <StudentHeader title="Meddelanden" icon={<FaEnvelope className="text-purple-300" />} />
      </div>
      <div className="container mx-auto px-6 py-6">
        <MessagesClient />
      </div>
    </div>
  )
}
