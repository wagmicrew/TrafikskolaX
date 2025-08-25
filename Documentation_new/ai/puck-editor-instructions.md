# Puck Editor AI Instructions for Direct TSX/JSX Page Editing

## Overview
Puck is a modular, open-source visual editor for React.js that enables direct editing of TSX/JSX pages without type editors. This guide provides comprehensive instructions for implementing Puck to edit React components directly.

## Core Concepts

### What is Puck?
- **Visual Editor**: Drag-and-drop interface for React components
- **Component-Based**: Works with existing React components
- **Data Ownership**: No vendor lock-in, you own your data
- **Framework Agnostic**: Works with Next.js, Create React App, etc.
- **MIT Licensed**: Suitable for commercial applications

### Key Features (Puck 0.20)
- **Inline Text Editing**: Edit text fields directly in preview
- **Component Configuration**: Define editable fields for components
- **Multi-column Layouts**: Advanced CSS layout support
- **External Data Sources**: Connect to APIs and databases
- **Server Components**: Next.js App Router compatibility
- **Overlay Portals**: Interactive elements within editor
- **Field Transforms**: Modify field values for custom functionality

## Installation & Setup

### 1. Install Puck
```bash
npm install @measured/puck --save
# or
pnpm add @measured/puck
# or
yarn add @measured/puck
```

### 2. Basic Implementation
```tsx
import { Puck, Render } from "@measured/puck";
import "@measured/puck/puck.css";

// Component configuration
const config = {
  components: {
    HeadingBlock: {
      fields: {
        children: { type: "text" },
        level: {
          type: "select",
          options: [
            { label: "H1", value: "1" },
            { label: "H2", value: "2" },
            { label: "H3", value: "3" }
          ]
        }
      },
      render: ({ children, level }) => {
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
        return <HeadingTag>{children}</HeadingTag>;
      }
    }
  }
};

// Editor component
export function Editor({ data, onSave }) {
  return (
    <Puck 
      config={config} 
      data={data} 
      onPublish={onSave}
    />
  );
}

// Render component for display
export function Page({ data }) {
  return <Render config={config} data={data} />;
}
```

## Direct TSX/JSX Page Editing Strategy

### 1. Component Mapping
Map existing TSX/JSX components to Puck configuration:

```tsx
// Existing component
const Button = ({ text, variant, onClick }) => (
  <button className={`btn btn-${variant}`} onClick={onClick}>
    {text}
  </button>
);

// Puck configuration
const config = {
  components: {
    Button: {
      fields: {
        text: { type: "text" },
        variant: {
          type: "select",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" }
          ]
        }
      },
      render: Button // Use existing component directly
    }
  }
};
```

### 2. Inline Text Editing (Puck 0.20)
Enable direct text editing in preview:

```tsx
const config = {
  components: {
    EditableText: {
      fields: {
        content: {
          type: "textarea",
          contentEditable: true // Enable inline editing
        }
      },
      render: ({ content }) => <div>{content}</div>
    }
  }
};
```

### 3. Advanced Component Configuration

#### Complex Fields
```tsx
const config = {
  components: {
    Card: {
      fields: {
        title: { type: "text" },
        image: { type: "text" }, // URL input
        items: {
          type: "array",
          arrayFields: {
            name: { type: "text" },
            description: { type: "textarea" }
          }
        },
        settings: {
          type: "object",
          objectFields: {
            showBorder: { type: "radio", options: [
              { label: "Yes", value: true },
              { label: "No", value: false }
            ]},
            alignment: {
              type: "select",
              options: [
                { label: "Left", value: "left" },
                { label: "Center", value: "center" },
                { label: "Right", value: "right" }
              ]
            }
          }
        }
      },
      render: ({ title, image, items, settings }) => (
        <div className={`card ${settings.showBorder ? 'border' : ''} text-${settings.alignment}`}>
          <img src={image} alt={title} />
          <h3>{title}</h3>
          {items.map((item, i) => (
            <div key={i}>
              <h4>{item.name}</h4>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      )
    }
  }
};
```

#### Interactive Components with Overlay Portals
```tsx
import { registerOverlayPortal } from "@measured/puck";

const config = {
  components: {
    Accordion: {
      fields: {
        title: { type: "text" },
        content: { type: "slot" } // Nested components
      },
      render: ({ title, content }) => {
        const ref = useRef(null);
        
        useEffect(() => {
          if (ref.current) {
            registerOverlayPortal(ref.current);
          }
        }, []);

        return (
          <details>
            <summary ref={ref}>{title}</summary>
            <div>{content()}</div>
          </details>
        );
      }
    }
  }
};
```

## Save Functionality Without Type Editor

### 1. Direct File Writing
```tsx
// API endpoint for saving pages
// /api/pages/save.ts
export async function POST(request: Request) {
  const { pageId, data, config } = await request.json();
  
  // Generate TSX content from Puck data
  const tsxContent = generateTSXFromPuckData(data, config);
  
  // Write directly to file system
  const filePath = `pages/${pageId}.tsx`;
  await fs.writeFile(filePath, tsxContent);
  
  return Response.json({ success: true });
}

function generateTSXFromPuckData(data, config) {
  const imports = new Set();
  
  const renderComponent = (item) => {
    const componentConfig = config.components[item.type];
    if (!componentConfig) return '';
    
    // Add import if needed
    imports.add(item.type);
    
    // Generate JSX
    const props = Object.entries(item.props)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
      
    return `<${item.type} ${props} />`;
  };
  
  const content = data.content.map(renderComponent).join('\n');
  
  return `
import React from 'react';
${Array.from(imports).map(comp => `import { ${comp} } from '@/components/${comp}';`).join('\n')}

export default function Page() {
  return (
    <div>
      ${content}
    </div>
  );
}`;
}
```

### 2. Database Storage with File Generation
```tsx
// Store Puck data in database
const savePage = async (pageData) => {
  // Save to database
  await db.pages.upsert({
    where: { id: pageData.id },
    update: { 
      puckData: pageData.data,
      updatedAt: new Date()
    },
    create: {
      id: pageData.id,
      puckData: pageData.data,
      createdAt: new Date()
    }
  });
  
  // Generate and save TSX file
  const tsxContent = generateTSXFromPuckData(pageData.data, config);
  await fs.writeFile(`pages/${pageData.id}.tsx`, tsxContent);
};
```

### 3. Real-time Sync
```tsx
// Auto-save functionality
export function Editor({ pageId, initialData }) {
  const [data, setData] = useState(initialData);
  
  // Debounced save
  const debouncedSave = useMemo(
    () => debounce(async (newData) => {
      await fetch('/api/pages/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, data: newData })
      });
    }, 1000),
    [pageId]
  );
  
  const handleChange = (newData) => {
    setData(newData);
    debouncedSave(newData);
  };
  
  return (
    <Puck 
      config={config}
      data={data}
      onChange={handleChange}
      onPublish={handleSave}
    />
  );
}
```

## Field Transform API for Custom Functionality

### Rich Text Integration
```tsx
const fieldTransforms = {
  richtext: ({ value }) => {
    // Convert rich text to React nodes
    return <div dangerouslySetInnerHTML={{ __html: value }} />;
  },
  markdown: ({ value }) => {
    // Convert markdown to React
    return <ReactMarkdown>{value}</ReactMarkdown>;
  }
};

const config = {
  components: {
    RichContent: {
      fields: {
        content: { type: "richtext" } // Custom field type
      },
      render: ({ content }) => content // Already transformed
    }
  }
};

// Usage
<Puck 
  config={config} 
  fieldTransforms={fieldTransforms}
  data={data} 
/>
```

## Integration Patterns

