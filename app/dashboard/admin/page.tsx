import { requireAuth } from '@/lib/auth/server-auth';

export default async function AdminDashboard() {
  const user = await requireAuth('admin');

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-lg">Välkommen, {user.firstName} {user.lastName}!</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Bokningar</h2>
          <p className="text-gray-600">Hantera alla bokningar</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Användare</h2>
          <p className="text-gray-600">Hantera elever och lärare</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Rapporter</h2>
          <p className="text-gray-600">Visa statistik och rapporter</p>
        </div>
      </div>
    </div>
  );
}

