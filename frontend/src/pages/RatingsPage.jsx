import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ratingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const RatingsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [userRatings, setUserRatings] = useState([]);
  const [topWhiskies, setTopWhiskies] = useState([]);
  const [recentRatings, setRecentRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-ratings');

  useEffect(() => {
    loadRatingsData();
  }, [user]);

  const loadRatingsData = async () => {
    try {
      setLoading(true);
      
      const promises = [
        ratingAPI.getTopWhiskies({ limit: 10 }),
        ratingAPI.getRecent({ limit: 10 })
      ];

      if (user) {
        promises.push(ratingAPI.getUserRatings(user.id, { limit: 20 }));
      }

      const results = await Promise.all(promises);
      
      setTopWhiskies(results[0].data.whiskies || []);
      setRecentRatings(results[1].data.ratings || []);
      
      if (user && results[2]) {
        setUserRatings(results[2].data.ratings || []);
      }
      
    } catch (error) {
      console.error('Error loading ratings:', error);
      toast.error('Failed to load ratings data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRating = async (ratingId) => {
    if (!window.confirm('Are you sure you want to delete this rating?')) {
      return;
    }

    try {
      await ratingAPI.delete(ratingId);
      toast.success('Rating deleted successfully');
      loadRatingsData(); // Reload data
    } catch (error) {
      console.error('Error deleting rating:', error);
      const message = error.response?.data?.message || 'Failed to delete rating';
      toast.error(message);
    }
  };

  const RatingCard = ({ rating, showWhiskyName = false, showDeleteButton = false }) => (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          {showWhiskyName && (
            <Link 
              to={`/whiskies/${rating.whisky_id}`}
              className="text-lg font-semibold text-amber-600 hover:text-amber-700"
            >
              {rating.whisky?.name || 'Unknown Whisky'}
            </Link>
          )}
          {!showWhiskyName && rating.user && (
            <div className="text-lg font-semibold">
              {rating.user.first_name || rating.user.username}
            </div>
          )}
          <div className="text-sm text-gray-500">
            {new Date(rating.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xl font-bold text-amber-600">
            {rating.overall_score}/10
          </div>
          {showDeleteButton && (
            <button
              onClick={() => handleDeleteRating(rating.id)}
              className="text-red-600 hover:text-red-700 p-1"
              title="Delete rating"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {rating.review_text && (
        <p className="text-gray-700 mb-3 text-sm">{rating.review_text}</p>
      )}

      {(rating.appearance_score || rating.nose_score || rating.palate_score || rating.finish_score) && (
        <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
          {rating.appearance_score && (
            <div>Appearance: {rating.appearance_score}/10</div>
          )}
          {rating.nose_score && (
            <div>Nose: {rating.nose_score}/10</div>
          )}
          {rating.palate_score && (
            <div>Palate: {rating.palate_score}/10</div>
          )}
          {rating.finish_score && (
            <div>Finish: {rating.finish_score}/10</div>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Ratings & Reviews</h1>
        <p className="text-gray-600 mt-2">
          Discover community ratings and manage your whisky reviews
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('my-ratings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-ratings'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Ratings ({userRatings.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('top-whiskies')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'top-whiskies'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Top Rated Whiskies
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recent'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recent Reviews
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {/* My Ratings Tab */}
        {activeTab === 'my-ratings' && (
          <div>
            {!isAuthenticated ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to see your ratings</h3>
                <p className="text-gray-600 mb-4">
                  Track your whisky ratings and reviews by signing in to your account.
                </p>
                <Link
                  to="/login"
                  className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : userRatings.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Your Ratings</h2>
                  <div className="text-sm text-gray-500">
                    {userRatings.length} rating{userRatings.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="grid gap-4">
                  {userRatings.map((rating) => (
                    <RatingCard 
                      key={rating.id} 
                      rating={rating} 
                      showWhiskyName={true}
                      showDeleteButton={true}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No ratings yet</h3>
                <p className="text-gray-600 mb-4">
                  Start exploring whiskies and share your ratings with the community.
                </p>
                <Link
                  to="/whiskies"
                  className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors"
                >
                  Browse Whiskies
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Top Whiskies Tab */}
        {activeTab === 'top-whiskies' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Top Rated Whiskies</h2>
            {topWhiskies.length > 0 ? (
              <div className="grid gap-4">
                {topWhiskies.map((whisky, index) => (
                  <div key={whisky.id} className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-amber-600">
                          #{index + 1}
                        </div>
                        <div>
                          <Link 
                            to={`/whiskies/${whisky.id}`}
                            className="text-lg font-semibold text-amber-600 hover:text-amber-700"
                          >
                            {whisky.name}
                          </Link>
                          <div className="text-sm text-gray-500">
                            {whisky.distillery}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-amber-600">
                          {whisky.average_rating}/10
                        </div>
                        <div className="text-sm text-gray-500">
                          {whisky.rating_count} rating{whisky.rating_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No rated whiskies found.</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Reviews Tab */}
        {activeTab === 'recent' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Recent Community Reviews</h2>
            {recentRatings.length > 0 ? (
              <div className="grid gap-4">
                {recentRatings.map((rating) => (
                  <div key={rating.id} className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link 
                          to={`/whiskies/${rating.whisky_id}`}
                          className="text-lg font-semibold text-amber-600 hover:text-amber-700"
                        >
                          {rating.whisky?.name || 'Unknown Whisky'}
                        </Link>
                        <div className="text-sm text-gray-500">
                          by {rating.user?.first_name || rating.user?.username} • {new Date(rating.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xl font-bold text-amber-600">
                        {rating.overall_score}/10
                      </div>
                    </div>
                    
                    {rating.review_text && (
                      <p className="text-gray-700 text-sm">{rating.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No recent ratings found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingsPage;