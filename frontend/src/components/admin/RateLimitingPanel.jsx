import React, { useState, useEffect } from 'react';
import { 
  Shield, Clock, AlertTriangle, BarChart3, Settings, 
  RefreshCw, Save, Eye, TrendingUp, Users, Activity,
  CheckCircle, XCircle, Zap, Timer
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import toast from 'react-hot-toast';

const RateLimitingPanel = ({ className = "" }) => {
  const { settings, refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(false);
  const [rateLimitSettings, setRateLimitSettings] = useState({
    enabled: true,
    globalLimit: 100,
    windowMs: 60000,
    userLimit: 50,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    endpoints: {
      '/api/auth/login': { limit: 5, windowMs: 300000 }, // 5 attempts per 5 minutes
      '/api/auth/register': { limit: 3, windowMs: 300000 }, // 3 attempts per 5 minutes
      '/api/auth/forgot-password': { limit: 2, windowMs: 3600000 }, // 2 attempts per hour
      '/api/whiskies': { limit: 200, windowMs: 60000 }, // 200 requests per minute
      '/api/ratings': { limit: 50, windowMs: 60000 }, // 50 ratings per minute
      '/api/admin': { limit: 20, windowMs: 60000 } // 20 admin requests per minute
    },
    whitelist: [],
    blacklist: []
  });
  const [stats, setStats] = useState({
    totalRequests: 0,
    blockedRequests: 0,
    uniqueIPs: 0,
    topEndpoints: [],
    recentBlocked: []
  });

  // Load rate limiting settings
  useEffect(() => {
    loadRateLimitSettings();
    loadRateLimitStats();
  }, []);

  const loadRateLimitSettings = async () => {
    try {
      const response = await fetch('/api/admin/rate-limiting/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRateLimitSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error loading rate limiting settings:', error);
    }
  };

  const loadRateLimitStats = async () => {
    try {
      const response = await fetch('/api/admin/rate-limiting/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading rate limiting stats:', error);
    }
  };

  // Save rate limiting settings
  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/rate-limiting/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(rateLimitSettings)
      });

      if (response.ok) {
        toast.success('Rate limiting settings saved successfully');
        await refreshSettings();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving rate limiting settings:', error);
      toast.error('Failed to save rate limiting settings');
    } finally {
      setLoading(false);
    }
  };

  // Update setting
  const updateSetting = (key, value) => {
    setRateLimitSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Update endpoint setting
  const updateEndpointSetting = (endpoint, key, value) => {
    setRateLimitSettings(prev => ({
      ...prev,
      endpoints: {
        ...prev.endpoints,
        [endpoint]: {
          ...prev.endpoints[endpoint],
          [key]: value
        }
      }
    }));
  };

  // Add new endpoint
  const addEndpoint = () => {
    const endpoint = prompt('Enter API endpoint path (e.g., /api/custom):');
    if (endpoint && !rateLimitSettings.endpoints[endpoint]) {
      setRateLimitSettings(prev => ({
        ...prev,
        endpoints: {
          ...prev.endpoints,
          [endpoint]: { limit: 100, windowMs: 60000 }
        }
      }));
    }
  };

  // Remove endpoint
  const removeEndpoint = (endpoint) => {
    if (window.confirm(`Remove rate limiting for ${endpoint}?`)) {
      setRateLimitSettings(prev => {
        const newEndpoints = { ...prev.endpoints };
        delete newEndpoints[endpoint];
        return {
          ...prev,
          endpoints: newEndpoints
        };
      });
    }
  };

  // Add IP to list
  const addToList = (listType) => {
    const ip = prompt(`Enter IP address to add to ${listType}:`);
    if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      setRateLimitSettings(prev => ({
        ...prev,
        [listType]: [...prev[listType], ip]
      }));
    } else if (ip) {
      toast.error('Invalid IP address format');
    }
  };

  // Remove IP from list
  const removeFromList = (listType, ip) => {
    setRateLimitSettings(prev => ({
      ...prev,
      [listType]: prev[listType].filter(item => item !== ip)
    }));
  };

  // Format time duration
  const formatDuration = (ms) => {
    if (ms < 60000) return `${ms / 1000}s`;
    if (ms < 3600000) return `${ms / 60000}m`;
    return `${ms / 3600000}h`;
  };

  // Get status color based on block rate
  const getBlockRateColor = (rate) => {
    if (rate < 5) return 'text-green-600';
    if (rate < 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">API Rate Limiting</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadRateLimitStats}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Refresh stats"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={saveSettings}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'endpoints', label: 'Endpoints', icon: Zap },
            { id: 'access-control', label: 'Access Control', icon: Shield },
            { id: 'stats', label: 'Statistics', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-1" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900">Enable Rate Limiting</label>
              <button
                onClick={() => updateSetting('enabled', !rateLimitSettings.enabled)}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${rateLimitSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out
                    ${rateLimitSettings.enabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Global Rate Limit (requests per window)
                </label>
                <input
                  type="number"
                  min="1"
                  value={rateLimitSettings.globalLimit}
                  onChange={(e) => updateSetting('globalLimit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum requests per IP within the time window</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Window (milliseconds)
                </label>
                <select
                  value={rateLimitSettings.windowMs}
                  onChange={(e) => updateSetting('windowMs', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={15000}>15 seconds</option>
                  <option value={60000}>1 minute</option>
                  <option value={300000}>5 minutes</option>
                  <option value={900000}>15 minutes</option>
                  <option value={3600000}>1 hour</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Time window for rate limiting</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Per-User Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={rateLimitSettings.userLimit}
                  onChange={(e) => updateSetting('userLimit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Limit for authenticated users (overrides global for logged-in users)</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Advanced Options</h4>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rateLimitSettings.skipSuccessfulRequests}
                    onChange={(e) => updateSetting('skipSuccessfulRequests', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Skip successful requests from counting</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rateLimitSettings.skipFailedRequests}
                    onChange={(e) => updateSetting('skipFailedRequests', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Skip failed requests from counting</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Endpoint-Specific Rate Limits</h4>
              <button
                onClick={addEndpoint}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm"
              >
                Add Endpoint
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(rateLimitSettings.endpoints).map(([endpoint, config]) => (
                <div key={endpoint} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <code className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                      {endpoint}
                    </code>
                    <button
                      onClick={() => removeEndpoint(endpoint)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Request Limit
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={config.limit}
                        onChange={(e) => updateEndpointSetting(endpoint, 'limit', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Window
                      </label>
                      <select
                        value={config.windowMs}
                        onChange={(e) => updateEndpointSetting(endpoint, 'windowMs', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={15000}>15 seconds</option>
                        <option value={60000}>1 minute</option>
                        <option value={300000}>5 minutes</option>
                        <option value={900000}>15 minutes</option>
                        <option value={3600000}>1 hour</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
                    {config.limit} requests per {formatDuration(config.windowMs)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access Control Tab */}
        {activeTab === 'access-control' && (
          <div className="space-y-6">
            {/* Whitelist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">IP Whitelist</h4>
                <button
                  onClick={() => addToList('whitelist')}
                  className="px-3 py-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors text-sm"
                >
                  Add IP
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">IPs that bypass rate limiting entirely</p>
              
              {rateLimitSettings.whitelist.length === 0 ? (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  No whitelisted IPs
                </div>
              ) : (
                <div className="space-y-2">
                  {rateLimitSettings.whitelist.map(ip => (
                    <div key={ip} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded">
                      <code className="text-sm">{ip}</code>
                      <button
                        onClick={() => removeFromList('whitelist', ip)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blacklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">IP Blacklist</h4>
                <button
                  onClick={() => addToList('blacklist')}
                  className="px-3 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors text-sm"
                >
                  Add IP
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">IPs that are completely blocked</p>
              
              {rateLimitSettings.blacklist.length === 0 ? (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  No blacklisted IPs
                </div>
              ) : (
                <div className="space-y-2">
                  {rateLimitSettings.blacklist.map(ip => (
                    <div key={ip} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded">
                      <code className="text-sm">{ip}</code>
                      <button
                        onClick={() => removeFromList('blacklist', ip)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">Total Requests</span>
                </div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {stats.totalRequests?.toLocaleString() || '0'}
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-700">Blocked Requests</span>
                </div>
                <div className="text-2xl font-bold text-red-900 mt-1">
                  {stats.blockedRequests?.toLocaleString() || '0'}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700">Unique IPs</span>
                </div>
                <div className="text-2xl font-bold text-green-900 mt-1">
                  {stats.uniqueIPs?.toLocaleString() || '0'}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-700">Block Rate</span>
                </div>
                <div className={`text-2xl font-bold mt-1 ${
                  getBlockRateColor(
                    stats.totalRequests > 0 
                      ? (stats.blockedRequests / stats.totalRequests) * 100 
                      : 0
                  )
                }`}>
                  {stats.totalRequests > 0 
                    ? `${((stats.blockedRequests / stats.totalRequests) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
              </div>
            </div>

            {/* Top Endpoints */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Most Requested Endpoints</h4>
              {stats.topEndpoints?.length > 0 ? (
                <div className="space-y-2">
                  {stats.topEndpoints.map((endpoint, index) => (
                    <div key={endpoint.path} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                        <code className="text-sm">{endpoint.path}</code>
                      </div>
                      <div className="text-sm text-gray-600">
                        {endpoint.count?.toLocaleString()} requests
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  No endpoint statistics available
                </div>
              )}
            </div>

            {/* Recent Blocked Requests */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Recent Blocked Requests</h4>
              {stats.recentBlocked?.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.recentBlocked.map((blocked, index) => (
                    <div key={index} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <code className="text-sm">{blocked.ip}</code>
                        <span className="text-sm text-gray-600">→ {blocked.endpoint}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(blocked.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  No recent blocked requests
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RateLimitingPanel;