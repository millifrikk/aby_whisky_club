import React from 'react';
import { useAppearance } from '../../hooks/useAppearance';
import DarkModeToggle from '../common/DarkModeToggle';
import { Palette, Moon, Sun, Eye } from 'lucide-react';

const AppearanceTestPanel = () => {
  const { 
    primaryColor, 
    secondaryColor, 
    isDarkMode, 
    darkModeEnabled, 
    siteLogoUrl,
    siteName,
    loading 
  } = useAppearance();

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 theme-transition">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance Test Panel</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Test and preview appearance settings</p>
          </div>
        </div>
        <Eye className="h-5 w-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Color Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Color Scheme</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Primary Color:</span>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600" 
                  style={{ backgroundColor: primaryColor }}
                ></div>
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{primaryColor}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Secondary Color:</span>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600" 
                  style={{ backgroundColor: secondaryColor }}
                ></div>
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{secondaryColor}</span>
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Color Preview:</p>
            <div className="flex items-center space-x-2">
              <button 
                className="px-3 py-1 rounded text-white text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Primary
              </button>
              <button 
                className="px-3 py-1 rounded text-white text-sm"
                style={{ backgroundColor: secondaryColor }}
              >
                Secondary
              </button>
            </div>
          </div>
        </div>

        {/* Dark Mode Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Theme Mode</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Dark Mode Available:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                darkModeEnabled 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {darkModeEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Theme:</span>
              <div className="flex items-center space-x-2">
                {isDarkMode ? (
                  <Moon className="h-4 w-4 text-slate-400" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isDarkMode ? 'Dark' : 'Light'}
                </span>
              </div>
            </div>

            {darkModeEnabled && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Toggle Theme:</span>
                <DarkModeToggle />
              </div>
            )}
          </div>

          {/* Theme Preview */}
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Theme Preview:</p>
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div className="h-2 bg-gray-300 dark:bg-gray-500 rounded w-3/4"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Site Branding */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Site Branding</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Site Name:</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{siteName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Logo URL:</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-32">
              {siteLogoUrl || 'Not set'}
            </span>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Testing Instructions</h5>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Change colors in the admin settings to see real-time updates</li>
          <li>• Use the dark mode toggle to test theme switching</li>
          <li>• Dark mode setting must be enabled in appearance settings</li>
          <li>• All changes are applied immediately across the application</li>
        </ul>
      </div>
    </div>
  );
};

export default AppearanceTestPanel;