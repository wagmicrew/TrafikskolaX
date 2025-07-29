import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

export default async function UsersPage() {
  const allUsers = await db.select().from(users).execute();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Användarhantering</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="text-left py-2 px-4">Namn</th>
              <th className="text-left py-2 px-4">Email</th>
              <th className="text-left py-2 px-4">Roll</th>
              <th className="text-left py-2 px-4">Inskriven</th>
              <th className="text-left py-2 px-4">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id}>
                <td className="border-t py-2 px-4">{user.name}</td>
                <td className="border-t py-2 px-4">{user.email}</td>
                <td className="border-t py-2 px-4">{user.role}</td>
                <td className="border-t py-2 px-4">{user.inskriven ? 'Ja' : 'Nej'}</td>
                <td className="border-t py-2 px-4">
                  <button className="text-blue-500" onClick={() => handleEdit(user)}>Redigera</button>
                  <button className="text-red-500 ml-2" onClick={() => handleDelete(user.id)}>Radera</button>
                  <button className="text-green-500 ml-2" onClick={() => toggleInskriven(user.id)}>{user.inskriven ? 'Ta bort inskriven' : 'Gör inskriven'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h2 className="text-xl mb-2">Lägg till ny användare</h2>
        {/* User form to be implemented */}
      </div>
    </div>
  );
}

function handleEdit(user) {
  // Logic to edit user
}

function handleDelete(userId) {
  // Logic to delete user
}

function toggleInskriven(userId) {
  // Logic to toggle inskriven
}
