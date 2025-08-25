'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Code, AlertTriangle, CheckCircle } from 'lucide-react';

interface JSXEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

export interface JSXEditorRef {
  insertText: (text: string) => void;
  focus: () => void;
  blur: () => void;
  getJSXContent: () => string;
  setJSXContent: (content: string) => void;
}

interface JSXElement {
  type: 'element' | 'text' | 'component';
  tag?: string;
  props?: Record<string, any>;
  children?: JSXElement[];
  content?: string;
  raw?: string;
}

const JSXEditor = forwardRef<JSXEditorRef, JSXEditorProps>(({
  value = '',
  onChange,
  placeholder = 'Skriv JSX här...',
  className,
  height = 500,
}, ref) => {
  const [jsxContent, setJSXContent] = useState(value);
  const [parsedJSX, setParsedJSX] = useState<JSXElement[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'code' | 'visual' | 'preview'>('code');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Simple JSX parser
  const parseJSX = (jsx: string): { elements: JSXElement[], errors: string[] } => {
    const errors: string[] = [];
    const elements: JSXElement[] = [];

    try {
      // Basic JSX parsing - this is a simplified version
      // In a real implementation, you'd use a proper JSX parser like @babel/parser
      
      // Remove comments
      const cleanJSX = jsx.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      
      // Find JSX elements
      const elementRegex = /<(\w+)([^>]*?)>([\s\S]*?)<\/\1>|<(\w+)([^>]*?)\/>/g;
      let match;
      
      while ((match = elementRegex.exec(cleanJSX)) !== null) {
        const [fullMatch, tag1, props1, children, tag2, props2] = match;
        const tag = tag1 || tag2;
        const props = props1 || props2;
        
        // Parse props
        const parsedProps: Record<string, any> = {};
        if (props) {
          const propRegex = /(\w+)=(?:{([^}]+)}|"([^"]+)"|'([^']+)')/g;
          let propMatch;
          while ((propMatch = propRegex.exec(props)) !== null) {
            const [, propName, jsValue, stringValue1, stringValue2] = propMatch;
            parsedProps[propName] = jsValue || stringValue1 || stringValue2;
          }
        }
        
        elements.push({
          type: tag && tag[0] === tag[0].toUpperCase() ? 'component' : 'element',
          tag,
          props: parsedProps,
          children: children ? parseJSX(children).elements : [],
          raw: fullMatch
        });
      }
      
      // Find text content
      const textContent = cleanJSX.replace(elementRegex, '').trim();
      if (textContent) {
        elements.push({
          type: 'text',
          content: textContent,
          raw: textContent
        });
      }
      
    } catch (error) {
      errors.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return { elements, errors };
  };

  // Update parsed JSX when content changes
  useEffect(() => {
    const { elements, errors } = parseJSX(jsxContent);
    setParsedJSX(elements);
    setParseErrors(errors);
  }, [jsxContent]);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = jsxContent.substring(0, start) + text + jsxContent.substring(end);
        setJSXContent(newValue);
        onChange?.(newValue);
        
        // Set cursor position after inserted text
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + text.length;
          textarea.focus();
        }, 0);
      }
    },
    focus: () => textareaRef.current?.focus(),
    blur: () => textareaRef.current?.blur(),
    getJSXContent: () => jsxContent,
    setJSXContent: (content: string) => {
      setJSXContent(content);
      onChange?.(content);
    },
  }));

  const handleContentChange = (newContent: string) => {
    setJSXContent(newContent);
    onChange?.(newContent);
  };

  const renderJSXElement = (element: JSXElement, index: number): React.ReactNode => {
    if (element.type === 'text') {
      return <span key={index} className="text-gray-800 dark:text-gray-200">{element.content}</span>;
    }
    
    return (
      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-2 mb-2">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={element.type === 'component' ? 'default' : 'secondary'}>
            {element.tag}
          </Badge>
          {element.props && Object.keys(element.props).length > 0 && (
            <Badge variant="outline">
              {Object.keys(element.props).length} props
            </Badge>
          )}
        </div>
        {element.props && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {Object.entries(element.props).map(([key, value]) => (
              <div key={key}>
                <code>{key}={typeof value === 'string' ? `"${value}"` : `{${value}}`}</code>
              </div>
            ))}
          </div>
        )}
        {element.children && element.children.length > 0 && (
          <div className="ml-4 border-l border-gray-300 dark:border-gray-600 pl-2">
            {element.children.map((child, childIndex) => renderJSXElement(child, childIndex))}
          </div>
        )}
      </div>
    );
  };

  const insertCommonJSX = (jsx: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = jsxContent.substring(0, start) + jsx + jsxContent.substring(end);
      setJSXContent(newValue);
      onChange?.(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + jsx.length;
        textarea.focus();
      }, 0);
    }
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <div className="border-b bg-gray-50 dark:bg-gray-800 p-2">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Kod
              </TabsTrigger>
              <TabsTrigger value="visual" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Visuell
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Förhandsvisning
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              {parseErrors.length > 0 ? (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {parseErrors.length} fel
                </Badge>
              ) : (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Giltig JSX
                </Badge>
              )}
            </div>
          </div>
        </div>

        <TabsContent value="code" className="p-0">
          <div className="flex">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={jsxContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={placeholder}
                className="w-full p-4 font-mono text-sm resize-none focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                style={{ height: `${height}px` }}
              />
            </div>
            <div className="w-64 border-l bg-gray-50 dark:bg-gray-800 p-2">
              <h4 className="font-semibold mb-2 text-sm">Vanliga JSX-element</h4>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => insertCommonJSX('<div className="">\n  \n</div>')}
                >
                  div
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => insertCommonJSX('<p className="">\n  \n</p>')}
                >
                  p
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => insertCommonJSX('<h1 className="">\n  \n</h1>')}
                >
                  h1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => insertCommonJSX('<Button variant="default">\n  \n</Button>')}
                >
                  Button
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => insertCommonJSX('<Card>\n  <CardContent>\n    \n  </CardContent>\n</Card>')}
                >
                  Card
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="visual" className="p-4">
          <div style={{ height: `${height - 100}px`, overflowY: 'auto' }}>
            {parseErrors.length > 0 && (
              <Card className="mb-4 border-red-200 dark:border-red-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Parse-fel
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {parseErrors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-2">
              {parsedJSX.length > 0 ? (
                parsedJSX.map((element, index) => renderJSXElement(element, index))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Ingen giltig JSX hittades
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="p-4">
          <div 
            className="border rounded p-4 bg-white dark:bg-gray-900"
            style={{ height: `${height - 100}px`, overflowY: 'auto' }}
          >
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              JSX-förhandsvisning (kräver kompilering)
              <br />
              <small>I en riktig implementation skulle detta visa den renderade JSX:en</small>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

JSXEditor.displayName = 'JSXEditor';

export { JSXEditor };
