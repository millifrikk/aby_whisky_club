import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ContentModerationPage = () => {
  const { isAdmin } = useAuth();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    content_type: 'all',
    status: 'all'
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0
  });

  useEffect(() => {
    if (!isAdmin()) return;
    loadContent();
  }, [filters, isAdmin]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 20,
        ...filters
      };
      
      const response = await adminAPI.getContentForModeration(params);
      setContent(response.data.content);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
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

  const handleModerateContent = async (contentType, contentId, action, reason = '') => {
    try {
      await adminAPI.moderateContent(contentType, contentId, { action, reason });
      toast.success(`Content ${action}d successfully`);
      loadContent(); // Reload content
    } catch (error) {
      console.error('Error moderating content:', error);
      toast.error('Failed to moderate content');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'rating':
        return '⭐';
      case 'news_event':
        return '📰';
      default:
        return '📄';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
        <p className="text-gray-600 mt-2">Review and moderate user-generated content</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Content Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
            <select
              value={filters.content_type}
              onChange={(e) => handleFilterChange('content_type', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">All Content</option>
              <option value="ratings">Ratings & Reviews</option>
              <option value="events">News & Events</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div>
        <p className="text-sm text-gray-600">
          {pagination.total_count} {pagination.total_count === 1 ? 'item' : 'items'} found
        </p>
      </div>

      {/* Content List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {content.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {content.map((item) => (
              <div key={`${item.type}-${item.id}`} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">{getContentTypeIcon(item.type)}</span>
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                            {item.type === 'rating' ? 'Rating' : 'News/Event'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(item.status)}`}>
                            {item.status}
                          </span>
                          {item.score && (
                            <span className="text-sm text-amber-600 font-medium">
                              {item.score}/10
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          by {item.author?.first_name || item.author?.username} • {formatDate(item.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Title for events */}
                    {item.title && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                    )}

                    {/* Related item for ratings */}
                    {item.related_item && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Whisky:</span> {item.related_item.name} 
                        <span className="text-gray-400"> • {item.related_item.distillery}</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="text-gray-700 bg-gray-50 p-3 rounded-md mb-4">
                      {item.content}
                    </div>

                    {/* Event type for news/events */}
                    {item.event_type && (
                      <div className="text-sm text-gray-500 mb-3">
                        <span className="font-medium">Type:</span> {item.event_type}
                      </div>
                    )}
                  </div>

                  {/* Moderation Actions */}
                  <div className="ml-6 flex flex-col space-y-2">
                    {item.type === 'news_event' && (
                      <>
                        {item.status !== 'published' && (
                          <button
                            onClick={() => handleModerateContent(item.type, item.id, 'approve')}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Publish
                          </button>
                        )}
                        {item.status === 'published' && (
                          <button
                            onClick={() => handleModerateContent(item.type, item.id, 'reject')}
                            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                          >
                            Unpublish
                          </button>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={() => handleModerateContent(item.type, item.id, 'flag')}
                      className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                    >
                      Flag
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
                          handleModerateContent(item.type, item.id, 'delete');
                        }
                      }}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-600">
              {filters.content_type !== 'all' || filters.status !== 'all'
                ? 'Try adjusting your filters to see more content.'
                : 'No content available for moderation.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.current_page} of {pagination.total_pages}
          </div>
          <div className="flex space-x-2">
            <button
              disabled={!pagination.has_prev}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={!pagination.has_next}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentModerationPage;