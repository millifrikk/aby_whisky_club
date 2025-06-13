import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAvailableLanguages, getPotentialLanguages, getLanguageConfig, detectUserLanguage } from '../../utils/languages';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [showExpanded, setShowExpanded] = useState(false);

  // Get available languages (those with translations)
  const availableLanguages = getAvailableLanguages();
  const potentialLanguages = getPotentialLanguages().slice(0, 6); // Show top 6 potential languages
  
  const currentLanguage = getLanguageConfig(i18n.language) || getLanguageConfig('en');

  const handleLanguageChange = (languageCode) => {
    if (availableLanguages.some(lang => lang.code === languageCode)) {
      i18n.changeLanguage(languageCode);
      setShowExpanded(false);
    }
  };

  const handleAutoDetect = () => {
    const detectedLang = detectUserLanguage();
    i18n.changeLanguage(detectedLang);
    setShowExpanded(false);
  };

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center px-2 py-2 text-xl hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-md transition-colors"
        aria-label={t('language.select')}
        title={currentLanguage?.nativeName || currentLanguage?.name}
      >
        <span>{currentLanguage?.flag || '🌍'}</span>
      </button>

      {/* Enhanced Dropdown menu */}
      <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-2" role="menu">
          {/* Header */}
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
            {t('language.available')}
          </div>
          
          {/* Auto-detect option */}
          <button
            onClick={handleAutoDetect}
            className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-blue-50 hover:text-blue-600 transition-colors text-gray-700"
            role="menuitem"
            title={t('language.autoDetect')}
          >
            <span className="text-lg mr-3">🌐</span>
            <div className="flex-1">
              <div className="text-sm">{t('language.autoDetect')}</div>
              <div className="text-xs text-gray-500">{t('language.detectDescription')}</div>
            </div>
          </button>
          
          <div className="border-t border-gray-100 my-1" />
          
          {/* Available languages */}
          {availableLanguages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`flex items-center w-full px-3 py-2 text-sm text-left hover:bg-amber-50 hover:text-amber-600 transition-colors ${
                i18n.language === language.code
                  ? 'bg-amber-50 text-amber-600 font-medium'
                  : 'text-gray-700'
              }`}
              role="menuitem"
              title={language.nativeName}
            >
              <span className="text-lg mr-3">{language.flag}</span>
              <div className="flex-1">
                <div className="text-sm">{language.nativeName}</div>
                <div className="text-xs text-gray-500">{language.name}</div>
              </div>
              {i18n.language === language.code && (
                <svg
                  className="w-4 h-4 text-amber-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
          
          {/* Coming Soon section */}
          {potentialLanguages.length > 0 && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <div className="px-3 py-2">
                <button
                  onClick={() => setShowExpanded(!showExpanded)}
                  className="flex items-center w-full text-xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors"
                >
                  <span className="flex-1 text-left">{t('language.comingSoon')}</span>
                  <svg
                    className={`w-3 h-3 transition-transform ${showExpanded ? 'rotate-180' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {showExpanded && (
                  <div className="mt-2 space-y-1">
                    {potentialLanguages.map((language) => (
                      <div
                        key={language.code}
                        className="flex items-center px-2 py-1 text-sm text-gray-400 cursor-not-allowed"
                        title={`${language.nativeName} - ${t('language.notYetAvailable')}`}
                      >
                        <span className="text-base mr-3 opacity-50">{language.flag}</span>
                        <div className="flex-1">
                          <div className="text-xs">{language.nativeName}</div>
                          <div className="text-xs text-gray-400">{language.name}</div>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded">
                          {t('language.soon')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;