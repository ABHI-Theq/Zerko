'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ThemeAwarePageProps {
  children: React.ReactNode;
  className?: string;
  showBackground?: boolean;
}

export function ThemeAwarePage({ 
  children, 
  className = "",
  showBackground = true 
}: ThemeAwarePageProps) {
  return (
    <div className={cn(
      "min-h-screen w-full bg-background text-foreground transition-colors",
      showBackground && "relative",
      className
    )}>
      {showBackground && (
        <div
          className="absolute inset-0 z-0 pointer-events-none grid-bg opacity-50 dark:opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(75, 85, 99, 0.08) 20px, rgba(75, 85, 99, 0.08) 21px),
              repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(107, 114, 128, 0.06) 30px, rgba(107, 114, 128, 0.06) 31px),
              repeating-linear-gradient(60deg, transparent, transparent 40px, rgba(55, 65, 81, 0.05) 40px, rgba(55, 65, 81, 0.05) 41px),
              repeating-linear-gradient(150deg, transparent, transparent 35px, rgba(31, 41, 55, 0.04) 35px, rgba(31, 41, 55, 0.04) 36px)
            `,
          }}
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}