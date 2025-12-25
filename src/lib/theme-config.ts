export const themeConfig = {
  themes: ['light', 'dark', 'system'] as const,
  defaultTheme: 'system' as const,
  
  // Theme-specific configurations
  light: {
    name: 'Light',
    description: 'Clean and bright interface',
    colors: {
      primary: 'hsl(0 0% 9%)',
      secondary: 'hsl(0 0% 96.1%)',
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(0 0% 3.9%)',
      muted: 'hsl(0 0% 96.1%)',
      accent: 'hsl(0 0% 96.1%)',
      border: 'hsl(0 0% 89.8%)',
    }
  },
  
  dark: {
    name: 'Dark',
    description: 'Easy on the eyes in low light',
    colors: {
      primary: 'hsl(0 0% 98%)',
      secondary: 'hsl(0 0% 14.9%)',
      background: 'hsl(0 0% 3.9%)',
      foreground: 'hsl(0 0% 98%)',
      muted: 'hsl(0 0% 14.9%)',
      accent: 'hsl(0 0% 14.9%)',
      border: 'hsl(0 0% 14.9%)',
    }
  },
  
  system: {
    name: 'System',
    description: 'Follows your system preference',
  }
} as const;

export type ThemeName = keyof typeof themeConfig.themes;
export type ThemeColors = typeof themeConfig.light.colors;