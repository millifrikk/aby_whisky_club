import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Tag, Filter, Zap, Clock, TrendingUp } from 'lucide-react';
import Fuse from 'fuse.js';
import searchHistory from '../../utils/searchHistory';

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
  const [useFuzzySearch, setUseFuzzySearch] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

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

  // Enhanced keyword mapping with intelligent synonyms
  const enhancedKeywordMapping = useMemo(() => [
    { 
      terms: ['2fa', 'two factor', 'mfa', 'totp', 'authenticator', 'security code'], 
      setting: 'enable_two_factor_auth',
      synonyms: ['multi-factor authentication', 'time-based one-time password']
    },
    { 
      terms: ['email', 'mail', 'smtp', 'notification', 'notify'], 
      settings: ['email_notifications_enabled', 'smtp_enabled', 'admin_email'],
      synonyms: ['electronic mail', 'messages', 'alerts']
    },
    { 
      terms: ['password', 'pwd', 'auth', 'login', 'signin', 'authentication'], 
      settings: ['password_complexity_rules', 'login_attempt_limit', 'session_timeout'],
      synonyms: ['passphrase', 'credentials', 'access control']
    },
    { 
      terms: ['dark', 'theme', 'mode', 'appearance', 'ui', 'interface'], 
      settings: ['enable_dark_mode', 'primary_color', 'secondary_color'],
      synonyms: ['night mode', 'color scheme', 'visual style']
    },
    { 
      terms: ['social', 'share', 'follow', 'message', 'chat', 'community'], 
      settings: ['enable_social_sharing', 'enable_user_follows', 'enable_user_messaging'],
      synonyms: ['social media', 'networking', 'communication']
    },
    { 
      terms: ['color', 'brand', 'logo', 'design', 'style', 'visual'], 
      settings: ['primary_color', 'secondary_color', 'site_logo_url', 'site_name'],
      synonyms: ['branding', 'colors', 'styling', 'aesthetics']
    },
    { 
      terms: ['export', 'backup', 'data', 'download', 'gdpr', 'compliance'], 
      settings: ['export_user_data_enabled', 'backup_retention_days'],
      synonyms: ['data portability', 'user data', 'privacy rights']
    },
    { 
      terms: ['moderation', 'content', 'review', 'approval', 'filter'], 
      settings: ['enable_content_moderation', 'auto_moderation_threshold'],
      synonyms: ['content review', 'spam filtering', 'quality control']
    },
    { 
      terms: ['analytics', 'stats', 'metrics', 'tracking', 'insights'], 
      settings: ['enable_advanced_analytics', 'track_user_activity'],
      synonyms: ['statistics', 'data analysis', 'performance monitoring']
    },
    { 
      terms: ['maintenance', 'downtime', 'offline', 'service'], 
      settings: ['maintenance_mode_enabled', 'maintenance_message'],
      synonyms: ['system maintenance', 'scheduled downtime']
    }
  ], []);

  // Fuse.js configuration for fuzzy search
  const fuseOptions = useMemo(() => ({
    includeScore: true,
    includeMatches: true,
    threshold: 0.4, // Lower = more strict matching
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 2,
    keys: [
      { name: 'search.title', weight: 0.4 },
      { name: 'key', weight: 0.3 },
      { name: 'description', weight: 0.25 },
      { name: 'category', weight: 0.15 },
      { name: 'search.keywords', weight: 0.2 },
      { name: 'search.synonyms', weight: 0.25 }
    ]
  }), []);

  // Create Fuse instance
  const fuse = useMemo(() => {
    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      return null;
    }
    
    // Enhance settings with expanded keywords and synonyms
    const enhancedSettings = settings.map(setting => {
      const matchingMappings = enhancedKeywordMapping.filter(mapping => {
        const targetSettings = mapping.settings || [mapping.setting];
        return targetSettings.includes(setting.key);
      });

      const additionalKeywords = matchingMappings.flatMap(m => m.terms || []);
      const additionalSynonyms = matchingMappings.flatMap(m => m.synonyms || []);

      return {
        ...setting,
        search: {
          ...setting.search,
          keywords: [...(setting.search?.keywords || []), ...additionalKeywords],
          synonyms: [...(setting.search?.synonyms || []), ...additionalSynonyms]
        }
      };
    });

    return new Fuse(enhancedSettings, fuseOptions);
  }, [settings, enhancedKeywordMapping, fuseOptions]);

  // Enhanced search algorithm with fuzzy search
  const searchSettings = useMemo(() => {
    try {
      if (!searchTerm.trim() && selectedCategory === 'all') {
        return settings || [];
      }

      const query = searchTerm.trim();
      let filtered = settings || [];

      // Apply fuzzy search if enabled and query exists
      if (useFuzzySearch && query && fuse) {
        const fuseResults = fuse.search(query);
        
        // Extract items with scores and matches
        filtered = fuseResults.map(result => ({
          ...result.item,
          _searchScore: result.score,
          _searchMatches: result.matches || []
        }));

        console.log(`FUZZY SEARCH: query="${query}", results=${filtered.length}/${settings.length}`);
      } else if (query) {
        // Fallback to basic search
        filtered = (settings || []).filter(setting => {
          const searchData = setting.search || {};
          const searchText = [
            searchData.title || setting.key,
            setting.description || '',
            setting.key,
            setting.category,
            (searchData.keywords || []).join(' '),
            (searchData.synonyms || []).join(' ')
          ].join(' ').toLowerCase();

          return searchText.includes(query.toLowerCase());
        });

        console.log(`BASIC SEARCH: query="${query}", results=${filtered.length}/${settings.length}`);
      }

      // Apply category filter
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(setting => setting.category === selectedCategory);
      }

      // Sort by relevance (fuzzy score if available, then by weight)
      return filtered.sort((a, b) => {
        // If we have fuzzy search scores, use them
        if (a._searchScore !== undefined && b._searchScore !== undefined) {
          return a._searchScore - b._searchScore; // Lower score = better match in Fuse.js
        }

        // Fallback to weight-based sorting
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
  }, [searchTerm, selectedCategory, settings, useFuzzySearch, fuse]);

  // Load suggestions when search term changes
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const newSuggestions = searchHistory.getSuggestions(searchTerm, 6);
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Error loading suggestions:', error);
        setSuggestions([]);
      }
    };

    loadSuggestions();
  }, [searchTerm]);

  // Debounced search effect with history tracking
  useEffect(() => {
    try {
      setIsSearching(true);
      const timer = setTimeout(() => {
        if (typeof onSearchResults === 'function') {
          // Search mode is active if there's a search term (not just category filter)
          const hasActiveSearch = searchTerm.trim() !== '';
          
          // Add to search history if we have a search term and results
          if (hasActiveSearch && searchSettings.length > 0) {
            const searchMode = useFuzzySearch ? 'fuzzy' : 'exact';
            searchHistory.addSearch(searchTerm.trim(), searchSettings, searchMode);
          }
          
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
  }, [searchSettings, onSearchResults, searchTerm, selectedCategory, useFuzzySearch]);

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setShowFilters(false);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.term);
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => setShowSuggestions(false), 150);
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
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
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

        {/* Search Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Search Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.term}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2">
                    {suggestion.type === 'recent' ? (
                      <Clock className="h-4 w-4 text-blue-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-sm text-gray-900">{suggestion.displayText}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{suggestion.reason}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      suggestion.type === 'recent' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {suggestion.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
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

            {/* Fuzzy Search Toggle */}
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                    Fuzzy Search
                  </span>
                  <span className="text-xs text-gray-500">
                    Tolerates typos and similar words
                  </span>
                </div>
                <button
                  onClick={() => setUseFuzzySearch(!useFuzzySearch)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${useFuzzySearch ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${useFuzzySearch ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </label>
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
            {useFuzzySearch && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                <Zap className="h-3 w-3 mr-1" />
                Fuzzy
              </span>
            )}
          </div>
          
          {searchSettings.length === 0 && (
            <span className="text-orange-600">
              {useFuzzySearch ? 'Try different terms or disable fuzzy search' : 'No settings match your search'}
            </span>
          )}
        </div>
      )}

      {/* Quick Search Suggestions */}
      {!searchTerm.trim() && (
        <div className="text-sm text-gray-500 space-y-3">
          {/* Recent Searches */}
          {(() => {
            const recentSearches = searchHistory.getRecentSearches(5);
            return recentSearches.length > 0 && (
              <div>
                <span className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Recent searches:
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {recentSearches.map(search => (
                    <button
                      key={search.id}
                      onClick={() => setSearchTerm(search.originalTerm)}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs
                               hover:bg-blue-100 transition-colors flex items-center"
                      title={`${search.resultCount} results - ${new Date(search.timestamp).toLocaleDateString()}`}
                    >
                      {search.originalTerm}
                      <span className="ml-1 text-blue-500">({search.resultCount})</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Popular Terms */}
          {(() => {
            const popularTerms = searchHistory.getPopularTerms(6);
            return popularTerms.length > 0 && (
              <div>
                <span className="font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Popular searches:
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {popularTerms.map(term => (
                    <button
                      key={term.term}
                      onClick={() => setSearchTerm(term.term)}
                      className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs
                               hover:bg-green-100 transition-colors flex items-center"
                      title={`${term.count} searches - ${Math.round(term.successRate * 100)}% success rate`}
                    >
                      {term.term}
                      <span className="ml-1 text-green-500">({term.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Default Quick Searches */}
          <div>
            <span className="font-medium">Quick searches:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                '2FA', 'email', 'password', 'dark mode', 'social', 'colors', 'logo',
                'analytics', 'export', 'moderation', 'maintenance', 'backup'
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

          <div className="text-xs text-gray-400">
            💡 Try typing with typos like "emial" or "pasword" to test fuzzy search
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsSearch;