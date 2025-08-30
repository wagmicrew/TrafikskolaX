import React from 'react';
import { TRIGGER_DEFINITIONS, TriggerDefinition } from '@/lib/email/trigger-definitions';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmailTriggerType } from '@/lib/email/types';
import { 
  Card, 
  CardContent,
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Hash, Variable } from 'lucide-react';

interface EmailVariableSelectorProps {
  triggerType: EmailTriggerType;
  onInsertVariable: (variable: string) => void;
  className?: string;
}

export const EmailVariableSelector: React.FC<EmailVariableSelectorProps> = ({
  triggerType,
  onInsertVariable,
  className
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  
  // Find current trigger definition
  const triggerDefinition = TRIGGER_DEFINITIONS.find(
    trigger => trigger.id === triggerType
  );
  
  // If no trigger definition found, display message
  if (!triggerDefinition) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Variabler</CardTitle>
          <CardDescription>
            Ingen triggertyp vald eller definierad
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get available variables
  const availableVariables = triggerDefinition.availableVariables || [];
  
  // Group variables by category based on their prefix
  const getVariableCategory = (variable: string): string => {
    if (variable.startsWith('{{user.')) return 'user';
    if (variable.startsWith('{{booking.')) return 'booking';
    if (variable.startsWith('{{payment.')) return 'payment';
    if (variable.startsWith('{{teacher.')) return 'teacher';
    if (variable.startsWith('{{school')) return 'school';
    return 'other';
  };

  // Filter variables by selected category
  const filteredVariables = selectedCategory === 'all'
    ? availableVariables
    : availableVariables.filter(v => getVariableCategory(v) === selectedCategory);

  // Get unique categories
  const categories = ['all', ...new Set(availableVariables.map(getVariableCategory))];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Variabler</CardTitle>
        <CardDescription>
          Tillgängliga variabler för {triggerDefinition.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select 
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Välj kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'Alla variabler' : category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-1 gap-2">
            {filteredVariables.map((variable, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start"
                onClick={() => onInsertVariable(variable)}
              >
                <Variable className="h-4 w-4 mr-2" />
                {variable}
              </Button>
            ))}

            {filteredVariables.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                Inga variabler tillgängliga
              </div>
            )}
          </div>

          <div className="p-2 bg-muted rounded-md text-xs text-muted-foreground">
            <p className="flex items-center mb-1">
              <Hash className="h-3 w-3 mr-1" />
              <strong>När skickas detta mail:</strong>
            </p>
            <p>{triggerDefinition.whenTriggered}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
