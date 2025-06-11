import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../services/adminAPI';

const DistillerySelector = ({ 
  value, 
  onChange, 
  error, 
  required = false,
  onNewDistilleryRequest 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [distilleries, setDistilleries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDistillery, setSelectedDistillery] = useState(null);
  const [showNewDistilleryForm, setShowNewDistilleryForm] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Initialize with existing value
  useEffect(() => {
    if (value) {
      // If value is an object (distillery), use it directly
      if (typeof value === 'object' && value.id) {
        setSelectedDistillery(value);
        setSearchTerm(value.name);
      } 
      // If value is a string (existing distillery name), search for it
      else if (typeof value === 'string') {
        setSearchTerm(value);
        searchDistilleries(value);
      }
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchDistilleries = async (search) => {
    if (!search || search.length < 2) {
      setDistilleries([]);
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.searchDistilleries({ search, limit: 10 });
      setDistilleries(response.data.distilleries || []);
    } catch (error) {
      console.error('Error searching distilleries:', error);
      setDistilleries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setSelectedDistillery(null);
    setShowDropdown(true);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchDistilleries(newSearchTerm);
    }, 300);

    // Update parent with text value for backward compatibility
    onChange(newSearchTerm);
  };

  const handleDistillerySelect = (distillery) => {
    setSelectedDistillery(distillery);
    setSearchTerm(distillery.name);
    setShowDropdown(false);
    
    // Update parent with both the distillery object and the ID
    onChange(distillery.name, distillery.id, distillery);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
    if (searchTerm.length >= 2) {
      searchDistilleries(searchTerm);
    }
  };

  const handleNewDistilleryClick = () => {
    setShowDropdown(false);
    setShowNewDistilleryForm(true);
    if (onNewDistilleryRequest) {
      onNewDistilleryRequest(searchTerm);
    }
  };

  const clearSelection = () => {
    setSelectedDistillery(null);
    setSearchTerm('');
    setDistilleries([]);
    setShowDropdown(false);
    onChange('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Distillery {required && '*'}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${selectedDistillery ? 'pr-10' : ''}`}
          placeholder="Search for a distillery..."
        />
        
        {selectedDistillery && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {selectedDistillery && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">{selectedDistillery.name}</p>
              <p className="text-xs text-green-600">
                {selectedDistillery.region}, {selectedDistillery.country}
              </p>
            </div>
            <div className="text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && (
            <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </div>
          )}

          {!loading && distilleries.length === 0 && searchTerm.length >= 2 && (
            <div className="px-4 py-2">
              <p className="text-sm text-gray-500 mb-2">No distilleries found for "{searchTerm}"</p>
              <button
                type="button"
                onClick={handleNewDistilleryClick}
                className="w-full text-left px-2 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add "{searchTerm}" as new distillery
              </button>
            </div>
          )}

          {!loading && distilleries.length > 0 && (
            <>
              {distilleries.map((distillery) => (
                <button
                  key={distillery.id}
                  type="button"
                  onClick={() => handleDistillerySelect(distillery)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="font-medium text-gray-900">{distillery.name}</div>
                  <div className="text-sm text-gray-500">{distillery.region}, {distillery.country}</div>
                </button>
              ))}
              
              {searchTerm && searchTerm.length >= 2 && (
                <div className="border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleNewDistilleryClick}
                    className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add "{searchTerm}" as new distillery
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DistillerySelector;