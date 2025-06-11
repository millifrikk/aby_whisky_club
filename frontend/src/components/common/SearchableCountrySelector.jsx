import React, { useState, useEffect, useRef } from 'react';
import countriesData from '../../data/countries.json';

const SearchableCountrySelector = ({ 
  value, 
  onChange, 
  error, 
  required = false,
  placeholder = "Select distillery first, or search country..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Set initial value if provided
    if (value && typeof value === 'string') {
      const country = countriesData.find(c => c.name === value || c.code === value);
      if (country) {
        setSelectedCountry(country);
        setSearchTerm(country.name);
      } else {
        // Handle custom country names not in our dataset
        setSearchTerm(value);
        setSelectedCountry({ name: value, code: 'CUSTOM', flag: '🌍' });
      }
    } else if (value && typeof value === 'object' && value.name) {
      // Handle when value is a country object
      setSelectedCountry(value);
      setSearchTerm(value.name);
    } else if (!value || value === '') {
      // Clear when value is empty
      setSelectedCountry(null);
      setSearchTerm('');
    }
  }, [value]);

  useEffect(() => {
    // Filter countries based on search term
    if (searchTerm.length >= 2) {
      const filtered = countriesData.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10); // Limit to 10 results for performance
      
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries([]);
    }
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    
    if (newSearchTerm.length >= 2) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      // Clear selection if search is too short
      if (selectedCountry) {
        setSelectedCountry(null);
        onChange('', null, null);
      }
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setSearchTerm(country.name);
    setShowDropdown(false);
    
    // Call onChange with country name, code, and full country object
    onChange(country.name, country.code, country);
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setShowDropdown(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const clearSelection = () => {
    setSelectedCountry(null);
    setSearchTerm('');
    setShowDropdown(false);
    onChange('', null, null);
    searchInputRef.current?.focus();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Country {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        
        {/* Clear button */}
        {selectedCountry && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && filteredCountries.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredCountries.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleCountrySelect(country)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center space-x-3"
            >
              <span className="text-xl">{country.flag}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{country.name}</div>
                <div className="text-sm text-gray-500">{country.code}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showDropdown && searchTerm.length >= 2 && filteredCountries.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
          <div className="text-gray-500 text-center">
            No countries found for "{searchTerm}"
          </div>
        </div>
      )}

      {/* Selected country confirmation */}
      {selectedCountry && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-3">
            <span className="text-xl">{selectedCountry.flag}</span>
            <div className="flex-1">
              <div className="font-medium text-green-800">{selectedCountry.name}</div>
              <div className="text-sm text-green-600">Selected country</div>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Help text */}
      <p className="mt-1 text-sm text-gray-500">
        Type at least 2 characters to search countries
      </p>
    </div>
  );
};

export default SearchableCountrySelector;