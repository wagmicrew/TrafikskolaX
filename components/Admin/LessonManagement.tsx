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

const LessonManagement = () => {
  const { user, token } = useAuth();
  const [lessonTypes, setLessonTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessonTypes = async () => {
      setLoading(true);
      try {
        const response = await fetcher('/api/admin/lesson-types', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLessonTypes(response || []);
      } catch (error) {
        console.error('Failed to fetch lesson types', error);
      } finally {
         setLoading(false);
      }
    };
    if (user && user.role === 'admin') {
      fetchLessonTypes();
    }
  }, [user, token]);

  const handleDeleteLesson = async (lessonId) => {
    try {
      await fetcher(`/api/admin/lesson-types/${lessonId}`, {
        method: 'DELETE',
      });
      setLessonTypes(prev => prev.filter(lt => lt.id !== lessonId));
    } catch (error) {
      console.error('Error deleting lesson type', error);
    }
  };

  const handleEditLesson = lesson => {
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
          {lessonTypes.map((lesson) => (
            <tr key={lesson.id}>
              <td>{lesson.name}</td>
              <td>{lesson.price}</td>
              <td>{lesson.duration} min</td>
              <td>{lesson.active ? 'Yes' : 'No'}</td>
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

