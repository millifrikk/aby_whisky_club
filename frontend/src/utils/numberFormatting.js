import { useSettings } from '../contexts/SettingsContext';

/**
 * Comprehensive number formatting utilities with localization
 * Integrates with admin settings for regional preferences
 */

/**
 * Format a number according to regional preferences
 * @param {number|string} value - Number to format
 * @param {string} format - Format type ('US', 'EU', 'IN')
 * @param {string} decimalSeparator - Decimal separator character
 * @param {string} thousandsSeparator - Thousands separator character
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, format = 'US', decimalSeparator = '.', thousandsSeparator = ',', decimals = 2) => {
  if (value === null || value === undefined || value === '') return '';
  
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  
  try {
    // Round to specified decimal places
    const rounded = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    const parts = rounded.toFixed(decimals).split('.');
    
    let integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Apply thousands separator based on format
    if (thousandsSeparator && integerPart.length > 3) {
      switch (format) {
        case 'US':
          // US format: 1,234,567
          integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
          break;
        case 'EU':
          // EU format: 1.234.567 or 1 234 567
          integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
          break;
        case 'IN':
          // Indian format: 12,34,567
          integerPart = integerPart.replace(/\B(?=(?:(\d{2})+)?(\d{3})+(?!\d))/g, thousandsSeparator);
          break;
        default:
          integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
      }
    }
    
    // Join with decimal separator
    if (decimals > 0 && decimalPart) {
      return integerPart + decimalSeparator + decimalPart;
    } else {
      return integerPart;
    }
  } catch (error) {
    console.error('Error formatting number:', error);
    return value.toString();
  }
};

/**
 * Format a currency value with localization
 * @param {number|string} value - Currency value to format
 * @param {string} currencySymbol - Currency symbol
 * @param {string} format - Number format type
 * @param {string} decimalSeparator - Decimal separator
 * @param {string} thousandsSeparator - Thousands separator
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currencySymbol = '$', format = 'US', decimalSeparator = '.', thousandsSeparator = ',') => {
  if (value === null || value === undefined || value === '') return '';
  
  const formatted = formatNumber(value, format, decimalSeparator, thousandsSeparator, 2);
  if (!formatted) return '';
  
  // Currency symbol placement varies by locale
  switch (format) {
    case 'EU':
      // EU: 1.234,56 €
      return `${formatted} ${currencySymbol}`;
    case 'US':
    case 'IN':
    default:
      // US/IN: $1,234.56
      return `${currencySymbol}${formatted}`;
  }
};

/**
 * Format a percentage with localization
 * @param {number|string} value - Percentage value (0-1 or 0-100)
 * @param {boolean} isDecimal - Whether value is decimal (0-1) or percentage (0-100)
 * @param {string} format - Number format type
 * @param {string} decimalSeparator - Decimal separator
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, isDecimal = true, format = 'US', decimalSeparator = '.', decimals = 1) => {
  if (value === null || value === undefined || value === '') return '';
  
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  
  const percentage = isDecimal ? num * 100 : num;
  const formatted = formatNumber(percentage, format, decimalSeparator, '', decimals);
  
  return `${formatted}%`;
};

/**
 * Parse a formatted number string back to number
 * @param {string} value - Formatted number string
 * @param {string} decimalSeparator - Decimal separator used
 * @param {string} thousandsSeparator - Thousands separator used
 * @returns {number|null} Parsed number or null if invalid
 */
export const parseFormattedNumber = (value, decimalSeparator = '.', thousandsSeparator = ',') => {
  if (!value || typeof value !== 'string') return null;
  
  try {
    // Remove thousands separators
    let cleaned = value.replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '');
    
    // Convert decimal separator to dot
    if (decimalSeparator !== '.') {
      cleaned = cleaned.replace(decimalSeparator, '.');
    }
    
    // Remove any non-numeric characters except dots and minus
    cleaned = cleaned.replace(/[^\d.-]/g, '');
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  } catch (error) {
    console.error('Error parsing formatted number:', error);
    return null;
  }
};

/**
 * React hook for number formatting with admin settings integration
 */
