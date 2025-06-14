import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Tag, Filter } from 'lucide-react';

const SettingsSearch = ({ 
  settings = [], 
  onSearchResults, 
  placeholder = "Search settings...",
  className = "" 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique categories from settings
  const categories = useMemo(() => {
    try {
      if (!settings || !Array.isArray(settings)) {
        return ['all'];
      }
      const cats = [...new Set(settings.map(setting => setting?.category).filter(Boolean))].sort();
      return ['all', ...cats];
    } catch (error) {
      console.error('Error calculating categories:', error);
      return ['all'];
    }
  }, [settings]);

  // Basic search algorithm with multi-field matching
  const searchSettings = useMemo(() => {
    try {
      if (!searchTerm.trim() && selectedCategory === 'all') {
        return settings || [];
      }

      const query = searchTerm.toLowerCase().trim();
      
      const filtered = (settings || []).filter(setting => {
      // Category filter
      if (selectedCategory !== 'all' && setting.category !== selectedCategory) {
        return false;
      }

      // If no search term, return all settings in category
      if (!query) {
        return true;
      }

      const searchData = setting.search || {};
      
      // Search fields with weights
      const searchFields = [
        { field: searchData.title || setting.key, weight: 10 },
        { field: setting.description || '', weight: 8 },
        { field: setting.key, weight: 6 },
        { field: setting.category, weight: 4 },
        { field: (searchData.keywords || []).join(' '), weight: 5 },
        { field: (searchData.synonyms || []).join(' '), weight: 7 }
      ];

      // Check for matches
      let hasMatch = false;
      let score = 0;

      searchFields.forEach(({ field, weight }) => {
        const fieldText = field.toLowerCase();
        
        // Exact match
        if (fieldText.includes(query)) {
          hasMatch = true;
          score += weight * 2;
        }
        
        // Word-based matching
        const queryWords = query.split(' ').filter(word => word.length > 1);
        queryWords.forEach(word => {
          if (fieldText.includes(word)) {
            hasMatch = true;
            score += weight;
          }
        });
      });

      // Special keyword matching
      const keywordMatches = [
        { terms: ['2fa', 'two factor', 'mfa'], setting: 'enable_two_factor_auth' },
        { terms: ['email', 'mail', 'smtp'], settings: ['email_notifications_enabled', 'smtp_enabled', 'admin_email'] },
        { terms: ['password', 'pwd', 'auth'], settings: ['password_complexity_rules', 'login_attempt_limit'] },
        { terms: ['dark', 'theme', 'mode'], setting: 'enable_dark_mode' },
        { terms: ['social', 'share', 'follow'], settings: ['enable_social_sharing', 'enable_user_follows', 'enable_user_messaging'] },
        { terms: ['color', 'brand', 'logo'], settings: ['primary_color', 'secondary_color', 'site_logo_url'] }
      ];

      keywordMatches.forEach(({ terms, setting: targetSetting, settings }) => {
        const targetSettings = settings || [targetSetting];
        if (targetSettings.includes(setting.key)) {
          terms.forEach(term => {
            if (query.includes(term)) {
              hasMatch = true;
              score += 15; // High score for intelligent matches
            }
          });
        }
      });

      return hasMatch;
    });
    
    // Debug: log filtered count vs original
    if (query) {
      console.log(`SEARCH DEBUG: query="${query}", original=${(settings || []).length}, filtered=${filtered.length}`);
      if (filtered.length < 10) {
        console.log('Filtered setting keys:', filtered.map(s => s.key));
      }
    }
    
    return filtered.sort((a, b) => {
      // Sort by relevance (high-weight settings first, then alphabetically)
      const aWeight = a.search?.weight === 'high' ? 3 : a.search?.weight === 'medium' ? 2 : 1;
      const bWeight = b.search?.weight === 'high' ? 3 : b.search?.weight === 'medium' ? 2 : 1;
      
      if (aWeight !== bWeight) {
        return bWeight - aWeight;
      }
      
      return (a.search?.title || a.key).localeCompare(b.search?.title || b.key);
    });
    } catch (error) {
      console.error('Error in search algorithm:', error);
      return settings || [];
    }
  }, [searchTerm, selectedCategory, settings]);

  // Debounced search effect
  useEffect(() => {
    try {
      setIsSearching(true);
      const timer = setTimeout(() => {
        if (typeof onSearchResults === 'function') {
          // Search mode is active if there's a search term (not just category filter)
          const hasActiveSearch = searchTerm.trim() !== '';
          // Call search results callback
          onSearchResults(searchSettings || [], hasActiveSearch, searchTerm.trim());
        }
        setIsSearching(false);
      }, searchTerm.trim() ? 300 : 0);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Error in search effect:', error);
      setIsSearching(false);
    }
  }, [searchSettings, onSearchResults, searchTerm, selectedCategory]);

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setShowFilters(false);
  };

  const hasActiveFilters = searchTerm.trim() !== '';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            console.log('Search term changing to:', e.target.value);
            setSearchTerm(e.target.value);
          }}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   bg-white text-gray-900 placeholder-gray-500"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
          {isSearching && (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              selectedCategory !== 'all' ? 'text-blue-600' : 'text-gray-400'
            }`}
            title="Filter by category"
          >
            <Filter className="h-4 w-4" />
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearSearch}
              className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              title="Clear search and filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </h4>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white text-gray-900"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : 
                     category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      {searchTerm.trim() && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span>
              {searchSettings.length} setting{searchSettings.length !== 1 ? 's' : ''} found
              {searchTerm && ` for "${searchTerm}"`}
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            </span>
          </div>
          
          {searchSettings.length === 0 && (
            <span className="text-orange-600">
              No settings match your search
            </span>
          )}
        </div>
      )}

      {/* Quick Search Suggestions */}
      {!searchTerm.trim() && (
        <div className="text-sm text-gray-500">
          <span className="font-medium">Quick searches:</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              '2FA', 'email', 'password', 'dark mode', 'social', 'colors', 'logo'
            ].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setSearchTerm(suggestion)}
                className="px-2 py-1 bg-gray-100 rounded text-xs
                         hover:bg-gray-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsSearch;