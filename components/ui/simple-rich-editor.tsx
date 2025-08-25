'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// Dynamic import to prevent SSR issues
const Puck = dynamic(() => import('@measured/puck').then(mod => ({ default: mod.Puck })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96 text-gray-500">Loading editor...</div>
});

// Import types separately to avoid SSR issues
import type { Data } from '@measured/puck';

// Import Puck components and config
import { Config } from '@measured/puck';
import '@measured/puck/puck.css';

interface SimpleRichEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

export interface SimpleRichEditorRef {
  insertText: (text: string) => void;
  focus: () => void;
  blur: () => void;
}

// Puck configuration for rich text editing
export const puckConfig: Config = {
  components: {
    Heading: {
      fields: {
        children: {
          type: "text",
          label: "Text",
        },
        level: {
          type: "select",
          label: "Heading Level",
          options: [
            { label: "H1", value: "1" },
            { label: "H2", value: "2" },
            { label: "H3", value: "3" },
            { label: "H4", value: "4" },
            { label: "H5", value: "5" },
            { label: "H6", value: "6" },
          ],
        },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Default", value: "default" },
            { label: "Large", value: "large" },
            { label: "Small", value: "small" },
          ],
        },
      },
      defaultProps: {
        children: "Heading Text",
        level: "2",
        style: "default",
      },
      render: ({ children, level, style }) => {
        const className = style === "large" ? "text-4xl font-bold" : 
                         style === "small" ? "text-lg font-medium" : 
                         "text-2xl font-semibold";
        
        switch (level) {
          case "1": return <h1 className={className}>{children}</h1>;
          case "2": return <h2 className={className}>{children}</h2>;
          case "3": return <h3 className={className}>{children}</h3>;
          case "4": return <h4 className={className}>{children}</h4>;
          case "5": return <h5 className={className}>{children}</h5>;
          case "6": return <h6 className={className}>{children}</h6>;
          default: return <h2 className={className}>{children}</h2>;
        }
      },
    },
    Paragraph: {
      fields: {
        children: {
          type: "textarea",
          label: "Text Content",
        },
        align: {
          type: "select",
          label: "Text Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
      },
      defaultProps: {
        children: "Enter your paragraph text here...",
        align: "left",
      },
      render: ({ children, align }) => (
        <p className={`text-${align} mb-4 leading-relaxed`}>{children}</p>
      ),
    },
    Text: {
      fields: {
        children: {
          type: "text",
          label: "Text",
        },
        bold: {
          type: "radio",
          label: "Font Weight",
          options: [
            { label: "Normal", value: false },
            { label: "Bold", value: true },
          ],
        },
        italic: {
          type: "radio",
          label: "Font Style",
          options: [
            { label: "Normal", value: false },
            { label: "Italic", value: true },
          ],
        },
        color: {
          type: "select",
          label: "Text Color",
          options: [
            { label: "Default", value: "text-gray-900" },
            { label: "Blue", value: "text-blue-600" },
            { label: "Green", value: "text-green-600" },
            { label: "Red", value: "text-red-600" },
          ],
        },
      },
      defaultProps: {
        children: "Text content",
        bold: false,
        italic: false,
        color: "text-gray-900",
      },
      render: ({ children, bold, italic, color }) => {
        const className = `${color} ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''}`;
        return <span className={className}>{children}</span>;
      },
    },
    List: {
      fields: {
        items: {
          type: "array",
          label: "List Items",
          arrayFields: {
            content: {
              type: "text",
              label: "Item Text",
            },
          },
        },
        ordered: {
          type: "radio",
          label: "List Type",
          options: [
            { label: "Unordered (•)", value: false },
            { label: "Ordered (1,2,3)", value: true },
          ],
        },
      },
      defaultProps: {
        items: [
          { content: "First item" },
          { content: "Second item" },
          { content: "Third item" },
        ],
        ordered: false,
      },
      render: ({ items, ordered }) => {
        const ListTag = ordered ? "ol" : "ul";
        const className = ordered ? "list-decimal list-inside space-y-2" : "list-disc list-inside space-y-2";
        return (
          <ListTag className={className}>
            {items?.map((item: any, index: number) => (
              <li key={index} className="leading-relaxed">{item.content}</li>
            ))}
          </ListTag>
        );
      },
    },
    Link: {
      fields: {
        children: {
          type: "text",
          label: "Link Text",
        },
        href: {
          type: "text",
          label: "URL",
        },
        target: {
          type: "select",
          label: "Open In",
          options: [
            { label: "Same window", value: "_self" },
            { label: "New window", value: "_blank" },
          ],
        },
      },
      defaultProps: {
        children: "Click here",
        href: "https://example.com",
        target: "_self",
      },
      render: ({ children, href, target }) => (
        <a 
          href={href} 
          target={target}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {children}
        </a>
      ),
    },
    Image: {
      fields: {
        src: {
          type: "text",
          label: "Image URL",
        },
        alt: {
          type: "text",
          label: "Alt Text",
        },
        width: {
          type: "number",
          label: "Width (px)",
        },
        height: {
          type: "number",
          label: "Height (px)",
        },
        rounded: {
          type: "radio",
          label: "Style",
          options: [
            { label: "Square", value: false },
            { label: "Rounded", value: true },
          ],
        },
      },
      defaultProps: {
        src: "https://via.placeholder.com/400x300",
        alt: "Placeholder image",
        width: 400,
        height: 300,
        rounded: false,
      },
      render: ({ src, alt, width, height, rounded }) => (
        <img
          src={src}
          alt={alt || ""}
          width={width || "auto"}
          height={height || "auto"}
          className={`max-w-full h-auto ${rounded ? 'rounded-lg' : ''}`}
        />
      ),
    },
    Hero: {
      fields: {
        title: { 
          type: "text",
          label: "Main Title"
        },
        subtitle: { 
          type: "textarea",
          label: "Subtitle"
        },
        backgroundColor: {
          type: "select",
          label: "Background Color",
          options: [
            { label: "Blue", value: "bg-blue-600" },
            { label: "Green", value: "bg-green-600" },
            { label: "Red", value: "bg-red-600" },
            { label: "Gray", value: "bg-gray-600" },
            { label: "Purple", value: "bg-purple-600" }
          ]
        }
      },
      defaultProps: {
        title: "Welcome to Our Site",
        subtitle: "This is a hero section with customizable content",
        backgroundColor: "bg-blue-600"
      },
      render: ({ title, subtitle, backgroundColor }) => (
        <section className={`${backgroundColor} text-white py-20 mb-8`}>
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{title}</h1>
            <p className="text-xl md:text-2xl opacity-90">{subtitle}</p>
          </div>
        </section>
      )
    },
    Button: {
      fields: {
        text: { 
          type: "text",
          label: "Button Text"
        },
        href: { 
          type: "text",
          label: "Link URL"
        },
        variant: {
          type: "select",
          label: "Button Style",
          options: [
            { label: "Primary (Blue)", value: "primary" },
            { label: "Secondary (Gray)", value: "secondary" },
            { label: "Success (Green)", value: "success" },
            { label: "Danger (Red)", value: "danger" }
          ]
        },
        size: {
          type: "select",
          label: "Button Size",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" }
          ]
        }
      },
      defaultProps: {
        text: "Click Me",
        href: "#",
        variant: "primary",
        size: "md"
      },
      render: ({ text, href, variant, size }) => {
        const variantClasses = {
          primary: "bg-blue-600 text-white hover:bg-blue-700",
          secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
          success: "bg-green-600 text-white hover:bg-green-700",
          danger: "bg-red-600 text-white hover:bg-red-700"
        };
        
        const sizeClasses = {
          sm: "px-4 py-2 text-sm",
          md: "px-6 py-3 text-base",
          lg: "px-8 py-4 text-lg"
        };
        
        return (
          <a
            href={href}
            className={`inline-block rounded-lg font-semibold transition-colors ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClasses[size as keyof typeof sizeClasses]}`}
          >
            {text}
          </a>
        );
      }
    },
    Spacer: {
      fields: {
        height: { 
          type: "number",
          label: "Height (px)"
        }
      },
      defaultProps: {
        height: 40
      },
      render: ({ height }) => <div style={{ height: `${height}px` }} className="w-full" />
    },
    Card: {
      fields: {
        title: {
          type: "text",
          label: "Card Title"
        },
        content: {
          type: "textarea",
          label: "Card Content"
        },
        imageUrl: {
          type: "text",
          label: "Image URL (optional)"
        }
      },
      defaultProps: {
        title: "Card Title",
        content: "This is the card content. You can add any text here.",
        imageUrl: ""
      },
      render: ({ title, content, imageUrl }) => (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-200">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
          <p className="text-gray-700 leading-relaxed">{content}</p>
        </div>
      )
    },
    Grid: {
      fields: {
        columns: {
          type: "select",
          label: "Number of Columns",
          options: [
            { label: "2 Columns", value: "2" },
            { label: "3 Columns", value: "3" },
            { label: "4 Columns", value: "4" }
          ]
        },
        gap: {
          type: "select",
          label: "Gap Size",
          options: [
            { label: "Small", value: "gap-4" },
            { label: "Medium", value: "gap-6" },
            { label: "Large", value: "gap-8" }
          ]
        }
      },
      defaultProps: {
        columns: "3",
        gap: "gap-6"
      },
      render: ({ columns, gap }) => (
        <div className={`grid grid-cols-1 md:grid-cols-${columns} ${gap} mb-6`}>
          <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 text-center">
            <p className="text-gray-600">Grid Item 1</p>
            <p className="text-sm text-gray-500 mt-2">Drag content here</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 text-center">
            <p className="text-gray-600">Grid Item 2</p>
            <p className="text-sm text-gray-500 mt-2">Drag content here</p>
          </div>
          {columns !== "2" && (
            <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 text-center">
              <p className="text-gray-600">Grid Item 3</p>
              <p className="text-sm text-gray-500 mt-2">Drag content here</p>
            </div>
          )}
          {columns === "4" && (
            <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300 text-center">
              <p className="text-gray-600">Grid Item 4</p>
              <p className="text-sm text-gray-500 mt-2">Drag content here</p>
            </div>
          )}
        </div>
      )
    },
    ImageGallery: {
      fields: {
        images: {
          type: "array",
          label: "Images",
          arrayFields: {
            src: { type: "text", label: "Image URL" },
            alt: { type: "text", label: "Alt Text" },
            caption: { type: "text", label: "Caption (optional)" }
          }
        },
        layout: {
          type: "select",
          label: "Gallery Layout",
          options: [
            { label: "Grid", value: "grid" },
            { label: "Masonry", value: "masonry" },
            { label: "Carousel", value: "carousel" }
          ]
        }
      },
      defaultProps: {
        images: [
          { src: "/images/placeholder1.jpg", alt: "Image 1", caption: "Sample Image 1" },
          { src: "/images/placeholder2.jpg", alt: "Image 2", caption: "Sample Image 2" },
          { src: "/images/placeholder3.jpg", alt: "Image 3", caption: "Sample Image 3" }
        ],
        layout: "grid"
      },
      render: ({ images, layout }) => (
        <div className="mb-6">
          <div className={`${layout === "grid" ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "flex flex-wrap gap-4"}`}>
            {images.map((image: any, index: number) => (
              <div key={index} className="relative group">
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                />
                {image.caption && (
                  <p className="text-sm text-gray-600 mt-2 text-center">{image.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    },
    Section: {
      fields: {
        backgroundColor: {
          type: "select",
          label: "Background Color",
          options: [
            { label: "White", value: "bg-white" },
            { label: "Light Gray", value: "bg-gray-50" },
            { label: "Dark Gray", value: "bg-gray-900" },
            { label: "Blue", value: "bg-blue-600" },
            { label: "Green", value: "bg-green-600" }
          ]
        },
        padding: {
          type: "select",
          label: "Padding",
          options: [
            { label: "Small", value: "py-8" },
            { label: "Medium", value: "py-16" },
            { label: "Large", value: "py-24" }
          ]
        },
        textColor: {
          type: "select",
          label: "Text Color",
          options: [
            { label: "Dark", value: "text-gray-900" },
            { label: "Light", value: "text-white" },
            { label: "Gray", value: "text-gray-600" }
          ]
        }
      },
      defaultProps: {
        backgroundColor: "bg-white",
        padding: "py-16",
        textColor: "text-gray-900"
      },
      render: ({ backgroundColor, padding, textColor }) => (
        <section className={`${backgroundColor} ${padding} ${textColor} w-full`}>
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Section Title</h2>
              <p className="text-lg opacity-80">Add your content here by dragging components into this section.</p>
            </div>
          </div>
        </section>
      )
    }
  },
  categories: {
    content: {
      title: "Content",
      components: ["Heading", "Paragraph", "Text", "List"]
    },
    media: {
      title: "Media",
      components: ["Image", "Hero"]
    },
    interactive: {
      title: "Interactive",
      components: ["Button", "Link"]
    },
    layout: {
      title: "Layout",
      components: ["Spacer", "Card", "Grid", "Section"]
    },
    gallery: {
      title: "Gallery",
      components: ["ImageGallery"]
    }
  }
};

const SimpleRichEditor = forwardRef<SimpleRichEditorRef, SimpleRichEditorProps>(({
  value = '',
  onChange,
  placeholder = 'Skriv här...',
  className,
  height = 400,
}, ref) => {
  const [data, setData] = React.useState<Data>(() => {
    try {
      // Try to parse existing HTML content into Puck format
      if (value && value.trim()) {
        // Enhanced HTML to Puck conversion
        const content = [];
        
        // Extract headings
        const headingMatches = value.match(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi);
        if (headingMatches) {
          headingMatches.forEach((match, index) => {
            const levelMatch = match.match(/<h([1-6])/);
            const textMatch = match.match(/>(.*?)</);
            if (levelMatch && textMatch) {
              content.push({
                type: "Heading",
                props: {
                  children: textMatch[1].replace(/<[^>]*>/g, ''),
                  level: levelMatch[1],
                  style: "default"
                },
              });
            }
          });
        }
        
        // Extract paragraphs
        const paragraphMatches = value.match(/<p[^>]*>(.*?)<\/p>/gi);
        if (paragraphMatches) {
          paragraphMatches.forEach((match, index) => {
            const textMatch = match.match(/>(.*?)</);
            if (textMatch && textMatch[1].trim()) {
              content.push({
                type: "Paragraph",
                props: {
                  children: textMatch[1].replace(/<[^>]*>/g, ''),
                  align: "left"
                },
              });
            }
          });
        }
        
        // Extract images
        const imageMatches = value.match(/<img[^>]*>/gi);
        if (imageMatches) {
          imageMatches.forEach((match, index) => {
            const srcMatch = match.match(/src="([^"]*)"/);
            const altMatch = match.match(/alt="([^"]*)"/);
            if (srcMatch) {
              content.push({
                type: "Image",
                props: {
                  src: srcMatch[1],
                  alt: altMatch ? altMatch[1] : '',
                  width: 'auto',
                  height: 'auto'
                },
              });
            }
          });
        }
        
        // If no structured content found, add as paragraph
        if (content.length === 0) {
          content.push({
            type: "Paragraph",
            props: { children: value.replace(/<[^>]*>/g, '') },
          });
        }
        
        // Ensure all content items have proper id and zones structure
        const processedContent = content.map((item, index) => ({
          ...item,
          props: {
            ...item.props,
            id: `item-${index}-${Date.now()}` // Ensure unique IDs
          }
        }));
        
        return {
          content: processedContent,
          root: { 
            props: {
              title: ""
            }
          },
          zones: {}
        };
      }
      // Return default content to show the drag & drop functionality
      return {
        content: [
          {
            type: "Heading",
            props: { 
              children: "Welcome to Puck Editor",
              level: "2",
              style: "default",
              id: `heading-${Date.now()}`
            },
          },
          {
            type: "Paragraph",
            props: { 
              children: "Drag components from the sidebar to build your content. Click on any component to edit its properties.",
              align: "left",
              id: `paragraph-${Date.now()}`
            },
          },
        ],
        root: { 
          props: {
            title: ""
          }
        },
        zones: {}
      };
    } catch {
      return {
        content: [
          {
            type: "Paragraph",
            props: { 
              children: "Start editing by dragging components from the sidebar.",
              id: `fallback-paragraph-${Date.now()}`
            },
          },
        ],
        root: { 
          props: {
            title: ""
          }
        },
        zones: {}
      };
    }
  });

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      // TODO: Implement Puck insert text functionality
      console.log('Insert text:', text);
    },
    focus: () => {
      // Focus functionality - Puck handles this internally
    },
    blur: () => {
      // Blur functionality - Puck handles this internally
    },
  }));

  const handleChange = (data: Data) => {
    // Validate data structure before setting
    const validatedData = {
      ...data,
      content: data.content?.map((item, index) => ({
        ...item,
        props: {
          ...item.props,
          // Ensure all props are serializable and have toString methods
          id: item.props?.id || `item-${index}-${Date.now()}`
        }
      })) || [],
      root: data.root || { props: { title: "" } },
      zones: data.zones || {}
    };
    
    setData(validatedData);
    
    // Convert Puck data back to HTML for external use
    const htmlContent = validatedData.content.map(item => {
      // Ensure item.props exists and has valid values
      const props = item.props || {};
      
      switch (item.type) {
        case "Heading":
          return `<h${props.level || 2}>${String(props.children || "")}</h${props.level || 2}>`;
        case "Paragraph":
          return `<p>${String(props.children || "")}</p>`;
        case "Text":
          let text = String(props.children || "");
          if (props.bold) text = `<strong>${text}</strong>`;
          if (props.italic) text = `<em>${text}</em>`;
          return `<span>${text}</span>`;
        case "List":
          const items = (props.items || []).map((listItem: any) => `<li>${String(listItem?.content || "")}</li>`).join("");
          const ListTag = props.ordered ? "ol" : "ul";
          return `<${ListTag}>${items}</${ListTag}>`;
        case "Link":
          return `<a href="${String(props.href || "")}" target="${String(props.target || "_self")}">${String(props.children || "")}</a>`;
        case "Image":
          return `<img src="${String(props.src || "")}" alt="${String(props.alt || "")}" width="${String(props.width || "auto")}" height="${String(props.height || "auto")}" />`;
        case "Hero":
          return `<section class="${String(props.backgroundColor || "bg-blue-600")} text-white py-20"><div class="container mx-auto px-4 text-center"><h1 class="text-4xl font-bold mb-4">${String(props.title || "")}</h1><p class="text-xl">${String(props.subtitle || "")}</p></div></section>`;
        case "Button":
          return `<a href="${String(props.href || "")}" class="inline-block px-6 py-3 rounded-lg font-semibold ${props.variant === "primary" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-800 hover:bg-gray-300"} transition-colors">${String(props.text || "")}</a>`;
        case "Spacer":
          return `<div style="height: ${String(props.height || 40)}px"></div>`;
        default:
          return "";
      }
    }).join("\n");
    
    onChange?.(htmlContent);
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-white", className)} style={{ height }}>
      <Puck
        config={puckConfig}
        data={data}
        onChange={handleChange}
        headerTitle="Content Editor"
        headerPath="/"
        iframe={{
          enabled: false
        }}
      />
    </div>
  );
});

SimpleRichEditor.displayName = 'SimpleRichEditor';

export { SimpleRichEditor };
