/**
 * Enhanced language management utilities for dynamic language support
 * Supports extensible language system beyond English/Swedish
 */

/**
 * Comprehensive language configuration
 * Each language includes code, name, native name, flag, and RTL support
 */
export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    dateLocale: 'en-US',
    currency: 'USD',
    region: 'Americas'
  },
  {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    flag: '🇸🇪',
    rtl: false,
    dateLocale: 'sv-SE',
    currency: 'SEK',
    region: 'Europe'
  },
  // Additional European languages
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
    dateLocale: 'de-DE',
    currency: 'EUR',
    region: 'Europe'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false,
    dateLocale: 'fr-FR',
    currency: 'EUR',
    region: 'Europe'
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false,
    dateLocale: 'es-ES',
    currency: 'EUR',
    region: 'Europe'
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    rtl: false,
    dateLocale: 'it-IT',
    currency: 'EUR',
    region: 'Europe'
  },
  {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    rtl: false,
    dateLocale: 'nl-NL',
    currency: 'EUR',
    region: 'Europe'
  },
  {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    flag: '🇳🇴',
    rtl: false,
    dateLocale: 'no-NO',
    currency: 'NOK',
    region: 'Europe'
  },
  {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk',
    flag: '🇩🇰',
    rtl: false,
    dateLocale: 'da-DK',
    currency: 'DKK',
    region: 'Europe'
  },
  // Asian languages
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
    dateLocale: 'ja-JP',
    currency: 'JPY',
    region: 'Asia'
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false,
    dateLocale: 'ko-KR',
    currency: 'KRW',
    region: 'Asia'
  },
  {
    code: 'zh',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    rtl: false,
    dateLocale: 'zh-CN',
    currency: 'CNY',
    region: 'Asia'
  }
];

/**
 * Languages that have translation files available
 * Initially only English and Swedish, others can be added dynamically
 */
export const AVAILABLE_LANGUAGES = [
  'en', 'sv'
];

/**
 * Gets language configuration by code
 * @param {string} code - Language code (e.g., 'en', 'sv')
 * @returns {object|null} Language configuration or null if not found
 */
export const getLanguageConfig = (code) => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || null;
};

/**
 * Gets all supported languages grouped by region
 * @returns {object} Languages grouped by region
 */
export const getLanguagesByRegion = () => {
  return SUPPORTED_LANGUAGES.reduce((regions, language) => {
    const region = language.region;
    if (!regions[region]) {
      regions[region] = [];
    }
    regions[region].push(language);
    return regions;
  }, {});
};

/**
 * Gets currently available languages (those with translation files)
 * @returns {array} Array of available language configurations
 */
export const getAvailableLanguages = () => {
  return SUPPORTED_LANGUAGES.filter(lang => AVAILABLE_LANGUAGES.includes(lang.code));
};

/**
 * Gets languages that could be added (supported but not yet available)
 * @returns {array} Array of potential language configurations
 */
export const getPotentialLanguages = () => {
  return SUPPORTED_LANGUAGES.filter(lang => !AVAILABLE_LANGUAGES.includes(lang.code));
};

/**
 * Detects user's preferred language from browser settings
 * @returns {string} Detected language code or fallback to 'en'
 */
export const detectUserLanguage = () => {
  // Get browser languages in order of preference
  const browserLanguages = navigator.languages || [navigator.language || navigator.userLanguage || 'en'];
  
  // Find the first browser language that we support
  for (const browserLang of browserLanguages) {
    // Extract language code (e.g., 'en-US' -> 'en')
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    // Check if we have this language available
    if (AVAILABLE_LANGUAGES.includes(langCode)) {
      return langCode;
    }
  }
  
  // Fallback to English
  return 'en';
};

/**
 * Gets the display name for a language based on current UI language
 * @param {string} langCode - Language code to get name for
 * @param {string} displayLang - Language to display the name in
 * @returns {string} Language display name
 */
export const getLanguageDisplayName = (langCode, displayLang = 'en') => {
  const config = getLanguageConfig(langCode);
  if (!config) return langCode;
  
  // For now, return English name or native name
  // This could be enhanced with full translation matrix
  if (displayLang === langCode) {
    return config.nativeName;
  } else {
    return config.name;
  }
};

/**
 * Validates if a language code is supported
 * @param {string} code - Language code to validate
 * @returns {boolean} True if language is supported
 */
export const isLanguageSupported = (code) => {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
};

/**
 * Validates if a language is available (has translations)
 * @param {string} code - Language code to validate
 * @returns {boolean} True if language is available
 */
export const isLanguageAvailable = (code) => {
  return AVAILABLE_LANGUAGES.includes(code);
};

/**
 * Gets suggested default currency and locale for a language
 * @param {string} langCode - Language code
 * @returns {object} Suggested defaults { currency, locale, dateLocale }
 */
export const getLanguageDefaults = (langCode) => {
  const config = getLanguageConfig(langCode);
  if (!config) {
    return { currency: 'USD', locale: 'en-US', dateLocale: 'en-US' };
  }
  
  return {
    currency: config.currency,
    locale: config.dateLocale,
    dateLocale: config.dateLocale
  };
};

/**
 * Language regions for UI organization
 */
export const LANGUAGE_REGIONS = {
  'Europe': ['en', 'sv', 'de', 'fr', 'es', 'it', 'nl', 'no', 'da'],
  'Americas': ['en', 'es'],
  'Asia': ['ja', 'ko', 'zh']
};

/**
 * Get direction (LTR/RTL) for a language
 * @param {string} langCode - Language code
 * @returns {string} 'ltr' or 'rtl'
 */
export const getLanguageDirection = (langCode) => {
  const config = getLanguageConfig(langCode);
  return config?.rtl ? 'rtl' : 'ltr';
};

export default {
  SUPPORTED_LANGUAGES,
  AVAILABLE_LANGUAGES,
  getLanguageConfig,
  getLanguagesByRegion,
  getAvailableLanguages,
  getPotentialLanguages,
  detectUserLanguage,
  getLanguageDisplayName,
  isLanguageSupported,
  isLanguageAvailable,
  getLanguageDefaults,
  getLanguageDirection
};