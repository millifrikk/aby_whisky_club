import { useSettings } from '../contexts/SettingsContext';
import { useState, useEffect } from 'react';

/**
 * Dark mode theme management system
 * Provides theme switching and persistence
 */

/**
 * Theme configurations
 */
export const THEMES = {
  light: {
    name: 'Light',
    icon: '☀️',
    colors: {
      // Primary colors
      primary: '#8B4513',
      primaryLight: '#A0522D',
      primaryDark: '#654321',
      
      // Background colors
      background: '#FFFFFF',
      backgroundSecondary: '#F8F9FA',
      backgroundTertiary: '#F1F3F4',
      
      // Text colors
      text: '#212529',
      textSecondary: '#6C757D',
      textMuted: '#ADB5BD',
      
      // Border colors
      border: '#DEE2E6',
      borderLight: '#E9ECEF',
      
      // State colors
      success: '#28A745',
      warning: '#FFC107',
      error: '#DC3545',
      info: '#17A2B8',
      
      // Card colors
      cardBackground: '#FFFFFF',
      cardShadow: 'rgba(0, 0, 0, 0.1)',
      
      // Navigation colors
      navBackground: '#FFFFFF',
      navText: '#212529',
      navHover: '#F8F9FA',
      
      // Button colors
      buttonPrimary: '#8B4513',
      buttonSecondary: '#6C757D',
      buttonText: '#FFFFFF',
      
      // Input colors
      inputBackground: '#FFFFFF',
      inputBorder: '#CED4DA',
      inputText: '#495057',
      
      // Whisky card specific
      whiskyCardBackground: '#FFFFFF',
      whiskyCardBorder: '#E9ECEF',
      ratingStars: '#FFD700'
    }
  },
  dark: {
    name: 'Dark',
    icon: '🌙',
    colors: {
      // Primary colors
      primary: '#D2691E',
      primaryLight: '#F4A460',
      primaryDark: '#A0522D',
      
      // Background colors
      background: '#121212',
      backgroundSecondary: '#1E1E1E',
      backgroundTertiary: '#2D2D2D',
      
      // Text colors
      text: '#FFFFFF',
      textSecondary: '#B3B3B3',
      textMuted: '#808080',
      
      // Border colors
      border: '#404040',
      borderLight: '#333333',
      
      // State colors
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3',
      
      // Card colors
      cardBackground: '#1E1E1E',
      cardShadow: 'rgba(0, 0, 0, 0.3)',
      
      // Navigation colors
      navBackground: '#1E1E1E',
      navText: '#FFFFFF',
      navHover: '#2D2D2D',
      
      // Button colors
      buttonPrimary: '#D2691E',
      buttonSecondary: '#666666',
      buttonText: '#FFFFFF',
      
      // Input colors
      inputBackground: '#2D2D2D',
      inputBorder: '#404040',
      inputText: '#FFFFFF',
      
      // Whisky card specific
      whiskyCardBackground: '#1E1E1E',
      whiskyCardBorder: '#333333',
      ratingStars: '#FFD700'
    }
  },
  auto: {
    name: 'Auto',
    icon: '🌗',
    description: 'Follow system preference'
  }
};

/**
 * Get system theme preference
 */
export function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Get saved theme preference
 */
export function getSavedTheme() {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    return localStorage.getItem('theme-preference');
  } catch (error) {
    console.warn('Could not access localStorage for theme preference');
    return null;
  }
}

/**
 * Save theme preference
 */
export function saveTheme(theme) {
  if (typeof localStorage === 'undefined') return;
  
  try {
    localStorage.setItem('theme-preference', theme);
  } catch (error) {
    console.warn('Could not save theme preference to localStorage');
  }
}

/**
 * Determine effective theme based on preference and system
 */
export function getEffectiveTheme(preference = null) {
  const savedTheme = preference || getSavedTheme();
  
  if (savedTheme === 'auto' || !savedTheme) {
    return getSystemTheme();
  }
  
  return savedTheme === 'dark' ? 'dark' : 'light';
}

/**
 * Apply theme to document
 */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  
  const effectiveTheme = getEffectiveTheme(theme);
  const themeConfig = THEMES[effectiveTheme];
  
  if (!themeConfig) {
    console.warn(`Unknown theme: ${effectiveTheme}`);
    return;
  }
  
  // Update document class
  document.documentElement.classList.remove('light-theme', 'dark-theme');
  document.documentElement.classList.add(`${effectiveTheme}-theme`);
  
  // Update CSS custom properties
  const root = document.documentElement;
  Object.entries(themeConfig.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
  });
  
  // Update meta theme-color for mobile browsers
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.content = themeConfig.colors.background;
}

