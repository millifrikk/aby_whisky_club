import { useSettings } from '../contexts/SettingsContext';

// Currency conversion utility with hybrid approach (admin rates + manual override)
export class CurrencyConverter {
  constructor(settings = {}) {
    this.settings = settings;
    this.baseCurrency = 'USD'; // All rates are relative to USD
  }

  // Get exchange rate for a currency from admin settings
  getExchangeRate(currencyCode) {
    const rateKey = `exchange_rate_${currencyCode.toLowerCase()}`;
    const rate = this.settings[rateKey];
    return rate !== undefined ? parseFloat(rate) : null;
  }

  // Get available currencies with their rates
  getAvailableCurrencies() {
    const currencies = [];
    
    // Common currencies with their settings keys
    const currencyMap = {
      'USD': { symbol: '$', rateKey: 'exchange_rate_usd' },
      'SEK': { symbol: 'Kr', rateKey: 'exchange_rate_sek' },
      'EUR': { symbol: '€', rateKey: 'exchange_rate_eur' },
      'GBP': { symbol: '£', rateKey: 'exchange_rate_gbp' }
    };

    for (const [code, config] of Object.entries(currencyMap)) {
      const rate = this.getExchangeRate(code);
      if (rate !== null) {
        currencies.push({
          code,
          symbol: config.symbol,
          rate,
          name: this.getCurrencyName(code)
        });
      }
    }

    return currencies;
  }

  // Get currency display name
  getCurrencyName(code) {
    const names = {
      'USD': 'US Dollar',
      'SEK': 'Swedish Krona',
      'EUR': 'Euro',
      'GBP': 'British Pound'
    };
    return names[code] || code;
  }

  // Convert amount between currencies using admin settings rates
  convertCurrency(amount, fromCurrency, toCurrency, customRate = null) {
    if (!amount || amount <= 0) return 0;
    if (fromCurrency === toCurrency) return parseFloat(amount);

    let convertedAmount;

    // Use custom rate if provided (manual override)
    if (customRate && customRate > 0) {
      convertedAmount = parseFloat(amount) * parseFloat(customRate);
    } else {
      // Use admin settings rates
      const fromRate = this.getExchangeRate(fromCurrency);
      const toRate = this.getExchangeRate(toCurrency);

      if (fromRate === null || toRate === null) {
        throw new Error(`Exchange rate not found for ${fromCurrency} or ${toCurrency}`);
      }

      // Convert through USD base: amount / fromRate * toRate
      const usdAmount = parseFloat(amount) / fromRate;
      convertedAmount = usdAmount * toRate;
    }

    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  }

  // Calculate conversion rate between two currencies
  getConversionRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;

    const fromRate = this.getExchangeRate(fromCurrency);
    const toRate = this.getExchangeRate(toCurrency);

    if (fromRate === null || toRate === null) {
      return null;
    }

    // Rate to convert from one currency to another
    return toRate / fromRate;
  }

  // Format conversion details for UI display
  formatConversion(amount, fromCurrency, toCurrency, customRate = null) {
    try {
      const convertedAmount = this.convertCurrency(amount, fromCurrency, toCurrency, customRate);
      const rate = customRate || this.getConversionRate(fromCurrency, toCurrency);
      
      const fromSymbol = this.getAvailableCurrencies().find(c => c.code === fromCurrency)?.symbol || fromCurrency;
      const toSymbol = this.getAvailableCurrencies().find(c => c.code === toCurrency)?.symbol || toCurrency;

      return {
        originalAmount: parseFloat(amount),
        convertedAmount,
        fromCurrency,
        toCurrency,
        fromSymbol,
        toSymbol,
        rate,
        isCustomRate: customRate !== null,
        displayText: `${fromSymbol}${amount} ${fromCurrency} → ${toSymbol}${convertedAmount.toFixed(2)} ${toCurrency}`,
        rateText: `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`
      };
    } catch (error) {
      return {
        error: error.message,
        originalAmount: parseFloat(amount),
        fromCurrency,
        toCurrency
      };
    }
  }
}

// React hook for currency conversion
export const useCurrencyConverter = () => {
  const { settings, loading } = useSettings();
  
  if (loading || !settings) {
    return {
      converter: null,
      loading: true,
      isReady: false
    };
  }

  const converter = new CurrencyConverter(settings);
  
  return {
    converter,
    loading: false,
    isReady: true,
    convertCurrency: (amount, from, to, customRate) => 
      converter.convertCurrency(amount, from, to, customRate),
    formatConversion: (amount, from, to, customRate) => 
      converter.formatConversion(amount, from, to, customRate),
    getAvailableCurrencies: () => converter.getAvailableCurrencies(),
    getConversionRate: (from, to) => converter.getConversionRate(from, to)
  };
};

export default CurrencyConverter;