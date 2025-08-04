'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { X, Save, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NewLessonTypePopoverProps {
  onClose: () => void;
  onSave: (lessonType: any) => void;
}

interface LessonTypeFormData {
  name: string;
  description: string;
  durationMinutes: number;
  price: string;
  priceStudent: string;
  salePrice: string;
  isActive: boolean;
}

export default function NewLessonTypePopover({ onClose, onSave }: NewLessonTypePopoverProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LessonTypeFormData>({
    defaultValues: {
      name: '',
      description: '',
      durationMinutes: 45,
      price: '',
      priceStudent: '',
      salePrice: '',
      isActive: true,
    }
  });

  const onSubmit = async (data: LessonTypeFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/lesson-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          durationMinutes: data.durationMinutes,
          price: data.price,
          priceStudent: data.priceStudent || null,
          salePrice: data.salePrice || null,
          isActive: data.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create lesson type');
      }

      const savedLessonType = await response.json();
      onSave(savedLessonType);
      toast.success('Lektionstyp skapad framgångsrikt!');
      reset();
      onClose();
    } catch (error) {
      toast.error('Misslyckades att skapa lektionstyp');
      console.error('Error creating lesson type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Glassmorphism Container */}
        <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl shadow-2xl">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-transparent to-blue-500/30 rounded-xl"></div>
          
          {/* Content */}
          <div className="relative z-10 p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-white drop-shadow-lg" />
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                  Ny Lektionstyp
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div>
                <Label htmlFor="name" className="text-white font-medium drop-shadow-sm">
                  Namn *
                </Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Namn är obligatoriskt' })}
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                  placeholder="T.ex. B-körkort grundlektion"
                />
                {errors.name && (
                  <p className="text-red-300 text-sm mt-1 drop-shadow-sm">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-white font-medium drop-shadow-sm">
                  Beskrivning
                </Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  rows={3}
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg resize-none"
                  placeholder="Beskriv vad som ingår i lektionen..."
                />
              </div>

              {/* Duration and Price Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="durationMinutes" className="text-white font-medium drop-shadow-sm">
                    Längd (minuter) *
                  </Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    {...register('durationMinutes', { 
                      required: 'Längd är obligatorisk',
                      min: { value: 1, message: 'Minst 1 minut' }
                    })}
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                    placeholder="45"
                  />
                  {errors.durationMinutes && (
                    <p className="text-red-300 text-sm mt-1 drop-shadow-sm">{errors.durationMinutes.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price" className="text-white font-medium drop-shadow-sm">
                    Pris (SEK) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price', { 
                      required: 'Pris är obligatoriskt',
                      min: { value: 0, message: 'Pris måste vara positivt' }
                    })}
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                    placeholder="500"
                  />
                  {errors.price && (
                    <p className="text-red-300 text-sm mt-1 drop-shadow-sm">{errors.price.message}</p>
                  )}
                </div>
              </div>

              {/* Student Price and Sale Price Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priceStudent" className="text-white font-medium drop-shadow-sm">
                    Studentpris (SEK)
                  </Label>
                  <Input
                    id="priceStudent"
                    type="number"
                    step="0.01"
                    {...register('priceStudent', {
                      min: { value: 0, message: 'Pris måste vara positivt' }
                    })}
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                    placeholder="400"
                  />
                  {errors.priceStudent && (
                    <p className="text-red-300 text-sm mt-1 drop-shadow-sm">{errors.priceStudent.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="salePrice" className="text-white font-medium drop-shadow-sm">
                    Reapris (SEK)
                  </Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    {...register('salePrice', {
                      min: { value: 0, message: 'Pris måste vara positivt' }
                    })}
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                    placeholder="450"
                  />
                  {errors.salePrice && (
                    <p className="text-red-300 text-sm mt-1 drop-shadow-sm">{errors.salePrice.message}</p>
                  )}
                </div>
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register('isActive')}
                  className="w-4 h-4 rounded border-2 border-white/30 bg-white/10 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <Label htmlFor="isActive" className="text-white font-medium drop-shadow-sm">
                  Aktiv (synlig för bokningar)
                </Label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-200"
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white border-0 transition-all duration-200 backdrop-blur-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sparar...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Skapa Lektionstyp
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
