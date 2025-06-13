import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';
import useAnalyticsSettings from '../../hooks/useAnalyticsSettings';
import useAnalyticsDashboard from '../../hooks/useAnalyticsDashboard';
import toast from 'react-hot-toast';

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { usageTrackingEnabled, performanceMonitoring, statsPublic, leaderboardEnabled } = useAnalyticsSettings();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  
  // Data states
  const [activityAnalytics, setActivityAnalytics] = useState(null);
  const [performanceAnalytics, setPerformanceAnalytics] = useState(null);
  const [topEntities, setTopEntities] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [slowEndpoints, setSlowEndpoints] = useState([]);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }
    loadAnalyticsData();
  }, [isAdmin, navigate, dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const promises = [];
      
      // Only load analytics if tracking is enabled
      if (usageTrackingEnabled) {
        promises.push(
          analyticsAPI.getActivityAnalytics({ period: dateRange }),
          analyticsAPI.getTopEntities({ period: dateRange, limit: 10 })
        );
      }
      
      if (performanceMonitoring) {
        promises.push(
          analyticsAPI.getPerformanceAnalytics({ period: dateRange }),
          analyticsAPI.getSystemHealth(),
          analyticsAPI.getSlowEndpoints({ limit: 10 })
        );
      }

      const results = await Promise.all(promises);
      
      let resultIndex = 0;
      if (usageTrackingEnabled) {
        setActivityAnalytics(results[resultIndex++].data);
        setTopEntities(results[resultIndex++].data);
      }
      
      if (performanceMonitoring) {
        setPerformanceAnalytics(results[resultIndex++].data);
        setSystemHealth(results[resultIndex++].data);
        setSlowEndpoints(results[resultIndex++].data);
      }
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin()) {
    return null;
  }

  const tabs = [
    { id: 'overview', name: 'Overview', enabled: true },
    { id: 'activity', name: 'User Activity', enabled: usageTrackingEnabled },
    { id: 'performance', name: 'Performance', enabled: performanceMonitoring },
    { id: 'engagement', name: 'Engagement', enabled: usageTrackingEnabled },
  ].filter(tab => tab.enabled);

  const dateRangeOptions = [
    { value: '1d', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Settings Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg border-2 ${usageTrackingEnabled ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${usageTrackingEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">Usage Tracking</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{usageTrackingEnabled ? 'Active' : 'Disabled'}</p>
        </div>
        
        <div className={`p-4 rounded-lg border-2 ${performanceMonitoring ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${performanceMonitoring ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">Performance Monitoring</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{performanceMonitoring ? 'Active' : 'Disabled'}</p>
        </div>
        
        <div className={`p-4 rounded-lg border-2 ${statsPublic ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${statsPublic ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">Public Statistics</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{statsPublic ? 'Visible' : 'Hidden'}</p>
        </div>
        
        <div className={`p-4 rounded-lg border-2 ${leaderboardEnabled ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${leaderboardEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">Leaderboard</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{leaderboardEnabled ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>

      {/* Quick Stats */}
      {activityAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl font-bold text-blue-600">{activityAnalytics.totalActivities || 0}</div>
            <div className="text-gray-600">Total Activities</div>
            <div className="text-sm text-gray-500 mt-1">Last {dateRange}</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl font-bold text-green-600">{activityAnalytics.uniqueUsers || 0}</div>
            <div className="text-gray-600">Active Users</div>
            <div className="text-sm text-gray-500 mt-1">Unique visitors</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl font-bold text-purple-600">{activityAnalytics.totalSessions || 0}</div>
            <div className="text-gray-600">Sessions</div>
            <div className="text-sm text-gray-500 mt-1">User sessions</div>
          </div>
        </div>
      )}

      {/* System Health */}
      {systemHealth && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">System Health Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemHealth.metrics?.map((metric, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl font-bold ${
                  metric.status === 'healthy' ? 'text-green-600' :
                  metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metric.score || 0}%
                </div>
                <div className="text-sm text-gray-600">{metric.type?.replace('_', ' ').toUpperCase()}</div>
                <div className={`text-xs mt-1 ${
                  metric.status === 'healthy' ? 'text-green-600' :
                  metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metric.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const ActivityTab = () => (
    <div className="space-y-6">
      {/* Activity Types */}
      {activityAnalytics?.activityBreakdown && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Activity Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activityAnalytics.activityBreakdown.map((activity, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{activity.count}</div>
                <div className="text-sm text-gray-600">{activity.activity_type?.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Entities */}
      {topEntities && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {topEntities.topWhiskies && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Most Viewed Whiskies</h3>
              <div className="space-y-3">
                {topEntities.topWhiskies.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">{item.entityName || `Whisky #${item.entity_id}`}</span>
                    <span className="text-blue-600 font-bold">{item.views} views</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {topEntities.topPages && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Most Visited Pages</h3>
              <div className="space-y-3">
                {topEntities.topPages.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">{item.entityName || 'Unknown Page'}</span>
                    <span className="text-green-600 font-bold">{item.views} visits</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const PerformanceTab = () => (
    <div className="space-y-6">
      {/* Performance Metrics */}
      {performanceAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl font-bold text-blue-600">
              {performanceAnalytics.averageResponseTime || 0}ms
            </div>
            <div className="text-gray-600">Avg Response Time</div>
            <div className="text-sm text-gray-500 mt-1">API performance</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl font-bold text-green-600">
              {performanceAnalytics.averagePageLoad || 0}ms
            </div>
            <div className="text-gray-600">Avg Page Load</div>
            <div className="text-sm text-gray-500 mt-1">Frontend performance</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl font-bold text-purple-600">
              {performanceAnalytics.errorRate || 0}%
            </div>
            <div className="text-gray-600">Error Rate</div>
            <div className="text-sm text-gray-500 mt-1">System reliability</div>
          </div>
        </div>
      )}

      {/* Slow Endpoints */}
      {slowEndpoints.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Slowest Endpoints</h3>
          <div className="space-y-3">
            {slowEndpoints.map((endpoint, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{endpoint.endpoint}</span>
                  <div className="text-sm text-gray-600">{endpoint.requestCount} requests</div>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${endpoint.averageTime > 1000 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {endpoint.averageTime}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const EngagementTab = () => (
    <div className="space-y-6">
      {/* User Engagement Metrics */}
      {activityAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-blue-600">
              {activityAnalytics.averageSessionDuration || 0}m
            </div>
            <div className="text-gray-600">Avg Session Duration</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-green-600">
              {activityAnalytics.returningUsers || 0}%
            </div>
            <div className="text-gray-600">Returning Users</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-purple-600">
              {activityAnalytics.pageViewsPerSession || 0}
            </div>
            <div className="text-gray-600">Pages per Session</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-amber-600">
              {activityAnalytics.bounceRate || 0}%
            </div>
            <div className="text-gray-600">Bounce Rate</div>
          </div>
        </div>
      )}

      {/* Recent User Activities */}
      {activityAnalytics?.recentActivities && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Recent User Activities</h3>
          <div className="space-y-3">
            {activityAnalytics.recentActivities.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{activity.activity_type?.replace('_', ' ')}</span>
                  <div className="text-sm text-gray-600">
                    {activity.entity_type && `${activity.entity_type} ${activity.entity_id || ''}`}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(activity.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'activity':
        return <ActivityTab />;
      case 'performance':
        return <PerformanceTab />;
      case 'engagement':
        return <EngagementTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Insights into user behavior and system performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={loadAnalyticsData}
            className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Analytics Disabled Notice */}
      {!usageTrackingEnabled && !performanceMonitoring && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="text-yellow-400 mr-3">⚠️</div>
            <div>
              <h3 className="text-yellow-800 font-medium">Analytics Disabled</h3>
              <p className="text-yellow-700 mt-1">
                Usage tracking and performance monitoring are currently disabled. 
                Enable them in <a href="/admin/settings" className="underline">System Settings</a> to start collecting analytics data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default AnalyticsPage;