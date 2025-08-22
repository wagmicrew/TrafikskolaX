"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import fetcher from '@/lib/fetcher';
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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Lesson Management</h2>

      {/* Edit Lesson Popover */}
      <Dialog>
        <DialogTrigger asChild>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Add/Edit Lesson
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lesson Type</DialogTitle>
            <DialogDescription>
              Make changes to the lesson type here. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          {/* Form fields for editing */}
          <form id="edit-lesson-form">
            {/* Add form fields here */}
          </form>
          <DialogFooter>
            <button type="submit" form="edit-lesson-form" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Save Changes
            </button>
            <DialogClose asChild>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg">
                Cancel
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Duration</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {lessonTypes.map((lesson: LessonType) => (
            <tr key={lesson.id}>
              <td>{lesson.name}</td>
              <td>{lesson.price}</td>
              <td>{lesson.durationMinutes} min</td>
              <td>{lesson.isActive ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => handleDeleteLesson(lesson.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LessonManagement;

