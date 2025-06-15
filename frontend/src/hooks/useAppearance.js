import { useSettings } from '../contexts/SettingsContext';
import { useEffect, useState } from 'react';

// Utility function to lighten hex colors
const lightenHexColor = (hex, percent) => {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  
  // Lighten by moving towards white
  const newR = Math.min(255, Math.round(r + (255 - r) * percent / 100));
  const newG = Math.min(255, Math.round(g + (255 - g) * percent / 100));
  const newB = Math.min(255, Math.round(b + (255 - b) * percent / 100));
  
  // Convert back to hex
  const toHex = (c) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

export const useAppearance = () => {
  const { settings, loading } = useSettings();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Initialize dark mode from localStorage and settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (settings && typeof settings.enable_dark_mode !== 'undefined') {
      // Use admin setting if available
      const shouldUseDark = settings.enable_dark_mode && (savedTheme === 'dark' || (!savedTheme && systemPrefersDark));
      setIsDarkMode(shouldUseDark);
      applyTheme(shouldUseDark);
    } else if (savedTheme) {
      // Use saved preference
      const shouldUseDark = savedTheme === 'dark';
      setIsDarkMode(shouldUseDark);
      applyTheme(shouldUseDark);
    } else {
      // Use system preference
      setIsDarkMode(systemPrefersDark);
      applyTheme(systemPrefersDark);
    }
  }, [settings]);
  
  // Function to apply theme classes
  const applyTheme = (isDark) => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };
  
  // Function to toggle dark mode
  const toggleDarkMode = () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    applyTheme(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  // Apply dynamic CSS custom properties and favicon when settings change
  useEffect(() => {
    if (!loading && settings) {
      const root = document.documentElement;
      
      // Apply brand colors if available
      if (settings.primary_color) {
        root.style.setProperty('--color-primary', settings.primary_color);
        root.style.setProperty('--color-primary-dark', settings.secondary_color || settings.primary_color);
        
        // Generate lighter variations of primary color
        const primaryColor = settings.primary_color;
        if (primaryColor.startsWith('#')) {
          // Simple color lightening (basic implementation)
          const lighterColor = lightenHexColor(primaryColor, 20);
          const subtleColor = lightenHexColor(primaryColor, 60);
          root.style.setProperty('--color-primary-light', lighterColor);
          root.style.setProperty('--color-primary-subtle', subtleColor);
        }
      }
      
      if (settings.secondary_color) {
        root.style.setProperty('--color-secondary', settings.secondary_color);
      }
      
      // Apply favicon if available
      if (settings.site_favicon_url) {
        const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'icon';
        link.href = settings.site_favicon_url;
        if (!document.querySelector("link[rel~='icon']")) {
          document.getElementsByTagName('head')[0].appendChild(link);
        }
      }
      
      // Apply site name to document title
      if (settings.site_name) {
        document.title = settings.site_name;
      }
      
      console.log('🎨 Applied dynamic theme:', {
        primary: settings.primary_color,
        secondary: settings.secondary_color,
        favicon: settings.site_favicon_url,
        siteName: settings.site_name,
        darkMode: isDarkMode,
        darkModeEnabled: settings.enable_dark_mode,
        cssVarsSet: true
      });
    }
  }, [settings, loading, isDarkMode]);

  return {
    // Appearance settings
    primaryColor: settings?.primary_color || '#d97706',
    secondaryColor: settings?.secondary_color || '#f59e0b',
    siteLogoUrl: settings?.site_logo_url || '',
    siteFaviconUrl: settings?.site_favicon_url || '',
    heroBackgroundImage: settings?.hero_background_image || '',
    clubMotto: settings?.club_motto || 'Discover exceptional whiskies together',
    footerText: settings?.footer_text || '© 2025 Åby Whisky Club. All rights reserved.',
    siteName: settings?.site_name || 'Åby Whisky Club',
    
    // Dark mode functionality
    isDarkMode,
    darkModeEnabled: settings?.enable_dark_mode === true || settings?.enable_dark_mode === 'true',
    toggleDarkMode,
    
    loading
  };
};

export default useAppearance;