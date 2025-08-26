'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { OrbLoader } from '@/components/ui/orb-loader';
import {
  User as UserIcon,
  Mail,
  PlusCircle,
  Calendar,
  FileText,
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Badge, 
  Select, 
  TextInput, 
  Alert,
  Modal
} from 'flowbite-react';

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
  userStats: _userStats,
  currentPage,
  totalPages,
  roleFilter,
  searchFilter,
}: UsersClientProps) {
  const [tab, setTab] = useState<'users' | 'reports'>('users');
  const [search, setSearch] = useState(searchFilter);
  const [showImpersonationLoader, setShowImpersonationLoader] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    setSearch(searchFilter);
  }, [searchFilter]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value;
    window.location.href = `/dashboard/admin/users?role=${role}&search=${search}&page=1`;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/dashboard/admin/users?role=${roleFilter}&search=${search}&page=1`;
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userToDelete}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Användare borttagen');
        window.location.reload();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Kunde inte ta bort användaren');
      }
    } catch (error) {
      toast.error('Ett fel uppstod');
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleToggleActive = async (userId: string, isCurrentlyActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isCurrentlyActive }),
      });
      
      if (response.ok) {
        toast.success(isCurrentlyActive ? 'Användare inaktiverad' : 'Användare aktiverad');
        window.location.reload();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Kunde inte uppdatera användaren');
      }
    } catch (error) {
      toast.error('Ett fel uppstod');
    }
  };

  const handleSkrivIn = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/skriv-in`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success('Användare inskriven');
        window.location.reload();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Kunde inte skriva in användaren');
      }
    } catch (error) {
      toast.error('Ett fel uppstod');
    }
  };

  const handleImpersonate = async (userId: string) => {
    setShowImpersonationLoader(true);
    try {
      const response = await fetch('/api/admin/users/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        window.location.href = '/dashboard';
      } else {
        const data = await response.json();
        toast.error(data.error || 'Kunde inte anta identitet');
        setShowImpersonationLoader(false);
      }
    } catch (error) {
      toast.error('Ett fel uppstod');
      setShowImpersonationLoader(false);
    }
  };

  const handlePageChange = (page: number) => {
    window.location.href = `/dashboard/admin/users?role=${roleFilter}&search=${search}&page=${page}`;
  };

  return (
    <>
      <OrbLoader isVisible={showImpersonationLoader} text="Antar identitet..." />
      <div className="space-y-6">
        {/* Header Section with Flowbite Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Header Card */}
          <Card className="lg:col-span-2 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <UserIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Användarhantering
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Hantera användare och deras roller
                  </p>
                </div>
              </div>
              <Badge color="info" className="text-sm">
                {users.length} användare
              </Badge>
            </div>
          </Card>

          {/* Add User Card */}
          <Card className="shadow-lg">
            <div className="text-center">
              <Link
                href="/dashboard/admin/users/new"
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                Lägg till Användare
              </Link>
            </div>
          </Card>
        </div>

        {/* Custom Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
            <li className="mr-2">
              <button
                className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${
                  tab === 'users'
                    ? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
                onClick={() => setTab('users')}
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Användare
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${
                  tab === 'reports'
                    ? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
                onClick={() => setTab('reports')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Rapporter
              </button>
            </li>
          </ul>
        </div>

        {tab === 'users' && (
          <div className="space-y-6">
            {/* Filters Section with Flowbite Components */}
            <Card className="shadow-lg">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                  <div className="w-full sm:w-48">
                    <Select
                      value={roleFilter}
                      onChange={handleRoleChange}
                      icon={Shield}
                    >
                      <option value="">Alla roller</option>
                      <option value="student">Student</option>
                      <option value="teacher">Lärare</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </div>
                  <form onSubmit={handleSearchSubmit} className="w-full sm:w-64">
                    <TextInput
                      type="text"
                      value={search}
                      onChange={handleSearchChange}
                      placeholder="Sök användare..."
                      icon={Search}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchSubmit(e as any);
                        }
                      }}
                    />
                  </form>
                </div>
                <Button
                  size="sm"
                  color="light"
                  onClick={() => {
                    window.location.href = '/dashboard/admin/users';
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Rensa filter
                </Button>
              </div>
            </Card>

            {/* Users Grid (Cards) */}
            <Card className="shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {users.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </h3>
                          </div>
                          {user.customPrice && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Specialpris: {user.customPrice} kr</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Lärare' : 'Student'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {user.isActive ? 'Aktiv' : 'Inaktiv'}
                          </span>
                          {user.inskriven && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                              Inskriven
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{user.bookingCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="xs"
                        color="light"
                        onClick={() => {
                          setSelectedUser(user);
                          setDetailsOpen(true);
                        }}
                      >
                        Visa detaljer
                      </Button>
                      <Button size="xs" color="light" onClick={() => handleImpersonate(user.id)}>
                        Anta identitet
                      </Button>
                      <Button
                        size="xs"
                        color={user.isActive ? 'warning' : 'success'}
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                      >
                        {user.isActive ? 'Inaktivera' : 'Aktivera'}
                      </Button>
                      {!user.inskriven && (
                        <Button size="xs" color="purple" onClick={() => handleSkrivIn(user.id)}>
                          Skriv in
                        </Button>
                      )}
                      <Button size="xs" color="failure" onClick={() => handleDeleteUser(user.id)}>
                        Ta bort
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Pagination */}
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  color="light"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Föregående
                </Button>
                
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Sida {currentPage} av {totalPages}
                </span>
                
                <Button
                  size="sm"
                  color="light"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Nästa
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <Card className="shadow-lg">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Rapporter kommer snart
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Denna funktion är under utveckling.
              </p>
            </div>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bekräfta radering
                </h3>
              </div>
              <div className="p-6">
                <p className="text-base text-gray-500 dark:text-gray-300 mb-4">
                  Är du säker på att du vill ta bort denna användare? Denna åtgärd kan inte ångras.
                </p>
                <Alert color="failure">
                  <span className="font-medium">Varning!</span> Alla bokningar och data för denna användare kommer att tas bort permanent.
                </Alert>
              </div>
              <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 gap-2">
                <Button
                  color="gray"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Avbryt
                </Button>
                <Button
                  color="failure"
                  onClick={confirmDeleteUser}
                >
                  Ta bort användare
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        <Modal show={detailsOpen} onClose={() => setDetailsOpen(false)} size="lg">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {selectedUser ? (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-md">
                  <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    selectedUser.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                    selectedUser.role === 'teacher' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {selectedUser.role === 'admin' ? 'Admin' : selectedUser.role === 'teacher' ? 'Lärare' : 'Student'}
                  </span>
                </div>
              </div>
            ) : (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Användardetaljer</h3>
            )}
          </div>
          {/* Body */}
          <div className="p-6">
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">E-post</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bokningar</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.bookingCount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      selectedUser.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {selectedUser.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Inskriven</p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      selectedUser.inskriven ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {selectedUser.inskriven ? 'Ja' : 'Nej'}
                    </span>
                  </div>
                </div>
                {selectedUser.inskrivenDate && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Inskriven datum</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{new Date(selectedUser.inskrivenDate).toLocaleDateString('sv-SE')}</p>
                  </div>
                )}
                {selectedUser.customPrice && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Specialpris</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.customPrice} kr</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 justify-between items-center">
            {selectedUser && (
              <>
                <div className="flex gap-2">
                  <Button size="sm" color="light" onClick={() => window.open(`/dashboard/admin/users/${selectedUser.id}`, '_blank')}>
                    Öppna profilsida
                  </Button>
                  <Button size="sm" color="light" onClick={() => handleImpersonate(selectedUser.id)}>
                    Anta identitet
                  </Button>
                </div>
                <div className="flex gap-2">
                  {!selectedUser.inskriven && (
                    <Button size="sm" color="purple" onClick={() => handleSkrivIn(selectedUser.id)}>
                      Skriv in
                    </Button>
                  )}
                  <Button
                    size="sm"
                    color={selectedUser.isActive ? 'warning' : 'success'}
                    onClick={() => handleToggleActive(selectedUser.id, selectedUser.isActive)}
                  >
                    {selectedUser.isActive ? 'Inaktivera' : 'Aktivera'}
                  </Button>
                  <Button size="sm" color="gray" onClick={() => setDetailsOpen(false)}>
                    Stäng
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </>
  );
}