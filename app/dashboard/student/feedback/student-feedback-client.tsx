"use client";

import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaSadTear, FaSmileBeam, FaComments } from 'react-icons/fa';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex items-center justify-center">
        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6">Ingen feedback att visa.</div>
      </div>
    );
  }

  const toggleExpand = (bookingId: string): void => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  const getValuationColor = (valuation: number): string => {
    if (valuation <= 3) return 'text-red-500';
    if (valuation <= 7) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getValuationText = (valuation: number): string => {
    if (valuation <= 3) return 'Behöver övning';
    if (valuation <= 7) return 'Godkänd';
    return 'Utmärkt';
  };

  const needsAttention = feedback.filter(f => f.feedback?.some(item => item.valuation <= 3));
  const lookingGood = feedback.filter(f => f.feedback?.some(item => item.valuation > 7));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6">
      <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white shadow-2xl mb-8">
        <h1 className="text-2xl font-extrabold">Din feedback</h1>
        <p className="text-slate-300 mt-1">Här kan du se detaljerad feedback från dina lärare.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white">
          <div className="flex items-center">
            <FaComments className="text-2xl text-sky-300" />
            <div className="ml-4">
              <p className="text-sm text-slate-300">Lektioner med feedback</p>
              <p className="text-2xl font-extrabold">{total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white">
          <div className="flex items-center">
            <FaSadTear className="text-2xl text-rose-300" />
            <div className="ml-4">
              <p className="text-sm text-slate-300">Behöver övning</p>
              <p className="text-2xl font-extrabold">{needsAttention.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white">
          <div className="flex items-center">
            <FaSmileBeam className="text-2xl text-emerald-300" />
            <div className="ml-4">
              <p className="text-sm text-slate-300">Utmärkt</p>
              <p className="text-2xl font-extrabold">{lookingGood.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white shadow-2xl">
        <h2 className="text-xl font-extrabold mb-4">Feedback per lektion</h2>
        <div className="space-y-4">
          {feedback.map((fb: FeedbackEntry) => (
            <div key={fb.id} className="rounded-xl border border-white/10 bg-white/5">
              <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/10 rounded-xl"
                onClick={() => toggleExpand(fb.bookingId)}
              >
                <div>
                  <p className="font-semibold text-white">{fb.lessonTypeName}</p>
                  <p className="text-sm text-slate-300">{new Date(fb.scheduledDate).toLocaleDateString('sv-SE')}</p>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-slate-300 mr-4">{fb.feedback?.length || 0} feedbackpunkter</p>
                  {expandedBooking === fb.bookingId ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </div>
              {expandedBooking === fb.bookingId && (
                <div className="p-4 border-t border-white/10">
                  <div className="space-y-3">
                    {fb.feedback?.map((item: FeedbackItem) => (
                      <div key={item.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white">{item.stepIdentifier}</p>
                          <div className={`flex items-center font-semibold ${getValuationColor(item.valuation)}`}>
                            {getValuationText(item.valuation)}
                            <div className="w-20 h-2 bg-white/10 rounded-full ml-4">
                              <div 
                                className={`h-2 rounded-full ${getValuationColor(item.valuation).replace('text-', 'bg-')}`}
                                style={{ width: `${item.valuation * 10}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-slate-200 mt-2">{item.feedbackText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {feedback.length === 0 && (
          <div className="text-center py-8 text-slate-300">
            <p>Ingen feedback ännu. Kom tillbaka efter din nästa lektion!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeedbackClient;

