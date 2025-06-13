import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import WishlistButton from '../components/common/WishlistButton';
import ComparisonButton from '../components/common/ComparisonButton';

const WishlistPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { 
    wishlist, 
    loading, 
    pagination, 
    isEnabled, 
    loadWishlist,
    updateWishlistItem,
    wishlistCount 
  } = useWishlist();

  useEffect(() => {
    if (isAuthenticated && isEnabled) {
      loadWishlist();
    }
  }, [isAuthenticated, isEnabled, loadWishlist]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your wishlist.</p>
          <Link
            to="/login"
            className="bg-amber-600 text-white px-6 py-3 rounded-md hover:bg-amber-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Feature Unavailable</h2>
          <p className="text-gray-600">The wishlist feature is currently disabled.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="mt-2 text-gray-600">
            Whiskies you want to try ({wishlistCount} items)
          </p>
        </div>

        {/* Content */}
        {wishlist.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">
              Start adding whiskies you want to try to your wishlist.
            </p>
            <Link
              to="/whiskies"
              className="bg-amber-600 text-white px-6 py-3 rounded-md hover:bg-amber-700 transition-colors"
            >
              Browse Whiskies
            </Link>
          </div>
        ) : (
          <>
            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {wishlist.map((item) => (
                <WishlistCard key={item.id} item={item} onUpdate={updateWishlistItem} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => loadWishlist({ page: pagination.current_page - 1 })}
                    disabled={!pagination.has_prev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => loadWishlist({ page: pagination.current_page + 1 })}
                    disabled={!pagination.has_next}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const WishlistCard = ({ item, onUpdate }) => {
  const whisky = item.whisky;
  const priorityColors = {
    1: 'bg-gray-100 text-gray-800',
    2: 'bg-yellow-100 text-yellow-800',
    3: 'bg-red-100 text-red-800'
  };

  const priorityLabels = {
    1: 'Low',
    2: 'Medium',
    3: 'High'
  };

  const handlePriorityChange = (newPriority) => {
    onUpdate(item.id, { priority: parseInt(newPriority) });
  };

  const handleNotesChange = (newNotes) => {
    onUpdate(item.id, { notes: newNotes });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Whisky Image */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
        {whisky.image_url ? (
          <img
            src={whisky.image_url}
            alt={whisky.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-4xl">🥃</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            <Link 
              to={`/whiskies/${whisky.id}`}
              className="hover:text-amber-600 transition-colors"
            >
              {whisky.name}
            </Link>
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[item.priority]}`}>
            {priorityLabels[item.priority]} Priority
          </span>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p><strong>Distillery:</strong> {whisky.distillery || 'Not specified'}</p>
          <p><strong>Region:</strong> {whisky.region || 'Not specified'}</p>
          {whisky.age && <p><strong>Age:</strong> {whisky.age} years</p>}
          {whisky.abv && <p><strong>ABV:</strong> {whisky.abv}%</p>}
        </div>

        {/* Notes */}
        {item.notes && (
          <div className="mb-4">
            <p className="text-sm text-gray-700">{item.notes}</p>
          </div>
        )}

        {/* Added Date */}
        <div className="text-xs text-gray-500 mb-4">
          Added on {new Date(item.added_at).toLocaleDateString()}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <WishlistButton
            whisky={whisky}
            variant="icon"
            size="sm"
            showText={false}
            className="flex-shrink-0"
          />
          <ComparisonButton
            whisky={whisky}
            variant="icon"
            size="sm"
            showText={false}
            className="flex-shrink-0"
          />
          <Link
            to={`/whiskies/${whisky.id}`}
            className="flex-1 bg-amber-600 text-white text-center py-1 px-3 rounded text-sm hover:bg-amber-700 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;