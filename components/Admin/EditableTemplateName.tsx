'use client';

import { useState, useRef, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditableTemplateNameProps {
  templateId: string;
  currentName: string;
  onSave: (templateId: string, newName: string) => Promise<void>;
  className?: string;
}

export default function EditableTemplateName({
  templateId,
  currentName,
  onSave,
  className = ''
}: EditableTemplateNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setName(currentName);
  };

  const handleSave = async () => {
    if (name.trim() === '') {
      toast.error('Namn kan inte vara tomt');
      return;
    }

    if (name.trim() === currentName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(templateId, name.trim());
      setIsEditing(false);
      toast.success('Mallnamn uppdaterat');
    } catch (error) {
      console.error('Error saving template name:', error);
      toast.error('Fel vid uppdatering av mallnamn');
      setName(currentName);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(currentName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSaving}
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors"
          title="Spara"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
          title="Avbryt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <span className="flex-1 font-medium text-gray-900">{currentName}</span>
      <button
        onClick={handleEdit}
        className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
        title="Redigera namn"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  );
}

