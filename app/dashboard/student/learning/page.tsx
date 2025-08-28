"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Progress } from 'flowbite-react';
import { BookOpen, Clock, CheckCircle, PlayCircle, FileText, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

interface LearningCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface LearningStats {
  totalHours: number;
  completedModules: number;
  currentStreak: number;
  certificatesEarned: number;
}

export default function StudentLearningPage() {
  const [categories, setCategories] = useState<LearningCategory[]>([]);
  const [stats, setStats] = useState<LearningStats>({
    totalHours: 0,
    completedModules: 0,
    currentStreak: 0,
    certificatesEarned: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchLearningData();
  }, []);

  const fetchLearningData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API calls
      const mockCategories: LearningCategory[] = [
        {
          id: 'traffic-rules',
          name: 'Trafikregler',
          description: 'Grundläggande trafikregler och vägmärken',
          icon: '🚦',
          progress: 75,
          totalLessons: 12,
          completedLessons: 9,
          estimatedTime: 180,
          difficulty: 'beginner'
        },
        {
          id: 'driving-technique',
          name: 'Körteknik',
          description: 'Praktisk körteknik och säker körning',
          icon: '🚗',
          progress: 45,
          totalLessons: 15,
          completedLessons: 7,
          estimatedTime: 240,
          difficulty: 'intermediate'
        },
        {
          id: 'risk-awareness',
          name: 'Riskmedvetenhet',
          description: 'Identifiera och hantera risker i trafiken',
          icon: '⚠️',
          progress: 30,
          totalLessons: 10,
          completedLessons: 3,
          estimatedTime: 150,
          difficulty: 'intermediate'
        },
        {
          id: 'eco-driving',
          name: 'Miljökörning',
          description: 'Ekonomisk och miljövänlig körning',
          icon: '🌱',
          progress: 0,
          totalLessons: 8,
          completedLessons: 0,
          estimatedTime: 120,
          difficulty: 'advanced'
        }
      ];

      const mockStats: LearningStats = {
        totalHours: 12.5,
        completedModules: 19,
        currentStreak: 5,
        certificatesEarned: 2
      };

      setCategories(mockCategories);
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching learning data:', error);
      toast.error('Kunde inte hämta utbildningsdata');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'failure';
      default: return 'gray';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Nybörjare';
      case 'intermediate': return 'Medel';
      case 'advanced': return 'Avancerad';
      default: return difficulty;
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Utbildning & Lärande</h1>
          <p className="text-gray-600">Utveckla dina körkunskaper med våra interaktiva lektioner</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Studietimmar</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avklarade moduler</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedModules}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Dagars streak</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Certifikat</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.certificatesEarned}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Learning Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Utbildningskategorier</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="text-3xl mr-4">{category.icon}</div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {category.name}
                        </h3>
                        <p className="text-gray-600 text-sm">{category.description}</p>
                      </div>
                    </div>
                    <Badge color={getDifficultyColor(category.difficulty)} size="sm">
                      {getDifficultyText(category.difficulty)}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Framsteg</span>
                      <span className="text-sm text-gray-600">
                        {category.completedLessons}/{category.totalLessons} lektioner
                      </span>
                    </div>
                    <Progress progress={category.progress} color="blue" />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>~{Math.floor(category.estimatedTime / 60)}h {category.estimatedTime % 60}min</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>{category.totalLessons} lektioner</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      href={`/dashboard/student/learning/${category.id}`}
                      className="flex-1"
                      color={category.progress > 0 ? "blue" : "gray"}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      {category.progress > 0 ? 'Fortsätt' : 'Börja'}
                    </Button>
                    <Button
                      color="gray"
                      onClick={() => toast.info('Förhandsvisning kommer snart')}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="mb-8">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Senaste aktivitet</h3>
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Genomförde "Väjningsregler på korsningar"
                  </p>
                  <p className="text-xs text-gray-600">För 2 dagar sedan</p>
                </div>
                <Badge color="success" size="sm">+10 poäng</Badge>
              </div>
              
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <PlayCircle className="h-5 w-5 text-blue-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Startade "Säker körning i mörker"
                  </p>
                  <p className="text-xs text-gray-600">För 3 dagar sedan</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                <Award className="h-5 w-5 text-purple-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Erhöll certifikat "Grundläggande trafikregler"
                  </p>
                  <p className="text-xs text-gray-600">För 1 vecka sedan</p>
                </div>
                <Badge color="purple" size="sm">Certifikat</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="text-center">
          <Button size="lg" onClick={() => toast.info('Funktion kommer snart')}>
            <BookOpen className="h-5 w-5 mr-2" />
            Visa alla kurser
          </Button>
        </div>
      </div>
    </div>
  );
}
