import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../contexts/SettingsContext';
import { useCurrency } from '../../utils/currency';
import { useDateTime } from '../../utils/dateTime';
import { 
  getAvailableLanguages, 
  getPotentialLanguages, 
  detectUserLanguage,
  getLanguageDefaults,
  getLanguagesByRegion 
} from '../../utils/languages';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LocalizationTestPanel = () => {
  const { t, i18n } = useTranslation();
  const { settings, refreshSettings } = useSettings();
  const { symbol: currencySymbol, code: currencyCode, formatPrice } = useCurrency();
  const { formatDate, formatTime, formatRelativeTime, formatEventDate, locale, timezone } = useDateTime();
  
  const [selectedTestLanguage, setSelectedTestLanguage] = useState(i18n.language);
  const [testCurrency, setTestCurrency] = useState(currencyCode);
  const [testAmount, setTestAmount] = useState(299.99);
  const [testDate, setTestDate] = useState(new Date().toISOString());
  const [detectedLanguage, setDetectedLanguage] = useState('');
  
  const availableLanguages = getAvailableLanguages();
  const potentialLanguages = getPotentialLanguages();
  const languagesByRegion = getLanguagesByRegion();
  
  useEffect(() => {
    setDetectedLanguage(detectUserLanguage());
  }, []);

  const handleLanguageTest = async (langCode) => {
    try {
      // Temporarily change language
      await i18n.changeLanguage(langCode);
      setSelectedTestLanguage(langCode);
      
      // Get suggested defaults for this language
      const defaults = getLanguageDefaults(langCode);
      setTestCurrency(defaults.currency);
      
      toast.success(`Language changed to ${langCode} for testing`);
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error('Failed to change language');
    }
  };

  const applyLanguageDefaults = async (langCode) => {
    try {
      const defaults = getLanguageDefaults(langCode);
      
      // Update system settings with suggested defaults
      await adminAPI.updateSystemSetting('locale', { value: defaults.locale });
      await adminAPI.updateSystemSetting('currency_code', { value: defaults.currency });
      
      // Update currency symbol based on currency
      const currencySymbols = {
        'USD': '$',
        'EUR': '€',
        'SEK': 'Kr',
        'GBP': '£',
        'NOK': 'kr',
        'DKK': 'kr',
        'JPY': '¥',
        'KRW': '₩',
        'CNY': '¥'
      };
      
      if (currencySymbols[defaults.currency]) {
        await adminAPI.updateSystemSetting('currency_symbol', { value: currencySymbols[defaults.currency] });
      }
      
      await refreshSettings();
      toast.success(`Applied default settings for ${langCode}`);
    } catch (error) {
      console.error('Error applying language defaults:', error);
      toast.error('Failed to apply language defaults');
    }
  };

  const resetToEnglish = async () => {
    try {
      await i18n.changeLanguage('en');
      setSelectedTestLanguage('en');
      setTestCurrency('USD');
      toast.success('Reset to English');
    } catch (error) {
      console.error('Error resetting language:', error);
      toast.error('Failed to reset language');
    }
  };

  const formatTestCurrency = (amount) => {
    const symbols = {
      'USD': '$', 'EUR': '€', 'SEK': 'Kr', 'GBP': '£',
      'NOK': 'kr', 'DKK': 'kr', 'JPY': '¥', 'KRW': '₩', 'CNY': '¥'
    };
    const symbol = symbols[testCurrency] || '$';
    
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: testCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
      return formatter.format(amount).replace(/[\$€£¥₩]/g, symbol);
    } catch (error) {
      return `${symbol}${amount.toLocaleString()}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-6">Localization Testing & Management</h3>
      
      {/* Current Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-900 mb-3">Current Localization Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Language:</span>
            <div className="text-blue-800">{selectedTestLanguage.toUpperCase()} - {t('language.' + selectedTestLanguage)}</div>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Currency:</span>
            <div className="text-blue-800">{currencySymbol} {currencyCode}</div>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Locale:</span>
            <div className="text-blue-800">{locale}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Testing */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Language Testing</h4>
          
          {/* Browser Detection */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-green-900">Browser Detection</div>
                <div className="text-sm text-green-700">
                  Detected: <span className="font-medium">{detectedLanguage.toUpperCase()}</span>
                </div>
              </div>
              <button
                onClick={() => handleLanguageTest(detectedLanguage)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Apply
              </button>
            </div>
          </div>
          
          {/* Available Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Available Languages
            </label>
            <div className="space-y-2">
              {availableLanguages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageTest(lang.code)}
                  className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors ${
                    selectedTestLanguage === lang.code
                      ? 'bg-amber-50 border border-amber-300 text-amber-800'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{lang.flag}</span>
                    <div>
                      <div className="font-medium">{lang.nativeName}</div>
                      <div className="text-xs text-gray-500">{lang.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        applyLanguageDefaults(lang.code);
                      }}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      title="Apply default locale and currency settings"
                    >
                      Apply Defaults
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Quick Reset */}
          <button
            onClick={resetToEnglish}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Reset to English
          </button>
        </div>

        {/* Localization Preview */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Live Preview</h4>
          
          {/* Sample Text Translations */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-800 mb-3">Text Translations</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Navigation Home:</span>
                <span className="font-medium">{t('navigation.home')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Whiskies:</span>
                <span className="font-medium">{t('whisky.title')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Events:</span>
                <span className="font-medium">{t('events.title')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profile:</span>
                <span className="font-medium">{t('profile.title')}</span>
              </div>
            </div>
          </div>
          
          {/* Currency Formatting Test */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-800 mb-3">Currency Formatting</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.01"
                  value={testAmount}
                  onChange={(e) => setTestAmount(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <select
                  value={testCurrency}
                  onChange={(e) => setTestCurrency(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="SEK">SEK</option>
                  <option value="GBP">GBP</option>
                  <option value="NOK">NOK</option>
                  <option value="DKK">DKK</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
              <div className="text-lg font-medium text-center p-2 bg-white border border-gray-200 rounded">
                {formatTestCurrency(testAmount)}
              </div>
            </div>
          </div>
          
          {/* Date/Time Formatting Test */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-800 mb-3">Date/Time Formatting</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{formatDate(testDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{formatTime(testDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Relative:</span>
                <span className="font-medium">{formatRelativeTime(new Date(Date.now() - 2 * 60 * 60 * 1000))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Event:</span>
                <span className="font-medium">{formatEventDate(new Date(Date.now() + 24 * 60 * 60 * 1000))}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Timezone: {timezone} | Locale: {locale}
            </div>
          </div>
        </div>
      </div>

      {/* Language Expansion Preview */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-medium text-amber-900 mb-3">Future Language Expansion</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {potentialLanguages.slice(0, 8).map(lang => (
            <div key={lang.code} className="flex items-center space-x-2 text-sm">
              <span className="opacity-50">{lang.flag}</span>
              <span className="text-amber-800">{lang.nativeName}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-amber-700">
          These languages are configured and ready for translation files.
        </div>
      </div>
    </div>
  );
};

export default LocalizationTestPanel;