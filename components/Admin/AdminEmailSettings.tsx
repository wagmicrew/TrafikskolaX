import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { emailTemplates } from '@/lib/db/schema';
import { useToast } from '@/lib/hooks/use-toast';

const AdminEmailSettings = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await db.select().from(emailTemplates);
      setTemplates(response);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({ title: 'Error', description: 'Failed to fetch email templates.', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleTemplateChange = (field, value) => {
    setSelectedTemplate((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    try {
      await db.update(emailTemplates)
        .set({
          subject: selectedTemplate.subject,
          htmlContent: selectedTemplate.htmlContent,
        })
        .where(eq(emailTemplates.id, selectedTemplate.id));

      toast({ title: 'Success', description: 'Template updated successfully.', variant: 'success' });
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast({ title: 'Error', description: 'Failed to update email template.', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Email Templates</h1>

      <div className="flex">
        <div className="w-1/3 pr-4">
          <ul>
            {isLoading ? (
              <li>Loading...</li>
            ) : (
              templates.map((template) => (
                <li
                  key={template.id}
                  className={`p-2 cursor-pointer ${selectedTemplate?.id === template.id ? 'bg-blue-200' : ''}`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  {template.triggerType}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="w-2/3">
          {selectedTemplate && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={selectedTemplate.subject}
                onChange={(e) => handleTemplateChange('subject', e.target.value)}
                className="mt-1 mb-4 p-2 border border-gray-300 w-full"
              />

              <label className="block text-sm font-medium text-gray-700">HTML Content</label>
              <textarea
                value={selectedTemplate.htmlContent}
                onChange={(e) => handleTemplateChange('htmlContent', e.target.value)}
                rows={10}
                className="mt-1 mb-4 p-2 border border-gray-300 w-full"
              />

              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEmailSettings;
