'use client';

import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeToggleSimple } from './ThemeToggleSimple';

interface ThemeAwareHeaderProps {
  title?: string;
  children?: React.ReactNode;
  showThemeToggle?: boolean;
  simpleToggle?: boolean;
  className?: string;
}

export function ThemeAwareHeader({ 
  title, 
  children, 
  showThemeToggle = true, 
  simpleToggle = false,
  className = ""
}: ThemeAwareHeaderProps) {
  return (
    <header className={`flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="flex items-center space-x-4">
        {title && (
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        )}
        {children}
      </div>
      {showThemeToggle && (
        <div className="flex items-center space-x-2">
          {simpleToggle ? <ThemeToggleSimple /> : <ThemeToggle />}
        </div>
      )}
    </header>
  );
}