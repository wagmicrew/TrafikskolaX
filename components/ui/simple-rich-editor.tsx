'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { cn } from '@/lib/utils';

interface FlowbiteWysiwygEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

export interface FlowbiteWysiwygEditorRef {
  insertText: (text: string) => void;
  focus: () => void;
  blur: () => void;
}

const FlowbiteWysiwygEditor = forwardRef<FlowbiteWysiwygEditorRef, FlowbiteWysiwygEditorProps>(({
  value = '',
  onChange,
  placeholder = 'Skriv här...',
  className,
  height = 400,
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);

  useEffect(() => {
    if (!editorRef.current || editorInstanceRef.current) return;

    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'flex flex-wrap items-center gap-2 p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg';
    toolbar.innerHTML = `
      <div class="flex flex-wrap items-center gap-1">
        <!-- Bold -->
        <button type="button" id="boldBtn" class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Fet stil">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5h4.5a3.5 3.5 0 1 1 0 7H8m0-7v7m0-7H6m2 7h6.5a3.5 3.5 0 1 1 0 7H8m0-7v7m0 0H6"/>
          </svg>
        </button>

        <!-- Italic -->
        <button type="button" id="italicBtn" class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Kursiv">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 4h-9m4 16h6M14 20l-4-16"/>
          </svg>
        </button>

        <!-- Underline -->
        <button type="button" id="underlineBtn" class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Understruken">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h12M6 4v12M6 16h12"/>
          </svg>
        </button>

        <!-- Strikethrough -->
        <button type="button" id="strikeBtn" class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Genomstruken">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h12M6 4v12M6 16h12M12 8l4 4M8 12l4-4"/>
          </svg>
        </button>

        <!-- Heading -->
        <select id="headingSelect" class="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors" title="Rubriknivå">
          <option value="p">Normal</option>
          <option value="h1">Rubrik 1</option>
          <option value="h2">Rubrik 2</option>
          <option value="h3">Rubrik 3</option>
          <option value="h4">Rubrik 4</option>
          <option value="h5">Rubrik 5</option>
          <option value="h6">Rubrik 6</option>
        </select>
      </div>

      <div class="flex flex-wrap items-center gap-1">
        <!-- Link -->
        <button type="button" id="linkBtn" class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Infoga länk">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-3 3a5 5 0 0 0 0 7.07z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l3-3a5 5 0 0 0 0-7.07z"/>
          </svg>
        </button>

        <!-- Image -->
        <button type="button" id="imageBtn" class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Infoga bild">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </button>

        <!-- List -->
        <button type="button" id="listBtn" class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Punktlista">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <!-- Ordered List -->
        <button type="button" id="orderedListBtn" class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Numrerad lista">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6h8m-8 4h8m-8 4h8M6 6v4m0-4v8m0-8h2m-2 8h2"/>
          </svg>
        </button>

        <!-- Text Alignment -->
        <select id="alignSelect" class="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors" title="Textjustering">
          <option value="left">Vänster</option>
          <option value="center">Centrerad</option>
          <option value="right">Höger</option>
          <option value="justify">Justerad</option>
        </select>
      </div>
    `;

    // Create editable content area
    const contentArea = document.createElement('div');
    contentArea.className = 'p-4 focus:outline-none min-h-[300px] prose prose-sm max-w-none format lg:format-lg dark:format-invert';
    contentArea.setAttribute('data-placeholder', placeholder);
    contentArea.innerHTML = value || '<p><br></p>';

    // Add placeholder styling
    const style = document.createElement('style');
    style.textContent = `
      [contenteditable="true"]:empty:before {
        content: attr(data-placeholder);
        color: #9ca3af;
        pointer-events: none;
      }
      .ProseMirror-focused {
        outline: none;
      }
    `;
    document.head.appendChild(style);

    // Clear editor content and add toolbar and content area
    editorRef.current.innerHTML = '';
    editorRef.current.appendChild(toolbar);
    editorRef.current.appendChild(contentArea);

    // Initialize TipTap editor
    const editor = new Editor({
      element: contentArea,
      extensions: [
        StarterKit,
        Highlight,
        Underline,
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Image,
      ],
      content: value || '<p><br></p>',
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        onChange?.(html);
      },
      editorProps: {
        attributes: {
          class: 'format lg:format-lg dark:format-invert focus:outline-none format-blue max-w-none',
        },
                },
              });

    editorInstanceRef.current = editor;

    // Set up toolbar event listeners
    const boldBtn = toolbar.querySelector('#boldBtn') as HTMLButtonElement;
    const italicBtn = toolbar.querySelector('#italicBtn') as HTMLButtonElement;
    const underlineBtn = toolbar.querySelector('#underlineBtn') as HTMLButtonElement;
    const strikeBtn = toolbar.querySelector('#strikeBtn') as HTMLButtonElement;
    const headingSelect = toolbar.querySelector('#headingSelect') as HTMLSelectElement;
    const linkBtn = toolbar.querySelector('#linkBtn') as HTMLButtonElement;
    const imageBtn = toolbar.querySelector('#imageBtn') as HTMLButtonElement;
    const listBtn = toolbar.querySelector('#listBtn') as HTMLButtonElement;
    const orderedListBtn = toolbar.querySelector('#orderedListBtn') as HTMLButtonElement;
    const alignSelect = toolbar.querySelector('#alignSelect') as HTMLSelectElement;

    // Bold functionality
    boldBtn?.addEventListener('click', () => {
      if (editor.isEditable) {
        editor.chain().focus().toggleBold().run();
      }
    });

    // Italic functionality
    italicBtn?.addEventListener('click', () => {
      if (editor.isEditable) {
        editor.chain().focus().toggleItalic().run();
      }
    });

    // Underline functionality
    underlineBtn?.addEventListener('click', () => {
      if (editor.isEditable) {
        editor.chain().focus().toggleUnderline().run();
      }
    });

    // Strikethrough functionality
    strikeBtn?.addEventListener('click', () => {
      if (editor.isEditable) {
        editor.chain().focus().toggleStrike().run();
      }
    });

    // Heading functionality
    headingSelect?.addEventListener('change', () => {
      if (editor.isEditable) {
        const value = headingSelect.value;
        if (value === 'p') {
          editor.chain().focus().setParagraph().run();
        } else {
          editor.chain().focus().toggleHeading({ level: parseInt(value.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
        }
        headingSelect.value = 'p';
      }
    });

    // Link functionality
    linkBtn?.addEventListener('click', () => {
      if (editor.isEditable) {
        const url = window.prompt('Ange länk-URL:', 'https://');
        if (url) {
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
      }
    });

    // Image functionality
    imageBtn?.addEventListener('click', () => {
      if (editor.isEditable) {
        const url = window.prompt('Ange bild-URL:', 'https://');
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    });

    // List functionality
    listBtn?.addEventListener('click', () => {
      if (editor.isEditable) {
        editor.chain().focus().toggleBulletList().run();
      }
    });

    // Ordered list functionality
    orderedListBtn?.addEventListener('click', () => {
      if (editor.isEditable) {
        editor.chain().focus().toggleOrderedList().run();
      }
    });

    // Text alignment functionality
    alignSelect?.addEventListener('change', () => {
      if (editor.isEditable) {
        editor.chain().focus().setTextAlign(alignSelect.value).run();
      }
    });

    return () => {
      editor.destroy();
    };
  }, [value, onChange, placeholder]);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorInstanceRef.current && value !== editorInstanceRef.current.getHTML()) {
      editorInstanceRef.current.commands.setContent(value || '<p><br></p>');
    }
  }, [value]);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (editorInstanceRef.current && editorInstanceRef.current.isEditable) {
        editorInstanceRef.current.chain().focus().insertContent(text).run();
      }
    },
    focus: () => {
      if (editorInstanceRef.current && editorInstanceRef.current.isEditable) {
        editorInstanceRef.current.commands.focus();
      }
    },
    blur: () => {
      if (editorInstanceRef.current && editorInstanceRef.current.isEditable) {
        // TipTap doesn't have a blur command, but we can focus on document body
        (document.activeElement as HTMLElement)?.blur();
      }
    },
  }));

  return (
    <div
      ref={editorRef}
      className={cn("border border-gray-200 rounded-lg bg-white overflow-hidden", className)}
      style={{ height: `${height}px` }}
    >
      {/* Editor will be initialized here */}
    </div>
  );
});

FlowbiteWysiwygEditor.displayName = 'FlowbiteWysiwygEditor';

export { FlowbiteWysiwygEditor };
