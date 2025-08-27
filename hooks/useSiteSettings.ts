import { useState, useEffect } from 'react';

export interface SiteSettings {
  social_facebook?: string;
  social_instagram?: string;
  social_tiktok?: string;
  // Common public contact fields
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  // Publicly exposed swish phone (if configured)
  swish_phone?: string;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/public/site-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to fetch site settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading };
}
