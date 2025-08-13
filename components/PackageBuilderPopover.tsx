'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GripVertical, X, Plus, Save, Package, ChevronUp, ChevronDown, ChevronDown as DropdownIcon, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

// Types
interface PackageContent {
  id: string;
  lessonTypeId?: string;
  handledarSessionId?: string;
  credits: number;
  contentType: 'lesson' | 'handledar' | 'text';
  freeText?: string;
  hasChanges?: boolean;
  sortOrder?: number;
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

const PackageBuilderPopover: React.FC<PackageBuilderPopoverProps> = ({ lessonTypes, handledarSessions, initialPackage, onSave, onClose, onUpdate }: PackageBuilderPopoverProps) => {
  // Defensive flag to avoid conditional hooks
  const invalidData = !Array.isArray(lessonTypes) || !Array.isArray(handledarSessions);

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
  const [loading, setLoading] = useState(false);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingContentId, setSavingContentId] = useState<string | null>(null);
  const [confirmEmptyOpen, setConfirmEmptyOpen] = useState(false);

  const { handleSubmit } = useForm<Record<string, unknown>>();

  // Load existing package contents if editing
  useEffect(() => {
    if (initialPackage?.id) {
      setContentsLoading(true);
      loadPackageContents(initialPackage.id).finally(() => setContentsLoading(false));
    }
  }, [initialPackage?.id]);

  const loadPackageContents = async (packageId: string) => {
    try {
      const response = await fetch(`/api/admin/packages/${packageId}/contents`);
      if (response.ok) {
        const contents = await response.json();
        setPackageData(prev => ({
          ...prev,
          contents: contents.map((content: Record<string, unknown>) => ({
            id: content.id,
            lessonTypeId: content.lessonTypeId,
            handledarSessionId: content.handledarSessionId,
            credits: content.credits,
            contentType: content.contentType,
            freeText: content.freeText,
            sortOrder: content.sortOrder,
            hasChanges: false
          }))
        }));
      }
    } catch (error) {
      console.error('Error loading package contents:', error);
    }
  };

  const addContent = (contentType: 'lesson' | 'handledar' | 'text') => {
    const newContent: PackageContent = {
      id: uuidv4(),
      credits: contentType === 'text' ? 0 : 1,
      contentType,
      freeText: contentType === 'text' ? '' : undefined,
      sortOrder: packageData.contents.length,
    };

    // For handledar type, don't require specific session selection
    if (contentType === 'handledar') {
      newContent.handledarSessionId = undefined; // Generic handledar credit
    }

    setPackageData(prev => ({
      ...prev,
      contents: [...prev.contents, newContent],
    }));
    setShowAddDropdown(false);
  };

  const moveContent = (dragIndex: number, hoverIndex: number) => {
    const draggedContent = packageData.contents[dragIndex];
    const newContents = [...packageData.contents];
    newContents.splice(dragIndex, 1);
    newContents.splice(hoverIndex, 0, draggedContent);
    
    // Update sort order
    const updatedContents = newContents.map((content, index) => ({
      ...content,
      sortOrder: index,
      hasChanges: true
    }));
    
    setPackageData(prev => ({ ...prev, contents: updatedContents }));
  };

