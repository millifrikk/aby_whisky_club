import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { whiskyAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import WhiskyImage from '../components/common/WhiskyImage';
import toast from 'react-hot-toast';

const WhiskiesPage = () => {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [whiskies, setWhiskies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    region: searchParams.get('region') || '',
    type: searchParams.get('type') || '',
    min_age: searchParams.get('min_age') || '',
    max_age: searchParams.get('max_age') || '',
    available_only: searchParams.get('available_only') === 'true',
    sort_by: searchParams.get('sort_by') || 'name',
    sort_order: searchParams.get('sort_order') || 'ASC',
  });

  useEffect(() => {
    loadWhiskies();
  }, [searchParams]);

  const loadWhiskies = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(searchParams);
      const response = await whiskyAPI.getAll(params);
      setWhiskies(response.data.whiskies);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading whiskies:', error);
      toast.error('Failed to load whiskies');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const newParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newParams.set(k, v);
    });
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      region: '',
      type: '',
      min_age: '',
      max_age: '',
      available_only: false,
      sort_by: 'name',
      sort_order: 'ASC',
    });
    setSearchParams({});
  };

  const handleDeleteWhisky = async (whisky) => {
    if (!window.confirm(`Are you sure you want to delete "${whisky.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await whiskyAPI.delete(whisky.id);
      toast.success('Whisky deleted successfully');
      loadWhiskies(); // Reload the list
    } catch (error) {
      console.error('Error deleting whisky:', error);
      const message = error.response?.data?.message || 'Failed to delete whisky';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Whisky Collection</h1>
          <p className="text-gray-600">Browse our extensive collection of fine whiskies</p>
        </div>
        {isAdmin() && (
          <Link
            to="/admin/whiskies/new"
            className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors"
          >
            Add Whisky
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Name, distillery..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </label>
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">All Regions</option>
              <option value="Speyside">Speyside</option>
              <option value="Islay">Islay</option>
              <option value="Highlands">Highlands</option>
              <option value="Lowlands">Lowlands</option>
              <option value="Campbeltown">Campbeltown</option>
              <option value="Islands">Islands</option>
              <option value="Kentucky">Kentucky</option>
              <option value="Tennessee">Tennessee</option>
              <option value="Ireland">Ireland</option>
              <option value="Japan">Japan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">All Types</option>
              <option value="single_malt">Single Malt</option>
              <option value="blended_whisky">Blended Whisky</option>
              <option value="blended_malt">Blended Malt</option>
              <option value="grain_whisky">Grain Whisky</option>
              <option value="bourbon">Bourbon</option>
              <option value="rye">Rye</option>
              <option value="irish">Irish</option>
              <option value="japanese">Japanese</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Age
            </label>
            <input
              type="number"
              value={filters.min_age}
              onChange={(e) => handleFilterChange('min_age', e.target.value)}
              placeholder="0"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Age
            </label>
            <input
              type="number"
              value={filters.max_age}
              onChange={(e) => handleFilterChange('max_age', e.target.value)}
              placeholder="100"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={`${filters.sort_by}-${filters.sort_order}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split('-');
                handleFilterChange('sort_by', sort_by);
                handleFilterChange('sort_order', sort_order);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="name-ASC">Name (A-Z)</option>
              <option value="name-DESC">Name (Z-A)</option>
              <option value="distillery-ASC">Distillery (A-Z)</option>
              <option value="age-ASC">Age (Low-High)</option>
              <option value="age-DESC">Age (High-Low)</option>
              <option value="rating_average-DESC">Rating (High-Low)</option>
              <option value="created_at-DESC">Newest First</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.available_only}
              onChange={(e) => handleFilterChange('available_only', e.target.checked)}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="ml-2 text-sm text-gray-700">Available only</span>
          </label>

          <button
            onClick={clearFilters}
            className="text-sm text-amber-600 hover:text-amber-700"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      ) : (
        <>
          {/* Results count */}
          <div className="text-sm text-gray-600">
            {pagination.total_count} whisky{pagination.total_count !== 1 ? 'ies' : ''} found
          </div>

          {/* Whisky grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whiskies.map((whisky) => (
              <div key={whisky.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Whisky Image */}
                <WhiskyImage 
                  src={whisky.image_url}
                  alt={whisky.name}
                  className="h-48 w-full"
                  showLabel={false}
                />
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{whisky.name}</h3>
                    <div className="flex flex-col items-end space-y-1">
                      {!whisky.is_available && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Unavailable
                        </span>
                      )}
                      {whisky.is_featured && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{whisky.distillery}</p>
                  
                  <div className="text-sm text-gray-500 mb-4">
                    {whisky.region && `${whisky.region} • `}
                    {whisky.age ? `${whisky.age} years` : 'NAS'} • {whisky.abv}% ABV
                  </div>

                  {whisky.rating_average > 0 && (
                    <div className="flex items-center mb-4">
                      <span className="text-amber-500">★</span>
                      <span className="ml-1 text-sm font-medium">{whisky.rating_average}/10</span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({whisky.rating_count} rating{whisky.rating_count !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}

                  {whisky.description && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                      {whisky.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center">
                    <Link
                      to={`/whiskies/${whisky.id}`}
                      className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                    
                    <div className="flex items-center space-x-2">
                      {whisky.current_price && (
                        <span className="text-sm font-medium text-gray-900">
                          ${whisky.current_price}
                        </span>
                      )}
                      
                      {isAdmin() && (
                        <div className="flex space-x-1">
                          <Link
                            to={`/admin/whiskies/${whisky.id}/edit`}
                            className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded hover:bg-amber-200 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteWhisky(whisky)}
                            className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={!pagination.has_prev}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={!pagination.has_next}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}

          {whiskies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No whiskies found matching your criteria.</p>
              <button
                onClick={clearFilters}
                className="mt-2 text-amber-600 hover:text-amber-700"
              >
                Clear filters to see all whiskies
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WhiskiesPage;
