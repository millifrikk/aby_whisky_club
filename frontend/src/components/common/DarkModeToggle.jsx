import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '../../hooks/useAppearance';

const DarkModeToggle = ({ className = '' }) => {
  const { isDarkMode, darkModeEnabled, toggleDarkMode } = useAppearance();

  // Don't show toggle if dark mode is disabled by admin
  if (!darkModeEnabled) {
    return null;
  }

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        p-2 rounded-lg transition-all duration-300 ease-in-out
        hover:bg-gray-100 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50
        ${className}
      `}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`
            absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300
            ${isDarkMode ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
        />
        <Moon 
          className={`
            absolute inset-0 w-5 h-5 text-slate-400 transition-all duration-300
            ${isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
          `}
        />
      </div>
    </button>
  );
};

export default DarkModeToggle;