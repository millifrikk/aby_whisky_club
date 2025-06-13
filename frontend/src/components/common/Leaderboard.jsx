import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { leaderboardAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';
import useAnalyticsSettings from '../../hooks/useAnalyticsSettings';
import useUserManagement from '../../hooks/useUserManagement';
import toast from 'react-hot-toast';

const Leaderboard = ({ showWhiskies = true, showRaters = true, limit = 5 }) => {
  const { t } = useTranslation();
  const { leaderboardEnabled } = useAnalyticsSettings();
  const { allowPublicProfiles } = useUserManagement();
  const [topRaters, setTopRaters] = useState([]);
  const [topWhiskies, setTopWhiskies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (leaderboardEnabled) {
      loadLeaderboards();
    } else {
      setLoading(false);
    }
  }, [leaderboardEnabled]);

  const loadLeaderboards = async () => {
    try {
      setLoading(true);
      
      const promises = [];
      if (showRaters) {
        promises.push(leaderboardAPI.getTopRaters({ limit }));
      }
      if (showWhiskies) {
        promises.push(leaderboardAPI.getTopWhiskies({ limit }));
      }

      const results = await Promise.allSettled(promises);
      
      let resultIndex = 0;
      if (showRaters) {
        if (results[resultIndex].status === 'fulfilled') {
          setTopRaters(results[resultIndex].value.data.leaderboard || []);
        } else {
          console.error('Failed to load top raters:', results[resultIndex].reason);
        }
        resultIndex++;
      }
      
      if (showWhiskies) {
        if (results[resultIndex].status === 'fulfilled') {
          setTopWhiskies(results[resultIndex].value.data.leaderboard || []);
        } else {
          console.error('Failed to load top whiskies:', results[resultIndex].reason);
        }
      }

    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (user) => {
    if (!user) return 'Member';
    
    if (allowPublicProfiles) {
      return user.display_name || user.first_name || user.username || 'Member';
    }
    
    return 'Member'; // Hide username when public profiles disabled
  };

  if (!leaderboardEnabled) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showRaters && topRaters.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              🏆 Top Raters
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {topRaters.slice(0, limit).map((entry, index) => (
                <div key={entry.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {entry.rank}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {getDisplayName(entry.user)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.stats.rating_count} rating{entry.stats.rating_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-amber-600">
                      ★ {entry.stats.average_rating}
                    </div>
                    <div className="text-xs text-gray-500">
                      avg rating
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {topRaters.length > limit && (
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500">
                  And {topRaters.length - limit} more active raters...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {showWhiskies && topWhiskies.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              🥃 Top Rated Whiskies
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {topWhiskies.slice(0, limit).map((entry, index) => (
                <div key={entry.whisky.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="flex-1">
                      <Link 
                        to={`/whiskies/${entry.whisky.id}`}
                        className="font-medium text-gray-900 hover:text-amber-600 transition-colors"
                      >
                        {entry.whisky.name}
                      </Link>
                      <div className="text-sm text-gray-500">
                        {entry.whisky.distillery}
                        {entry.whisky.region && ` • ${entry.whisky.region}`}
                        {entry.whisky.age && ` • ${entry.whisky.age} years`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-purple-600">
                      ★ {entry.stats.rating_average}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.stats.rating_count} rating{entry.stats.rating_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {topWhiskies.length > limit && (
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500">
                  And {topWhiskies.length - limit} more top-rated whiskies...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {(!showRaters || topRaters.length === 0) && (!showWhiskies || topWhiskies.length === 0) && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>No leaderboard data available yet.</p>
            <p className="text-sm mt-1">Start rating whiskies to see the community leaders!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;