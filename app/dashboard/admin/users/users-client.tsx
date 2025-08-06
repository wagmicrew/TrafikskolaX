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
  CreditCard,
  AlertTriangle,
  FileText,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [exportPdf, setExportPdf] = useState(true);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exportPdf }),
      });

      if (response.ok) {
        const result = await response.json();
        const message = result.pdfGenerated 
          ? `Användare raderad framgångsrikt. PDF export skapad: ${result.pdfFileName}`
          : 'Användare raderad framgångsrikt. PDF export misslyckades men användaren raderades.';
        alert(message);
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Fel vid radering: ${error.error}`);
      }
    } catch (error) {
      alert('Ett fel uppstod vid radering av användare');
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
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
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/admin/users/${user.id}`} className="text-blue-600 hover:underline">
                      Hantera
                    </Link>
                    
                    <button 
                      onClick={() => handleDeleteClick(user)}
                      className="text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Trash className="w-4 h-4" /> Radera
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold">Bekräfta radering</h3>
            </div>
            
            <p className="text-gray-700 mb-4">
              Vill du verkligen radera användaren <strong>{userToDelete.firstName} {userToDelete.lastName}</strong> och alla bokningar/feedback?
            </p>
            
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={exportPdf}
                  onChange={(e) => setExportPdf(e.target.checked)}
                  className="rounded"
                />
                <FileText className="w-4 h-4" />
                Exportera en sammanfattning till PDF åt kunden innan du raderar
              </label>
              <p className="text-xs text-gray-500 mt-1">
                (Detta kommer att kompilera all användardata, alla bokningar och bokningsrecensioner till en PDF med student-ID som PDF-namn och sparas på datorn)
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Raderar...
                  </>
                ) : (
                  <>
                    <Trash className="w-4 h-4" />
                    Radera
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

