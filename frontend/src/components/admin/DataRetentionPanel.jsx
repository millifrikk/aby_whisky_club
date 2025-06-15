import React, { useState, useEffect } from 'react';
import { Database, Clock, Trash2, Shield, Calendar, Archive, AlertCircle, Settings } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DataRetentionPanel = () => {
  const { settings, refreshSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [retentionPolicies, setRetentionPolicies] = useState({});
  const [storageStats, setStorageStats] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize retention policies from settings
  useEffect(() => {
    if (settings) {
      setRetentionPolicies({
        user_data_retention_days: settings.user_data_retention_days || 2555, // ~7 years
        activity_logs_retention_days: settings.activity_logs_retention_days || 365,
        backup_retention_days: settings.backup_retention_days || 90,
        session_data_retention_days: settings.session_data_retention_days || 30,
        temp_files_retention_days: settings.temp_files_retention_days || 7,
        auto_cleanup_enabled: settings.auto_cleanup_enabled !== false
      });
      
      // Mock storage statistics
      setStorageStats({
        total_storage_mb: 2847,
        user_data_mb: 1234,
        activity_logs_mb: 567,
        backups_mb: 892,
        temp_files_mb: 154,
        last_cleanup: '2025-06-13T22:00:00Z',
        auto_cleanup_running: false
      });
      
      setLoading(false);
    }
  }, [settings]);

  const handleUpdateRetentionPolicy = async (key, value) => {
    try {
      setSaving(true);
      await adminAPI.updateSystemSetting(key, { value });
      
      setRetentionPolicies(prev => ({
        ...prev,
        [key]: value
      }));
      
      toast.success('Retention policy updated');
      await refreshSettings();
    } catch (error) {
      console.error('Error updating retention policy:', error);
      toast.error('Failed to update retention policy');
    } finally {
      setSaving(false);
    }
  };

  const handleRunCleanup = async (type) => {
    try {
      toast.success(`Starting ${type} cleanup...`);
      // Mock cleanup operation
      // await adminAPI.runDataCleanup(type);
      
      // Update storage stats (mock)
      setStorageStats(prev => ({
        ...prev,
        [`${type}_mb`]: Math.floor(prev[`${type}_mb`] * 0.7), // Simulate cleanup
        last_cleanup: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error running cleanup:', error);
      toast.error(`Failed to run ${type} cleanup`);
    }
  };

  const formatBytes = (mb) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const getRetentionColor = (days) => {
    if (days <= 30) return 'text-red-600 dark:text-red-400';
    if (days <= 90) return 'text-yellow-600 dark:text-yellow-400';
    if (days <= 365) return 'text-blue-600 dark:text-blue-400';
    return 'text-green-600 dark:text-green-400';
  };

  const isDataRetentionEnabled = settings?.enable_data_retention !== false;

  if (!isDataRetentionEnabled) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Data Retention Disabled</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Data retention management is currently disabled. Enable it in the general settings.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 theme-transition">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
            <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Retention Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Configure data lifecycle and cleanup policies</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {retentionPolicies.auto_cleanup_enabled && (
            <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
              <Settings className="h-4 w-4 mr-1" />
              Auto-Cleanup On
            </span>
          )}
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Storage</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatBytes(storageStats.total_storage_mb)}
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400">User Data</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatBytes(storageStats.user_data_mb)}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-400">Activity Logs</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatBytes(storageStats.activity_logs_mb)}
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="text-sm text-purple-600 dark:text-purple-400">Backups</div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {formatBytes(storageStats.backups_mb)}
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="text-sm text-yellow-600 dark:text-yellow-400">Temp Files</div>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {formatBytes(storageStats.temp_files_mb)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention Policies */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Retention Policies</h4>
          
          <div className="space-y-4">
            {[
              { key: 'user_data_retention_days', label: 'User Data', description: 'User profiles, ratings, reviews' },
              { key: 'activity_logs_retention_days', label: 'Activity Logs', description: 'User actions, system events' },
              { key: 'backup_retention_days', label: 'Backups', description: 'Database and file backups' },
              { key: 'session_data_retention_days', label: 'Session Data', description: 'User sessions, temporary data' },
              { key: 'temp_files_retention_days', label: 'Temporary Files', description: 'Uploads, cache, temp files' }
            ].map(policy => (
              <div key={policy.key} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{policy.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{policy.description}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={retentionPolicies[policy.key]}
                      onChange={(e) => handleUpdateRetentionPolicy(policy.key, parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded 
                               focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      disabled={saving}
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-medium ${getRetentionColor(retentionPolicies[policy.key])}`}>
                    {retentionPolicies[policy.key] <= 30 ? 'Short-term' :
                     retentionPolicies[policy.key] <= 90 ? 'Medium-term' :
                     retentionPolicies[policy.key] <= 365 ? 'Long-term' : 'Extended'}
                  </div>
                  <button
                    onClick={() => handleRunCleanup(policy.key.replace('_retention_days', ''))}
                    className="flex items-center px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Cleanup Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-Cleanup Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Auto-Cleanup Configuration</h4>
          
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Automatic Cleanup</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Run cleanup operations based on retention policies
                </div>
              </div>
              <button
                onClick={() => handleUpdateRetentionPolicy('auto_cleanup_enabled', !retentionPolicies.auto_cleanup_enabled)}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                  ${retentionPolicies.auto_cleanup_enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}
                `}
                disabled={saving}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out
                    ${retentionPolicies.auto_cleanup_enabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
            
            {storageStats.last_cleanup && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Last cleanup: {new Date(storageStats.last_cleanup).toLocaleString()}
              </div>
            )}
          </div>

          {/* Storage Analytics */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Storage Distribution</h5>
            <div className="space-y-2">
              {[
                { label: 'User Data', size: storageStats.user_data_mb, color: 'bg-blue-500' },
                { label: 'Activity Logs', size: storageStats.activity_logs_mb, color: 'bg-green-500' },
                { label: 'Backups', size: storageStats.backups_mb, color: 'bg-purple-500' },
                { label: 'Temp Files', size: storageStats.temp_files_mb, color: 'bg-yellow-500' }
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded ${item.color}`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatBytes(item.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Information */}
      <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
        <h5 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">Data Retention Compliance</h5>
        <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
          <li>• GDPR Article 5(1)(e): Data kept no longer than necessary</li>
          <li>• Configurable retention periods for different data types</li>
          <li>• Automated cleanup to ensure compliance</li>
          <li>• Storage monitoring and optimization</li>
          <li>• Audit trail for all data retention operations</li>
        </ul>
      </div>
    </div>
  );
};

export default DataRetentionPanel;