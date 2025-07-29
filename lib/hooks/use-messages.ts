"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';

export const useMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/messages?type=unread');
      setUnreadCount(response.data.messages.length);
    } catch (error) {
      console.error('Failed to fetch unread messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Optionally, refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    unreadCount,
    loading,
    refreshUnreadCount: fetchUnreadCount
  };
};
