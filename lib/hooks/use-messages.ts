"use client";

import { useState, useEffect, useCallback } from 'react';

// Global state for unread count
let globalUnreadCount = 0;
const globalListeners: Array<(count: number) => void> = [];

const notifyListeners = (count: number) => {
  globalUnreadCount = count;
  globalListeners.forEach(listener => listener(count));
};

export const useMessages = () => {
  const [unreadCount, setUnreadCount] = useState(globalUnreadCount);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    // Polling disabled globally
    notifyListeners(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Add this component to listeners
    globalListeners.push(setUnreadCount);
    
    // Initial nop
    fetchUnreadCount();
    
    // No interval polling
    const interval = setInterval(() => {}, 3600000);
    
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
  // Polling disabled globally
  notifyListeners(0);
};
