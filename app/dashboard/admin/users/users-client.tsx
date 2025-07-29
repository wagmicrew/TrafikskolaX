'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  ArrowLeftCircle,
  ArrowRightCircle,
  PlusCircle,
  Trash,
  Check,
  X,
  UserCheck,
  Calendar,
} from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  isActive: boolean;
  inskriven: boolean;
  inskrivenDate: string | null;
  customPrice: string | null;
  bookingCount: number;
}

interface UserStat {
  role: 'student' | 'teacher' | 'admin';
  count: number;
}

interface UsersClientProps {
  users: User[];
  userStats: UserStat[];
  currentPage: number;
  totalPages: number;
  roleFilter: string;
  searchFilter: string;
}

export default function UsersClient({
  users,
  userStats,
  currentPage,
  totalPages,
  roleFilter,
  searchFilter,
}: UsersClientProps) {
  const [search, setSearch] = useState(searchFilter);
  const [loadingSkriv, setLoadingSkriv] = useState<string | null>(null);

  const handleSkrivIn = async (userId: string) => {
    setLoadingSkriv(userId);
    try {
      const response = await fetch('/api/admin/users/skriv-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert('Ett fel uppstod vid inskrivning');
      }
    } catch (error) {
      alert('Ett fel uppstod vid inskrivning');
    }
    setLoadingSkriv(null);
  };

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    window.location.href = `/dashboard/admin/users?role=${event.target.value}`;
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.location.href = `/dashboard/admin/users?role=${roleFilter}&search=${search}`;
  };

  const handlePageChange = (page: number) => {
    window.location.href = `/dashboard/admin/users?role=${roleFilter}&search=${search}&page=${page}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="w-8 h-8 text-blue-600" /> Användarhantering
        </h1>

        <Link
          href="/dashboard/admin/users/new"
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5" /> Lägg till Användare
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <select
          value={roleFilter}
          onChange={handleRoleChange}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alla roller</option>
          <option value="student">Student</option>
          <option value="teacher">Lärare</option>
          <option value="admin">Admin</option>
        </select>
        <form onSubmit={handleSearchSubmit} className="flex items-center">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Sök användare..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sök
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Namn</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Roll</th>
              <th className="px-4 py-2 text-left">Inskriven</th>
              <th className="px-4 py-2 text-left">Bokningar</th>
              <th className="px-4 py-2 text-left">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-2">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">
                  {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Lärare' : 'Student'}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {user.inskriven ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                    {user.role === 'student' && !user.inskriven && (
                      <button
                        onClick={() => handleSkrivIn(user.id)}
                        disabled={loadingSkriv === user.id}
                        className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        {loadingSkriv === user.id ? (
                          'Skriver in...'
                        ) : (
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Skriv In
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  {user.bookingCount > 0 ? (
                    <Link
                      href={`/dashboard/admin/bookings?user=${user.id}`}
                      className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Calendar className="w-4 h-4" />
                      {user.bookingCount}
                    </Link>
                  ) : (
                    <span className="text-gray-500">{user.bookingCount}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <Link href={`/dashboard/admin/users/${user.id}`} className="text-blue-600 hover:underline">
                    Hantera
                  </Link>

                  <button className="ml-2 text-red-600 hover:underline">
                    <Trash className="w-5 h-5 inline" /> Radera
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6">
        <div className="flex gap-2">
          <span className="text-sm">
            Visar {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalPages * 20)} av {totalPages * 20}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftCircle className="w-5 h-5" /> Föregående
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Nästa <ArrowRightCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        {userStats.map((stat) => (
          <div key={stat.role} className="flex items-center gap-2 px-4 py-3 border rounded-lg">
            <span className="text-lg font-semibold">
              {stat.role === 'admin' ? 'Admin' : stat.role === 'teacher' ? 'Lärare' : 'Studenter'}
            </span>
            <span className="text-2xl font-bold text-blue-600">{stat.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

