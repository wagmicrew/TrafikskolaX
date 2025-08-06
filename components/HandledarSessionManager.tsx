import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface HandledarSession {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  pricePerParticipant: number;
  teacherId: string;
  teacherName?: string;
  isActive: boolean;
  formattedDateTime?: string;
  spotsLeft?: number;
}

const HandledarSessionManager = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<HandledarSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<HandledarSession | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/admin/handledar-sessions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch handledar sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    // Implement session creation logic
  };

  const handleEditSession = (sessionId: string) => {
    // Implement session editing logic
  };

  const showDeleteConfirmation = (session: HandledarSession) => {
    setSessionToDelete(session);
    setDeleteError('');
  };

  const cancelDelete = () => {
    setSessionToDelete(null);
    setDeleteError('');
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete || isDeleting) return;
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      const response = await fetch(`/api/handledar-sessions/${sessionToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      
      if (response.ok) {
        toast.success('Handledar session deleted successfully');
        setSessions(sessions.filter(session => session.id !== sessionToDelete.id));
        setSessionToDelete(null);
      } else {
        const data = await response.json();
        setDeleteError(data.error || 'Failed to delete session');
        toast.error(data.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting handledar session:', error);
      setDeleteError('A technical error occurred while deleting the session');
      toast.error('A technical error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="w-full space-y-6">
      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-xl font-bold">Confirm Deletion</h3>
            </div>
            
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete the handledar session "{sessionToDelete.title}"? This action cannot be undone.
            </p>
            
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {deleteError}
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteSession}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
                {!isDeleting && <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Handledar Sessions</CardTitle>
          <CardDescription>Manage handledar sessions here</CardDescription>
        </CardHeader>
        <div className="p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{session.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{session.formattedDateTime}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {session.currentParticipants}/{session.maxParticipants} ({session.spotsLeft} Left)
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => handleEditSession(session.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="ml-4 text-red-600 hover:text-red-900"
                      onClick={() => showDeleteConfirmation(session)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4">
          <Button onClick={handleCreateSession}>Create New Session</Button>
        </div>
      </Card>
    </div>
  );
};

export default HandledarSessionManager;
