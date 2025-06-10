import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SystemSettingsPage = () => {
  const { isAdmin } = useAuth();
  const [settingsByCategory, setSettingsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editedValues, setEditedValues] = useState({});

  useEffect(() => {
    if (!isAdmin()) return;
    loadSettings();
  }, [isAdmin, selectedCategory]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const response = await adminAPI.getSystemSettings(params);
      setSettingsByCategory(response.data.settings_by_category);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
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

  const renderSettingInput = (setting) => {
    const { key, value, data_type, is_readonly } = setting;
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
          />
        );

      case 'string':
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleValueChange(key, e.target.value, data_type)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
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
      default: return '📋';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'general': return 'border-blue-200 bg-blue-50';
      case 'email': return 'border-green-200 bg-green-50';
      case 'security': return 'border-red-200 bg-red-50';
      case 'content': return 'border-purple-200 bg-purple-50';
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

      {/* Category Filter */}
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

      {/* Settings by Category */}
      {categories.map(category => (
        <div key={category} className={`border-l-4 rounded-lg shadow-sm ${getCategoryColor(category)}`}>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-3">{getCategoryIcon(category)}</span>
              {category.charAt(0).toUpperCase() + category.slice(1)} Settings
            </h2>

            <div className="space-y-6">
              {settingsByCategory[category].map(setting => {
                const hasChanges = editedValues[setting.key] !== undefined;
                const isSaving = saving[setting.key];

                return (
                  <div key={setting.key} className="bg-white p-4 rounded-md border border-gray-200">
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
      ))}

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