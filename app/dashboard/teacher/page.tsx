import { requireAuth } from '@/lib/auth/server-auth';

export default async function TeacherDashboard() {
  const user = await requireAuth('teacher');

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Lärare Dashboard</h1>
      <p className="text-lg">Välkommen, {user.firstName} {user.lastName}!</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Mina lektioner</h2>
          <p className="text-gray-600">Se dina schemalagda körlektioner</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Elevfeedback</h2>
          <p className="text-gray-600">Ge feedback till dina elever</p>
        </div>
      </div>
    </div>
  );
}
