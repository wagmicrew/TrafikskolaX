"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from 'flowbite-react';

// TypeScript interfaces
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface FeedbackItem {
  id: string;
  stepIdentifier: string;
  valuation: number;
  feedbackText: string;
}

interface FeedbackEntry {
  id: string;
  bookingId: string;
  lessonTypeName: string;
  scheduledDate: string;
  feedback: FeedbackItem[];
}

interface StudentFeedbackClientProps {
  user: User;
  feedback: FeedbackEntry[];
  total: number;
}

// Glassmorphism styled student feedback page

const StudentFeedbackClient: React.FC<StudentFeedbackClientProps> = ({ user, feedback, total }) => {
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  if (!feedback) {
    return (
      <div className="text-center py-12">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-8">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingen feedback att visa</h3>
            <p className="text-gray-600">Du har ännu inte fått någon feedback från dina lärare.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleExpand = (bookingId: string): void => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  const getValuationColor = (valuation: number): string => {
    if (valuation <= 3) return 'failure';
    if (valuation <= 7) return 'warning';
    return 'success';
  };

  const getValuationText = (valuation: number): string => {
    if (valuation <= 3) return 'Behöver övning';
    if (valuation <= 7) return 'Godkänd';
    return 'Utmärkt';
  };

  const needsAttention = feedback.filter(f => f.feedback?.some(item => item.valuation <= 3));
  const lookingGood = feedback.filter(f => f.feedback?.some(item => item.valuation > 7));

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Din lärarfeedback</h1>
              <p className="text-gray-600 mt-1">Här kan du se detaljerad feedback från dina lärare.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="text-2xl text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Lektioner med feedback</p>
                <p className="text-3xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="text-2xl text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Behöver övning</p>
                <p className="text-3xl font-bold text-gray-900">{needsAttention.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="text-2xl text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Utmärkt</p>
                <p className="text-3xl font-bold text-gray-900">{lookingGood.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Feedback per lektion</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {feedback.map((fb: FeedbackEntry) => (
              <div key={fb.id} className="border-b border-gray-100 last:border-b-0">
                <div
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(fb.bookingId)}
                >
                  <div>
                    <p className="font-semibold text-gray-900">{fb.lessonTypeName}</p>
                    <p className="text-sm text-gray-600">{new Date(fb.scheduledDate).toLocaleDateString('sv-SE')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color="gray" size="sm">
                      {fb.feedback?.length || 0} feedbackpunkter
                    </Badge>
                    {expandedBooking === fb.bookingId ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {expandedBooking === fb.bookingId && (
                  <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                    <div className="py-3 space-y-3">
                      {fb.feedback?.map((item: FeedbackItem) => (
                        <Card key={item.id} className="bg-white border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-semibold text-gray-900">{item.stepIdentifier}</p>
                              <Badge color={getValuationColor(item.valuation)} className="font-semibold">
                                {getValuationText(item.valuation)} ({item.valuation}/10)
                              </Badge>
                            </div>

                            {item.feedbackText && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-700">{item.feedbackText}</p>
                              </div>
                            )}

                            {/* Progress bar for valuation */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Prestationsnivå</span>
                                <span>{item.valuation}/10</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    item.valuation <= 3 ? 'bg-red-500' :
                                    item.valuation <= 7 ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${item.valuation * 10}%` }}
                                ></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {feedback.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingen feedback ännu</h3>
              <p className="text-gray-600">Kom tillbaka efter din nästa lektion för att se lärarens feedback!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFeedbackClient;

