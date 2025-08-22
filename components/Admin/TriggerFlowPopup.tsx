'use client';

import { useState } from 'react';
import { X, Search, Mail, Clock, User, CreditCard, BookOpen, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TRIGGER_DEFINITIONS, getAllTriggerCategories, getTriggersByCategory, type TriggerDefinition } from '@/lib/email/trigger-definitions';

interface TriggerFlowPopupProps {
  open: boolean;
  onClose: () => void;
  onSelectTrigger?: (trigger: TriggerDefinition) => void;
}

const categoryIcons: Record<string, any> = {
  authentication: User,
  booking: BookOpen,
  handledar: User,
  payment: CreditCard,
  admin: Settings,
  system: AlertCircle,
};

const categoryColors: Record<string, string> = {
  authentication: 'bg-blue-100 text-blue-800 border-blue-200',
  booking: 'bg-green-100 text-green-800 border-green-200',
  handledar: 'bg-purple-100 text-purple-800 border-purple-200',
  payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  admin: 'bg-gray-100 text-gray-800 border-gray-200',
  system: 'bg-red-100 text-red-800 border-red-200',
};

export function TriggerFlowPopup({ open, onClose, onSelectTrigger }: TriggerFlowPopupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = getAllTriggerCategories();
  
  const filteredTriggers = TRIGGER_DEFINITIONS.filter(trigger => {
    const matchesSearch = trigger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trigger.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trigger.triggerLocation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || trigger.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedTriggers = categories.reduce((acc, category) => {
    acc[category] = getTriggersByCategory(category).filter(trigger => 
      selectedCategory === 'all' || selectedCategory === category
    ).filter(trigger => 
      trigger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trigger.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trigger.triggerLocation.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return acc;
  }, {} as Record<string, TriggerDefinition[]>);

  const handleTriggerSelect = (trigger: TriggerDefinition) => {
    if (onSelectTrigger) {
      onSelectTrigger(trigger);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-xl shadow-2xl border z-[60]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-post Triggers & Flödesöversikt
          </DialogTitle>
        </DialogHeader>

        <div className="flex-shrink-0 space-y-4 mb-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Sök triggers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">Alla ({TRIGGER_DEFINITIONS.length})</TabsTrigger>
              {categories.map(category => {
                const count = getTriggersByCategory(category).length;
                const Icon = categoryIcons[category];
                return (
                  <TabsTrigger key={category} value={category} className="flex items-center gap-1">
                    <Icon className="h-3 w-3" />
                    {category === 'authentication' ? 'Auth' : 
                     category === 'booking' ? 'Bokning' :
                     category === 'handledar' ? 'Handledar' :
                     category === 'payment' ? 'Betalning' :
                     category === 'admin' ? 'Admin' : 'System'} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="space-y-6">
            {selectedCategory === 'all' ? (
              categories.map(category => {
                const triggers = groupedTriggers[category];
                if (triggers.length === 0) return null;
                
                const Icon = categoryIcons[category];
                const categoryName = category === 'authentication' ? 'Autentisering' :
                                   category === 'booking' ? 'Bokningar' :
                                   category === 'handledar' ? 'Handledarutbildning' :
                                   category === 'payment' ? 'Betalningar' :
                                   category === 'admin' ? 'Administration' : 'System';

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Icon className="h-5 w-5" />
                      <h3 className="font-semibold text-lg">{categoryName}</h3>
                      <Badge variant="outline">{triggers.length}</Badge>
                    </div>
                    <div className="grid gap-3">
                      {triggers.map(trigger => (
                        <TriggerCard 
                          key={trigger.id} 
                          trigger={trigger} 
                          onSelect={onSelectTrigger ? () => handleTriggerSelect(trigger) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid gap-3">
                {filteredTriggers.map(trigger => (
                  <TriggerCard 
                    key={trigger.id} 
                    trigger={trigger} 
                    onSelect={onSelectTrigger ? () => handleTriggerSelect(trigger) : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          {filteredTriggers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Inga triggers hittades med din sökning.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TriggerCardProps {
  trigger: TriggerDefinition;
  onSelect?: () => void;
}

function TriggerCard({ trigger, onSelect }: TriggerCardProps) {
  return (
    <div 
      className={`border rounded-lg p-4 space-y-3 ${onSelect ? 'hover:bg-gray-50 cursor-pointer' : ''} transition-colors`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{trigger.name}</h4>
            <Badge className={categoryColors[trigger.category]} variant="outline">
              {trigger.category}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-2">{trigger.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="flex items-center gap-1 text-gray-500 mb-1">
            <Clock className="h-3 w-3" />
            <span className="font-medium">När:</span>
          </div>
          <p className="text-gray-700">{trigger.whenTriggered}</p>
        </div>
        
        <div>
          <div className="flex items-center gap-1 text-gray-500 mb-1">
            <Settings className="h-3 w-3" />
            <span className="font-medium">Plats i flödet:</span>
          </div>
          <p className="text-gray-700">{trigger.flowPosition}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kodfil:</span>
          <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1">{trigger.triggerLocation}</p>
        </div>

        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Standard mottagare:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {trigger.defaultReceivers.map(receiver => (
              <Badge key={receiver} variant="secondary" className="text-xs">
                {receiver === 'student' ? 'Elev' :
                 receiver === 'teacher' ? 'Lärare' :
                 receiver === 'admin' ? 'Admin' :
                 receiver === 'supervisor' ? 'Handledare' :
                 receiver === 'school' ? 'Skola' : receiver}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tillgängliga variabler:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {trigger.availableVariables.slice(0, 6).map(variable => (
              <Badge key={variable} variant="outline" className="text-xs font-mono">
                {variable}
              </Badge>
            ))}
            {trigger.availableVariables.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{trigger.availableVariables.length - 6} till
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
