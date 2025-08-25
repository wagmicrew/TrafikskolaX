"use client";

import React, { useState, useEffect } from 'react';

interface TrueFocusTextProps {
  texts: string[];
  interval?: number;
  className?: string;
}

export function TrueFocusText({ texts, interval = 500, className = "" }: TrueFocusTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="relative flex items-center justify-center h-12">
        {texts.map((text, index) => (
          <div
            key={index}
            className={`absolute transition-all duration-500 ease-in-out ${
              index === currentIndex
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="text-2xl font-bold text-black tracking-wide">
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
