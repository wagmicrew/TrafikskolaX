"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import fetcher from '@/lib/fetcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { OrbSpinner } from '@/components/ui/orb-loader';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';

type LessonType = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: string; // stored as string in API/DB
  priceStudent?: string | null;
  salePrice?: string | null;
  isActive: boolean;
};

const LessonManagement = () => {
  const { user } = useAuth();
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessonTypes = async () => {
      setLoading(true);
      try {
        const response = await fetcher('/api/admin/lesson-types', {
          // Cookies carry auth (HTTP-only). Include credentials for safety.
          credentials: 'include',
        });
        setLessonTypes((response as LessonType[]) || []);
      } catch (error) {
        console.error('Failed to fetch lesson types', error);
      } finally {
         setLoading(false);
      }
    };
    if (user && user.role === 'admin') {
      fetchLessonTypes();
    }
  }, [user]);

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await fetcher(`/api/admin/lesson-types/${lessonId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setLessonTypes(prev => prev.filter((lt) => lt.id !== lessonId));
    } catch (error) {
      console.error('Error deleting lesson type', error);
    }
  };

  const handleEditLesson = (lesson: LessonType) => {
    // Logic to populate form with existing lesson data
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <OrbSpinner size="md" />
    </div>
  );

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-tight">Lektionshantering</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Edit Lesson Dialog with glassmorphism */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm">Lägg till/Redigera lektion</Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[600px] p-0 overflow-hidden border-0 bg-transparent shadow-none">
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl h-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 rounded-xl sm:rounded-2xl"></div>
              <div className="relative z-10 p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-white font-bold drop-shadow-lg">Redigera lektionstyp</DialogTitle>
                  <DialogDescription className="text-white/80 drop-shadow-sm">
                    Gör ändringar i lektionstypen här. Klicka spara när du är klar.
                  </DialogDescription>
                </DialogHeader>
            {/* Form fields for editing */}
            <form id="edit-lesson-form" className="space-y-4">
              {/* TODO: Add form fields */}
            </form>
                <DialogFooter className="gap-2">
                  <Button type="submit" form="edit-lesson-form" variant="primary">Spara</Button>
                  <DialogClose asChild>
                    <Button variant="outline">Avbryt</Button>
                  </DialogClose>
                </DialogFooter>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Namn</TableHead>
              <TableHead>Pris</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Aktiv</TableHead>
              <TableHead>Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessonTypes.map((lesson: LessonType) => (
              <TableRow key={lesson.id}>
                <TableCell className="font-medium">{lesson.name}</TableCell>
                <TableCell>{lesson.price}</TableCell>
                <TableCell>{lesson.durationMinutes} min</TableCell>
                <TableCell>{lesson.isActive ? 'Ja' : 'Nej'}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditLesson(lesson)}>Redigera</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteLesson(lesson.id)}>Ta bort</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default LessonManagement;

