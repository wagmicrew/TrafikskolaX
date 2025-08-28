"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Progress } from 'flowbite-react';
import { BarChart3, TrendingUp, Clock, Target, Calendar, Award, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

interface LessonStats {
  totalLessons: number;
  completedLessons: number;
  upcomingLessons: number;
  cancelledLessons: number;
  averageScore: number;
  totalHours: number;
}

interface PerformanceData {
  category: string;
  score: number;
  maxScore: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface MonthlyProgress {
  month: string;
  lessons: number;
  hours: number;
  score: number;
}

export default function StudentStatisticsPage() {
  const [lessonStats, setLessonStats] = useState<LessonStats>({
    totalLessons: 0,
    completedLessons: 0,
    upcomingLessons: 0,
    cancelledLessons: 0,
    averageScore: 0,
    totalHours: 0
  });
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [monthlyProgress, setMonthlyProgress] = useState<MonthlyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API calls
      const mockLessonStats: LessonStats = {
        totalLessons: 25,
        completedLessons: 18,
        upcomingLessons: 4,
        cancelledLessons: 3,
        averageScore: 8.2,
        totalHours: 36
      };

      const mockPerformanceData: PerformanceData[] = [
        {
          category: 'Parkering',
          score: 85,
          maxScore: 100,
          trend: 'up',
          lastUpdated: '2024-01-20'
        },
        {
          category: 'Trafikregler',
          score: 92,
          maxScore: 100,
          trend: 'stable',
          lastUpdated: '2024-01-18'
        },
        {
          category: 'Körning i stad',
          score: 78,
          maxScore: 100,
          trend: 'up',
          lastUpdated: '2024-01-22'
        },
        {
          category: 'Motorväg',
          score: 65,
          maxScore: 100,
          trend: 'down',
          lastUpdated: '2024-01-15'
        },
        {
          category: 'Mörkerkörning',
          score: 70,
          maxScore: 100,
          trend: 'up',
          lastUpdated: '2024-01-19'
        }
      ];

      const mockMonthlyProgress: MonthlyProgress[] = [
        { month: 'Sep', lessons: 3, hours: 6, score: 7.5 },
        { month: 'Okt', lessons: 5, hours: 10, score: 8.0 },
        { month: 'Nov', lessons: 4, hours: 8, score: 8.2 },
        { month: 'Dec', lessons: 6, hours: 12, score: 8.5 },
        { month: 'Jan', lessons: 0, hours: 0, score: 0 }
      ];

      setLessonStats(mockLessonStats);
      setPerformanceData(mockPerformanceData);
      setMonthlyProgress(mockMonthlyProgress);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Kunde inte hämta statistik');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'failure';
      default: return 'gray';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'warning';
    return 'failure';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <Spinner size="xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistik & Framsteg</h1>
          <p className="text-gray-600">Följ din utveckling och se dina prestationer över tid</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Genomförda</p>
                  <p className="text-2xl font-bold text-gray-900">{lessonStats.completedLessons}</p>
                  <p className="text-xs text-gray-500">av {lessonStats.totalLessons} lektioner</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Totala timmar</p>
                  <p className="text-2xl font-bold text-gray-900">{lessonStats.totalHours}</p>
                  <p className="text-xs text-gray-500">körtid</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Target className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Genomsnitt</p>
                  <p className="text-2xl font-bold text-gray-900">{lessonStats.averageScore}</p>
                  <p className="text-xs text-gray-500">av 10 poäng</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Kommande</p>
                  <p className="text-2xl font-bold text-gray-900">{lessonStats.upcomingLessons}</p>
                  <p className="text-xs text-gray-500">bokade lektioner</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Övergripande framsteg</h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Kursframsteg</span>
                <span className="text-sm text-gray-600">
                  {lessonStats.completedLessons}/{lessonStats.totalLessons} lektioner
                </span>
              </div>
              <Progress 
                progress={(lessonStats.completedLessons / lessonStats.totalLessons) * 100} 
                color="blue" 
                size="lg"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{lessonStats.completedLessons}</p>
                <p className="text-sm text-green-700">Genomförda</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">{lessonStats.upcomingLessons}</p>
                <p className="text-sm text-blue-700">Kommande</p>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-900">{lessonStats.cancelledLessons}</p>
                <p className="text-sm text-red-700">Avbokade</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance by Category */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Prestationer per kategori</h2>
            <div className="space-y-4">
              {performanceData.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{item.category}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge color={getTrendColor(item.trend)} size="sm">
                        <div className="flex items-center">
                          {getTrendIcon(item.trend)}
                          <span className="ml-1">{item.trend === 'up' ? 'Förbättring' : item.trend === 'down' ? 'Försämring' : 'Stabilt'}</span>
                        </div>
                      </Badge>
                      <Badge color={getScoreColor(item.score)} size="sm">
                        {item.score}/100
                      </Badge>
                    </div>
                  </div>
                  
                  <Progress progress={item.score} color="blue" className="mb-2" />
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Senast uppdaterad: {new Date(item.lastUpdated).toLocaleDateString('sv-SE')}</span>
                    <span>{item.score}% av max</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Monthly Progress Chart */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Månadsvis utveckling</h2>
            <div className="space-y-4">
              {monthlyProgress.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{month.month} 2024</h3>
                      <p className="text-sm text-gray-600">
                        {month.lessons} lektioner • {month.hours} timmar
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {month.score > 0 ? (
                      <>
                        <p className="text-lg font-semibold text-gray-900">{month.score}</p>
                        <p className="text-sm text-gray-600">Genomsnitt</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Ingen data</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Achievements */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Prestationer & Mål</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 mb-1">Första lektionen</h3>
                <p className="text-sm text-gray-600">Genomförd</p>
                <Badge color="success" size="sm" className="mt-2">Uppnått</Badge>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Award className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 mb-1">10 lektioner</h3>
                <p className="text-sm text-gray-600">Halvvägs till målet</p>
                <Badge color="success" size="sm" className="mt-2">Uppnått</Badge>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg opacity-60">
                <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 mb-1">Körprovsredo</h3>
                <p className="text-sm text-gray-600">Alla färdigheter utvecklade</p>
                <Badge color="gray" size="sm" className="mt-2">Ej uppnått</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
