'use client';

import React from 'react';
import Orb from './Orb';

interface OrbLoaderProps {
  isVisible: boolean;
  text?: string;
}

export function OrbLoader({ isVisible, text = "Laddar..." }: OrbLoaderProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xl">
      <div className="relative flex items-center justify-center">
        {/* New WebGL Orb */}
        <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 relative">
          <Orb
            hoverIntensity={0}
            rotateOnHover={false}
            hue={70}
            forceHoverState={false}
          />
        </div>

        {/* Loading Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-lg tracking-tight">
              {text}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small orb spinner for inline loading
interface OrbSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OrbSpinner({ size = 'md', className = '' }: OrbSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      <Orb
        hoverIntensity={0}
        rotateOnHover={false}
        hue={70}
        forceHoverState={false}
      />
    </div>
  );
}
