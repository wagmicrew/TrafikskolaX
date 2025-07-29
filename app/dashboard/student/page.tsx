import { requireAuth } from '@/lib/auth/server-auth';
import Link from 'next/link';

export default async function StudentDashboard() {
  const user = await requireAuth('student');

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Elev Dashboard</h1>
      <p className="text-lg">Välkommen, {user.firstName} {user.lastName}!</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Mina bokningar</h2>
          <p className="text-gray-600 mb-4">Se och hantera dina körlektioner</p>
          <Link href="/boka-korning" className="text-blue-600 hover:underline">
            Boka ny lektion →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Min profil</h2>
          <p className="text-gray-600">Uppdatera dina uppgifter</p>
        </div>
      </div>
    </div>
  );
}
