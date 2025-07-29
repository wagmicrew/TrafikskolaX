"use client";

import React from 'react';
import Link from 'next/link';
import { FaEnvelope } from 'react-icons/fa';
import { useMessages } from '@/lib/hooks/use-messages';

interface MessageIndicatorProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

const MessageIndicator: React.FC<MessageIndicatorProps> = ({ href, className, children }) => {
  const { unreadCount } = useMessages();

  return (
    <Link href={href} className={`relative ${className}`}>
      {children}
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default MessageIndicator;
