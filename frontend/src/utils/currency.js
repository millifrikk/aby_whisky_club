import { useSettings } from '../contexts/SettingsContext';

/**
 * Formats a price amount with the specified currency symbol and code
 * @param {number} amount - The price amount to format
 * @param {string} currencySymbol - Currency symbol (e.g., '$', '€', 'kr')
 * @param {string} currencyCode - Currency code (e.g., 'USD', 'EUR', 'SEK')
 * @returns {string} Formatted price string
 */
export const formatPrice = (amount, currencySymbol = '$', currencyCode = 'USD') => {
  // Handle null, undefined, or empty string
  if (!amount && amount !== 0) return '';
  
  // Validate amount is a number
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    console.warn(`Invalid amount for currency formatting: ${amount}`);
    return `${currencySymbol}0.00`;
  }
  
  // Validate currency code format (should be 3 letters)
  const validCurrencyCode = currencyCode && currencyCode.length === 3 ? currencyCode.toUpperCase() : 'USD';
  const validCurrencySymbol = currencySymbol || '$';
  
  try {
    // Use Intl.NumberFormat for proper number formatting based on currency
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    const formatted = formatter.format(numAmount);
    
    // Replace the default currency symbol with our custom symbol
    // This handles cases where the admin sets a custom symbol
    const defaultSymbol = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrencyCode
    }).formatToParts(1).find(part => part.type === 'currency').value;
    
    return formatted.replace(defaultSymbol, validCurrencySymbol);
  } catch (error) {
    // Fallback for invalid currency codes
    console.warn(`Invalid currency code: ${validCurrencyCode}, using fallback formatting`);
    return `${validCurrencySymbol}${numAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
};

/**
 * Custom hook that provides currency-related functionality
 * Uses admin settings for currency symbol and code
 * @returns {object} Currency utilities and formatting functions
 */
export const useCurrency = () => {
  const { settings, loading, error } = useSettings();
  
  // Use fallback values if settings are not loaded or invalid
  const currencySymbol = settings?.currency_symbol || '$';
  const currencyCode = settings?.currency_code || 'USD';
  
  // Validate currency code format
  const validCurrencyCode = currencyCode && currencyCode.length === 3 ? currencyCode.toUpperCase() : 'USD';
  const validCurrencySymbol = currencySymbol || '$';
  
  console.log('💰 useCurrency: Settings loaded:', { 
    currencySymbol: validCurrencySymbol, 
    currencyCode: validCurrencyCode, 
    loading, 
    error,
    hasSettings: !!settings 
  });
  
  /**
   * Format a price using the current admin currency settings
   * @param {number} amount - Amount to format
   * @returns {string} Formatted price string
   */
  const formatPrice = (amount) => {
    return formatPriceWithCurrency(amount, validCurrencySymbol, validCurrencyCode);
  };
  
  /**
   * Get just the currency symbol for display in labels
   * @returns {string} Currency symbol
   */
  const getSymbol = () => validCurrencySymbol;
  
  /**
   * Get the currency code
   * @returns {string} Currency code (e.g., 'USD', 'SEK')
   */
  const getCode = () => validCurrencyCode;
  
  /**
   * Check if currency settings are loaded
   * @returns {boolean} True if settings are loaded
   */
  const isLoaded = () => !loading && !error;
  
  /**
   * Check if there was an error loading settings
   * @returns {boolean} True if there was an error
   */
  const hasError = () => !!error;
  
  /**
   * Validate if a currency code is supported
   * @param {string} code - Currency code to validate
   * @returns {boolean} True if currency code is valid
   */
  const isValidCurrencyCode = (code) => {
    return code && typeof code === 'string' && code.length === 3;
  };
  
  return {
    symbol: validCurrencySymbol,
    code: validCurrencyCode,
    formatPrice,
    getSymbol,
    getCode,
    isLoaded,
    hasError,
    isValidCurrencyCode,
    loading,
    error
  };
};

// Named export for direct use without hook
export const formatPriceWithCurrency = formatPrice;