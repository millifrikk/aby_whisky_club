import React, { useState, useEffect } from 'react';
import { Settings, AlertTriangle, Clock, Eye, Save, RotateCcw } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MaintenanceModePanel = () => {
  const { settings, refreshSettings } = useSettings();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [originalMessage, setOriginalMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize state from settings
  useEffect(() => {
    if (settings) {
      const maintenance = settings.maintenance_mode || false;
      const message = settings.maintenance_message || 'We are currently performing scheduled maintenance. Please check back soon.';
      
      setIsMaintenanceMode(maintenance);
      setMaintenanceMessage(message);
      setOriginalMessage(message);
      setLoading(false);
    }
  }, [settings]);

  const handleToggleMaintenanceMode = async () => {
    try {
      setSaving(true);
      const newMode = !isMaintenanceMode;
      
      await adminAPI.updateSystemSetting('maintenance_mode', { value: newMode });
      
      setIsMaintenanceMode(newMode);
      toast.success(newMode ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
      
      // Refresh settings to update throughout the app
      await refreshSettings();
      
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      toast.error('Failed to update maintenance mode');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMessage = async () => {
    try {
      setSaving(true);
      
      await adminAPI.updateSystemSetting('maintenance_message', { value: maintenanceMessage });
      
      setOriginalMessage(maintenanceMessage);
      toast.success('Maintenance message updated');
      
      // Refresh settings
      await refreshSettings();
      
    } catch (error) {
      console.error('Error updating maintenance message:', error);
      toast.error('Failed to update maintenance message');
    } finally {
      setSaving(false);
    }
  };

  const handleResetMessage = () => {
    setMaintenanceMessage(originalMessage);
  };

  const hasChanges = maintenanceMessage !== originalMessage;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 theme-transition">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            isMaintenanceMode ? 'bg-red-100 dark:bg-red-900' : 'bg-blue-100 dark:bg-blue-900'
          }`}>
            <Settings className={`h-5 w-5 ${
              isMaintenanceMode ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Maintenance Mode</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Control site accessibility and user messaging</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isMaintenanceMode && (
            <span className="flex items-center px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-sm font-medium">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Active
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Mode Toggle */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Maintenance Status</h4>
          
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {isMaintenanceMode ? 'Maintenance Active' : 'Site Online'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isMaintenanceMode 
                    ? 'Only administrators can access the site' 
                    : 'Site is accessible to all users'
                  }
                </p>
              </div>
              <button
                onClick={handleToggleMaintenanceMode}
                disabled={saving}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${isMaintenanceMode ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-600'}
                  ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out
                    ${isMaintenanceMode ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <button
              onClick={handleToggleMaintenanceMode}
              disabled={saving}
              className={`
                w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors
                ${isMaintenanceMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }
                ${saving ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              {isMaintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
            </button>
          </div>
        </div>

        {/* Maintenance Message */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Maintenance Message</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message displayed to users during maintenance
              </label>
              <textarea
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter maintenance message..."
                maxLength={500}
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {maintenanceMessage.length}/500 characters
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveMessage}
                disabled={!hasChanges || saving}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${hasChanges && !saving
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Message
              </button>

              {hasChanges && (
                <button
                  onClick={handleResetMessage}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 
                           hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-3">
          <Eye className="h-4 w-4 text-gray-400" />
          <h5 className="font-medium text-gray-900 dark:text-white">Message Preview</h5>
        </div>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2" />
            <span className="font-medium text-yellow-800 dark:text-yellow-200">Site Maintenance</span>
          </div>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            {maintenanceMessage}
          </p>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Usage Instructions</h5>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Enable maintenance mode to restrict site access to administrators only</li>
          <li>• Customize the message that users will see during maintenance</li>
          <li>• Regular users will be redirected to a maintenance page</li>
          <li>• Administrators can still access all admin functions normally</li>
          <li>• Remember to disable maintenance mode when work is complete</li>
        </ul>
      </div>
    </div>
  );
};

export default MaintenanceModePanel;