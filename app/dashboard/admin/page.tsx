import { requireAuth } from '@/lib/auth/server-auth';

export default async function AdminDashboard() {
  const user = await requireAuth('admin');

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-lg">Välkommen, {user.firstName} {user.lastName}!</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-400 to-blue-500 p-6 rounded-lg shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-2">Bokningar</h2>
          <p className="text-gray-100">Hantera alla bokningar</p>
          <button className="mt-4 bg-white text-green-700 py-2 px-4 rounded">Öppna</button>
        </div>

        <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-6 rounded-lg shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-2">Användare</h2>
          <p className="text-gray-100">Hantera elever och lärare</p>
          <button className="mt-4 bg-white text-purple-700 py-2 px-4 rounded">Öppna</button>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-red-500 p-6 rounded-lg shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-2">Lektioner & Paket</h2>
          <p className="text-gray-100">Hantera lektionspaket</p>
          <button className="mt-4 bg-white text-yellow-700 py-2 px-4 rounded">Öppna</button>
        </div>

        <div className="bg-gradient-to-r from-teal-400 to-indigo-500 p-6 rounded-lg shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-2">Inställningar</h2>
          <p className="text-gray-100">Konfigurera systemet</p>
          <button className="mt-4 bg-white text-teal-700 py-2 px-4 rounded">Öppna</button>
        </div>
      </div>
    </div>
  );
}

