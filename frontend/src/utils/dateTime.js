import { useSettings } from '../contexts/SettingsContext';

/**
 * Comprehensive date/time formatting utilities with timezone awareness
 * Integrates with admin settings for localization preferences
 */

/**
 * Formats a date according to locale and admin settings
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('short', 'medium', 'long', 'full')
 * @param {string} locale - Locale code (e.g., 'en-US', 'sv-SE')
 * @param {string} timezone - Timezone (e.g., 'Europe/Stockholm', 'America/New_York')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'medium', locale = 'en-US', timezone = null) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.warn(`Invalid date provided to formatDate: ${date}`);
      return '';
    }
    
    const formatOptions = {
      short: { dateStyle: 'short' },
      medium: { dateStyle: 'medium' },
      long: { dateStyle: 'long' },
      full: { dateStyle: 'full' },
      // Custom formats
      'day-month': { day: 'numeric', month: 'short' },
      'month-year': { month: 'long', year: 'numeric' },
      'year-only': { year: 'numeric' }
    };
    
    const options = formatOptions[format] || formatOptions.medium;
    
    // Add timezone if provided
    if (timezone) {
      options.timeZone = timezone;
    }
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return new Date(date).toLocaleDateString();
  }
};

/**
 * Formats a time according to locale and admin settings
 * @param {Date|string} date - Date/time to format
 * @param {string} format - Format type ('short', 'medium', 'long')
 * @param {string} locale - Locale code
 * @param {string} timezone - Timezone
 * @param {boolean} includeSeconds - Whether to include seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (date, format = 'short', locale = 'en-US', timezone = null, includeSeconds = false) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.warn(`Invalid date provided to formatTime: ${date}`);
      return '';
    }
    
    const formatOptions = {
      short: { timeStyle: 'short' },
      medium: { timeStyle: 'medium' },
      long: { timeStyle: 'long' }
    };
    
    const options = formatOptions[format] || formatOptions.short;
    
    // Override with custom seconds option if needed
    if (includeSeconds && format === 'short') {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      delete options.timeStyle;
    }
    
    // Add timezone if provided
    if (timezone) {
      options.timeZone = timezone;
    }
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    console.error('Error formatting time:', error);
    return new Date(date).toLocaleTimeString();
  }
};

/**
 * Formats a date and time together
 * @param {Date|string} date - Date/time to format
 * @param {string} dateFormat - Date format type
 * @param {string} timeFormat - Time format type
 * @param {string} locale - Locale code
 * @param {string} timezone - Timezone
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, dateFormat = 'medium', timeFormat = 'short', locale = 'en-US', timezone = null) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.warn(`Invalid date provided to formatDateTime: ${date}`);
      return '';
    }
    
    const options = {
      dateStyle: dateFormat === 'short' ? 'short' : dateFormat === 'long' ? 'long' : 'medium',
      timeStyle: timeFormat === 'long' ? 'long' : timeFormat === 'medium' ? 'medium' : 'short'
    };
    
    // Add timezone if provided
    if (timezone) {
      options.timeZone = timezone;
    }
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return new Date(date).toLocaleString();
  }
};

/**
 * Formats a relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string} date - Date to compare
 * @param {string} locale - Locale code
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date, locale = 'en-US') => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.warn(`Invalid date provided to formatRelativeTime: ${date}`);
      return '';
    }
    
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    // Use Intl.RelativeTimeFormat for proper localization
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (Math.abs(diffSec) < 60) {
      return rtf.format(diffSec, 'second');
    } else if (Math.abs(diffMin) < 60) {
      return rtf.format(diffMin, 'minute');
    } else if (Math.abs(diffHour) < 24) {
      return rtf.format(diffHour, 'hour');
    } else {
      return rtf.format(diffDay, 'day');
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'some time ago';
  }
};

/**
 * Gets user's timezone from browser
 * @returns {string} User's timezone
 */
export const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not determine user timezone, using UTC');
    return 'UTC';
  }
};

/**
 * Converts a date to a different timezone
 * @param {Date|string} date - Date to convert
 * @param {string} timezone - Target timezone
 * @returns {Date} Date object in target timezone
 */
export const convertToTimezone = (date, timezone) => {
  if (!date) return null;
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.warn(`Invalid date provided to convertToTimezone: ${date}`);
      return null;
    }
    
    // Create a new date in the target timezone
    const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
    const targetDate = new Date(utc);
    
    return targetDate;
  } catch (error) {
    console.error('Error converting timezone:', error);
    return new Date(date);
  }
};

/**
 * React hook for date/time formatting with admin settings integration
 */
