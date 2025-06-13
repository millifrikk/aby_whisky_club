import React, { useState } from 'react';

const CurrencyConversionPanel = ({ 
  currentCurrency, 
  currentSymbol, 
  purchasePrice, 
  currentPrice, 
  availableCurrencies, 
  converter, 
  onConvert 
}) => {
  const [targetCurrency, setTargetCurrency] = useState('');
  const [customRate, setCustomRate] = useState('');
  const [showConversion, setShowConversion] = useState(false);
  const [conversionPreview, setConversionPreview] = useState(null);

  const handleCurrencyChange = (newCurrency) => {
    setTargetCurrency(newCurrency);
    if (newCurrency && currentCurrency !== newCurrency) {
      calculatePreview(newCurrency, customRate);
    } else {
      setConversionPreview(null);
    }
  };

  const handleCustomRateChange = (rate) => {
    setCustomRate(rate);
    if (targetCurrency && currentCurrency !== targetCurrency) {
      calculatePreview(targetCurrency, rate);
    }
  };

  const calculatePreview = (toCurrency, customRateValue) => {
    try {
      const targetCurrencyInfo = availableCurrencies.find(c => c.code === toCurrency);
      if (!targetCurrencyInfo) return;

      const rate = customRateValue ? parseFloat(customRateValue) : converter.getConversionRate(currentCurrency, toCurrency);
      if (!rate) return;

      const convertedPurchasePrice = purchasePrice ? converter.convertCurrency(purchasePrice, currentCurrency, toCurrency, customRateValue ? parseFloat(customRateValue) : null) : 0;
      const convertedCurrentPrice = currentPrice ? converter.convertCurrency(currentPrice, currentCurrency, toCurrency, customRateValue ? parseFloat(customRateValue) : null) : 0;

      setConversionPreview({
        fromCurrency: currentCurrency,
        fromSymbol: currentSymbol,
        toCurrency,
        toSymbol: targetCurrencyInfo.symbol,
        rate,
        isCustomRate: Boolean(customRateValue),
        originalPurchasePrice: parseFloat(purchasePrice) || 0,
        originalCurrentPrice: parseFloat(currentPrice) || 0,
        convertedPurchasePrice,
        convertedCurrentPrice
      });
    } catch (error) {
      console.error('Error calculating conversion preview:', error);
      setConversionPreview(null);
    }
  };

  const executeConversion = () => {
    if (!conversionPreview) return;

    onConvert({
      purchasePrice: conversionPreview.convertedPurchasePrice,
      currentPrice: conversionPreview.convertedCurrentPrice,
      newCurrencyCode: conversionPreview.toCurrency,
      newCurrencySymbol: conversionPreview.toSymbol
    });

    // Reset conversion state
    setTargetCurrency('');
    setCustomRate('');
    setShowConversion(false);
    setConversionPreview(null);
  };

  if (!showConversion) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-900">Currency Conversion</h3>
            <p className="text-sm text-blue-700">
              Current prices are in {currentSymbol} {currentCurrency}. Convert to different currency?
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowConversion(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Convert Currency
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-amber-900 mb-4">Convert Currency</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conversion Settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Convert to Currency
            </label>
            <select
              value={targetCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Select target currency...</option>
              {availableCurrencies
                .filter(currency => currency.code !== currentCurrency)
                .map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
            </select>
          </div>

          {targetCurrency && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Exchange Rate (Optional)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={customRate}
                onChange={(e) => handleCustomRateChange(e.target.value)}
                placeholder={`Default: ${converter.getConversionRate(currentCurrency, targetCurrency)?.toFixed(4) || 'N/A'}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                1 {currentCurrency} = X {targetCurrency}
              </p>
            </div>
          )}
        </div>

        {/* Conversion Preview */}
        {conversionPreview && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Conversion Preview</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Rate:</span>
                <span className="font-medium">
                  1 {conversionPreview.fromCurrency} = {conversionPreview.rate.toFixed(4)} {conversionPreview.toCurrency}
                  {conversionPreview.isCustomRate && <span className="text-blue-600 ml-1">(Custom)</span>}
                </span>
              </div>
              
              <hr className="my-2"/>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Purchase Price:</span>
                <span>
                  <span className="text-gray-500">{conversionPreview.fromSymbol}{conversionPreview.originalPurchasePrice.toFixed(2)}</span>
                  <span className="mx-2">→</span>
                  <span className="font-medium">{conversionPreview.toSymbol}{conversionPreview.convertedPurchasePrice.toFixed(2)}</span>
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Current Price:</span>
                <span>
                  <span className="text-gray-500">{conversionPreview.fromSymbol}{conversionPreview.originalCurrentPrice.toFixed(2)}</span>
                  <span className="mx-2">→</span>
                  <span className="font-medium">{conversionPreview.toSymbol}{conversionPreview.convertedCurrentPrice.toFixed(2)}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={() => {
            setShowConversion(false);
            setTargetCurrency('');
            setCustomRate('');
            setConversionPreview(null);
          }}
          className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        
        {conversionPreview && (
          <button
            type="button"
            onClick={executeConversion}
            className="px-4 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            Apply Conversion
          </button>
        )}
      </div>
    </div>
  );
};

export default CurrencyConversionPanel;