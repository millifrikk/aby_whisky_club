import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useCurrency, formatPriceWithCurrency } from '../../utils/currency';
import { useCurrencyConverter } from '../../utils/currencyConversion';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CurrencyManagementPanel = () => {
  const { settings, refreshSettings } = useSettings();
  const { symbol: currentSymbol, code: currentCode } = useCurrency();
  const { converter, isReady: converterReady, getAvailableCurrencies } = useCurrencyConverter();
  
  const [loading, setLoading] = useState(false);
  const [testAmount, setTestAmount] = useState('100');
  const [previewCurrency, setPreviewCurrency] = useState('');
  const [exchangeRates, setExchangeRates] = useState({
    exchange_rate_usd: '1',
    exchange_rate_sek: '10.5',
    exchange_rate_eur: '0.85',
    exchange_rate_gbp: '0.75'
  });

  // Currency options with their standard symbols
  const supportedCurrencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar', rateKey: 'exchange_rate_usd' },
    { code: 'SEK', symbol: 'Kr', name: 'Swedish Krona', rateKey: 'exchange_rate_sek' },
    { code: 'EUR', symbol: '€', name: 'Euro', rateKey: 'exchange_rate_eur' },
    { code: 'GBP', symbol: '£', name: 'British Pound', rateKey: 'exchange_rate_gbp' }
  ];

  // Load current exchange rates from settings
  useEffect(() => {
    if (settings) {
      setExchangeRates({
        exchange_rate_usd: settings.exchange_rate_usd || '1',
        exchange_rate_sek: settings.exchange_rate_sek || '10.5',
        exchange_rate_eur: settings.exchange_rate_eur || '0.85',
        exchange_rate_gbp: settings.exchange_rate_gbp || '0.75'
      });
    }
  }, [settings]);

  const handleCurrencyChange = async (newCurrencyCode) => {
    try {
      setLoading(true);
      
      const selectedCurrency = supportedCurrencies.find(c => c.code === newCurrencyCode);
      if (!selectedCurrency) return;

      await adminAPI.updateSystemSetting('currency_code', { value: newCurrencyCode });
      await adminAPI.updateSystemSetting('currency_symbol', { value: selectedCurrency.symbol });
      
      await refreshSettings();
      toast.success(`Currency changed to ${selectedCurrency.symbol} ${newCurrencyCode}`);
      
    } catch (error) {
      console.error('Error updating currency:', error);
      toast.error('Failed to update currency settings');
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeRateUpdate = async (rateKey, newRate) => {
    try {
      const rateValue = parseFloat(newRate);
      if (isNaN(rateValue) || rateValue <= 0) {
        toast.error('Exchange rate must be a positive number');
        return;
      }

      await adminAPI.updateSystemSetting(rateKey, { value: newRate });
      await refreshSettings();
      
      setExchangeRates(prev => ({
        ...prev,
        [rateKey]: newRate
      }));
      
      toast.success('Exchange rate updated successfully');
      
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      toast.error('Failed to update exchange rate');
    }
  };

  const renderCurrencyPreview = () => {
    if (!testAmount || !previewCurrency || !converterReady) return null;

    try {
      const converted = converter.convertCurrency(
        parseFloat(testAmount), 
        currentCode, 
        previewCurrency
      );
      const previewCurrencyInfo = supportedCurrencies.find(c => c.code === previewCurrency);
      
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Currency Conversion Preview</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-green-700">Current ({currentCode}):</span>
              <span className="font-medium">{formatPriceWithCurrency(testAmount, currentSymbol, currentCode)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Converted ({previewCurrency}):</span>
              <span className="font-medium">{formatPriceWithCurrency(converted, previewCurrencyInfo?.symbol, previewCurrency)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">Exchange Rate:</span>
              <span>1 {currentCode} = {converter.getConversionRate(currentCode, previewCurrency)?.toFixed(4)} {previewCurrency}</span>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">Error calculating conversion: {error.message}</p>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-6">Currency Management</h3>
      
      {/* Current Currency Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-900 mb-2">Current System Currency</h4>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-blue-800">{currentSymbol} {currentCode}</span>
            <span className="text-blue-600 ml-2">
              ({supportedCurrencies.find(c => c.code === currentCode)?.name})
            </span>
          </div>
          <div className="text-sm text-blue-700">
            Sample: {formatPriceWithCurrency(299.99, currentSymbol, currentCode)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Selection */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Change System Currency</h4>
          
          <div className="space-y-3">
            {supportedCurrencies.map(currency => (
              <button
                key={currency.code}
                onClick={() => handleCurrencyChange(currency.code)}
                disabled={loading || currency.code === currentCode}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  currency.code === currentCode
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{currency.symbol} {currency.code}</span>
                    <span className="text-sm text-gray-600 block">{currency.name}</span>
                  </div>
                  {currency.code === currentCode && (
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                      Current
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Exchange Rates Management */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Exchange Rates (relative to USD)</h4>
          
          <div className="space-y-3">
            {supportedCurrencies.map(currency => (
              <div key={currency.code} className="flex items-center space-x-3">
                <div className="w-16 text-sm font-medium text-gray-700">
                  {currency.code}:
                </div>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={exchangeRates[currency.rateKey]}
                  onChange={(e) => setExchangeRates(prev => ({
                    ...prev,
                    [currency.rateKey]: e.target.value
                  }))}
                  onBlur={(e) => handleExchangeRateUpdate(currency.rateKey, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  disabled={currency.code === 'USD'} // USD is always 1.0
                />
                <div className="text-xs text-gray-500 w-24">
                  {currency.code === 'USD' ? 'Base' : `1 USD = ${exchangeRates[currency.rateKey]} ${currency.code}`}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>Note:</strong> Exchange rates are relative to USD. 
            For example, if 1 USD = 10.5 SEK, enter "10.5" for SEK rate.
          </div>
        </div>
      </div>

      {/* Currency Testing Tool */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-4">Currency Conversion Testing</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              placeholder="Enter amount..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Convert To
            </label>
            <select
              value={previewCurrency}
              onChange={(e) => setPreviewCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Select currency...</option>
              {supportedCurrencies
                .filter(c => c.code !== currentCode)
                .map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setTestAmount('299.99');
                setPreviewCurrency(currentCode === 'USD' ? 'SEK' : 'USD');
              }}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
            >
              Quick Test
            </button>
          </div>
        </div>
        
        {renderCurrencyPreview()}
      </div>

      {/* Live Currency Examples */}
      <div className="mt-6 p-4 bg-amber-50 rounded-lg">
        <h4 className="font-medium text-amber-900 mb-3">Live Examples in Current Currency</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[50, 100, 500, 1000].map(amount => (
            <div key={amount} className="text-center">
              <div className="text-amber-800 font-medium">
                {formatPriceWithCurrency(amount, currentSymbol, currentCode)}
              </div>
              <div className="text-amber-600 text-xs">Sample Price</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurrencyManagementPanel;