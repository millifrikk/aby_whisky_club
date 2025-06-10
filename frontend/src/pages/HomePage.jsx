import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { whiskyAPI, newsEventAPI, ratingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import WhiskyStatsCharts from '../components/charts/WhiskyStatsCharts';
import WhiskyImage from '../components/common/WhiskyImage';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [featuredWhiskies, setFeaturedWhiskies] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentRatings, setRecentRatings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      // Load data with individual error handling
      const results = await Promise.allSettled([
        whiskyAPI.getFeatured(),
        newsEventAPI.getUpcoming({ limit: 3 }),
        ratingAPI.getRecent({ limit: 5 }),
        whiskyAPI.getStats(),
      ]);

      // Handle featured whiskies
      if (results[0].status === 'fulfilled') {
        setFeaturedWhiskies(results[0].value.data.whiskies || []);
      } else {
        console.error('Failed to load featured whiskies:', results[0].reason);
        toast.error('Failed to load featured whiskies');
      }

      // Handle upcoming events
      if (results[1].status === 'fulfilled') {
        setUpcomingEvents(results[1].value.data.events || []);
      } else {
        console.error('Failed to load events:', results[1].reason);
        // Don't show error for events - they're optional
      }

      // Handle recent ratings
      if (results[2].status === 'fulfilled') {
        setRecentRatings(results[2].value.data.ratings || []);
      } else {
        console.error('Failed to load ratings:', results[2].reason);
        // Don't show error for ratings - they're optional
      }

      // Handle stats
      if (results[3].status === 'fulfilled') {
        setStats(results[3].value.data || {});
      } else {
        console.error('Failed to load stats:', results[3].reason);
        // Don't show error for stats - they're optional
      }

    } catch (error) {
      console.error('Error loading home data:', error);
      toast.error('Failed to load page content');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden mb-12"
           style={{
             backgroundImage: 'url(/images/aby_whisky_club_header01.png)',
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundRepeat: 'no-repeat'
           }}>
        <div className="absolute inset-0 bg-gradient-to-r from-amber-800/70 to-amber-900/70"></div>
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative px-8 py-16 text-center text-white">
          <div className="text-6xl mb-4">🥃</div>
          <h1 className="text-5xl font-bold mb-4">
            Welcome to Åby Whisky Club
          </h1>
          <p className="text-xl text-amber-100 mb-8">
            Your gateway to exceptional whisky experiences
          </p>
          
          {!isAuthenticated && (
            <div className="space-x-4">
              <Link
                to="/login"
                className="bg-white text-amber-800 px-6 py-3 rounded-md hover:bg-amber-50 transition-colors font-semibold"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="border-2 border-white text-white px-6 py-3 rounded-md hover:bg-white hover:text-amber-800 transition-colors font-semibold"
              >
                Join the Club
              </Link>
            </div>
          )}
          
          {isAuthenticated && (
            <div className="bg-white bg-opacity-20 p-4 rounded-lg border border-white border-opacity-30">
              <p className="text-white">
                Welcome back, <span className="font-semibold">{user?.first_name || user?.username}</span>!
              </p>
            </div>
          )}
        </div>
      </div>


      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-lg shadow-lg text-center text-white transform hover:scale-105 transition-transform">
          <div className="text-4xl mb-2">🥃</div>
          <div className="text-3xl font-bold">{stats.total_whiskies || 0}</div>
          <div className="text-amber-100">Total Whiskies</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-center text-white transform hover:scale-105 transition-transform">
          <div className="text-4xl mb-2">🏭</div>
          <div className="text-3xl font-bold">{stats.total_distilleries || 0}</div>
          <div className="text-blue-100">Distilleries</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-center text-white transform hover:scale-105 transition-transform">
          <div className="text-4xl mb-2">⏰</div>
          <div className="text-3xl font-bold">{stats.average_age || 'N/A'}</div>
          <div className="text-green-100">Avg Age (Years)</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-center text-white transform hover:scale-105 transition-transform">
          <div className="text-4xl mb-2">💪</div>
          <div className="text-3xl font-bold">{stats.average_abv || 'N/A'}%</div>
          <div className="text-purple-100">Avg ABV</div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-t-4 border-amber-500">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <div className="text-3xl">📋</div>
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Inventory Management</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Track our extensive whisky collection with detailed information and ratings.
          </p>
          <Link to="/whiskies" className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium transition-colors">
            Browse Collection 
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-t-4 border-yellow-500">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <div className="text-3xl">⭐</div>
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Rating System</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Share your tasting notes and discover what fellow members recommend.
          </p>
          <Link to="/ratings" className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium transition-colors">
            View Ratings 
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-t-4 border-blue-500">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <div className="text-3xl">🗓️</div>
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Events & News</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Stay updated with club events, tastings, and announcements.
          </p>
          <Link to="/events" className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium transition-colors">
            See Events 
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Analytics Charts */}
      <WhiskyStatsCharts />

      {/* Featured Whiskies */}
      {featuredWhiskies.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Whiskies</h2>
            <Link to="/whiskies" className="text-amber-600 hover:text-amber-700">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredWhiskies.slice(0, 3).map((whisky) => (
              <div key={whisky.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <WhiskyImage 
                  src={whisky.image_url}
                  alt={whisky.name}
                  className="h-40 w-full"
                  showLabel={false}
                />
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{whisky.name}</h3>
                  <p className="text-gray-600 mb-2">{whisky.distillery}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {whisky.region} • {whisky.age ? `${whisky.age} years` : 'NAS'} • {whisky.abv}% ABV
                  </p>
                  {whisky.rating_average > 0 && (
                    <div className="flex items-center mb-4">
                      <span className="text-amber-500">★</span>
                      <span className="ml-1 text-sm">{whisky.rating_average}/10</span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({whisky.rating_count} rating{whisky.rating_count !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                  <Link
                    to={`/whiskies/${whisky.id}`}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
            <Link to="/events" className="text-amber-600 hover:text-amber-700">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-2">{event.content.substring(0, 150)}...</p>
                    <div className="text-sm text-gray-500">
                      📅 {new Date(event.event_date).toLocaleDateString()} at{' '}
                      {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {event.location && ` • 📍 ${event.location}`}
                    </div>
                  </div>
                  <Link
                    to={`/events/${event.id}`}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium whitespace-nowrap"
                  >
                    Learn More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Ratings */}
      {recentRatings.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Ratings</h2>
            <Link to="/ratings" className="text-amber-600 hover:text-amber-700">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {recentRatings.map((rating) => (
              <div key={rating.id} className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{rating.whisky?.name}</h4>
                    <p className="text-sm text-gray-600">
                      by {rating.user?.first_name || rating.user?.username}
                    </p>
                    {rating.review_text && (
                      <p className="text-sm text-gray-700 mt-2">
                        "{rating.review_text.substring(0, 100)}..."
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-amber-600">
                      {rating.overall_score}/10
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
