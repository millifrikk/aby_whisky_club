import React, { useState, useEffect } from 'react';
import { 
  History, Clock, TrendingUp, BarChart3, Trash2, Download, 
  Calendar, Target, Search, X, Settings, RefreshCw 
} from 'lucide-react';
import searchHistory from '../../utils/searchHistory';

const SearchHistoryPanel = ({ className = "" }) => {
  const [activeTab, setActiveTab] = useState('history');
  const [historyData, setHistoryData] = useState([]);
  const [popularTerms, setPopularTerms] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [history, popular, analyticsData, currentSettings] = await Promise.all([
        Promise.resolve(searchHistory.getRecentSearches(50)),
        Promise.resolve(searchHistory.getPopularTerms(20)),
        Promise.resolve(searchHistory.getAnalytics()),
        Promise.resolve(searchHistory.getSettings())
      ]);
      
      setHistoryData(history);
      setPopularTerms(popular);
      setAnalytics(analyticsData);
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading search history data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle settings update
  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    searchHistory.updateSettings(newSettings);
  };

  // Clear all history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all search history? This action cannot be undone.')) {
      searchHistory.clearHistory();
      loadData();
    }
  };

  // Clear popular terms
  const handleClearPopular = () => {
    if (window.confirm('Are you sure you want to clear popular terms data? This action cannot be undone.')) {
      searchHistory.clearPopularTerms();
      loadData();
    }
  };

  // Remove specific history item
  const handleRemoveHistoryItem = (id) => {
    searchHistory.removeItem(id);
    loadData();
  };

  // Export data
  const handleExportData = () => {
    try {
      const data = searchHistory.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-history-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting search data:', error);
      alert('Failed to export search data');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get success rate color
  const getSuccessRateColor = (rate) => {
    if (rate >= 0.8) return 'text-green-600';
    if (rate >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2">Loading search history...</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Search History & Analytics</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportData}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
            <button
              onClick={loadData}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'history', label: 'Recent Searches', icon: Clock },
            { id: 'popular', label: 'Popular Terms', icon: TrendingUp },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings }
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
        {/* Recent Searches Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Recent Search History</h4>
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex items-center"
                disabled={historyData.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </button>
            </div>

            {historyData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No search history yet</p>
                <p className="text-sm">Start searching to see your history here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {historyData.map(search => (
                  <div key={search.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{search.originalTerm}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          search.searchMode === 'fuzzy' 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {search.searchMode}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          search.successful 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {search.resultCount} results
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(search.timestamp)}
                        </span>
                        {search.categories.length > 0 && (
                          <span>Categories: {search.categories.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveHistoryItem(search.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                      title="Remove from history"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular Terms Tab */}
        {activeTab === 'popular' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Popular Search Terms</h4>
              <button
                onClick={handleClearPopular}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex items-center"
                disabled={popularTerms.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </button>
            </div>

            {popularTerms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No popular terms yet</p>
                <p className="text-sm">Search patterns will appear here as you use the search</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {popularTerms.map((term, index) => (
                  <div key={term.term} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-medium text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{term.term}</div>
                        <div className="text-sm text-gray-500">
                          Last used: {formatDate(term.lastUsed)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">{term.count} searches</span>
                        <span className={`font-medium ${getSuccessRateColor(term.successRate)}`}>
                          {Math.round(term.successRate * 100)}% success
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900">Search Analytics</h4>
            
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{analytics.totalSearches || 0}</div>
                <div className="text-sm text-blue-700">Total Searches</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((analytics.successRate || 0) * 100)}%
                </div>
                <div className="text-sm text-green-700">Success Rate</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{analytics.uniqueTerms || 0}</div>
                <div className="text-sm text-purple-700">Unique Terms</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.averageResultsPerSearch ? analytics.averageResultsPerSearch.toFixed(1) : '0'}
                </div>
                <div className="text-sm text-orange-700">Avg Results</div>
              </div>
            </div>

            {/* Time-based Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Activity</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This week:</span>
                    <span className="font-medium">{analytics.weeklySearches || 0} searches</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This month:</span>
                    <span className="font-medium">{analytics.monthlySearches || 0} searches</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Top Categories</h5>
                <div className="space-y-2">
                  {(analytics.topCategories || []).slice(0, 3).map(cat => (
                    <div key={cat.category} className="flex justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {cat.category.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-medium">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900">Search History Settings</h4>
            
            <div className="space-y-4">
              {/* Enable History */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Enable Search History</label>
                  <p className="text-sm text-gray-500">Track search history for suggestions and analytics</p>
                </div>
                <button
                  onClick={() => handleSettingChange('enableHistory', !settings.enableHistory)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${settings.enableHistory ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${settings.enableHistory ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              {/* Enable Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Enable Analytics</label>
                  <p className="text-sm text-gray-500">Collect search analytics and popular terms</p>
                </div>
                <button
                  onClick={() => handleSettingChange('enableAnalytics', !settings.enableAnalytics)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${settings.enableAnalytics ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${settings.enableAnalytics ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              {/* Max History Size */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Maximum History Size
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={settings.maxHistorySize || 50}
                  onChange={(e) => handleSettingChange('maxHistorySize', parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Number of searches to keep in history</p>
              </div>

              {/* Retention Days */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Retention Period (Days)
                </label>
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={settings.retentionDays || 30}
                  onChange={(e) => handleSettingChange('retentionDays', parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">How long to keep search history</p>
              </div>

              {/* Max Suggestions */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Max Suggestions
                </label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={settings.maxSuggestions || 8}
                  onChange={(e) => handleSettingChange('maxSuggestions', parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Number of suggestions to show</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchHistoryPanel;