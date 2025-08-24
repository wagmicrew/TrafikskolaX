'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Home, Info, Phone, FileText } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  isExternal: boolean;
  icon?: string;
  children?: MenuItem[];
}

interface DynamicMenuProps {
  className?: string;
}

export default function DynamicMenu({ className = '' }: DynamicMenuProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const response = await fetch('/api/menu');
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.menu || []);
      } else {
        // Fallback to default menu if API fails
        setMenuItems([
          {
            id: '1',
            label: 'Hem',
            url: '/',
            isExternal: false,
            icon: 'Home'
          },
          {
            id: '2',
            label: 'Om oss',
            url: '/om-oss',
            isExternal: false,
            icon: 'Info'
          },
          {
            id: '3',
            label: 'Kontakt',
            url: '/kontakt',
            isExternal: false,
            icon: 'Phone'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      // Use fallback menu
      setMenuItems([
        {
          id: '1',
          label: 'Hem',
          url: '/',
          isExternal: false,
          icon: 'Home'
        },
        {
          id: '2',
          label: 'Om oss',
          url: '/om-oss',
          isExternal: false,
          icon: 'Info'
        },
        {
          id: '3',
          label: 'Kontakt',
          url: '/kontakt',
          isExternal: false,
          icon: 'Phone'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName?: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      Home,
      Info,
      Phone,
      FileText
    };

    const IconComponent = iconName ? iconMap[iconName] : FileText;
    return <IconComponent className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="w-20 h-4 bg-gray-200 animate-pulse rounded"></div>
        <div className="w-16 h-4 bg-gray-200 animate-pulse rounded"></div>
        <div className="w-18 h-4 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <nav className={`flex items-center space-x-1 ${className}`}>
      {menuItems.map((item) => {
        const hasChildren = item.children && item.children.length > 0;

        if (hasChildren) {
          return (
            <div key={item.id} className="relative group">
              <Link
                href={item.url}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                {...(item.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {item.icon && getIcon(item.icon)}
                <span className="ml-2">{item.label}</span>
                <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
              </Link>

              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  {item.children?.map((child) => (
                    <Link
                      key={child.id}
                      href={child.url}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      {...(child.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.url}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
            {...(item.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {item.icon && getIcon(item.icon)}
            <span className="ml-2">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
