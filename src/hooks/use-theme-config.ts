'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { themeConfig } from '@/lib/theme-config';

export function useThemeConfig() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? resolvedTheme : 'light';
  
  const toggleTheme = () => {
    if (currentTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');
  const setSystemTheme = () => setTheme('system');

  const isLight = currentTheme === 'light';
  const isDark = currentTheme === 'dark';
  const isSystem = theme === 'system';

  return {
    // Theme state
    theme,
    resolvedTheme: currentTheme,
    systemTheme,
    mounted,
    
    // Theme setters
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    
    // Theme checks
    isLight,
    isDark,
    isSystem,
    
    // Theme config
    themes: themeConfig.themes,
    themeConfig: themeConfig[currentTheme as keyof typeof themeConfig] || themeConfig.light,
  };
}