/**
 * Generate theme-aware CSS classes
 */
export function getThemeClasses(baseClasses = '', theme = null) {
  const effectiveTheme = getEffectiveTheme(theme);
  const themeClass = `theme-${effectiveTheme}`;
  
  return `${baseClasses} ${themeClass}`.trim();
}

/**
 * React hook for dark mode management
 */
export function useDarkMode() {
  const { settings } = useSettings();
  const [theme, setTheme] = useState(() => getSavedTheme() || 'auto');
  const [effectiveTheme, setEffectiveTheme] = useState(() => getEffectiveTheme());
  
  // Check if dark mode is enabled in admin settings
  const isDarkModeEnabled = settings?.enable_dark_mode !== false;
  
  // Update effective theme when preference or system changes
  useEffect(() => {
    const newEffectiveTheme = getEffectiveTheme(theme);
    setEffectiveTheme(newEffectiveTheme);
    
    if (isDarkModeEnabled) {
      applyTheme(theme);
    }
  }, [theme, isDarkModeEnabled]);
  
  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'auto') {
        const newEffectiveTheme = getSystemTheme();
        setEffectiveTheme(newEffectiveTheme);
        
        if (isDarkModeEnabled) {
          applyTheme('auto');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, isDarkModeEnabled]);
  
  // Initialize theme on mount
  useEffect(() => {
    if (isDarkModeEnabled) {
      applyTheme(theme);
    } else {
      // Force light theme if dark mode is disabled
      applyTheme('light');
    }
  }, [isDarkModeEnabled]);
  
  const toggleTheme = () => {
    if (!isDarkModeEnabled) return;
    
    const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    saveTheme(newTheme);
  };
  
  const setThemePreference = (newTheme) => {
    if (!isDarkModeEnabled && newTheme !== 'light') return;
    
    setTheme(newTheme);
    saveTheme(newTheme);
  };
  
  const getThemeConfig = (themeName = null) => {
    const targetTheme = themeName || effectiveTheme;
    return THEMES[targetTheme] || THEMES.light;
  };
  
  return {
    theme,
    effectiveTheme,
    isDarkMode: effectiveTheme === 'dark',
    isDarkModeEnabled,
    availableThemes: Object.keys(THEMES),
    toggleTheme,
    setTheme: setThemePreference,
    getThemeConfig,
    getThemeClasses,
    applyTheme
  };
}

/**
 * Higher-order component for theme-aware components
 */
export function withTheme(Component) {
  return function ThemedComponent(props) {
    const themeProps = useDarkMode();
    return <Component {...props} theme={themeProps} />;
  };
}

/**
 * Theme context provider helper
 */
export function ThemeProvider({ children, forcedTheme = null }) {
  const themeData = useDarkMode();
  
  useEffect(() => {
    if (forcedTheme) {
      themeData.setTheme(forcedTheme);
    }
  }, [forcedTheme]);
  
  return children;
}

/**
 * Get theme-appropriate color value
 */
export function getThemeColor(colorKey, theme = null) {
  const effectiveTheme = getEffectiveTheme(theme);
  const themeConfig = THEMES[effectiveTheme];
  
  if (!themeConfig || !themeConfig.colors) {
    return THEMES.light.colors[colorKey] || '#000000';
  }
  
  return themeConfig.colors[colorKey] || '#000000';
}

/**
 * Generate inline styles for theme-aware components
 */
export function getThemeStyles(styleMap, theme = null) {
  const effectiveTheme = getEffectiveTheme(theme);
  const styles = {};
  
  Object.entries(styleMap).forEach(([property, colorKey]) => {
    styles[property] = getThemeColor(colorKey, theme);
  });
  
  return styles;
}

/**
 * Theme transition utilities
 */
export function enableThemeTransitions() {
  if (typeof document === 'undefined') return;
  
  document.documentElement.style.setProperty('--theme-transition', 'all 0.3s ease');
}

export function disableThemeTransitions() {
  if (typeof document === 'undefined') return;
  
  document.documentElement.style.removeProperty('--theme-transition');
}

export default {
  THEMES,
  useDarkMode,
  withTheme,
  ThemeProvider,
  getSystemTheme,
  getSavedTheme,
  saveTheme,
  getEffectiveTheme,
  applyTheme,
  getThemeClasses,
  getThemeColor,
  getThemeStyles,
  enableThemeTransitions,
  disableThemeTransitions
};