  const removeContent = async (id: string) => {
    if (initialPackage?.id) {
      // For existing packages, delete from database
      try {
        const response = await fetch(`/api/admin/packages/${initialPackage.id}/contents?contentId=${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setPackageData(prev => ({
            ...prev,
            contents: prev.contents.filter(content => content.id !== id),
          }));
          toast.success('Innehåll borttaget!');
        } else {
          const error = await response.json();
          toast.error(error.error || 'Fel vid borttagning av innehåll');
        }
      } catch (error) {
        console.error('Error removing content:', error);
        toast.error('Fel vid borttagning av innehåll');
      }
    } else {
      // For new packages, just remove from local state
      setPackageData(prev => ({
        ...prev,
        contents: prev.contents.filter(content => content.id !== id),
      }));
    }
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
    if (!initialPackage?.id) {
      toast.error('Kan inte spara innehåll för nya paket');
      return;
    }

    setLoading(true);
    setSavingContentId(contentId);
    try {
      const content = packageData.contents.find(c => c.id === contentId);
      if (!content) {
        toast.error('Innehåll hittades inte');
        return;
      }

      // Validate content based on type
      if (content.contentType === 'lesson' && !content.lessonTypeId) {
        toast.error('Lektionstyp måste väljas för lektionsinnehåll');
        return;
      }

      if (content.contentType === 'text' && !content.freeText?.trim()) {
        toast.error('Fri text måste fyllas i');
        return;
      }

      // Prepare data for API
      const contentData = {
        lessonTypeId: content.lessonTypeId || null,
        handledarSessionId: content.handledarSessionId || null,
        credits: content.credits,
        contentType: content.contentType,
        freeText: content.freeText || null,
        sortOrder: content.sortOrder || 0,
      };

      const response = await fetch(`/api/admin/packages/${initialPackage.id}/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentData),
      });

      if (response.ok) {
        // Mark as saved
        setPackageData(prev => ({
          ...prev,
          contents: prev.contents.map(content => 
            content.id === contentId ? { ...content, hasChanges: false } : content
          ),
        }));
        toast.success('Innehåll sparat!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fel vid sparning av innehåll');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Fel vid sparning av innehåll');
    } finally {
      setLoading(false);
      setSavingContentId(null);
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

  const onSubmit = async () => {
    try {
      setSubmitting(true);
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
        if (content.contentType === 'text' && !content.freeText?.trim()) {
          toast.error('Alla textinnehåll måste ha text');
          return;
        }
        if ((content.credits ?? 0) < 0) {
          toast.error('Krediter kan inte vara negativa');
          return;
        }
      }

      // If no contents, ask for confirmation first
      if (packageData.contents.length === 0 && !confirmEmptyOpen) {
        setConfirmEmptyOpen(true);
        return;
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
    } finally {
      setSubmitting(false);
    }
  };

  const proceedSaveEmpty = async () => {
    setConfirmEmptyOpen(false);
    // Call onSubmit again but skip confirmation gate
    try {
      setSubmitting(true);
      if (initialPackage) {
        if (onUpdate) {
          await onUpdate(packageData);
          toast.success('Paket uppdaterat!');
        }
      } else {
        await onSave(packageData);
        toast.success('Paket skapat!');
      }
      onClose();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Fel vid sparning av paket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
          <div className="p-6 sm:p-8">
            {invalidData ? (
              <div>
                <h3 className="text-xl font-bold text-white">Laddningsfel</h3>
                <p className="mt-2 text-white/80">Ett fel uppstod vid laddning av paketbyggaren. Data kunde inte hämtas korrekt.</p>
                <div className="mt-4 flex justify-end"><Button onClick={onClose} variant="outline" className="border-white/20">Stäng</Button></div>
              </div>
            ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-sky-400" />
                  <h3 className="text-2xl font-bold text-white">
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
                      type="text"
                      inputMode="numeric"
                      value={packageData.price}
                      onChange={(e) => setPackageData({...packageData, price: e.target.value.replace(/[^0-9.]/g, '')})}
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
                      type="text"
                      inputMode="numeric"
                      value={packageData.priceStudent || ''}
                      onChange={(e) => setPackageData({...packageData, priceStudent: e.target.value.replace(/[^0-9.]/g, '')})}
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
                      type="text"
                      inputMode="numeric"
                      value={packageData.salePrice || ''}
                      onChange={(e) => setPackageData({...packageData, salePrice: e.target.value.replace(/[^0-9.]/g, '')})}
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
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Lägg till
                        <DropdownIcon className="w-4 h-4 ml-2" />
                      </Button>
                      {showAddDropdown && (
                        <div className="absolute right-0 top-full mt-2 z-10 min-w-[220px] rounded-lg overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => addContent('lesson')}
                              className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
                            >
                              📚 Lektion
                            </button>
                            <button
                              type="button"
                              onClick={() => addContent('handledar')}
                              className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
                            >
                              🚗 Handledarkredit (Generisk)
                            </button>
                            <button
                              type="button"
                              onClick={() => addContent('text')}
                              className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
                            >
                              📝 Fri text/Perk
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {contentsLoading && (
                      <div className="flex items-center justify-center py-10 text-white/80">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Laddar innehåll...
                      </div>
                    )}
                    {!contentsLoading && packageData.contents.map((content, index) => (
                      <div key={content.id} className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-white/60 cursor-move" />
                            <span className="text-white font-medium">Innehåll {index + 1}</span>
                          </div>
                          <div className="flex gap-1">
                            {content.hasChanges && initialPackage?.id && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => saveContentRow(content.id)}
                                disabled={loading}
                                className="text-green-300 hover:text-green-100 hover:bg-green-500/20"
                                title="Spara ändringar"
                              >
                                {savingContentId === content.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
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
                            <Label className="text-white/90 text-sm">
                              {content.contentType === 'lesson' ? 'Lektionstyp' : 
                               content.contentType === 'handledar' ? 'Handledarkredit' : 'Fri text'}
                            </Label>
                            {content.contentType === 'lesson' ? (
                              <select
                                value={content.lessonTypeId || ''}
                                onChange={(e) => updateContent(content.id, 'lessonTypeId', e.target.value)}
                                className="w-full bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg px-3 py-2 text-sm focus:bg-white/20 focus:border-white/50"
                              >
                                <option value="" className="bg-gray-800 text-white">Välj lektionstyp</option>
                                {getAvailableLessonTypes(content.id).map(type => (
                                  <option key={`available-${type.id}`} value={type.id} className="bg-gray-800 text-white">
                                    {type.name}
                                  </option>
                                ))}
                                {/* Add currently selected option if it exists */}
                                {content.lessonTypeId && lessonTypes.find(lt => lt.id === content.lessonTypeId) && (
                                  <option key={`selected-${content.lessonTypeId}`} value={content.lessonTypeId} className="bg-gray-800 text-white">
                                    {lessonTypes.find(lt => lt.id === content.lessonTypeId)?.name}
                                  </option>
                                )}
                              </select>
                            ) : content.contentType === 'handledar' ? (
                              <div className="text-white/60 text-sm p-2 bg-white/5 rounded border border-white/20">
                                Generisk handledarkredit - används för alla handledarutbildningar
                              </div>
                            ) : (
                              <div className="text-white/60 text-sm p-2 bg-white/5 rounded border border-white/20">
                                Fritextfält - ingen val krävs
                              </div>
                            )}
                          </div>
                          <div>
                            {content.contentType !== 'text' && (
                              <>
                                <Label className="text-white/90 text-sm">Antal krediter</Label>
                                <div className="relative">
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={content.credits}
                                    onChange={(e) => updateContent(content.id, 'credits', Math.max(0, parseInt(e.target.value) || 0))}
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
                              </>
                            )}
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

                    {!contentsLoading && packageData.contents.length === 0 && (
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
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white border-0 transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sparar...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Spara Paket
                    </>
                  )}
                </Button>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
    {confirmEmptyOpen ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">Tomt paketinnehåll</h4>
          <p className="text-white/80 mb-4">Paketet saknar innehåll. Är du säker på att du vill spara ändå? Du måste lägga till innehåll senare för att ge paketet värde.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmEmptyOpen(false)} className="border-white/20">Avbryt</Button>
            <Button onClick={proceedSaveEmpty} className="bg-sky-500 hover:bg-sky-600 text-white">Spara ändå</Button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
};

export default PackageBuilderPopover;
