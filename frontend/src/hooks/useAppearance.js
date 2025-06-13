import { useSettings } from '../contexts/SettingsContext';
import { useEffect } from 'react';

export const useAppearance = () => {
  const { settings, loading } = useSettings();

  // Apply dynamic CSS custom properties when settings change
  useEffect(() => {
    if (!loading && settings) {
      const root = document.documentElement;
      
      // Apply brand colors if available
      if (settings.primary_color) {
        root.style.setProperty('--color-primary', settings.primary_color);
        root.style.setProperty('--color-primary-dark', settings.secondary_color || settings.primary_color);
      }
      
      if (settings.secondary_color) {
        root.style.setProperty('--color-secondary', settings.secondary_color);
      }
      
      console.log('🎨 Applied dynamic theme colors:', {
        primary: settings.primary_color,
        secondary: settings.secondary_color,
        cssVarsSet: true
      });
    }
  }, [settings, loading]);

  return {
    primaryColor: settings.primary_color || '#d97706', // Fallback to default amber
    secondaryColor: settings.secondary_color || '#f59e0b',
    siteLogoUrl: settings.site_logo_url || '',
    siteFaviconUrl: settings.site_favicon_url || '',
    heroBackgroundImage: settings.hero_background_image || '',
    clubMotto: settings.club_motto || 'Discover exceptional whiskies together',
    footerText: settings.footer_text || '© 2024 Åby Whisky Club. All rights reserved.',
    siteName: settings.site_name || 'Åby Whisky Club',
    loading
  };
};

export default useAppearance;