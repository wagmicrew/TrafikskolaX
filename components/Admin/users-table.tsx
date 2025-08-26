'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Button,
  Badge,
  Checkbox
} from 'flowbite-react';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  XCircle
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

interface UsersTableProps {
  users: User[];
  selectedUsers: string[];
  onSelectUser: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onUserDetails: (user: User) => void;
  onImpersonate: (userId: string) => void;
  onToggleActive: (userId: string, isActive: boolean) => void;
  onSkrivIn: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export function UsersTable({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onUserDetails,
  onImpersonate,
  onToggleActive,
  onSkrivIn,
  onDeleteUser
}: UsersTableProps) {
  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  const someSelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

  return (
    <div className="overflow-x-auto">
      <Table hoverable>
        <TableHead>
          <TableRow>
            <TableHeadCell className="p-4">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </TableHeadCell>
            <TableHeadCell>Användare</TableHeadCell>
            <TableHeadCell>E-post</TableHeadCell>
            <TableHeadCell>Roll</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Bokningar</TableHeadCell>
            <TableHeadCell>Åtgärder</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody className="divide-y">
          {users.map((user) => (
            <TableRow key={user.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
              <TableCell className="p-4">
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => onSelectUser(user.id, e.target.checked)}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-sm">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    {user.customPrice && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Specialpris: {user.customPrice} kr
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-gray-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate max-w-xs">{user.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  color={
                    user.role === 'admin' ? 'failure' :
                    user.role === 'teacher' ? 'info' : 'success'
                  }
                  className="inline-block"
                >
                  {user.role === 'admin' ? 'Admin' :
                   user.role === 'teacher' ? 'Lärare' : 'Student'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge
                    color={user.isActive ? 'success' : 'failure'}
                    className="text-xs"
                  >
                    {user.isActive ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                  {user.inskriven && (
                    <Badge color="purple" className="text-xs">
                      Inskriven
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{user.bookingCount}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 flex-wrap">
                  <Button
                    size="xs"
                    color="light"
                    onClick={() => onUserDetails(user)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Visa
                  </Button>
                  <Button
                    size="xs"
                    color="light"
                    onClick={() => onImpersonate(user.id)}
                    className="flex items-center gap-1"
                  >
                    <UserIcon className="w-3 h-3" />
                    Anta
                  </Button>
                  <Button
                    size="xs"
                    color={user.isActive ? 'warning' : 'success'}
                    onClick={() => onToggleActive(user.id, user.isActive)}
                    className="flex items-center gap-1"
                  >
                    {user.isActive ? (
                      <>
                        <Ban className="w-3 h-3" />
                        Inaktivera
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Aktivera
                      </>
                    )}
                  </Button>
                  {!user.inskriven && (
                    <Button
                      size="xs"
                      color="purple"
                      onClick={() => onSkrivIn(user.id)}
                    >
                      Skriv in
                    </Button>
                  )}
                  <Button
                    size="xs"
                    color="failure"
                    onClick={() => onDeleteUser(user.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Ta bort
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