export const useDateTime = () => {
  const { settings, loading } = useSettings();
  
  // Extract date/time settings from admin settings
  const locale = settings?.locale || 'en-US';
  const timezone = settings?.timezone || getUserTimezone();
  const dateFormat = settings?.date_format || 'medium';
  const timeFormat = settings?.time_format || '12h';
  const firstDayOfWeek = settings?.first_day_of_week || 0;
  const weekNumbering = settings?.week_numbering || 'iso';
  const use24HourTime = timeFormat === '24h';
  
  /**
   * Format date using admin settings
   */
  const formatDateWithSettings = (date, customFormat = null) => {
    return formatDate(date, customFormat || dateFormat, locale, timezone);
  };
  
  /**
   * Format time using admin settings
   */
  const formatTimeWithSettings = (date, customFormat = null) => {
    if (!date) return '';
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      
      const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !use24HourTime
      };
      
      if (timezone) {
        options.timeZone = timezone;
      }
      
      return new Intl.DateTimeFormat(locale, options).format(dateObj);
    } catch (error) {
      console.error('Error formatting time with settings:', error);
      return new Date(date).toLocaleTimeString();
    }
  };
  
  /**
   * Format date and time using admin settings
   */
  const formatDateTimeWithSettings = (date, customDateFormat = null, customTimeFormat = null) => {
    return formatDateTime(
      date,
      customDateFormat || dateFormat,
      customTimeFormat || timeFormat,
      locale,
      timezone
    );
  };
  
  /**
   * Format relative time using admin settings
   */
  const formatRelativeTimeWithSettings = (date) => {
    return formatRelativeTime(date, locale);
  };
  
  /**
   * Format date for event displays (user-friendly format)
   */
  const formatEventDate = (date) => {
    if (!date) return '';
    
    const today = new Date();
    const eventDate = new Date(date);
    const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays > 0 && diffDays <= 7) {
      return `In ${diffDays} days`;
    } else if (diffDays < 0 && diffDays >= -7) {
      return `${Math.abs(diffDays)} days ago`;
    } else {
      return formatDateWithSettings(date);
    }
  };
  
  /**
   * Format whisky purchase date for display
   */
  const formatPurchaseDate = (date) => {
    if (!date) return 'Unknown';
    
    const purchaseDate = new Date(date);
    const today = new Date();
    const diffMonths = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + 
                       (today.getMonth() - purchaseDate.getMonth());
    
    if (diffMonths === 0) {
      return 'This month';
    } else if (diffMonths === 1) {
      return 'Last month';
    } else if (diffMonths < 12) {
      return `${diffMonths} months ago`;
    } else {
      const diffYears = Math.floor(diffMonths / 12);
      return diffYears === 1 ? 'Last year' : `${diffYears} years ago`;
    }
  };

  /**
   * Get the week number according to the configured numbering system
   * @param {Date} date - Date to get week number for
   * @returns {number} Week number
   */
  const getWeekNumber = (date) => {
    if (!date) return 0;
    
    const dateObj = new Date(date);
    
    if (weekNumbering === 'iso') {
      // ISO 8601 week numbering
      const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    } else {
      // US week numbering (starts on Sunday)
      const onejan = new Date(dateObj.getFullYear(), 0, 1);
      const millisecsInDay = 86400000;
      return Math.ceil((((dateObj - onejan) / millisecsInDay) + onejan.getDay() + 1) / 7);
    }
  };

  /**
   * Get calendar weeks for a month with proper first day of week
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @returns {Array} Array of week arrays
   */
  const getMonthWeeks = (year, month) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Adjust first day based on setting (0 = Sunday, 1 = Monday)
    let startDate = new Date(firstDay);
    const dayOffset = (firstDay.getDay() - firstDayOfWeek + 7) % 7;
    startDate.setDate(startDate.getDate() - dayOffset);
    
    while (startDate <= lastDay) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        week.push({
          date: new Date(date),
          inCurrentMonth: date.getMonth() === month,
          weekNumber: getWeekNumber(date)
        });
      }
      weeks.push(week);
      startDate.setDate(startDate.getDate() + 7);
    }
    
    return weeks;
  };
  
  return {
    // Basic formatting functions
    formatDate: formatDateWithSettings,
    formatTime: formatTimeWithSettings,
    formatDateTime: formatDateTimeWithSettings,
    formatRelativeTime: formatRelativeTimeWithSettings,
    
    // Specialized formatting functions
    formatEventDate,
    formatPurchaseDate,
    
    // Calendar functions
    getWeekNumber,
    getMonthWeeks,
    
    // Utility functions
    getUserTimezone,
    convertToTimezone,
    
    // Current settings
    locale,
    timezone,
    dateFormat,
    timeFormat,
    firstDayOfWeek,
    weekNumbering,
    use24HourTime,
    loading,
    
    // Validation function
    isValidDate: (date) => {
      if (!date) return false;
      const dateObj = new Date(date);
      return !isNaN(dateObj.getTime());
    }
  };
};

// Named exports for direct use
export {
  formatDate as formatDateDirect,
  formatTime as formatTimeDirect,
  formatDateTime as formatDateTimeDirect,
  formatRelativeTime as formatRelativeTimeDirect
};