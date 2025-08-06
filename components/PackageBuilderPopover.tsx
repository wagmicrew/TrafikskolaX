'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Plus, Save, Package, Trash2, GripVertical, BookOpen, Users, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Types matching database schema
interface PackageContent {
  id: string;
  packageId?: string;
  lessonTypeId?: string;
  handledarSessionId?: string;
  credits: number;
  contentType: 'lesson' | 'handledar' | 'text';
  freeText?: string;
  sortOrder: number;
  lessonType?: {
    id: string;
    name: string;
  };
  handledarSession?: {
    id: string;
    title: string;
  };
}

interface Package {
  id: string;
  name: string;
  description?: string;
  price: string;
  priceStudent?: string;
  salePrice?: string;
  isActive: boolean;
  contents: PackageContent[];
  createdAt?: string;
  updatedAt?: string;
}

// Interface for API submission (without content IDs for new packages)
interface PackageSubmission {
  id?: string;
  name: string;
  description?: string;
  price: string;
  priceStudent?: string;
  salePrice?: string;
  isActive: boolean;
  contents: {
    lessonTypeId?: string | null;
    handledarSessionId?: string | null;
    credits: number;
    contentType: 'lesson' | 'handledar' | 'text';
    freeText?: string | null;
    sortOrder: number;
  }[];
}

interface PackageBuilderPopoverProps {
  lessonTypes: { id: string; name: string; isActive: boolean; }[];
  handledarSessions: { id: string; title: string; isActive: boolean; }[];
  initialPackage?: Package;
  onSave: (pkg: PackageSubmission) => Promise<void>;
  onClose: () => void;
  onUpdate?: (pkg: PackageSubmission) => Promise<void>;
  isLoading?: boolean;
}

