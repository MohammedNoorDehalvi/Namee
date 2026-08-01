'use client';

import React from 'react';

interface LetterLoaderProps {
  text?: string;
  className?: string;
}

export function LetterLoader({ text = 'Generating', className = '' }: LetterLoaderProps) {
  const letters = text.split('');

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="loader-wrapper flex items-center justify-center gap-1">
        {letters.map((char, index) => (
          <span key={index} className="loader-letter">
            {char}
          </span>
        ))}
        <div className="loader ml-3" />
      </div>
    </div>
  );
}
