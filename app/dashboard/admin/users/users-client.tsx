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
  Shield,
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
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

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

  const handleImpersonate = async (targetUser: User) => {
    setImpersonatingId(targetUser.id);
    try {
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        alert(data?.error || 'Kunde inte hämta användarsession');
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (data?.adminToken) {
        try { localStorage.setItem('admin-session-token', data.adminToken); } catch {}
      }
      if (data?.token) {
        try { localStorage.setItem('auth-token', data.token); } catch {}
        document.cookie = `auth-token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        try {
          const payload = JSON.parse(atob((data.token as string).split('.')[1] || ''));
          const role = payload?.role || targetUser.role;
          const href = role === 'admin' ? '/dashboard/admin' : role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
          window.location.href = href;
          return;
        } catch {
          // Fallback to targetUser.role if decoding fails
          const href = targetUser.role === 'admin' ? '/dashboard/admin' : targetUser.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
          window.location.href = href;
          return;
        }
      } else {
        // No token returned; fallback navigation based on role
        const href = targetUser.role === 'admin' ? '/dashboard/admin' : targetUser.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
        window.location.href = href;
      }
    } catch (e) {
      alert('Misslyckades att hämta användarsession');
    } finally {
      setImpersonatingId(null);
    }
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
    <div className="text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-white drop-shadow-sm">
          <User className="w-8 h-8 text-sky-300" /> Användarhantering
        </h1>

        <Link
          href="/dashboard/admin/users/new"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
        >
          <PlusCircle className="w-5 h-5" /> Lägg till Användare
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <select
          value={roleFilter}
          onChange={handleRoleChange}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
            className="px-4 py-2 rounded-l-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-r-lg bg-white/10 hover:bg白/20 border border-white/20 text-white transition-colors"
          >
            Sök
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl bg白/10 backdrop-blur-md border border-white/20">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-3 text-slate-300">Namn</th>
              <th className="px-4 py-3 text-slate-300">Email</th>
              <th className="px-4 py-3 text-slate-300">Roll</th>
              <th className="px-4 py-3 text-slate-300">Inskriven</th>
              <th className="px-4 py-3 text-slate-300">Bokningar</th>
              <th className="px-4 py-3 text-slate-300">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-4 py-3 text-slate-100">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-3 text-slate-200">{user.email}</td>
                <td className="px-4 py-3 text-slate-200">
                  {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Lärare' : 'Student'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {user.inskriven ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <X className="w-5 h-5 text-rose-400" />
                    )}
                    {user.role === 'student' && !user.inskriven && (
                      <button
                        onClick={() => handleSkrivIn(user.id)}
                        disabled={loadingSkriv === user.id}
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs rounded transition-colors disabled:opacity-50"
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
                <td className="px-4 py-3">
                  {user.bookingCount > 0 ? (
                    <Link
                      href={`/dashboard/admin/bookings?user=${user.id}`}
                      className="text-sky-300 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Calendar className="w-4 h-4" />
                      {user.bookingCount}
                    </Link>
                  ) : (
                    <span className="text-slate-400">{user.bookingCount}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/admin/users/${user.id}`} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white">
                      Hantera
                    </Link>
                    <button
                      onClick={() => handleImpersonate(user)}
                      disabled={impersonatingId === user.id}
                      className="px-3 py-1 rounded bg-amber-500/90 hover:bg-amber-500 text-black disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4 inline mr-1" /> {impersonatingId === user.id ? 'Hämtar...' : 'Gå till användarsession'}
                    </button>
                    
                    <button 
                      onClick={() => handleDeleteClick(user)}
                      className="px-3 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white"
                    >
                      <Trash className="w-4 h-4 inline mr-1" /> Radera
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog with Glassmorphism */}
      {deleteDialogOpen && userToDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">Bekräfta radering</h3>
                </div>
                <button
                  onClick={handleDeleteCancel}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-slate-300 mb-4">
                Vill du verkligen radera användaren <strong className="text-white">{userToDelete.firstName} {userToDelete.lastName}</strong> och alla bokningar/feedback?
              </p>
              
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={exportPdf}
                    onChange={(e) => setExportPdf(e.target.checked)}
                    className="rounded bg-white/5 border-white/20 text-sky-500 focus:ring-sky-500"
                  />
                  <FileText className="w-4 h-4" />
                  Exportera en sammanfattning till PDF åt kunden innan du raderar
                </label>
                <p className="text-xs text-slate-400 mt-1">
                  (Detta kommer att kompilera all användardata, alla bokningar och bokningsrecensioner till en PDF med student-ID som PDF-namn och sparas på datorn)
                </p>
              </div>
              
              {/* Footer */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="px-4 py-2 text-white border border-white/20 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <div className="flex gap-2">
          <span className="text-sm text-slate-300">
            Visar {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalPages * 20)} av {totalPages * 20}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftCircle className="w-5 h-5" /> Föregående
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Nästa <ArrowRightCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        {userStats.map((stat) => (
          <div key={stat.role} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
            <span className="text-lg font-semibold">
              {stat.role === 'admin' ? 'Admin' : stat.role === 'teacher' ? 'Lärare' : 'Studenter'}
            </span>
            <span className="text-2xl font-bold text-sky-300">{stat.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