### 1. Next.js App Router Integration
```tsx
// app/editor/[pageId]/page.tsx
export default function EditorPage({ params }) {
  return <Editor pageId={params.pageId} />;
}

// app/[pageId]/page.tsx  
export default function DisplayPage({ params }) {
  const pageData = await getPageData(params.pageId);
  return <Render config={config} data={pageData} />;
}
```

### 2. Component Library Integration
```tsx
// Auto-generate config from component library
const generateConfigFromComponents = (components) => {
  const config = { components: {} };
  
  Object.entries(components).forEach(([name, component]) => {
    // Extract prop types and generate fields
    const fields = extractFieldsFromPropTypes(component);
    
    config.components[name] = {
      fields,
      render: component
    };
  });
  
  return config;
};

// Usage
import * as ComponentLibrary from '@/components';
const config = generateConfigFromComponents(ComponentLibrary);
```

### 3. TypeScript Integration
```tsx
// Type-safe configuration
interface ComponentProps {
  title: string;
  variant: 'primary' | 'secondary';
}

const config: Config<{
  MyComponent: ComponentProps;
}> = {
  components: {
    MyComponent: {
      fields: {
        title: { type: "text" },
        variant: {
          type: "select",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" }
          ]
        }
      },
      render: ({ title, variant }: ComponentProps) => (
        <div className={`component-${variant}`}>{title}</div>
      )
    }
  }
};
```

## Best Practices

### 1. Component Design
- **Keep components pure**: Avoid side effects in render functions
- **Use semantic props**: Clear, descriptive field names
- **Provide defaults**: Always set defaultProps for better UX
- **Handle edge cases**: Validate props and provide fallbacks

### 2. Performance Optimization
- **Lazy load components**: Use dynamic imports for large components
- **Memoize expensive operations**: Use React.memo and useMemo
- **Optimize re-renders**: Minimize unnecessary updates
- **Bundle splitting**: Separate editor and runtime bundles

### 3. User Experience
- **Intuitive field types**: Choose appropriate field types for data
- **Clear labels**: Descriptive field labels and help text
- **Logical grouping**: Organize fields into logical sections
- **Preview accuracy**: Ensure editor preview matches final output

### 4. Data Management
- **Version control**: Track changes to page data
- **Backup strategy**: Regular backups of page configurations
- **Migration support**: Handle config changes gracefully
- **Validation**: Validate data integrity on save

## Error Handling

### 1. Component Error Boundaries
```tsx
const config = {
  components: {
    SafeComponent: {
      render: (props) => {
        try {
          return <MyComponent {...props} />;
        } catch (error) {
          console.error('Component render error:', error);
          return <div>Error rendering component</div>;
        }
      }
    }
  }
};
```

### 2. Save Error Handling
```tsx
const handleSave = async (data) => {
  try {
    await savePage(data);
    toast.success('Page saved successfully');
  } catch (error) {
    console.error('Save error:', error);
    toast.error('Failed to save page');
    // Optionally revert to previous state
  }
};
```

## Security Considerations

### 1. Input Sanitization
```tsx
const config = {
  components: {
    SafeHTML: {
      fields: {
        content: { type: "textarea" }
      },
      render: ({ content }) => {
        // Sanitize HTML content
        const sanitized = DOMPurify.sanitize(content);
        return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
      }
    }
  }
};
```

### 2. File System Security
```tsx
// Validate file paths
const isValidPageId = (pageId) => {
  return /^[a-zA-Z0-9-_]+$/.test(pageId);
};

// Restrict file operations
const savePage = async (pageId, data) => {
  if (!isValidPageId(pageId)) {
    throw new Error('Invalid page ID');
  }
  
  const safePath = path.join(PAGES_DIR, `${pageId}.tsx`);
  if (!safePath.startsWith(PAGES_DIR)) {
    throw new Error('Invalid file path');
  }
  
  await fs.writeFile(safePath, generateTSX(data));
};
```

This comprehensive guide provides all the knowledge needed to implement Puck editor for direct TSX/JSX page editing without type editors, including save functionality, component configuration, and best practices.
