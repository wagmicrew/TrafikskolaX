'use client';

import React from 'react';
import Orb from './Orb';

interface OrbLoaderProps {
  isVisible: boolean;
  text?: string;
  textPosition?: 'overlay' | 'below';
}

export function OrbLoader({ isVisible, text = "Laddar...", textPosition = 'overlay' }: OrbLoaderProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xl">
      <div className={`relative flex ${textPosition === 'below' ? 'flex-col' : 'items-center justify-center'}`}>
        {/* New WebGL Orb */}
        <div className="w-80 h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[32rem] xl:h-[32rem] relative">
          <Orb
            hoverIntensity={0}
            rotateOnHover={false}
            hue={70}
            forceHoverState={false}
          />
        </div>

        {/* Loading Text */}
        {textPosition === 'below' ? (
          <div className="mt-8 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-lg tracking-tight">
                {text}
              </h2>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-lg tracking-tight">
                {text}
              </h2>
            </div>
          </div>
        )}
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
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
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
