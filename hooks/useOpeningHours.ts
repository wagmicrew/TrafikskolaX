"use client";

import { useState, useEffect } from 'react';

interface OpeningHoursData {
  office: {
    weekly: Record<string, Array<{ start: string; end: string }>>;
  };
  driving: {
    weekly: Record<string, Array<{ start: string; end: string }>>;
  };
}

interface OpeningHoursHook {
  data: OpeningHoursData | null;
  loading: boolean;
  error: string | null;
}

export function useOpeningHours(): OpeningHoursHook {
  const [data, setData] = useState<OpeningHoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpeningHours = async () => {
      try {
        const response = await fetch('/api/opening-hours');
        if (!response.ok) {
          throw new Error('Failed to fetch opening hours');
        }
        const result = await response.json();
        // Normalize shape: API returns { opening_hours: OpeningHoursConfig }
        const opening = (result && (result.opening_hours || result.openingHours || result)) as any;
        if (opening && opening.office && opening.office.weekly && opening.driving && opening.driving.weekly) {
          setData(opening as OpeningHoursData);
        } else {
          setData(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOpeningHours();
  }, []);

  return { data, loading, error };
}
