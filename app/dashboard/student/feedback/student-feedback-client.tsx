'use client';

import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaStar, FaSadTear, FaSmileBeam, FaComments } from 'react-icons/fa';

const StudentFeedbackClient = ({ user, feedback, total }) => {
  const [expandedBooking, setExpandedBooking] = useState(null);

  if (!feedback) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Ingen feedback att visa.</p>
      </div>
    );
  }

  const toggleExpand = (bookingId) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  const getValuationColor = (valuation) => {
    if (valuation <= 3) return 'text-red-500';
    if (valuation <= 7) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getValuationText = (valuation) => {
    if (valuation <= 3) return 'Behöver övning';
    if (valuation <= 7) return 'Godkänd';
    return 'Utmärkt';
  };

  const needsAttention = feedback.filter(f => f.feedback?.some(item => item.valuation <= 3));
  const lookingGood = feedback.filter(f => f.feedback?.some(item => item.valuation > 7));

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Din Feedback</h1>
        <p className="text-gray-600 mt-2">Här kan du se detaljerad feedback från dina lärare på dina körlektioner.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <FaComments className="text-3xl text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totala Lektioner med Feedback</p>
              <p className="text-2xl font-bold text-gray-800">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <FaSadTear className="text-3xl text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Behöver Övning</p>
              <p className="text-2xl font-bold text-gray-800">{needsAttention.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <FaSmileBeam className="text-3xl text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Utmärkt</p>
              <p className="text-2xl font-bold text-gray-800">{lookingGood.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Feedback per Lektion</h2>
        <div className="space-y-4">
          {feedback.map(fb => (
            <div key={fb.id} className="border border-gray-200 rounded-lg">
              <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                onClick={() => toggleExpand(fb.bookingId)}
              >
                <div>
                  <p className="font-semibold text-gray-800">{fb.lessonTypeName}</p>
                  <p className="text-sm text-gray-600">{new Date(fb.scheduledDate).toLocaleDateString('sv-SE')}</p>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray-600 mr-4">{fb.feedback?.length || 0} feedbackpunkter</p>
                  {expandedBooking === fb.bookingId ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </div>
              {expandedBooking === fb.bookingId && (
                <div className="p-4 border-t border-gray-200">
                  <div className="space-y-4">
                    {fb.feedback?.map(item => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-800">{item.stepIdentifier}</p>
                          <div className={`flex items-center font-semibold ${getValuationColor(item.valuation)}`}>
                            {getValuationText(item.valuation)}
                            <div className="w-20 h-2 bg-gray-200 rounded-full ml-4">
                              <div 
                                className={`h-2 rounded-full ${getValuationColor(item.valuation).replace('text-', 'bg-')}`}
                                style={{ width: `${item.valuation * 10}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{item.feedbackText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {feedback.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Ingen feedback ännu. Kom tillbaka efter din nästa lektion!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeedbackClient;

