import { useSettings } from '../contexts/SettingsContext';

export const useAnalyticsSettings = () => {
  const { settings } = useSettings();

  // Helper function to get setting value with fallback
  const getSetting = (key, defaultValue) => {
    const value = settings[key];
    if (value === undefined || value === null) return defaultValue;
    if (typeof defaultValue === 'boolean') {
      return value === 'true' || value === true;
    }
    return value;
  };

  return {
    // Public stats display on homepage
    statsPublic: getSetting('stats_public', true),
    
    // Leaderboard functionality  
    leaderboardEnabled: getSetting('leaderboard_enabled', true),
    
    // Usage tracking (for future analytics)
    usageTrackingEnabled: getSetting('enable_usage_tracking', true),
    
    // Performance monitoring
    performanceMonitoring: getSetting('performance_monitoring', true),
    
    // Google Analytics (future implementation)
    googleAnalyticsEnabled: getSetting('enable_google_analytics', false),
  };
};

export default useAnalyticsSettings;