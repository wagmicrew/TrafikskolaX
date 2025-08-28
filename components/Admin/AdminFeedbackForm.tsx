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
  id: number;
  stepNumber: number;
  category: string;
  subcategory: string;
  description?: string;
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
  const [selectedPlanningSteps, setSelectedPlanningSteps] = useState<number[]>([]);
  const [feedbackEntries, setFeedbackEntries] = useState<{
    [stepNumber: number]: {
      feedbackText: string;
      valuation: number;
      id?: string;
    }
  }>({});
  const [freeFeedbackText, setFreeFeedbackText] = useState('');
  const [freeFeedbackValuation, setFreeFeedbackValuation] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!!existingFeedback);
  const [loading, setLoading] = useState(true);

  // Load planning steps and existing feedback on mount
  React.useEffect(() => {
    loadPlanningSteps();
    loadExistingFeedback();
  }, [bookingId]);

  const loadPlanningSteps = async () => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/plan`);
      if (response.ok) {
        const data = await response.json();
        const selectedSteps = data.planned || [];
        setSelectedPlanningSteps(selectedSteps.map((s: string) => parseInt(s)));
      }
    } catch (error) {
      console.error('Error loading planning steps:', error);
    }
  };

  const loadExistingFeedback = async () => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/feedback`);
      if (response.ok) {
        const data = await response.json();
        const feedbackData: { [stepNumber: number]: { feedbackText: string; valuation: number; id?: string } } = {};

        data.feedback?.forEach((item: any) => {
          const stepNumber = parseInt(item.stepIdentifier);
          if (!isNaN(stepNumber)) {
            feedbackData[stepNumber] = {
              feedbackText: item.feedbackText || '',
              valuation: item.valuation || 5,
              id: item.id
            };
          }
        });

        setFeedbackEntries(feedbackData);
      }
    } catch (error) {
      console.error('Error loading existing feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackChange = (stepNumber: number, field: 'feedbackText' | 'valuation', value: string | number) => {
    setFeedbackEntries(prev => ({
      ...prev,
      [stepNumber]: {
        ...prev[stepNumber],
        [field]: value,
        id: prev[stepNumber]?.id
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if at least one feedback entry has content
    const hasContent = Object.values(feedbackEntries).some(entry => entry.feedbackText.trim()) ||
                      freeFeedbackText.trim();

    if (!hasContent) {
      toast.error('Vänligen fyll i minst en feedback-ruta');
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackPromises: Promise<any>[] = [];

      // Save feedback for selected planning steps
      Object.entries(feedbackEntries).forEach(([stepNumber, entry]) => {
        if (entry.feedbackText.trim()) {
          const url = entry.id
            ? `/api/admin/bookings/${bookingId}/feedback/${entry.id}`
            : `/api/admin/bookings/${bookingId}/feedback`;

          feedbackPromises.push(
            fetch(url, {
              method: entry.id ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                stepIdentifier: stepNumber.toString(),
                feedbackText: entry.feedbackText.trim(),
                valuation: entry.valuation,
              }),
            })
          );
        }
      });

      // Save free feedback if provided
      if (freeFeedbackText.trim()) {
        feedbackPromises.push(
          fetch(`/api/admin/bookings/${bookingId}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stepIdentifier: 'free',
              feedbackText: freeFeedbackText.trim(),
              valuation: freeFeedbackValuation,
            }),
          })
        );
      }

      const results = await Promise.allSettled(feedbackPromises);
      const failures = results.filter(result => result.status === 'rejected');

      if (failures.length > 0) {
        throw new Error('Some feedback could not be saved');
      }

      toast.success('Feedback sparad!');
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
      setFeedbackEntries({});
      setFreeFeedbackText('');
      setFreeFeedbackValuation(5);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Laddar feedback-formulär...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get selected planning steps with their details
  const selectedStepsDetails = selectedPlanningSteps
    .map(stepNumber => steps.find(step => step.stepNumber === stepNumber))
    .filter(Boolean);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-green-600" />
          Lektionsfeedback
        </CardTitle>
        <p className="text-sm text-gray-600">
          Ge feedback för de planerade momenten och lägg till fritt feedback om så önskas.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback boxes for selected planning steps */}
          {selectedStepsDetails.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Planerade moment</h3>
              {selectedStepsDetails.map((step) => {
                const entry = feedbackEntries[step!.stepNumber] || { feedbackText: '', valuation: 5 };
                return (
                  <div key={step!.stepNumber} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {step!.stepNumber}. {step!.subcategory}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{step!.category}</p>
                        {step!.description && (
                          <p className="text-xs text-gray-500 mt-1">{step!.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Valuation */}
                    <div className="mb-3">
                      <Label className="text-sm font-medium">Betyg (1-10)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => handleFeedbackChange(step!.stepNumber, 'valuation', rating)}
                              className={`w-6 h-6 rounded-full border-2 transition-colors text-xs ${
                                entry.valuation >= rating
                                  ? 'bg-yellow-400 border-yellow-400 text-white'
                                  : 'bg-gray-200 border-gray-300 text-gray-600 hover:bg-yellow-200'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        <span className="ml-2 text-xs text-gray-600">
                          {entry.valuation <= 3 ? 'Behöver övning' :
                           entry.valuation <= 7 ? 'Godkänd' : 'Utmärkt'}
                        </span>
                      </div>
                    </div>

                    {/* Feedback Text */}
                    <div>
                      <Label className="text-sm font-medium">Feedback (valfritt)</Label>
                      <Textarea
                        value={entry.feedbackText}
                        onChange={(e) => handleFeedbackChange(step!.stepNumber, 'feedbackText', e.target.value)}
                        placeholder="Skriv feedback för detta moment..."
                        rows={3}
                        className="resize-none mt-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Free feedback box */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Fritt feedback</h3>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="mb-3">
                <Label className="text-sm font-medium">Övergripande betyg (1-10)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFreeFeedbackValuation(rating)}
                        className={`w-6 h-6 rounded-full border-2 transition-colors text-xs ${
                          freeFeedbackValuation >= rating
                            ? 'bg-yellow-400 border-yellow-400 text-white'
                            : 'bg-gray-200 border-gray-300 text-gray-600 hover:bg-yellow-200'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <span className="ml-2 text-xs text-gray-600">
                    {freeFeedbackValuation <= 3 ? 'Behöver övning' :
                     freeFeedbackValuation <= 7 ? 'Godkänd' : 'Utmärkt'}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Allmän feedback (valfritt)</Label>
                <Textarea
                  value={freeFeedbackText}
                  onChange={(e) => setFreeFeedbackText(e.target.value)}
                  placeholder="Skriv allmän feedback om lektionen..."
                  rows={4}
                  className="resize-none mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Här kan du skriva allmänna kommentarer om lektionen som inte passar in i de specifika momenten ovan.
                </p>
              </div>
            </div>
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
