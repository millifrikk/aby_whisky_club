import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔧 SettingsContext: Fetching public settings...');
      const response = await axios.get(`${API_BASE_URL}/settings/public`);
      console.log('🔧 SettingsContext: Raw API response:', response.data);
      
      // Handle the key-value object format from API
      const settingsObj = response.data && response.data.settings ? response.data.settings : {};
      
      console.log('🔧 SettingsContext: Processed settings object:', settingsObj);
      console.log('🔧 SettingsContext: Currency symbol loaded:', settingsObj.currency_symbol);
      setSettings(settingsObj);
    } catch (error) {
      console.error('Failed to load public settings:', error);
      setError(error.message);
      // Set fallback values with guest browsing enabled by default
      setSettings({
        currency_symbol: '$',
        currency_code: 'USD',
        default_language: 'en',
        allow_guest_browsing: 'true',
        allow_registration: 'true'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = () => {
    fetchSettings();
  };

  const value = {
    settings,
    loading,
    error,
    refreshSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;