'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GripVertical, X, Plus, Save, Package, ChevronUp, ChevronDown, ChevronDown as DropdownIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Types
interface PackageContent {
  id: string;
  lessonTypeId?: string;
  handledarSessionId?: string;
  credits: number;
  contentType: 'lesson' | 'handledar' | 'text';
  freeText?: string;
  hasChanges?: boolean;
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
}

interface PackageBuilderPopoverProps {
  lessonTypes: { id: string; name: string; isActive: boolean; }[];
  handledarSessions: { id: string; title: string; isActive: boolean; }[];
  initialPackage?: Package;
  onSave: (pkg: Package) => void;
  onClose: () => void;
  onUpdate?: (pkg: Package) => void;
}

const PackageBuilderPopover: React.FC<PackageBuilderPopoverProps> = ({ lessonTypes, handledarSessions, initialPackage, onSave, onClose, onUpdate }) => {

  // Defensive check to prevent runtime errors if lessonTypes is not a valid array
  if (!Array.isArray(lessonTypes) || !Array.isArray(handledarSessions)) {
    // This provides a fallback UI instead of crashing the application
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 p-6 text-white">
          <h3 className="text-xl font-bold">Laddningsfel</h3>
          <p className="mt-2 text-white/80">Ett fel uppstod vid laddning av paketbyggaren. Data kunde inte hämtas korrekt.</p>
          <Button onClick={onClose} variant="outline" className="mt-4">Stäng</Button>
        </div>
      </div>
    );
  }
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

  const [showAddDropdown, setShowAddDropdown] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const addContent = (contentType: 'lesson' | 'handledar' | 'text') => {
    setPackageData(prev => ({
      ...prev,
      contents: [...prev.contents, {
        id: uuidv4(),
        credits: contentType === 'text' ? 0 : 1,
        contentType,
        freeText: contentType === 'text' ? '' : undefined,
      }],
    }));
    setShowAddDropdown(false);
  };

  const moveContent = (dragIndex: number, hoverIndex: number) => {
    const draggedContent = packageData.contents[dragIndex];
    const newContents = [...packageData.contents];
    newContents.splice(dragIndex, 1);
    newContents.splice(hoverIndex, 0, draggedContent);
    setPackageData(prev => ({ ...prev, contents: newContents }));
  };

  const removeContent = (id: string) => {
    setPackageData(prev => ({
      ...prev,
      contents: prev.contents.filter(content => content.id !== id),
    }));
  };

  const updateContent = (id: string, field: keyof PackageContent, value: any) => {
    setPackageData(prev => ({
      ...prev,
      contents: prev.contents.map(content => 
        content.id === id ? { ...content, [field]: value, hasChanges: true } : content
      ),
    }));
  };

  const saveContentRow = async (contentId: string) => {
    if (initialPackage) {
      // For existing packages, update the entire package with the current content
      try {
        await onUpdate?.(packageData);
        
        // Mark as saved
        setPackageData(prev => ({
          ...prev,
          contents: prev.contents.map(content => 
            content.id === contentId ? { ...content, hasChanges: false } : content
          ),
        }));

        toast.success('Innehåll sparat!');
      } catch (error) {
        console.error('Error saving content:', error);
        toast.error('Fel vid sparning av innehåll');
      }
    } else {
      // For new packages, just mark as no changes (will be saved with package)
      setPackageData(prev => ({
        ...prev,
        contents: prev.contents.map(content => 
          content.id === contentId ? { ...content, hasChanges: false } : content
        ),
      }));
      toast.success('Ändringar markerade för sparning');
    }
  };

  const getAvailableLessonTypes = (excludeContentId?: string) => {
    if (!lessonTypes || !Array.isArray(lessonTypes)) {
      return [];
    }
    
    const usedLessonTypeIds = packageData.contents
      .filter(content => content.contentType === 'lesson' && content.id !== excludeContentId)
      .map(content => content.lessonTypeId)
      .filter(Boolean);
    
    // Return only active lesson types that are not already used
    return lessonTypes.filter(lt => lt.isActive && !usedLessonTypeIds.includes(lt.id));
  };

  const getAvailableHandledarSessions = (excludeContentId?: string) => {
    if (!handledarSessions || !Array.isArray(handledarSessions)) {
      return [];
    }
    
    const usedHandledarSessionIds = packageData.contents
      .filter(content => content.contentType === 'handledar' && content.id !== excludeContentId)
      .map(content => content.handledarSessionId)
      .filter(Boolean);
    
    // Return only active handledar sessions that are not already used
    return handledarSessions.filter(hs => hs.isActive && !usedHandledarSessionIds.includes(hs.id));
  };

  const onSubmit = async (data: any) => {
    try {
      // Validate required fields
      if (!packageData.name.trim()) {
        toast.error('Paketnamn är obligatoriskt');
        return;
      }
      
      if (!packageData.price || parseFloat(packageData.price) <= 0) {
        toast.error('Ett giltigt pris måste anges');
        return;
      }

      // Validate package contents
      for (const content of packageData.contents) {
        if (content.contentType === 'lesson' && !content.lessonTypeId) {
          toast.error('Alla lektionsinnehåll måste ha en vald lektionstyp');
          return;
        }
        if (content.contentType === 'handledar' && !content.handledarSessionId) {
          toast.error('Alla handledarinnehåll måste ha en vald session');
          return;
        }
        if (content.contentType === 'text' && !content.freeText?.trim()) {
          toast.error('Alla textinnehåll måste ha text');
          return;
        }
        if (content.credits < 0) {
          toast.error('Krediter kan inte vara negativa');
          return;
        }
      }

      if (initialPackage) {
        // Update existing package
        if (onUpdate) {
          await onUpdate(packageData);
          toast.success('Paket uppdaterat!');
        }
      } else {
        // Create new package
        await onSave(packageData);
        toast.success('Paket skapat!');
      }
      onClose();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Fel vid sparning av paket');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Glassmorphism Container */}
        <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl shadow-2xl">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-transparent to-blue-500/30 rounded-xl"></div>
          
          {/* Content */}
          <div className="relative z-10 p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-white drop-shadow-lg" />
                  <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                    {initialPackage ? 'Redigera Paket' : 'Nytt Paket'}
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Package Details Form */}
              <div className="space-y-6">
                {/* Package Name */}
                <div>
                  <Label htmlFor="packageName" className="text-white font-medium drop-shadow-sm">
                    Paketnamn *
                  </Label>
                  <Input
                    id="packageName"
                    value={packageData.name}
                    onChange={(e) => setPackageData({...packageData, name: e.target.value})}
                    required
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                    placeholder="T.ex. B-körkort Komplett"
                  />
                </div>

                {/* Package Description */}
                <div>
                  <Label htmlFor="packageDescription" className="text-white font-medium drop-shadow-sm">
                    Beskrivning
                  </Label>
                  <Textarea
                    id="packageDescription"
                    value={packageData.description || ''}
                    onChange={(e) => setPackageData({...packageData, description: e.target.value})}
                    rows={3}
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg resize-none"
                    placeholder="Beskriv vad som ingår i paketet..."
                  />
                </div>

                {/* Price Fields */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="packagePrice" className="text-white font-medium drop-shadow-sm">
                      Pris (SEK) *
                    </Label>
                    <Input
                      id="packagePrice"
                      type="number"
                      step="1"
                      value={packageData.price}
                      onChange={(e) => setPackageData({...packageData, price: e.target.value})}
                      required
                      className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                      placeholder="2500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="packagePriceStudent" className="text-white font-medium drop-shadow-sm">
                      Studentpris (SEK)
                    </Label>
                    <Input
                      id="packagePriceStudent"
                      type="number"
                      step="1"
                      value={packageData.priceStudent || ''}
                      onChange={(e) => setPackageData({...packageData, priceStudent: e.target.value})}
                      className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                      placeholder="2000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="packageSalePrice" className="text-white font-medium drop-shadow-sm">
                      Reapris (SEK)
                    </Label>
                    <Input
                      id="packageSalePrice"
                      type="number"
                      step="1"
                      value={packageData.salePrice || ''}
                      onChange={(e) => setPackageData({...packageData, salePrice: e.target.value})}
                      className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
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
                    className="w-4 h-4 rounded border-2 border-white/30 bg-white/10 text-purple-600 focus:ring-purple-500 focus:ring-2"
                  />
                  <Label htmlFor="packageIsActive" className="text-white font-medium drop-shadow-sm">
                    Aktiv (synlig för köp)
                  </Label>
                </div>

                {/* Package Contents Section */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-white drop-shadow-sm">Paketinnehåll</h4>
                    <div className="relative">
                      <Button 
                        type="button" 
                        onClick={() => setShowAddDropdown(!showAddDropdown)}
                        className="bg-green-600/80 hover:bg-green-600 text-white border-0"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Lägg till
                        <DropdownIcon className="w-4 h-4 ml-2" />
                      </Button>
                      {showAddDropdown && (
                        <div className="absolute right-0 top-full mt-2 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg shadow-lg z-10 min-w-[200px]">
                          <div className="py-2">
                            <button
                              type="button"
                              onClick={() => addContent('lesson')}
                              className="w-full px-4 py-2 text-left text-gray-800 hover:bg-blue-100 transition-colors"
                            >
                              📚 Lektion
                            </button>
                            <button
                              type="button"
                              onClick={() => addContent('handledar')}
                              className="w-full px-4 py-2 text-left text-gray-800 hover:bg-green-100 transition-colors"
                            >
                              🚗 Handledarkredit
                            </button>
                            <button
                              type="button"
                              onClick={() => addContent('text')}
                              className="w-full px-4 py-2 text-left text-gray-800 hover:bg-purple-100 transition-colors"
                            >
                              📝 Fri text/Perk
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {packageData.contents.map((content, index) => (
                      <div key={content.id} className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-white/60 cursor-move" />
                            <span className="text-white font-medium">Innehåll {index + 1}</span>
                          </div>
                          <div className="flex gap-1">
                            {content.hasChanges && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => saveContentRow(content.id)}
                                className="text-green-300 hover:text-green-100 hover:bg-green-500/20"
                                title="Spara ändringar"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContent(content.id)}
                              className="text-red-300 hover:text-red-100 hover:bg-red-500/20"
                              title="Ta bort rad"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-white/90 text-sm">Lektionstyp</Label>
                            <select
                              value={content.lessonTypeId || ''}
                              onChange={(e) => updateContent(content.id, 'lessonTypeId', e.target.value)}
                              className="w-full bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg px-3 py-2 text-sm focus:bg-white/20 focus:border-white/50"
                            >
                              <option value="" className="bg-gray-800 text-white">Välj lektionstyp</option>
                              {(() => {
                                const availableTypes = getAvailableLessonTypes(content.id);
                                const allOptions = [];
                                
                                // Add currently selected option if it exists
                                if (content.lessonTypeId) {
                                  const currentType = lessonTypes.find(lt => lt.id === content.lessonTypeId);
                                  if (currentType) {
                                    allOptions.push(
                                      <option key={currentType.id} value={currentType.id} className="bg-gray-800 text-white">
                                        {currentType.name}
                                      </option>
                                    );
                                  }
                                }
                                
                                // Add available types
                                if (availableTypes && Array.isArray(availableTypes)) {
                                  availableTypes.forEach(type => {
                                    allOptions.push(
                                      <option key={type.id} value={type.id} className="bg-gray-800 text-white">
                                        {type.name}
                                      </option>
                                    );
                                  });
                                }
                                
                                return allOptions;
                              })()}
                            </select>
                          </div>
                          <div>
                            <Label className="text-white/90 text-sm">Antal krediter</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={content.credits}
                                onChange={(e) => updateContent(content.id, 'credits', Math.max(0, parseInt(e.target.value) || 0))}
                                min="0"
                                className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 text-sm pr-8"
                                placeholder="1"
                              />
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => updateContent(content.id, 'credits', Math.max(0, content.credits + 1))}
                                  className="text-white/60 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateContent(content.id, 'credits', Math.max(0, content.credits - 1))}
                                  className="text-white/60 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Free Text Option */}
                        <div className="mt-3">
                          <Label className="text-white/90 text-sm">Fri text (perk)</Label>
                          <Input
                            value={content.freeText || ''}
                            onChange={(e) => updateContent(content.id, 'freeText', e.target.value)}
                            className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 text-sm"
                            placeholder="T.ex. Gratis teorikurs, Personlig instruktör..."
                          />
                        </div>
                      </div>
                    ))}

                    {packageData.contents.length === 0 && (
                      <div className="text-center py-8 text-white/60">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Inga innehåll tillagda ännu</p>
                        <p className="text-sm">Klicka "Lägg till" för att lägga till lektioner och perks</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                  className="flex-1 bg-purple-600/80 hover:bg-purple-600 text-white border-0 transition-all duration-200 backdrop-blur-sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Spara Paket
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageBuilderPopover;
