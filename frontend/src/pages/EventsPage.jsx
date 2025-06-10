import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsEventAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const EventsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    search: '',
    upcoming_only: false,
    featured_only: false
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0
  });

  useEffect(() => {
    // Debounce search to prevent reload on every keystroke
    const timeoutId = setTimeout(() => {
      loadItems();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 12,
        ...filters,
        type: filters.type === 'all' ? undefined : filters.type
      };
      
      const response = await newsEventAPI.getAll(params);
      
      // Backend returns 'news_events' with underscore
      const newsEvents = response.data.news_events || [];
      
      setItems(newsEvents);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getItemIcon = (type) => {
    const icons = {
      'event': '🎉',
      'tasting': '🥃',
      'meeting': '👥',
      'news': '📰',
      'announcement': '📢'
    };
    return icons[type] || '📅';
  };

  const getItemTypeLabel = (type) => {
    const labels = {
      'event': 'Event',
      'tasting': 'Tasting',
      'meeting': 'Meeting',
      'news': 'News',
      'announcement': 'Announcement'
    };
    return labels[type] || 'Event';
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    };
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  const getStatusBadge = (item) => {
    if (item.type === 'news' || item.type === 'announcement') {
      return item.is_featured ? (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
          Featured
        </span>
      ) : null;
    }

    if (item.event_date) {
      const upcoming = isUpcoming(item.event_date);
      if (upcoming) {
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Upcoming
          </span>
        );
      } else {
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Past
          </span>
        );
      }
    }

    return null;
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Events & News</h1>
        <p className="text-gray-600 mt-2">Stay updated with club activities, tastings, and announcements</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search events and news..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">All Types</option>
              <option value="event">Events</option>
              <option value="tasting">Tastings</option>
              <option value="meeting">Meetings</option>
              <option value="news">News</option>
              <option value="announcement">Announcements</option>
            </select>
          </div>

          {/* Toggle Filters */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.upcoming_only}
                onChange={(e) => handleFilterChange('upcoming_only', e.target.checked)}
                className="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Upcoming only</span>
            </label>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.featured_only}
                onChange={(e) => handleFilterChange('featured_only', e.target.checked)}
                className="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Featured only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          {pagination.total_count} {pagination.total_count === 1 ? 'item' : 'items'} found
        </p>
      </div>

      {/* Events Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-48 w-full object-cover"
                />
              )}
              
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{getItemIcon(item.type)}</span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {getItemTypeLabel(item.type)}
                    </span>
                  </div>
                  {getStatusBadge(item)}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                  {item.title}
                </h3>

                {/* Event Date */}
                {item.event_date && (
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <span className="mr-2">📅</span>
                    <div>
                      <div>{formatEventDate(item.event_date).date}</div>
                      <div className="text-xs">{formatEventDate(item.event_date).time}</div>
                    </div>
                  </div>
                )}

                {/* Location */}
                {item.location && (
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <span className="mr-2">📍</span>
                    <span>{item.location}</span>
                  </div>
                )}

                {/* Content Preview */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {item.content.length > 150 
                    ? `${item.content.substring(0, 150)}...`
                    : item.content
                  }
                </p>

                {/* Event Info */}
                {item.type !== 'news' && item.type !== 'announcement' && (
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    {item.price && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        ${item.price}
                      </span>
                    )}
                    {item.capacity && (
                      <span>
                        {item.current_attendees || 0}/{item.capacity} attending
                      </span>
                    )}
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{item.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Action */}
                <Link
                  to={`/events/${item.id}`}
                  className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium text-sm"
                >
                  {item.type === 'news' || item.type === 'announcement' ? 'Read More' : 'View Details'}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 mb-6">
            {filters.search || filters.type !== 'all' || filters.upcoming_only || filters.featured_only
              ? 'Try adjusting your filters to see more results.'
              : 'No events or news have been posted yet.'
            }
          </p>
          {filters.search || filters.type !== 'all' || filters.upcoming_only || filters.featured_only ? (
            <button
              onClick={() => setFilters({
                type: 'all',
                search: '',
                upcoming_only: false,
                featured_only: false
              })}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      )}

      {/* Add Event Button for Admins */}
      {isAuthenticated && user?.role === 'admin' && (
        <div className="fixed bottom-6 right-6">
          <Link
            to="/admin/events/new"
            className="bg-amber-600 text-white p-4 rounded-full shadow-lg hover:bg-amber-700 transition-colors"
            title="Create New Event"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
};

export default EventsPage;