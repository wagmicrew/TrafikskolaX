import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FlowbiteWysiwygEditor, FlowbiteWysiwygEditorRef } from '@/components/ui/simple-rich-editor';

export interface EmailEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

export interface EmailEditorRef {
  insertText: (text: string) => void;
  getHTML: () => string;
  setContent: (html: string) => void;
  focus: () => void;
  blur: () => void;
}

const EmailEditor = forwardRef<EmailEditorRef, EmailEditorProps>((props, ref) => {
  const { value, onChange, placeholder = 'Skriv här...', className, height = 400 } = props;
  const editorRef = useRef<FlowbiteWysiwygEditorRef>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Client-side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (editorRef.current) {
        editorRef.current.insertText(text);
      }
    },
    getHTML: () => {
      return value;
    },
    setContent: (html: string) => {
      onChange(html);
    },
    focus: () => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    },
    blur: () => {
      if (editorRef.current) {
        editorRef.current.blur();
      }
    }
  }));

  if (!isMounted) {
    return <div className="border border-slate-200 rounded-md" style={{ height: `${height}px` }}>Loading editor...</div>;
  }

  return (
    <FlowbiteWysiwygEditor
      ref={editorRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      height={height}
    />
  );
});

EmailEditor.displayName = 'EmailEditor';

export { EmailEditor };
