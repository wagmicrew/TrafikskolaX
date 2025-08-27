"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Send, Edit, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingStep {
  identifier: string;
  name: string;
  category: string;
}

interface FeedbackFormProps {
  bookingId: string;
  steps: BookingStep[];
  onSuccess: () => void;
  onCancel?: () => void;
  existingFeedback?: {
    id: string;
    stepIdentifier: string;
    feedbackText: string;
    valuation: number;
  };
}

const AdminFeedbackForm: React.FC<FeedbackFormProps> = ({
  bookingId,
  steps,
  onSuccess,
  onCancel,
  existingFeedback
}) => {
  const [selectedStep, setSelectedStep] = useState(existingFeedback?.stepIdentifier || '');
  const [feedbackText, setFeedbackText] = useState(existingFeedback?.feedbackText || '');
  const [valuation, setValuation] = useState(existingFeedback?.valuation || 5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!!existingFeedback);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStep || !feedbackText.trim()) {
      toast.error('Vänligen fyll i alla obligatoriska fält');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing && existingFeedback
        ? `/api/admin/bookings/${bookingId}/feedback/${existingFeedback.id}`
        : `/api/admin/bookings/${bookingId}/feedback`;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepIdentifier: selectedStep,
          feedbackText: feedbackText.trim(),
          valuation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save feedback');
      }

      toast.success(isEditing ? 'Feedback uppdaterad!' : 'Feedback sparad!');
      onSuccess();
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error(error instanceof Error ? error.message : 'Ett fel uppstod');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset form
      setSelectedStep('');
      setFeedbackText('');
      setValuation(5);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Edit className="w-5 h-5 text-blue-600" />
              Redigera Feedback
            </>
          ) : (
            <>
              <Send className="w-5 h-5 text-green-600" />
              Lägg till Feedback
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step Selection */}
          <div className="space-y-2">
            <Label htmlFor="step-select">Välj lektionssteg *</Label>
            <Select value={selectedStep} onValueChange={setSelectedStep} disabled={isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Välj ett steg" />
              </SelectTrigger>
              <SelectContent>
                {steps.map((step) => (
                  <SelectItem key={step.identifier} value={step.identifier}>
                    <div className="flex flex-col">
                      <span className="font-medium">{step.name}</span>
                      <span className="text-xs text-gray-500">{step.category}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valuation Component */}
          <div className="space-y-2">
            <Label>Betyg (1-10) *</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setValuation(rating)}
                    className={`w-8 h-8 rounded-full border-2 transition-colors ${
                      valuation >= rating
                        ? 'bg-yellow-400 border-yellow-400 text-white'
                        : 'bg-gray-200 border-gray-300 text-gray-600 hover:bg-yellow-200'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {valuation <= 3 ? 'Behöver övning' :
                 valuation <= 7 ? 'Godkänd' : 'Utmärkt'}
              </span>
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <Label htmlFor="feedback-text">Feedback text *</Label>
            <Textarea
              id="feedback-text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Skriv din feedback här..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Beskriv vad eleven gjort bra och vad som kan förbättras.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                'Sparar...'
              ) : isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Uppdatera Feedback
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Spara Feedback
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Avbryt
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminFeedbackForm;
