import React, { useState, useEffect } from 'react';
import { 
  Settings, Link, CheckCircle, XCircle, AlertTriangle, 
  Zap, MessageSquare, Bell, Users, Mail, Send, TestTube,
  Save, RefreshCw, ExternalLink, Shield, Key
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import toast from 'react-hot-toast';

const ThirdPartyIntegrationsPanel = ({ className = "" }) => {
  const { settings, refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [integrationSettings, setIntegrationSettings] = useState({
    slack: {
      enabled: false,
      webhookUrl: '',
      channel: '#general',
      username: 'Åby Whisky Club'
    },
    discord: {
      enabled: false,
      webhookUrl: '',
      username: 'Åby Whisky Club',
      avatarUrl: ''
    },
    telegram: {
      enabled: false,
      botToken: '',
      chatId: '',
      parseMode: 'HTML'
    },
    mailchimp: {
      enabled: false,
      apiKey: '',
      listId: '',
      serverPrefix: ''
    },
    zapier: {
      enabled: false,
      webhookUrls: [],
      events: ['user_registered', 'whisky_rated', 'event_created']
    }
  });

  // Load integration settings from system settings
  useEffect(() => {
    try {
      const thirdPartyData = settings?.third_party_integrations;
      if (thirdPartyData) {
        const parsed = typeof thirdPartyData === 'string' ? JSON.parse(thirdPartyData) : thirdPartyData;
        setIntegrationSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error parsing third party integrations:', error);
    }
  }, [settings]);

  // Save integration settings
  const saveIntegrationSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          key: 'third_party_integrations',
          value: JSON.stringify(integrationSettings)
        })
      });

      if (response.ok) {
        toast.success('Integration settings saved successfully');
        await refreshSettings();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving integration settings:', error);
      toast.error('Failed to save integration settings');
    } finally {
      setLoading(false);
    }
  };

  // Test integration connection
  const testIntegration = async (platform) => {
    try {
      setTestResults(prev => ({ ...prev, [platform]: 'testing' }));
      
      const response = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          platform,
          config: integrationSettings[platform]
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setTestResults(prev => ({ ...prev, [platform]: 'success' }));
        toast.success(`${platform} integration test successful`);
      } else {
        setTestResults(prev => ({ ...prev, [platform]: 'error' }));
        toast.error(`${platform} integration test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error testing ${platform} integration:`, error);
      setTestResults(prev => ({ ...prev, [platform]: 'error' }));
      toast.error(`Failed to test ${platform} integration`);
    }
  };

  // Update integration setting
  const updateIntegrationSetting = (platform, key, value) => {
    setIntegrationSettings(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [key]: value
      }
    }));
  };

  // Get status icon for integration
  const getStatusIcon = (platform) => {
    const testResult = testResults[platform];
    const isEnabled = integrationSettings[platform]?.enabled;
    
    if (testResult === 'testing') return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    if (testResult === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (testResult === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    if (isEnabled) return <AlertTriangle className="h-4 w-4 text-yellow-500" title="Enabled but not tested" />;
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  // Get platform info
  const getPlatformInfo = (platform) => {
    const info = {
      slack: { name: 'Slack', icon: MessageSquare, color: 'purple' },
      discord: { name: 'Discord', icon: MessageSquare, color: 'indigo' },
      telegram: { name: 'Telegram', icon: Send, color: 'blue' },
      mailchimp: { name: 'Mailchimp', icon: Mail, color: 'yellow' },
      zapier: { name: 'Zapier', icon: Zap, color: 'orange' }
    };
    return info[platform] || { name: platform, icon: Link, color: 'gray' };
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Third-Party Integrations</h3>
          </div>
          <button
            onClick={saveIntegrationSettings}
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

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: Settings },
            { id: 'slack', label: 'Slack', icon: MessageSquare },
            { id: 'discord', label: 'Discord', icon: MessageSquare },
            { id: 'telegram', label: 'Telegram', icon: Send },
            { id: 'mailchimp', label: 'Mailchimp', icon: Mail },
            { id: 'zapier', label: 'Zapier', icon: Zap }
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
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Integration Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(integrationSettings).map(platform => {
                  const platformInfo = getPlatformInfo(platform);
                  const isEnabled = integrationSettings[platform]?.enabled;
                  
                  return (
                    <div key={platform} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <platformInfo.icon className={`h-5 w-5 text-${platformInfo.color}-500`} />
                          <span className="font-medium text-gray-900">{platformInfo.name}</span>
                        </div>
                        {getStatusIcon(platform)}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Status: {isEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setActiveTab(platform)}
                          className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Configure
                        </button>
                        {isEnabled && (
                          <button
                            onClick={() => testIntegration(platform)}
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors flex items-center"
                          >
                            <TestTube className="h-3 w-3 mr-1" />
                            Test
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900">Security Notice</h5>
                  <p className="text-sm text-blue-700 mt-1">
                    API keys and webhook URLs are stored securely and encrypted. Test your integrations regularly to ensure they're working correctly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slack Tab */}
        {activeTab === 'slack' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Slack Integration</h4>
              <div className="flex items-center space-x-2">
                {getStatusIcon('slack')}
                <button
                  onClick={() => testIntegration('slack')}
                  disabled={!integrationSettings.slack.enabled || !integrationSettings.slack.webhookUrl}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center"
                >
                  <TestTube className="h-3 w-3 mr-1" />
                  Test Connection
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">Enable Slack Integration</label>
                <button
                  onClick={() => updateIntegrationSetting('slack', 'enabled', !integrationSettings.slack.enabled)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${integrationSettings.slack.enabled ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${integrationSettings.slack.enabled ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={integrationSettings.slack.webhookUrl}
                  onChange={(e) => updateIntegrationSetting('slack', 'webhookUrl', e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Create a webhook URL in your Slack workspace settings
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
                <input
                  type="text"
                  value={integrationSettings.slack.channel}
                  onChange={(e) => updateIntegrationSetting('slack', 'channel', e.target.value)}
                  placeholder="#general"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={integrationSettings.slack.username}
                  onChange={(e) => updateIntegrationSetting('slack', 'username', e.target.value)}
                  placeholder="Åby Whisky Club"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Discord Tab */}
        {activeTab === 'discord' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Discord Integration</h4>
              <div className="flex items-center space-x-2">
                {getStatusIcon('discord')}
                <button
                  onClick={() => testIntegration('discord')}
                  disabled={!integrationSettings.discord.enabled || !integrationSettings.discord.webhookUrl}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center"
                >
                  <TestTube className="h-3 w-3 mr-1" />
                  Test Connection
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">Enable Discord Integration</label>
                <button
                  onClick={() => updateIntegrationSetting('discord', 'enabled', !integrationSettings.discord.enabled)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${integrationSettings.discord.enabled ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${integrationSettings.discord.enabled ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={integrationSettings.discord.webhookUrl}
                  onChange={(e) => updateIntegrationSetting('discord', 'webhookUrl', e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={integrationSettings.discord.username}
                  onChange={(e) => updateIntegrationSetting('discord', 'username', e.target.value)}
                  placeholder="Åby Whisky Club"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
                <input
                  type="url"
                  value={integrationSettings.discord.avatarUrl}
                  onChange={(e) => updateIntegrationSetting('discord', 'avatarUrl', e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Telegram Tab */}
        {activeTab === 'telegram' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Telegram Integration</h4>
              <div className="flex items-center space-x-2">
                {getStatusIcon('telegram')}
                <button
                  onClick={() => testIntegration('telegram')}
                  disabled={!integrationSettings.telegram.enabled || !integrationSettings.telegram.botToken}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center"
                >
                  <TestTube className="h-3 w-3 mr-1" />
                  Test Connection
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">Enable Telegram Integration</label>
                <button
                  onClick={() => updateIntegrationSetting('telegram', 'enabled', !integrationSettings.telegram.enabled)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${integrationSettings.telegram.enabled ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${integrationSettings.telegram.enabled ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Token <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={integrationSettings.telegram.botToken}
                  onChange={(e) => updateIntegrationSetting('telegram', 'botToken', e.target.value)}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Create a bot with @BotFather on Telegram
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={integrationSettings.telegram.chatId}
                  onChange={(e) => updateIntegrationSetting('telegram', 'chatId', e.target.value)}
                  placeholder="-123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use @getidsbot to get your chat ID
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mailchimp Tab */}
        {activeTab === 'mailchimp' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Mailchimp Integration</h4>
              <div className="flex items-center space-x-2">
                {getStatusIcon('mailchimp')}
                <button
                  onClick={() => testIntegration('mailchimp')}
                  disabled={!integrationSettings.mailchimp.enabled || !integrationSettings.mailchimp.apiKey}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center"
                >
                  <TestTube className="h-3 w-3 mr-1" />
                  Test Connection
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">Enable Mailchimp Integration</label>
                <button
                  onClick={() => updateIntegrationSetting('mailchimp', 'enabled', !integrationSettings.mailchimp.enabled)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${integrationSettings.mailchimp.enabled ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${integrationSettings.mailchimp.enabled ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={integrationSettings.mailchimp.apiKey}
                  onChange={(e) => updateIntegrationSetting('mailchimp', 'apiKey', e.target.value)}
                  placeholder="abc123abc123abc123abc123abc123-us1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  List ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={integrationSettings.mailchimp.listId}
                  onChange={(e) => updateIntegrationSetting('mailchimp', 'listId', e.target.value)}
                  placeholder="abc123def4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Server Prefix</label>
                <input
                  type="text"
                  value={integrationSettings.mailchimp.serverPrefix}
                  onChange={(e) => updateIntegrationSetting('mailchimp', 'serverPrefix', e.target.value)}
                  placeholder="us1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Zapier Tab */}
        {activeTab === 'zapier' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Zapier Integration</h4>
              <div className="flex items-center space-x-2">
                {getStatusIcon('zapier')}
                <button
                  onClick={() => testIntegration('zapier')}
                  disabled={!integrationSettings.zapier.enabled || integrationSettings.zapier.webhookUrls.length === 0}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center"
                >
                  <TestTube className="h-3 w-3 mr-1" />
                  Test Connection
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">Enable Zapier Integration</label>
                <button
                  onClick={() => updateIntegrationSetting('zapier', 'enabled', !integrationSettings.zapier.enabled)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${integrationSettings.zapier.enabled ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${integrationSettings.zapier.enabled ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URLs</label>
                <div className="space-y-2">
                  {integrationSettings.zapier.webhookUrls.map((url, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...integrationSettings.zapier.webhookUrls];
                          newUrls[index] = e.target.value;
                          updateIntegrationSetting('zapier', 'webhookUrls', newUrls);
                        }}
                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => {
                          const newUrls = integrationSettings.zapier.webhookUrls.filter((_, i) => i !== index);
                          updateIntegrationSetting('zapier', 'webhookUrls', newUrls);
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newUrls = [...integrationSettings.zapier.webhookUrls, ''];
                      updateIntegrationSetting('zapier', 'webhookUrls', newUrls);
                    }}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Add Webhook URL
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enabled Events</label>
                <div className="space-y-2">
                  {['user_registered', 'whisky_rated', 'event_created', 'whisky_added', 'user_followed'].map(event => (
                    <label key={event} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={integrationSettings.zapier.events.includes(event)}
                        onChange={(e) => {
                          const newEvents = e.target.checked
                            ? [...integrationSettings.zapier.events, event]
                            : integrationSettings.zapier.events.filter(e => e !== event);
                          updateIntegrationSetting('zapier', 'events', newEvents);
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {event.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThirdPartyIntegrationsPanel;