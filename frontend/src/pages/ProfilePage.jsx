import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import WhiskyImage from '../components/common/WhiskyImage';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [userRatings, setUserRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRatings: 0,
    averageRating: 0,
    highestRated: null,
    lowestRated: null,
    favoriteRegion: null,
    recentActivity: []
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Load user's ratings from profile endpoint (includes recent ratings)
      const profileResponse = await authAPI.getProfile();
      const ratings = profileResponse.data.user?.ratings || [];
      setUserRatings(ratings);

      // Calculate statistics (limited to recent ratings for now)
      calculateStats(ratings);
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ratings) => {
    if (ratings.length === 0) {
      setStats({
        totalRatings: 0,
        averageRating: 0,
        highestRated: null,
        lowestRated: null,
        favoriteRegion: null,
        recentActivity: []
      });
      return;
    }

    // Calculate average rating
    const totalScore = ratings.reduce((sum, rating) => sum + rating.overall_score, 0);
    const averageRating = totalScore / ratings.length;

    // Find highest and lowest rated whiskies
    const sortedRatings = [...ratings].sort((a, b) => b.overall_score - a.overall_score);
    const highestRated = sortedRatings[0];
    const lowestRated = sortedRatings[sortedRatings.length - 1];

    // Find favorite region (most rated region)
    const regionCount = {};
    ratings.forEach(rating => {
      if (rating.whisky?.region) {
        regionCount[rating.whisky.region] = (regionCount[rating.whisky.region] || 0) + 1;
      }
    });
    const favoriteRegion = Object.keys(regionCount).length > 0 
      ? Object.keys(regionCount).reduce((a, b) => regionCount[a] > regionCount[b] ? a : b)
      : null;

    // Recent activity (last 5 ratings)
    const recentActivity = ratings
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    setStats({
      totalRatings: ratings.length,
      averageRating: averageRating.toFixed(1),
      highestRated,
      lowestRated,
      favoriteRegion,
      recentActivity
    });
  };

  const getInitials = (user) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = (user) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'User';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account and view your whisky journey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Profile Image */}
            <div className="text-center mb-6">
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={getDisplayName(user)}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-amber-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-amber-200">
                  {getInitials(user)}
                </div>
              )}
              <h2 className="text-xl font-semibold mt-4 text-gray-900">
                {getDisplayName(user)}
              </h2>
              <p className="text-gray-600">@{user?.username}</p>
              {user?.role === 'admin' && (
                <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full mt-2">
                  Administrator
                </span>
              )}
            </div>

            {/* User Bio */}
            {user?.bio && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">About</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              <Link
                to="/profile/settings"
                className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition-colors text-center block"
              >
                Edit Profile
              </Link>
              <Link
                to="/profile/settings"
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-center block"
              >
                Account Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⭐</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Ratings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRatings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageRating}/10
                  </p>
                </div>
              </div>
            </div>

            {stats.favoriteRegion && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🗺️</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Favorite Region</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.favoriteRegion}</p>
                  </div>
                </div>
              </div>
            )}

            {stats.highestRated && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🏆</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Highest Rated</p>
                    <p className="text-lg font-bold text-gray-900">{stats.highestRated.overall_score}/10</p>
                    <p className="text-xs text-gray-500">{stats.highestRated.whisky?.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {stats.recentActivity.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Ratings</h3>
                <Link
                  to="/ratings"
                  className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                {stats.recentActivity.map((rating) => (
                  <div key={rating.id} className="flex items-center space-x-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <WhiskyImage 
                      src={rating.whisky?.image_url}
                      alt={rating.whisky?.name}
                      className="w-12 h-12 rounded-md"
                      showLabel={false}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {rating.whisky?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {rating.whisky?.distillery} • {rating.whisky?.region}
                      </p>
                      {rating.review_text && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          "{rating.review_text.substring(0, 80)}..."
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {rating.overall_score}/10
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Ratings State */}
          {stats.totalRatings === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🥃</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Ratings Yet</h3>
              <p className="text-gray-600 mb-6">
                Start your whisky journey by rating your first whisky!
              </p>
              <Link
                to="/whiskies"
                className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
              >
                Browse Whiskies
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;