const PackageBuilderPopover: React.FC<PackageBuilderPopoverProps> = ({ 
  lessonTypes, 
  handledarSessions, 
  initialPackage, 
  onSave, 
  onClose, 
  onUpdate, 
  isLoading = false 
}) => {
  const [packageData, setPackageData] = useState<Package>(() => {
    if (initialPackage) {
      return {
        ...initialPackage,
        contents: Array.isArray(initialPackage.contents) ? initialPackage.contents : []
      };
    }
    return {
      id: uuidv4(),
      name: '',
      description: '',
      price: '',
      priceStudent: '',
      salePrice: '',
      isActive: true,
      contents: [],
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when initialPackage changes
  useEffect(() => {
    if (initialPackage) {
      setPackageData({
        ...initialPackage,
        contents: Array.isArray(initialPackage.contents) ? initialPackage.contents : []
      });
    }
  }, [initialPackage]);

  const addContent = (contentType: 'lesson' | 'handledar' | 'text') => {
    // Check if trying to add a lesson when one already exists
    if (contentType === 'lesson') {
      const existingLesson = packageData.contents.find(content => content.contentType === 'lesson');
      if (existingLesson) {
        toast.error('Endast en lektionstyp kan läggas till per paket. Du kan ändra antalet krediter för den befintliga lektionen.');
        return;
      }
    }
    
    const newContent: PackageContent = {
      id: uuidv4(),
      credits: contentType === 'text' ? 0 : 1, // 0 for text, 1 for lesson/handledar
      contentType,
      freeText: contentType === 'text' ? '' : undefined,
      sortOrder: packageData.contents.length,
    };
    
    setPackageData(prev => ({
      ...prev,
      contents: [...prev.contents, newContent]
    }));
  };

  const removeContent = (id: string) => {
    setPackageData(prev => ({
      ...prev,
      contents: prev.contents.filter(content => content.id !== id)
    }));
  };

  const updateContent = (id: string, field: keyof PackageContent, value: any) => {
    setPackageData(prev => ({
      ...prev,
      contents: prev.contents.map(content => {
        if (content.id === id) {
          // If changing lesson type, validate it's not already used
          if (field === 'lessonTypeId' && value) {
            const isAlreadyUsed = prev.contents.some(c => 
              c.id !== id && c.lessonTypeId === value
            );
            if (isAlreadyUsed) {
              toast.error('Denna lektionstyp är redan vald i paketet');
              return content;
            }
          }
          
          // Prevent credits from being set for text content
          if (field === 'credits' && content.contentType === 'text') {
            return content; // Don't allow credits for text content
          }
          
          return { ...content, [field]: value };
        }
        return content;
      })
    }));
  };

  const moveContent = (dragIndex: number, hoverIndex: number) => {
    const draggedContent = packageData.contents[dragIndex];
    const newContents = [...packageData.contents];
    newContents.splice(dragIndex, 1);
    newContents.splice(hoverIndex, 0, draggedContent);
    
    // Update sortOrder for all contents
    const updatedContents = newContents.map((content, index) => ({
      ...content,
      sortOrder: index
    }));
    
    setPackageData(prev => ({ ...prev, contents: updatedContents }));
  };

  const getAvailableLessonTypes = (excludeContentId?: string) => {
    if (!lessonTypes || !Array.isArray(lessonTypes)) {
      return [];
    }
    
    const usedLessonTypeIds = packageData.contents
      .filter(content => content.id !== excludeContentId && content.lessonTypeId)
      .map(content => content.lessonTypeId);
    
    return lessonTypes.filter(lessonType => 
      lessonType.isActive && !usedLessonTypeIds.includes(lessonType.id)
    );
  };

  const getAvailableHandledarSessions = (excludeContentId?: string) => {
    if (!handledarSessions || !Array.isArray(handledarSessions)) {
      return [];
    }
    
    const usedSessionIds = packageData.contents
      .filter(content => content.id !== excludeContentId && content.handledarSessionId)
      .map(content => content.handledarSessionId);
    
    return handledarSessions.filter(session => 
      session.isActive && !usedSessionIds.includes(session.id)
    );
  };

  const validatePackage = (): string | null => {
    if (!packageData.name.trim()) {
      return 'Paketnamn krävs';
    }

    if (!packageData.price || parseFloat(packageData.price) <= 0) {
      return 'Giltigt pris krävs';
    }

    if (packageData.contents.length === 0) {
      return 'Minst ett innehåll krävs i paketet';
    }

    // Check for duplicate lesson types
    const lessonTypeIds = packageData.contents
      .filter(content => content.contentType === 'lesson' && content.lessonTypeId)
      .map(content => content.lessonTypeId);
    
    const uniqueLessonTypeIds = new Set(lessonTypeIds);
    if (lessonTypeIds.length !== uniqueLessonTypeIds.size) {
      return 'Du kan inte ha samma lektionstyp flera gånger i samma paket';
    }

    // Validate contents
    for (const content of packageData.contents) {
      if (content.contentType === 'lesson' && !content.lessonTypeId) {
        return 'Välj lektionstyp för alla lektionsinnehåll';
      }
      if (content.contentType === 'handledar' && !content.handledarSessionId) {
        return 'Välj handledarsession för alla handledarinnehåll';
      }
      if (content.contentType === 'text' && !content.freeText?.trim()) {
        return 'Alla textinnehåll måste ha text';
      }
      if (content.contentType === 'lesson' && content.credits < 1) {
        return 'Lektioner måste ha minst 1 kredit';
      }
      if (content.contentType === 'handledar' && content.credits < 0) {
        return 'Handledarkrediter kan inte vara negativa';
      }
      if (content.contentType === 'text' && content.credits !== 0) {
        return 'Textinnehåll ska inte ha krediter';
      }
    }

    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validatePackage();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare data for API
      const submitData: PackageSubmission = {
        ...packageData,
        contents: packageData.contents.map(content => ({
          lessonTypeId: content.lessonTypeId || null,
          handledarSessionId: content.handledarSessionId || null,
          credits: content.credits,
          contentType: content.contentType,
          freeText: content.freeText || null,
          sortOrder: content.sortOrder,
        }))
      };

      if (initialPackage) {
        if (onUpdate) {
          await onUpdate(submitData);
          toast.success('Paket uppdaterat!');
        }
      } else {
        await onSave(submitData);
        toast.success('Paket skapat!');
      }
      onClose();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Fel vid sparning av paket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'lesson':
        return <BookOpen className="w-4 h-4" />;
      case 'handledar':
        return <Users className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getContentTypeLabel = (contentType: string) => {
    switch (contentType) {
      case 'lesson':
        return 'Lektion';
      case 'handledar':
        return 'Handledar';
      case 'text':
        return 'Text';
      default:
        return 'Innehåll';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px] max-h-[95vh] sm:max-h-[90vh] p-0 overflow-hidden border-0 bg-transparent shadow-none">
        {/* Glassmorphism Container */}
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl h-full max-h-[95vh] overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/20 rounded-xl sm:rounded-2xl"></div>

          {/* Scrollable Content Container */}
          <div className="relative z-10 h-full overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8">
              {/* Header */}
              <DialogHeader className="relative mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center space-x-2 text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg pr-2">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span>{initialPackage ? 'Redigera Paket' : 'Nytt Paket'}</span>
                  </DialogTitle>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 group flex-shrink-0"
                    aria-label="Stäng formulär"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-3 sm:mt-4"></div>
              </DialogHeader>

              <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
                {/* Package Details */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-4 sm:p-6">
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white drop-shadow-sm">Paketinformation</h3>
                  </div>
                  
                  <div className="space-y-4 sm:space-y-6">
                    {/* Package Name */}
                    <div className="space-y-2">
                      <Label htmlFor="packageName" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                        Paketnamn *
                      </Label>
                      <Input
                        id="packageName"
                        value={packageData.name}
                        onChange={(e) => setPackageData({...packageData, name: e.target.value})}
                        required
                        disabled={isLoading || isSubmitting}
                        className="pl-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                        placeholder="T.ex. B-körkort Komplett"
                      />
                    </div>

                    {/* Package Description */}
                    <div className="space-y-2">
                      <Label htmlFor="packageDescription" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                        Beskrivning
                      </Label>
                      <Textarea
                        id="packageDescription"
                        value={packageData.description || ''}
                        onChange={(e) => setPackageData({...packageData, description: e.target.value})}
                        rows={3}
                        disabled={isLoading || isSubmitting}
                        className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl resize-none text-sm sm:text-base"
                        placeholder="Beskriv vad som ingår i paketet..."
                      />
                    </div>

                    {/* Price Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="packagePrice" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                          Pris (SEK) *
                        </Label>
                        <Input
                          id="packagePrice"
                          type="number"
                          step="1"
                          value={packageData.price}
                          onChange={(e) => setPackageData({...packageData, price: e.target.value})}
                          required
                          disabled={isLoading || isSubmitting}
                          className="pl-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                          placeholder="2500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="packagePriceStudent" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                          Studentpris (SEK)
                        </Label>
                        <Input
                          id="packagePriceStudent"
                          type="number"
                          step="1"
                          value={packageData.priceStudent || ''}
                          onChange={(e) => setPackageData({...packageData, priceStudent: e.target.value})}
                          disabled={isLoading || isSubmitting}
                          className="pl-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                          placeholder="2000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="packageSalePrice" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                          Reapris (SEK)
                        </Label>
                        <Input
                          id="packageSalePrice"
                          type="number"
                          step="1"
                          value={packageData.salePrice || ''}
                          onChange={(e) => setPackageData({...packageData, salePrice: e.target.value})}
                          disabled={isLoading || isSubmitting}
                          className="pl-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                          placeholder="2200"
                        />
                      </div>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="packageIsActive"
                        checked={packageData.isActive}
                        onChange={(e) => setPackageData({...packageData, isActive: e.target.checked})}
                        disabled={isLoading || isSubmitting}
                        className="w-4 h-4 text-red-600 bg-white/10 border-white/30 rounded focus:ring-red-500 focus:ring-2"
                      />
                      <Label htmlFor="packageIsActive" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                        Paketet är aktivt
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Package Contents */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-4 sm:p-6">
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white drop-shadow-sm">Paketinnehåll</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {packageData.contents.map((content, index) => (
                      <div key={content.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <GripVertical className="w-4 h-4 text-white/60" />
                            <div className="flex items-center space-x-2">
                              {getContentTypeIcon(content.contentType)}
                              <span className="text-sm text-white/80">
                                {getContentTypeLabel(content.contentType)} {index + 1}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContent(content.id)}
                            className="text-red-300 hover:text-red-100 hover:bg-red-500/20 p-1"
                            disabled={isLoading || isSubmitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {content.contentType === 'lesson' && (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label className="text-white font-medium drop-shadow-sm text-sm">
                                  Lektionstyp *
                                </Label>
                                <select
                                  value={content.lessonTypeId || ''}
                                  onChange={(e) => updateContent(content.id, 'lessonTypeId', e.target.value)}
                                  className="w-full bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg px-3 py-2 text-sm focus:bg-white/20 focus:border-white/50 transition-all duration-200"
                                  required
                                  disabled={isLoading || isSubmitting}
                                >
                                  <option value="">Välj lektionstyp</option>
                                  {getAvailableLessonTypes(content.id).map(lessonType => (
                                    <option key={lessonType.id} value={lessonType.id}>
                                      {lessonType.name}
                                    </option>
                                  ))}
                                </select>
                                {content.lessonTypeId && (
                                  <div className="text-xs text-blue-100/80 mt-1">
                                    ✅ Lektionstyp vald
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label className="text-white font-medium drop-shadow-sm text-sm">
                                  Antal krediter *
                                </Label>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={content.credits}
                                    onChange={(e) => updateContent(content.id, 'credits', Math.max(1, parseInt(e.target.value) || 1))}
                                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg h-10 text-sm flex-1"
                                    placeholder="1"
                                    disabled={isLoading || isSubmitting}
                                  />
                                  <div className="text-xs text-white/60">
                                    krediter
                                  </div>
                                </div>
                                <div className="text-xs text-white/60">
                                  Justera antalet krediter för att ändra paketets värde
                                </div>
                              </div>
                            </div>
                          )}

                          {content.contentType === 'handledar' && (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label className="text-white font-medium drop-shadow-sm text-sm">
                                  Handledarsession *
                                </Label>
                                <select
                                  value={content.handledarSessionId || ''}
                                  onChange={(e) => updateContent(content.id, 'handledarSessionId', e.target.value)}
                                  className="w-full bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg px-3 py-2 text-sm focus:bg-white/20 focus:border-white/50 transition-all duration-200"
                                  required
                                  disabled={isLoading || isSubmitting}
                                >
                                  <option value="">Välj handledarsession</option>
                                  {getAvailableHandledarSessions(content.id).map(session => (
                                    <option key={session.id} value={session.id}>
                                      {session.title}
                                    </option>
                                  ))}
                                </select>
                                {content.handledarSessionId && (
                                  <div className="text-xs text-green-100/80 mt-1">
                                    ✅ Handledarsession vald
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label className="text-white font-medium drop-shadow-sm text-sm">
                                  Antal krediter
                                </Label>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={content.credits}
                                    onChange={(e) => updateContent(content.id, 'credits', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg h-10 text-sm flex-1"
                                    placeholder="1"
                                    disabled={isLoading || isSubmitting}
                                  />
                                  <div className="text-xs text-white/60">
                                    krediter
                                  </div>
                                </div>
                                <div className="text-xs text-white/60">
                                  Krediter gäller för alla handledarstatustyper
                                </div>
                              </div>
                            </div>
                          )}

                          {content.contentType === 'text' && (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label className="text-white font-medium drop-shadow-sm text-sm">
                                  Textinnehåll *
                                </Label>
                                <Textarea
                                  value={content.freeText || ''}
                                  onChange={(e) => updateContent(content.id, 'freeText', e.target.value)}
                                  rows={3}
                                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg resize-none text-sm"
                                  placeholder="Ange textinnehåll (t.ex. 'Gratis teorikurs', 'Personlig instruktör', etc.)..."
                                  required
                                  disabled={isLoading || isSubmitting}
                                />
                                {content.freeText?.trim() && (
                                  <div className="text-xs text-purple-100/80 mt-1">
                                    ✅ Textinnehåll angivet
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add Content Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => addContent('lesson')}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 border border-blue-400/30 rounded-lg px-3 py-2 text-sm transition-all duration-200"
                        disabled={isLoading || isSubmitting || packageData.contents.some(content => content.contentType === 'lesson')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Lägg till lektion
                        {packageData.contents.some(content => content.contentType === 'lesson') && (
                          <span className="ml-2 text-xs opacity-75">(max 1)</span>
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => addContent('handledar')}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-100 border border-green-400/30 rounded-lg px-3 py-2 text-sm transition-all duration-200"
                        disabled={isLoading || isSubmitting}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Lägg till handledar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => addContent('text')}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 border border-purple-400/30 rounded-lg px-3 py-2 text-sm transition-all duration-200"
                        disabled={isLoading || isSubmitting}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Lägg till text
                      </Button>
                    </div>

                    {/* Lesson Type Info */}
                    {packageData.contents.some(content => content.contentType === 'lesson') && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                        <p className="text-sm text-blue-100">
                          💡 <strong>Tips:</strong> Endast en lektionstyp per paket. Du kan ändra antalet krediter för att justera värdet.
                        </p>
                      </div>
                    )}

                    {/* Handledar Info */}
                    {packageData.contents.some(content => content.contentType === 'handledar') && (
                      <div className="mt-3 p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
                        <p className="text-sm text-green-100">
                          💡 <strong>Tips:</strong> Handledarkrediter gäller för alla handledarstatustyper, inte bara specifika sessioner.
                        </p>
                      </div>
                    )}

                    {/* Text Content Info */}
                    {packageData.contents.some(content => content.contentType === 'text') && (
                      <div className="mt-3 p-3 bg-purple-500/10 border border-purple-400/20 rounded-lg">
                        <p className="text-sm text-purple-100">
                          💡 <strong>Tips:</strong> Textinnehåll används för att beskriva paketets fördelar och behöver inga krediter.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-red-500/30 text-sm sm:text-base"
                  disabled={isLoading || isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sparar paket...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>{initialPackage ? 'Uppdatera Paket' : 'Skapa Paket'}</span>
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageBuilderPopover;
