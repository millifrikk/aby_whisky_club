import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { whiskyAPI, newsEventAPI, ratingAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }
    loadDashboardData();
  }, [isAdmin, navigate]);

  const loadDashboardData = async () => {
    try {
      const [dashboardStats, ratingsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        ratingAPI.getRecent({ limit: 10 }),
      ]);

      // Extract data from the response
      const statsData = dashboardStats.data || dashboardStats;
      setStats(statsData);
      setRecentActivity(ratingsRes.data.ratings || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin()) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard')}</h1>
        <p className="text-gray-600">{t('admin.welcome')}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/admin/whiskies/new"
          className="bg-amber-600 text-white p-6 rounded-lg shadow-md hover:bg-amber-700 transition-colors"
        >
          <div className="text-3xl mb-4">🥃</div>
          <h3 className="text-lg font-semibold">Add Whisky</h3>
          <p className="text-amber-100">Add new whisky to collection</p>
        </Link>

        <Link
          to="/admin/events/new"
          className="bg-blue-600 text-white p-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          <div className="text-3xl mb-4">📰</div>
          <h3 className="text-lg font-semibold">Create Post</h3>
          <p className="text-blue-100">Add news or event</p>
        </Link>

        <Link
          to="/admin/users"
          className="bg-green-600 text-white p-6 rounded-lg shadow-md hover:bg-green-700 transition-colors"
        >
          <div className="text-3xl mb-4">👥</div>
          <h3 className="text-lg font-semibold">Manage Users</h3>
          <p className="text-green-100">View and manage members</p>
        </Link>

        <Link
          to="/admin/content"
          className="bg-purple-600 text-white p-6 rounded-lg shadow-md hover:bg-purple-700 transition-colors"
        >
          <div className="text-3xl mb-4">🛡️</div>
          <h3 className="text-lg font-semibold">Content Moderation</h3>
          <p className="text-purple-100">Review and moderate content</p>
        </Link>
      </div>

      {/* Additional Admin Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/admin/settings"
          className="bg-gray-600 text-white p-6 rounded-lg shadow-md hover:bg-gray-700 transition-colors"
        >
          <div className="text-3xl mb-4">⚙️</div>
          <h3 className="text-lg font-semibold">System Settings</h3>
          <p className="text-gray-100">Configure application settings</p>
        </Link>

        <Link
          to="/admin/export"
          className="bg-indigo-600 text-white p-6 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
        >
          <div className="text-3xl mb-4">📤</div>
          <h3 className="text-lg font-semibold">Data Export</h3>
          <p className="text-indigo-100">Export system data</p>
        </Link>

        <div className="bg-orange-600 text-white p-6 rounded-lg shadow-md opacity-75">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="text-lg font-semibold">Analytics</h3>
          <p className="text-orange-100">Coming soon...</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-amber-600">{stats.whiskies?.total_whiskies || 0}</div>
          <div className="text-gray-600">Total Whiskies</div>
          <div className="text-sm text-green-600 mt-1">
            {stats.whiskies?.available_whiskies || 0} available
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-blue-600">{stats.whiskies?.total_distilleries || 0}</div>
          <div className="text-gray-600">Distilleries</div>
          <div className="text-sm text-gray-500 mt-1">
            From {stats.whiskies?.total_countries || 0} regions
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-green-600">{stats.ratings?.total_ratings || 0}</div>
          <div className="text-gray-600">Total Ratings</div>
          <div className="text-sm text-gray-500 mt-1">
            Avg: {stats.ratings?.average_rating || 'N/A'}/10
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-purple-600">{stats.users?.total_members || 0}</div>
          <div className="text-gray-600">Total Members</div>
          <div className="text-sm text-gray-500 mt-1">
            {stats.users?.admins || 0} admins
          </div>
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Members:</span>
              <span className="font-medium">{stats.users?.members || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Administrators:</span>
              <span className="font-medium">{stats.users?.admins || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Raters:</span>
              <span className="font-medium">{stats.ratings?.active_raters || 0}</span>
            </div>
          </div>
        </div>

        {/* Content Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Events:</span>
              <span className="font-medium">{stats.events?.events_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">News Articles:</span>
              <span className="font-medium">{stats.events?.news_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Published Content:</span>
              <span className="font-medium">{stats.events?.published_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Whisky Management */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Whisky Management</h2>
            <Link
              to="/whiskies"
              className="text-amber-600 hover:text-amber-700 text-sm"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-3">
            <Link
              to="/admin/whiskies/new"
              className="block p-3 border border-amber-200 rounded-md hover:bg-amber-50 transition-colors"
            >
              <div className="font-medium text-amber-800">Add New Whisky</div>
              <div className="text-sm text-amber-600">Add whisky to the collection</div>
            </Link>
            
            <Link
              to="/whiskies?admin=true"
              className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-800">Manage Existing</div>
              <div className="text-sm text-gray-600">Edit or remove whiskies</div>
            </Link>
            
            <Link
              to="/admin/whiskies/import"
              className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-800">Bulk Import</div>
              <div className="text-sm text-gray-600">Import whiskies from CSV</div>
            </Link>
          </div>
        </div>

        {/* Content Management */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Content Management</h2>
            <Link
              to="/events"
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-3">
            <Link
              to="/admin/events/new"
              className="block p-3 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-blue-800">Create News/Event</div>
              <div className="text-sm text-blue-600">Share club news, events, or announcements</div>
            </Link>
            
            <Link
              to="/events"
              className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-800">Manage Posts</div>
              <div className="text-sm text-gray-600">Edit or delete content</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.slice(0, 5).map((rating) => (
              <div key={rating.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <div className="font-medium">
                    {rating.user?.first_name || rating.user?.username} rated{' '}
                    <span className="text-amber-600">{rating.whisky?.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Score: {rating.overall_score}/10 • {new Date(rating.created_at).toLocaleDateString()}
                  </div>
                  {rating.review_text && (
                    <div className="text-sm text-gray-700 mt-1">
                      "{rating.review_text.substring(0, 100)}..."
                    </div>
                  )}
                </div>
                <Link
                  to={`/whiskies/${rating.whisky?.id}`}
                  className="text-amber-600 hover:text-amber-700 text-sm"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent activity</p>
        )}
        
        <div className="mt-4 text-center">
          <Link
            to="/ratings"
            className="text-amber-600 hover:text-amber-700 text-sm"
          >
            View All Ratings →
          </Link>
        </div>
      </div>

      {/* Regional Distribution */}
      {stats.charts?.regional_breakdown && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Collection by Region</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.charts.regional_breakdown.map((region) => (
              <div key={region.region} className="text-center">
                <div className="text-2xl font-bold text-amber-600">{region.count}</div>
                <div className="text-sm text-gray-600">{region.region || 'Unknown'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
