import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: t('language.english'), flag: '🇺🇸' },
    { code: 'sv', name: t('language.swedish'), flag: '🇸🇪' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center px-2 py-2 text-xl hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-md transition-colors"
        aria-label={t('language.select')}
        title={currentLanguage.name}
      >
        <span>{currentLanguage.flag}</span>
      </button>

      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1" role="menu">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`flex items-center w-full px-3 py-2 text-sm text-left hover:bg-amber-50 hover:text-amber-600 transition-colors ${
                i18n.language === language.code
                  ? 'bg-amber-50 text-amber-600 font-medium'
                  : 'text-gray-700'
              }`}
              role="menuitem"
              title={language.name}
            >
              <span className="text-lg mr-2">{language.flag}</span>
              <span className="text-xs">{language.name}</span>
              {i18n.language === language.code && (
                <svg
                  className="w-3 h-3 ml-auto text-amber-600"
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
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;