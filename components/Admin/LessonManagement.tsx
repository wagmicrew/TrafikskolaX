import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import fetcher from '@/lib/fetcher';

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
      await fetcher(`/api/admin/lesson-types?id=${lessonId}`, {
        method: 'DELETE',
      });
      setLessonTypes(prev => prev.filter(lt => lt.id !== lessonId));
    } catch (error) {
      console.error('Error deleting lesson type', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Lesson Management</h2>
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