export const useNumberFormatting = () => {
  const { settings, loading } = useSettings();
  
  // Extract number formatting settings from admin settings
  const numberFormat = settings?.number_format || 'US';
  const decimalSeparator = settings?.decimal_separator || '.';
  const thousandsSeparator = settings?.thousands_separator || ',';
  const currencySymbol = settings?.currency_symbol || '$';
  
  /**
   * Format number using admin settings
   */
  const formatNumberWithSettings = (value, decimals = 2) => {
    return formatNumber(value, numberFormat, decimalSeparator, thousandsSeparator, decimals);
  };
  
  /**
   * Format currency using admin settings
   */
  const formatCurrencyWithSettings = (value) => {
    return formatCurrency(value, currencySymbol, numberFormat, decimalSeparator, thousandsSeparator);
  };
  
  /**
   * Format percentage using admin settings
   */
  const formatPercentageWithSettings = (value, isDecimal = true, decimals = 1) => {
    return formatPercentage(value, isDecimal, numberFormat, decimalSeparator, decimals);
  };
  
  /**
   * Parse formatted number using admin settings
   */
  const parseFormattedNumberWithSettings = (value) => {
    return parseFormattedNumber(value, decimalSeparator, thousandsSeparator);
  };
  
  /**
   * Format whisky rating (0-5 or 0-10 scale)
   */
  const formatRating = (value, maxScale = 5) => {
    if (value === null || value === undefined) return '--';
    
    const num = parseFloat(value);
    if (isNaN(num)) return '--';
    
    return formatNumberWithSettings(num, 1);
  };
  
  /**
   * Format ABV percentage
   */
  const formatABV = (value) => {
    if (value === null || value === undefined) return '--';
    
    const num = parseFloat(value);
    if (isNaN(num)) return '--';
    
    return formatPercentageWithSettings(num, false, 1);
  };
  
  /**
   * Format age in years
   */
  const formatAge = (value) => {
    if (value === null || value === undefined) return 'NAS';
    
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) return 'NAS';
    
    return `${num}y`;
  };
  
  /**
   * Format price with currency
   */
  const formatPrice = (value, currency = null) => {
    if (value === null || value === undefined) return '--';
    
    const symbol = currency || currencySymbol;
    return formatCurrency(value, symbol, numberFormat, decimalSeparator, thousandsSeparator);
  };
  
  /**
   * Format large numbers (e.g., member counts, statistics)
   */
  const formatLargeNumber = (value) => {
    if (value === null || value === undefined) return '0';
    
    const num = parseInt(value, 10);
    if (isNaN(num)) return '0';
    
    if (num >= 1000000) {
      return formatNumberWithSettings(num / 1000000, 1) + 'M';
    } else if (num >= 1000) {
      return formatNumberWithSettings(num / 1000, 1) + 'K';
    } else {
      return formatNumberWithSettings(num, 0);
    }
  };
  
  return {
    // Core formatting functions
    formatNumber: formatNumberWithSettings,
    formatCurrency: formatCurrencyWithSettings,
    formatPercentage: formatPercentageWithSettings,
    parseFormattedNumber: parseFormattedNumberWithSettings,
    
    // Specialized formatting functions
    formatRating,
    formatABV,
    formatAge,
    formatPrice,
    formatLargeNumber,
    
    // Current settings
    numberFormat,
    decimalSeparator,
    thousandsSeparator,
    currencySymbol,
    loading,
    
    // Validation functions
    isValidNumber: (value) => {
      const parsed = parseFormattedNumberWithSettings(value);
      return parsed !== null && !isNaN(parsed);
    },
    
    // Format examples for UI
    getFormatExamples: () => {
      const sampleNumber = 1234.56;
      return {
        number: formatNumberWithSettings(sampleNumber),
        currency: formatCurrencyWithSettings(sampleNumber),
        percentage: formatPercentageWithSettings(0.1234, true, 2),
        large: formatLargeNumber(1234567)
      };
    }
  };
};

// Named exports for direct use
export {
  formatNumber as formatNumberDirect,
  formatCurrency as formatCurrencyDirect,
  formatPercentage as formatPercentageDirect,
  parseFormattedNumber as parseFormattedNumberDirect
};