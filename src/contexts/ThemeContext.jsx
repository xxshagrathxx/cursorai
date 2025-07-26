import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Predefined theme colors
export const themeColors = {
  blue: {
    name: 'Ocean Blue',
    primary: '#2563eb',
    secondary: '#06b6d4',
    accent: '#3b82f6',
  },
  green: {
    name: 'Medical Green',
    primary: '#059669',
    secondary: '#10b981',
    accent: '#34d399',
  },
  purple: {
    name: 'Royal Purple',
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    accent: '#a78bfa',
  },
  teal: {
    name: 'Dental Teal',
    primary: '#0d9488',
    secondary: '#14b8a6',
    accent: '#5eead4',
  },
  indigo: {
    name: 'Professional Indigo',
    primary: '#4f46e5',
    secondary: '#6366f1',
    accent: '#818cf8',
  },
  rose: {
    name: 'Warm Rose',
    primary: '#e11d48',
    secondary: '#f43f5e',
    accent: '#fb7185',
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentColor, setCurrentColor] = useState('blue');
  const [customColor, setCustomColor] = useState(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dental-app-theme');
    if (savedTheme) {
      const theme = JSON.parse(savedTheme);
      setIsDarkMode(theme.isDarkMode || false);
      setCurrentColor(theme.currentColor || 'blue');
      setCustomColor(theme.customColor || null);
    }

    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!savedTheme) {
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Save theme to localStorage and apply to document
  useEffect(() => {
    const theme = {
      isDarkMode,
      currentColor,
      customColor,
    };
    
    localStorage.setItem('dental-app-theme', JSON.stringify(theme));
    
    // Apply theme to document
    const root = document.documentElement;
    
    // Apply dark mode class
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply color theme
    const colors = customColor || themeColors[currentColor];
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    
    // Update meta theme color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.primary);
    }
  }, [isDarkMode, currentColor, customColor]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const changeColorTheme = (colorKey) => {
    setCurrentColor(colorKey);
    setCustomColor(null); // Reset custom color when selecting predefined
  };

  const setCustomColorTheme = (colors) => {
    setCustomColor(colors);
    setCurrentColor('custom');
  };

  const getCurrentColors = () => {
    return customColor || themeColors[currentColor];
  };

  const value = {
    isDarkMode,
    currentColor,
    customColor,
    themeColors,
    toggleDarkMode,
    changeColorTheme,
    setCustomColorTheme,
    getCurrentColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};