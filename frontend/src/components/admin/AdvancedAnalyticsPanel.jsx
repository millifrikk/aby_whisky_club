import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Activity, Download, RefreshCw, Calendar, Target } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdvancedAnalyticsPanel = () => {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Initialize analytics data on component mount
  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Mock comprehensive analytics data
      const mockData = {
        user_engagement: {
          period_days: parseInt(selectedPeriod),
          daily_active_users: Array.from({ length: parseInt(selectedPeriod) }, (_, i) => ({
            date: new Date(Date.now() - (selectedPeriod - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            active_users: Math.floor(Math.random() * 50) + 20
          })),
          user_retention: {
            total_users: 1247,
            active_users: 456,
            retention_rate: '36.6'
          },
          content_trends: {
            reviews: Array.from({ length: parseInt(selectedPeriod) }, (_, i) => ({
              date: new Date(Date.now() - (selectedPeriod - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              count: Math.floor(Math.random() * 15) + 5
            })),
            ratings: Array.from({ length: parseInt(selectedPeriod) }, (_, i) => ({
              date: new Date(Date.now() - (selectedPeriod - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              count: Math.floor(Math.random() * 25) + 10
            }))
          },
          top_engaged_users: [
            { username: 'whisky_master', review_count: 45, rating_count: 123, active_days: 28, engagement_score: 196 },
            { username: 'scotch_lover', review_count: 38, rating_count: 89, active_days: 25, engagement_score: 152 },
            { username: 'connoisseur_pro', review_count: 32, rating_count: 76, active_days: 22, engagement_score: 130 }
          ]
        },
        whisky_popularity: {
          most_rated_whiskies: [
            { name: 'Macallan 18', distillery: 'Macallan', region: 'Speyside', rating_count: 156, avg_rating: '4.32' },
            { name: 'Lagavulin 16', distillery: 'Lagavulin', region: 'Islay', rating_count: 134, avg_rating: '4.28' },
            { name: 'Glenfiddich 21', distillery: 'Glenfiddich', region: 'Speyside', rating_count: 98, avg_rating: '4.15' }
          ],
          regional_popularity: [
            { region: 'Speyside', total_ratings: 845, avg_rating: '4.21' },
            { region: 'Islay', total_ratings: 623, avg_rating: '4.18' },
            { region: 'Highlands', total_ratings: 456, avg_rating: '4.09' }
          ],
          distillery_popularity: [
            { distillery: 'Macallan', total_ratings: 234, avg_rating: '4.35', whisky_count: 12 },
            { distillery: 'Lagavulin', total_ratings: 198, avg_rating: '4.29', whisky_count: 8 },
            { distillery: 'Glenfiddich', total_ratings: 176, avg_rating: '4.18', whisky_count: 15 }
          ]
        },
        user_behavior: {
          hourly_activity: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            activity_count: Math.floor(Math.random() * 100) + (i >= 18 && i <= 22 ? 50 : 0)
          })),
          weekly_activity: [
            { day_of_week: 0, day_name: 'Sunday', activity_count: 145 },
            { day_of_week: 1, day_name: 'Monday', activity_count: 189 },
            { day_of_week: 2, day_name: 'Tuesday', activity_count: 167 },
            { day_of_week: 3, day_name: 'Wednesday', activity_count: 203 },
            { day_of_week: 4, day_name: 'Thursday', activity_count: 234 },
            { day_of_week: 5, day_name: 'Friday', activity_count: 298 },
            { day_of_week: 6, day_name: 'Saturday', activity_count: 276 }
          ],
          action_frequency: [
            { action: 'view_whisky', frequency: 1245 },
            { action: 'rate_whisky', frequency: 567 },
            { action: 'write_review', frequency: 234 },
            { action: 'search', frequency: 189 },
            { action: 'browse_catalog', frequency: 156 }
          ]
        }
      };
      
      setAnalyticsData(mockData);
      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (format) => {
    try {
      toast.success(`Exporting analytics data as ${format.toUpperCase()}...`);
      // Mock export functionality
      // await adminAPI.exportAnalytics(format, selectedPeriod);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics data');
    }
  };

  const isAdvancedAnalyticsEnabled = settings?.enable_advanced_analytics !== false;

  if (!isAdvancedAnalyticsEnabled) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Advanced Analytics Disabled</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced analytics features are currently disabled. Enable them in the analytics settings.
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
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const { user_engagement, whisky_popularity, user_behavior } = analyticsData;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 theme-transition">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Analytics Dashboard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Deep insights and comprehensive metrics</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchAnalyticsData}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExportData('json')}
            className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </button>
          <button
            onClick={() => handleExportData('csv')}
            className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-100 text-sm">Active Users</div>
              <div className="text-2xl font-bold">{user_engagement?.user_retention?.active_users}</div>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-100 text-sm">Retention Rate</div>
              <div className="text-2xl font-bold">{user_engagement?.user_retention?.retention_rate}%</div>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-100 text-sm">Avg Rating</div>
              <div className="text-2xl font-bold">
                {whisky_popularity?.regional_popularity?.[0]?.avg_rating || '4.2'}
              </div>
            </div>
            <Target className="h-8 w-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-orange-100 text-sm">Daily Actions</div>
              <div className="text-2xl font-bold">
                {user_behavior?.action_frequency?.reduce((sum, action) => sum + action.frequency, 0) || 0}
              </div>
            </div>
            <Activity className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Engaged Users */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Top Engaged Users</h4>
          <div className="space-y-3">
            {user_engagement?.top_engaged_users?.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {user.review_count} reviews • {user.rating_count} ratings
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{user.engagement_score}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">score</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Whiskies */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Most Rated Whiskies</h4>
          <div className="space-y-3">
            {whisky_popularity?.most_rated_whiskies?.map((whisky, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{whisky.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {whisky.distillery} • {whisky.region}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{whisky.avg_rating}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{whisky.rating_count} ratings</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Popularity */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Regional Popularity</h4>
          <div className="space-y-3">
            {whisky_popularity?.regional_popularity?.map((region, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{region.region}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{region.total_ratings} total ratings</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{region.avg_rating}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">avg rating</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Activity Patterns */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Weekly Activity Pattern</h4>
          <div className="space-y-2">
            {user_behavior?.weekly_activity?.map((day) => (
              <div key={day.day_of_week} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300 w-20">{day.day_name}</span>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(day.activity_count / 300) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                  {day.activity_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Information */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Advanced Analytics Features</h5>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Real-time user engagement tracking and scoring</li>
          <li>• Comprehensive whisky popularity and rating analytics</li>
          <li>• User behavior patterns and activity analysis</li>
          <li>• Exportable reports in multiple formats</li>
          <li>• Configurable time periods and custom metrics</li>
        </ul>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsPanel;