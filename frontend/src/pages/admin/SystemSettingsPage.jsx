import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import CurrencyManagementPanel from '../../components/admin/CurrencyManagementPanel';
import LocalizationTestPanel from '../../components/admin/LocalizationTestPanel';
import AppearanceTestPanel from '../../components/admin/AppearanceTestPanel';
import MaintenanceModePanel from '../../components/admin/MaintenanceModePanel';
import DataExportPanel from '../../components/admin/DataExportPanel';
import ContentModerationPanel from '../../components/admin/ContentModerationPanel';
import AdvancedAnalyticsPanel from '../../components/admin/AdvancedAnalyticsPanel';
import DataRetentionPanel from '../../components/admin/DataRetentionPanel';
import SearchHistoryPanel from '../../components/admin/SearchHistoryPanel';
import SocialFeaturesTestPanel from '../../components/admin/SocialFeaturesTestPanel';
import ThirdPartyIntegrationsPanel from '../../components/admin/ThirdPartyIntegrationsPanel';
import WebhookNotificationsPanel from '../../components/admin/WebhookNotificationsPanel';
import RateLimitingPanel from '../../components/admin/RateLimitingPanel';
import SettingsSearch from '../../components/admin/SettingsSearch';
import SettingsSearchResults from '../../components/admin/SettingsSearchResults';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const SystemSettingsPage = () => {
  const { isAdmin } = useAuth();
  const { refreshSettings } = useSettings();
  const [settingsByCategory, setSettingsByCategory] = useState({});
  const [allSettings, setAllSettings] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editedValues, setEditedValues] = useState({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  useEffect(() => {
    if (!isAdmin()) return;
    // Debounce the loadSettings call to prevent multiple rapid calls
    const timer = setTimeout(() => {
      loadSettings();
    }, 100);

    return () => clearTimeout(timer);
  }, [isAdmin, selectedCategory]);

  // Initialize search results when allSettings is loaded (only if no active search)
  useEffect(() => {
    if (allSettings.length > 0 && !isSearchMode && !currentSearchTerm.trim()) {
      setSearchResults(allSettings);
    }
  }, [allSettings, isSearchMode, currentSearchTerm]);

  const loadSettings = async () => {
    if (isLoadingSettings) return; // Prevent multiple simultaneous requests
    
    try {
      setIsLoadingSettings(true);
      setLoading(true);
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      
      // Try to load enhanced settings with search metadata
      try {
        const enhancedResponse = await adminAPI.getEnhancedSystemSettings(params);
        const responseData = enhancedResponse.data || enhancedResponse;
        setAllSettings(responseData.settings || []);
        setSettingsByCategory(responseData.settings_by_category || {});
      } catch (enhancedError) {
        console.warn('Enhanced settings not available, falling back to regular settings:', enhancedError);
        
        // Fallback to regular settings endpoint
        const response = await adminAPI.getSystemSettings(params);
        setSettingsByCategory(response.data.settings_by_category || {});
        
        // Convert to flat array for search and add basic search metadata
        const flatSettings = Object.values(response.data.settings_by_category || {}).flat().map(setting => ({
          ...setting,
          search: {
            title: setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            keywords: setting.key.split('_'),
            synonyms: [],
            weight: 'medium',
            related: []
          }
        }));
        setAllSettings(flatSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Only show toast error if we haven't shown one recently
      if (!localStorage.getItem('last_settings_error') || 
          Date.now() - parseInt(localStorage.getItem('last_settings_error')) > 5000) {
        toast.error('Failed to load system settings');
        localStorage.setItem('last_settings_error', Date.now().toString());
      }
    } finally {
      setLoading(false);
      setIsLoadingSettings(false);
    }
  };

  const handleValueChange = (key, value, dataType) => {
    let parsedValue = value;
    
    // Parse value based on data type
    if (dataType === 'boolean') {
      parsedValue = value === 'true' || value === true;
    } else if (dataType === 'number') {
      parsedValue = parseFloat(value) || 0;
    }

    setEditedValues(prev => ({
      ...prev,
      [key]: parsedValue
    }));
  };

  const saveSetting = async (key, value) => {
    try {
      setSaving(prev => ({ ...prev, [key]: true }));
      await adminAPI.updateSystemSetting(key, { value });
      toast.success('Setting updated successfully');
      
      // Refresh global settings context for immediate UI updates
      refreshSettings();
      
      // Remove from edited values
      setEditedValues(prev => {
        const newValues = { ...prev };
        delete newValues[key];
        return newValues;
      });
      
      // Reload settings to get fresh data
      loadSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const resetSetting = (key, originalValue) => {
    setEditedValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
  };

  // Search handlers
  const handleSearchResults = (results, hasActiveSearch = false, searchTerm = '') => {
    setSearchResults(results);
    setIsSearchMode(hasActiveSearch);
    setCurrentSearchTerm(searchTerm);
  };

  const handleSettingClick = (setting) => {
    // Jump to setting in regular view
    setIsSearchMode(false);
    setSelectedCategory(setting.category);
    // Scroll to setting element after a brief delay for category change
    setTimeout(() => {
      const element = document.getElementById(`setting-${setting.key}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
        }, 2000);
      }
    }, 100);
  };

  const renderSettingInput = (setting) => {
    const { key, value, data_type, is_readonly, validation_rules } = setting;
    const currentValue = editedValues[key] !== undefined ? editedValues[key] : value;
    const hasChanges = editedValues[key] !== undefined;

    if (is_readonly) {
      return (
        <div className="flex items-center">
          <span className="text-gray-700 bg-gray-100 px-3 py-2 rounded border w-full">
            {String(currentValue)}
          </span>
          <span className="ml-2 text-xs text-gray-500">Read-only</span>
        </div>
      );
    }

    // Check if this setting has enum options (dropdown)
    if (validation_rules?.enum) {
      return (
        <select
          value={currentValue}
          onChange={(e) => {
            const value = data_type === 'number' ? parseFloat(e.target.value) : e.target.value;
            handleValueChange(key, value, data_type);
          }}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
        >
          {validation_rules.enum.map(option => (
            <option key={option} value={option}>
              {String(option)}
            </option>
          ))}
        </select>
      );
    }

    switch (data_type) {
      case 'boolean':
        return (
          <select
            value={currentValue.toString()}
            onChange={(e) => handleValueChange(key, e.target.value, data_type)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleValueChange(key, e.target.value, data_type)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            min={validation_rules?.min}
            max={validation_rules?.max}
          />
        );

      case 'string':
      default:
        // Special handling for different string types
        let inputType = 'text';
        let inputComponent = 'input';
        let placeholder = '';

        if (key.includes('url') || key.includes('image')) {
          inputType = 'url';
          placeholder = 'https://example.com/image.jpg or /images/local-image.jpg';
        } else if (key.includes('email')) {
          inputType = 'email';
          placeholder = 'example@domain.com';
        } else if (key.includes('password')) {
          inputType = 'password';
        } else if (key.includes('color')) {
          inputType = 'color';
        } else if (key.includes('template') || key.includes('message') || key.includes('signature')) {
          inputComponent = 'textarea';
        }

        const commonProps = {
          value: currentValue,
          onChange: (e) => handleValueChange(key, e.target.value, data_type),
          className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500",
          placeholder,
          maxLength: validation_rules?.maxLength,
          minLength: validation_rules?.minLength
        };

        if (inputComponent === 'textarea') {
          return (
            <textarea
              {...commonProps}
              rows={3}
              className={`${commonProps.className} resize-vertical`}
            />
          );
        }

        return (
          <input
            {...commonProps}
            type={inputType}
          />
        );
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'general': return '⚙️';
      case 'email': return '📧';
      case 'security': return '🔒';
      case 'content': return '📄';
      case 'appearance': return '🎨';
      case 'privacy': return '👤';
      case 'events': return '🎉';
      case 'analytics': return '📊';
      case 'features': return '🚀';
      case 'localization': return '🌍';
      default: return '📋';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'general': return 'border-blue-200 bg-blue-50';
      case 'email': return 'border-green-200 bg-green-50';
      case 'security': return 'border-red-200 bg-red-50';
      case 'content': return 'border-purple-200 bg-purple-50';
      case 'appearance': return 'border-pink-200 bg-pink-50';
      case 'privacy': return 'border-yellow-200 bg-yellow-50';
      case 'events': return 'border-indigo-200 bg-indigo-50';
      case 'analytics': return 'border-teal-200 bg-teal-50';
      case 'features': return 'border-orange-200 bg-orange-50';
      case 'localization': return 'border-cyan-200 bg-cyan-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const categories = Object.keys(settingsByCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">Configure system-wide application settings</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">🔍 Search Settings</h2>
        {/* Debug info */}
        <div className="mb-2 text-xs text-gray-500">
          Debug: Search Mode: {isSearchMode ? 'ON' : 'OFF'} | 
          Results: {searchResults.length} | 
          All Settings: {allSettings.length} | 
          Search Term: "{currentSearchTerm}" |
          Results Keys: {searchResults.slice(0,3).map(s => s.key).join(', ')}
        </div>
        <ErrorBoundary fallbackMessage="Search functionality temporarily unavailable">
          <SettingsSearch
            settings={allSettings}
            onSearchResults={(results, hasActiveSearch, searchTerm) => handleSearchResults(results, hasActiveSearch, searchTerm)}
            placeholder="Search by name, description, keywords, or category..."
          />
        </ErrorBoundary>
      </div>

      {/* Category Filter - Hidden in search mode */}
      {!isSearchMode && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Conditional Content: Search Results or Category View */}
      {isSearchMode ? (
        /* Search Results */
        <ErrorBoundary fallbackMessage="Search results temporarily unavailable">
          <SettingsSearchResults
            searchResults={searchResults}
            searchTerm={currentSearchTerm}
            onSettingClick={handleSettingClick}
            renderSettingControl={(setting) => {
            const hasChanges = editedValues[setting.key] !== undefined;
            const isSaving = saving[setting.key];
            
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
                {/* Setting Input */}
                <div>
                  {renderSettingInput(setting)}
                  
                  {/* Validation info */}
                  {setting.validation_rules && (
                    <div className="mt-1 text-xs text-gray-500">
                      {setting.validation_rules.minLength && `Min: ${setting.validation_rules.minLength} chars`}
                      {setting.validation_rules.maxLength && `Max: ${setting.validation_rules.maxLength} chars`}
                      {setting.validation_rules.min !== undefined && `Min: ${setting.validation_rules.min}`}
                      {setting.validation_rules.max !== undefined && `Max: ${setting.validation_rules.max}`}
                      {setting.validation_rules.pattern && 'Format validation applied'}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2">
                  {hasChanges && !setting.is_readonly && (
                    <>
                      <button
                        onClick={() => resetSetting(setting.key, setting.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        disabled={isSaving}
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => saveSetting(setting.key, editedValues[setting.key])}
                        disabled={isSaving}
                        className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  )}
                  {!hasChanges && (
                    <span className="text-sm text-green-600">Saved</span>
                  )}
                </div>
              </div>
            );
          }}
        />
        </ErrorBoundary>
      ) : (
        /* Regular Category View */
        categories.map(category => (
          <div key={category} className={`border-l-4 rounded-lg shadow-sm ${getCategoryColor(category)}`}>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">{getCategoryIcon(category)}</span>
                {category.charAt(0).toUpperCase() + category.slice(1)} Settings
              </h2>

              {/* Enhanced Management Panels for Specific Categories */}
              {category === 'localization' && (
                <div className="space-y-6 mb-6">
                  <CurrencyManagementPanel />
                  <LocalizationTestPanel />
                </div>
              )}
              
              {category === 'appearance' && (
                <div className="space-y-6 mb-6">
                  <AppearanceTestPanel />
                </div>
              )}
              
              {category === 'general' && (
                <div className="space-y-6 mb-6">
                  <MaintenanceModePanel />
                  <DataExportPanel />
                  <DataRetentionPanel />
                  <SearchHistoryPanel />
                </div>
              )}
              
              {category === 'analytics' && (
                <div className="space-y-6 mb-6">
                  <AdvancedAnalyticsPanel />
                </div>
              )}
              
              {category === 'content' && (
                <div className="space-y-6 mb-6">
                  <ContentModerationPanel />
                </div>
              )}
              
              {category === 'social_features' && (
                <div className="space-y-6 mb-6">
                  <SocialFeaturesTestPanel />
                </div>
              )}
              
              {category === 'api_integration' && (
                <div className="space-y-6 mb-6">
                  <ThirdPartyIntegrationsPanel />
                  <WebhookNotificationsPanel />
                  <RateLimitingPanel />
                </div>
              )}

              <div className="space-y-6">
                {settingsByCategory[category].map(setting => {
                  const hasChanges = editedValues[setting.key] !== undefined;
                  const isSaving = saving[setting.key];

                  return (
                    <div 
                      key={setting.key} 
                      id={`setting-${setting.key}`}
                      className="bg-white p-4 rounded-md border border-gray-200 transition-all duration-300"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                        {/* Setting Info */}
                        <div>
                          <h3 className="font-medium text-gray-900">{setting.key}</h3>
                          {setting.description && (
                            <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                          )}
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                              {setting.data_type}
                            </span>
                            {setting.is_readonly && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                Read-only
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Setting Input */}
                        <div>
                          {renderSettingInput(setting)}
                          
                          {/* Image preview for image URL settings */}
                          {(setting.key.includes('image') || setting.key.includes('url')) && 
                           setting.data_type === 'string' && 
                           (editedValues[setting.key] || setting.value) && (
                            <div className="mt-2">
                              <img 
                                src={editedValues[setting.key] || setting.value} 
                                alt="Preview" 
                                className="h-16 w-16 object-contain border border-gray-200 rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                                onLoad={(e) => {
                                  e.target.style.display = 'block';
                                }}
                              />
                            </div>
                          )}

                          {/* Color preview for color settings */}
                          {setting.key.includes('color') && 
                           setting.data_type === 'string' && 
                           (editedValues[setting.key] || setting.value) && (
                            <div className="mt-2 flex items-center space-x-2">
                              <div 
                                className="w-8 h-8 border border-gray-200 rounded"
                                style={{ backgroundColor: editedValues[setting.key] || setting.value }}
                              ></div>
                              <span className="text-sm text-gray-600">
                                {editedValues[setting.key] || setting.value}
                              </span>
                            </div>
                          )}

                          {/* Validation info */}
                          {setting.validation_rules && (
                            <div className="mt-1 text-xs text-gray-500">
                              {setting.validation_rules.minLength && `Min: ${setting.validation_rules.minLength} chars`}
                              {setting.validation_rules.maxLength && `Max: ${setting.validation_rules.maxLength} chars`}
                              {setting.validation_rules.min !== undefined && `Min: ${setting.validation_rules.min}`}
                              {setting.validation_rules.max !== undefined && `Max: ${setting.validation_rules.max}`}
                              {setting.validation_rules.pattern && 'Format validation applied'}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-2">
                          {hasChanges && !setting.is_readonly && (
                            <>
                              <button
                                onClick={() => resetSetting(setting.key, setting.value)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                                disabled={isSaving}
                              >
                                Reset
                              </button>
                              <button
                                onClick={() => saveSetting(setting.key, editedValues[setting.key])}
                                disabled={isSaving}
                                className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                              >
                                {isSaving ? 'Saving...' : 'Save'}
                              </button>
                            </>
                          )}
                          {!hasChanges && (
                            <span className="text-sm text-green-600">Saved</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))
      )}

      {categories.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚙️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No settings found</h3>
          <p className="text-gray-600">
            No system settings are available at the moment.
          </p>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsPage;