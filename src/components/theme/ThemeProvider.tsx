'use client';

import React from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

interface CustomThemeProviderProps extends ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={['light', 'dark', 'system']}
      {...props}
    >
      {children}
    </NextThemeProvider>
  );
}

export { useTheme } from 'next-themes';