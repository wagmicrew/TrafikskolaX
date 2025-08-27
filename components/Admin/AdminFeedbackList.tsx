"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Edit, Trash2, Star, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface FeedbackItem {
  id: string;
  stepIdentifier: string;
  feedbackText: string;
  rating: number | null;
  valuation: number;
  isFromTeacher: boolean;
  createdAt: string;
  stepName?: string;
  stepCategory?: string;
}

interface AdminFeedbackListProps {
  bookingId: string;
  feedback: FeedbackItem[];
  onRefresh: () => void;
  onEdit: (feedback: FeedbackItem) => void;
}

const AdminFeedbackList: React.FC<AdminFeedbackListProps> = ({
  bookingId,
  feedback,
  onRefresh,
  onEdit
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (feedbackId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna feedback?')) {
      return;
    }

    setDeletingId(feedbackId);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/feedback/${feedbackId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete feedback');
      }

      toast.success('Feedback borttagen!');
      onRefresh();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error(error instanceof Error ? error.message : 'Ett fel uppstod');
    } finally {
      setDeletingId(null);
    }
  };

  const getValuationColor = (valuation: number) => {
    if (valuation <= 3) return 'text-red-600 bg-red-100';
    if (valuation <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getValuationText = (valuation: number) => {
    if (valuation <= 3) return 'Behöver övning';
    if (valuation <= 7) return 'Godkänd';
    return 'Utmärkt';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!feedback || feedback.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ingen feedback än
            </h3>
            <p className="text-gray-500">
              Lägg till feedback för denna bokning genom att använda formuläret ovan.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Befintlig Feedback ({feedback.length})
      </h3>

      {feedback.map((item) => (
        <Card key={item.id} className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{item.stepName || item.stepIdentifier}</span>
                  {item.stepCategory && (
                    <Badge variant="outline" className="text-xs">
                      {item.stepCategory}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(item.createdAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {item.isFromTeacher ? 'Lärare' : 'Admin'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Valuation Badge */}
                <Badge className={`${getValuationColor(item.valuation)} border-0`}>
                  <Star className="w-3 h-3 mr-1" />
                  {item.valuation}/10
                </Badge>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(item)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {/* Valuation Description */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Betyg:</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${getValuationColor(item.valuation)}`}>
                  {getValuationText(item.valuation)}
                </span>
              </div>

              {/* Feedback Text */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback:</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {item.feedbackText}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminFeedbackList;
