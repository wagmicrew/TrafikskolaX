import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmailTemplate } from '@/lib/email/types';
import { Plus, Trash, Copy } from 'lucide-react';

interface EmailTemplateSelectProps {
  templates: EmailTemplate[];
  selectedTemplate: EmailTemplate | null;
  onTemplateSelect: (template: EmailTemplate) => void;
  onCreateTemplate: () => void;
  onDuplicateTemplate: (template: EmailTemplate) => void;
  onDeleteTemplate: (template: EmailTemplate) => void;
  isLoading: boolean;
}

export const EmailTemplateSelect: React.FC<EmailTemplateSelectProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onCreateTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  isLoading,
}) => {
  const groupedTemplates = templates.reduce<Record<string, EmailTemplate[]>>((acc, template) => {
    const category = template.triggerType.split('_')[0] || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {});

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Mallar</CardTitle>
        <CardDescription>
          Välj en mall att redigera eller skapa en ny
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select 
            disabled={isLoading}
            value={selectedTemplate?.id || ''}
            onValueChange={(value) => {
              const template = templates.find(t => t.id === value);
              if (template) {
                onTemplateSelect(template);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Välj en mall..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category} className="mb-2">
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase">
                    {category}
                  </div>
                  {categoryTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.subject || template.triggerType}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>

          {selectedTemplate && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onDuplicateTemplate(selectedTemplate)}
                disabled={isLoading}
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicera
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onDeleteTemplate(selectedTemplate)}
                disabled={isLoading}
              >
                <Trash className="h-4 w-4 mr-1" />
                Ta bort
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onCreateTemplate}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-1" />
          Skapa ny mall
        </Button>
      </CardFooter>
    </Card>
  );
};
