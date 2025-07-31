"use client";

import { useState, useEffect, useCallback } from 'react';

// Global state for unread count
let globalUnreadCount = 0;
let globalListeners: Array<(count: number) => void> = [];

const notifyListeners = (count: number) => {
  globalUnreadCount = count;
  globalListeners.forEach(listener => listener(count));
};

export const useMessages = () => {
  const [unreadCount, setUnreadCount] = useState(globalUnreadCount);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/messages/unread-count');
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      const data = await response.json();
      notifyListeners(data.unreadCount || 0);
    } catch (error) {
      // Only log the error in development, fail silently in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch unread messages:', error);
      }
      // Set count to 0 on error to prevent showing stale data
      notifyListeners(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Add this component to listeners
    globalListeners.push(setUnreadCount);
    
    // Fetch initial count
    fetchUnreadCount();
    
    // Refresh count every 60 seconds to reduce server requests
    const interval = setInterval(fetchUnreadCount, 60000);
    
    return () => {
      // Remove listener on unmount
      const index = globalListeners.indexOf(setUnreadCount);
      if (index > -1) {
        globalListeners.splice(index, 1);
      }
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refreshUnreadCount: fetchUnreadCount
  };
};

// Export a global refresh function for external use
export const refreshGlobalUnreadCount = async () => {
  try {
    const response = await fetch('/api/messages/unread-count');
    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }
    const data = await response.json();
    notifyListeners(data.unreadCount || 0);
  } catch (error) {
    // Only log the error in development, fail silently in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to refresh unread count:', error);
    }
    // Set count to 0 on error
    notifyListeners(0);
  }
};
