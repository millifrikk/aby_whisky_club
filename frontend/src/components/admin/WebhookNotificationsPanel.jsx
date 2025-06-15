import React, { useState, useEffect } from 'react';
import { 
  Webhook, Bell, Send, CheckCircle, XCircle, AlertTriangle, 
  Clock, Play, Pause, Settings, Trash2, Plus, TestTube,
  RefreshCw, ExternalLink, Eye, EyeOff, Save
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import toast from 'react-hot-toast';

const WebhookNotificationsPanel = ({ className = "" }) => {
  const { settings, refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [webhooks, setWebhooks] = useState([]);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [],
    enabled: true,
    secret: '',
    retryAttempts: 3,
    timeout: 5000
  });
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [showSecret, setShowSecret] = useState({});

  // Available webhook events
  const availableEvents = [
    { id: 'user.registered', label: 'User Registration', description: 'Triggered when a new user registers' },
    { id: 'user.verified', label: 'Email Verification', description: 'Triggered when user verifies email' },
    { id: 'whisky.added', label: 'Whisky Added', description: 'Triggered when a new whisky is added' },
    { id: 'whisky.rated', label: 'Whisky Rated', description: 'Triggered when a whisky receives a rating' },
    { id: 'event.created', label: 'Event Created', description: 'Triggered when a new event is created' },
    { id: 'event.rsvp', label: 'Event RSVP', description: 'Triggered when someone RSVPs to an event' },
    { id: 'user.followed', label: 'User Followed', description: 'Triggered when a user follows another user' },
    { id: 'message.sent', label: 'Message Sent', description: 'Triggered when a user sends a message' },
    { id: 'system.maintenance', label: 'Maintenance Mode', description: 'Triggered when maintenance mode changes' },
    { id: 'system.backup', label: 'System Backup', description: 'Triggered when system backup completes' }
  ];

  // Load webhook settings
  useEffect(() => {
    loadWebhooks();
    loadWebhookLogs();
  }, []);

  const loadWebhooks = async () => {
    try {
      const response = await fetch('/api/admin/webhooks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (error) {
      console.error('Error loading webhooks:', error);
    }
  };

  const loadWebhookLogs = async () => {
    try {
      const response = await fetch('/api/admin/webhooks/logs?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWebhookLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading webhook logs:', error);
    }
  };

  // Save webhook
  const saveWebhook = async (webhook = null) => {
    try {
      setLoading(true);
      const webhookData = webhook || newWebhook;
      
      const response = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        toast.success('Webhook saved successfully');
        if (!webhook) {
          setNewWebhook({
            name: '',
            url: '',
            events: [],
            enabled: true,
            secret: '',
            retryAttempts: 3,
            timeout: 5000
          });
        }
        await loadWebhooks();
      } else {
        throw new Error('Failed to save webhook');
      }
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error('Failed to save webhook');
    } finally {
      setLoading(false);
    }
  };

  // Delete webhook
  const deleteWebhook = async (webhookId) => {
    if (!window.confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Webhook deleted successfully');
        await loadWebhooks();
      } else {
        throw new Error('Failed to delete webhook');
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  // Test webhook
  const testWebhook = async (webhookId) => {
    try {
      const response = await fetch(`/api/admin/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('Webhook test successful');
      } else {
        toast.error(`Webhook test failed: ${result.error || 'Unknown error'}`);
      }
      
      await loadWebhookLogs();
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Failed to test webhook');
    }
  };

  // Toggle webhook enabled state
  const toggleWebhook = async (webhookId, enabled) => {
    try {
      const response = await fetch(`/api/admin/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        toast.success(`Webhook ${enabled ? 'enabled' : 'disabled'}`);
        await loadWebhooks();
      } else {
        throw new Error('Failed to update webhook');
      }
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast.error('Failed to update webhook');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Webhook className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Webhook Notifications</h3>
          </div>
          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: Settings },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
            { id: 'logs', label: 'Activity Logs', icon: Eye },
            { id: 'create', label: 'Create New', icon: Plus }
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Webhook className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">Total Webhooks</span>
                </div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {webhooks.length}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700">Active Webhooks</span>
                </div>
                <div className="text-2xl font-bold text-green-900 mt-1">
                  {webhooks.filter(w => w.enabled).length}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-700">Recent Events</span>
                </div>
                <div className="text-2xl font-bold text-yellow-900 mt-1">
                  {webhookLogs.filter(log => 
                    new Date(log.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Available Events</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableEvents.map(event => (
                  <div key={event.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">{event.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded mt-2 inline-block">
                      {event.id}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-4">
            {webhooks.length === 0 ? (
              <div className="text-center py-8">
                <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
                <p className="text-gray-500 mb-4">Create your first webhook to start receiving notifications</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Webhook
                </button>
              </div>
            ) : (
              webhooks.map(webhook => (
                <div key={webhook.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{webhook.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        webhook.enabled 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {webhook.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => testWebhook(webhook.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Test webhook"
                      >
                        <TestTube className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleWebhook(webhook.id, !webhook.enabled)}
                        className={`p-1.5 rounded transition-colors ${
                          webhook.enabled
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={webhook.enabled ? 'Disable webhook' : 'Enable webhook'}
                      >
                        {webhook.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deleteWebhook(webhook.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete webhook"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">URL:</span>
                      <div className="font-mono text-gray-900 break-all">{webhook.url}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Events:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhook.events.map(event => (
                          <span key={event} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-600">Retry Attempts:</span>
                      <span className="ml-2 font-medium">{webhook.retryAttempts || 3}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Timeout:</span>
                      <span className="ml-2 font-medium">{webhook.timeout || 5000}ms</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Triggered:</span>
                      <span className="ml-2 font-medium">
                        {webhook.lastTriggered 
                          ? new Date(webhook.lastTriggered).toLocaleString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Recent Webhook Activity</h4>
              <button
                onClick={loadWebhookLogs}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Refresh logs"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {webhookLogs.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No webhook activity</h3>
                <p className="text-gray-500">Webhook events will appear here when they occur</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {webhookLogs.map(log => (
                  <div key={log.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log.status)}
                        <span className="font-medium text-gray-900">{log.webhookName}</span>
                        <span className="text-sm text-gray-600">→ {log.event}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <span className="font-medium">Status:</span>
                        <span className={`ml-1 ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Response:</span>
                        <span className="ml-1">{log.responseStatus || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <span className="ml-1">{log.duration || 'N/A'}ms</span>
                      </div>
                    </div>

                    {log.error && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        <span className="font-medium">Error:</span> {log.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create New Tab */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900">Create New Webhook</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events to Subscribe <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {availableEvents.map(event => (
                    <label key={event.id} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event.id)}
                        onChange={(e) => {
                          const events = e.target.checked
                            ? [...newWebhook.events, event.id]
                            : newWebhook.events.filter(id => id !== event.id);
                          setNewWebhook(prev => ({ ...prev, events }));
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{event.label}</div>
                        <div className="text-xs text-gray-600">{event.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retry Attempts
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={newWebhook.retryAttempts}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="30000"
                    value={newWebhook.timeout}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secret (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showSecret.new ? "text" : "password"}
                    value={newWebhook.secret}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                    placeholder="Webhook secret for verification"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showSecret.new ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Optional secret for webhook signature verification
                </p>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newWebhook.enabled}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable webhook immediately</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => saveWebhook()}
                  disabled={loading || !newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Create Webhook
                </button>
                <button
                  onClick={() => setActiveTab('webhooks')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhookNotificationsPanel;