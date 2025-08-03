'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { DeleteLessonDialog } from '@/components/admin/delete-lesson-dialog';

interface LessonType {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EditLessonClientProps {
  lesson: LessonType;
}

export default function EditLessonClient({ lesson }: EditLessonClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: lesson.name,
    description: lesson.description || '',
    durationMinutes: lesson.durationMinutes,
    price: parseFloat(lesson.price),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard/admin/lessons');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update lesson');
      }
    } catch (error) {
      console.error('Error updating lesson:', error);
      alert('Failed to update lesson');
    } finally {
      setLoading(false);
    }
  };

const handleDelete = async () => {
    if (confirm('Det finns bokningar kopplade till denna lektionskategori. Vill du avboka dessa och radera kategorin?')) {
      setLoading(true);
      try {
        // Unbook all related bookings and issue credits
        const unbookResponse = await fetch(`/api/admin/unbook/${lesson.id}`, {
          method: 'POST',
        });

        if (!unbookResponse.ok) {
          throw new Error('Failed to cancel bookings');
        }

        // Delete lesson type
        const response = await fetch(`/api/admin/lessons/${lesson.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Lektionskategorin har raderats och krediter har återställts', {
            icon: <AlertTriangle className="text-white" />,
            style: {
              background: 'linear-gradient(to right, #35a02c, #6ce644)',
              color: '#fff',
              boxShadow: '0 4px 6px #0004',
            },
          });
          router.push('/dashboard/admin/lessons');
          router.refresh();
        } else {
          throw new Error('Failed to delete lesson');
        }
      } catch (error) {
        console.error('Error handling delete:', error);
        toast.error('Ett fel uppstod. Försök igen.', {
          icon: <AlertTriangle className="text-white" />,
          style: {
            background: 'linear-gradient(to right, #f13b3b, #f74444)',
            color: '#fff',
            boxShadow: '0 4px 6px #0004',
          },
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/admin/lessons"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lessons
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Lesson Type</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                  required
                  disabled={loading}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="price">Price (SEK)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  required
                  disabled={loading}
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete Lesson
              </Button>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/admin/lessons')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
