import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeVariant = 'enterprise' | 'modern' | 'minimal' | 'bold';
export type ShadowStyle = 'subtle' | 'pronounced' | 'flat';
export type AnimationSpeed = 'fast' | 'normal' | 'slow';
export type Density = 'comfortable' | 'compact' | 'spacious';

interface ThemeConfig {
  theme: ThemeVariant;
  primaryColor: string;
  borderRadius: string;
  shadowStyle: ShadowStyle;
  animationSpeed: AnimationSpeed;
  density: Density;
}

interface ThemeContextType {
  config: ThemeConfig;
  updateTheme: (newConfig: Partial<ThemeConfig>) => void;
  getThemeClasses: () => string;
}

const defaultConfig: ThemeConfig = {
  theme: 'enterprise',
  primaryColor: '#4F46E5', // Indigo
  borderRadius: 'rounded-lg',
  shadowStyle: 'subtle',
  animationSpeed: 'normal',
  density: 'comfortable',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ThemeConfig>(defaultConfig);

  useEffect(() => {
    // Apply theme classes to the root element
    const root = document.documentElement;
    root.className = `${config.theme}-theme ${config.shadowStyle}-shadows ${config.animationSpeed}-animations ${config.density}-density`;
  }, [config]);

  const updateTheme = (newConfig: Partial<ThemeConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const getThemeClasses = () => {
    return `theme-${config.theme} shadow-${config.shadowStyle} animation-${config.animationSpeed} density-${config.density}`;
  };

  return (
    <ThemeContext.Provider value={{ config, updateTheme, getThemeClasses }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};