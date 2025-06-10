import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { whiskyAPI, ratingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import RatingForm from '../components/common/RatingForm';

const WhiskyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [whisky, setWhisky] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [ratingStats, setRatingStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);

  useEffect(() => {
    loadWhiskyData();
  }, [id]);

  const loadWhiskyData = async () => {
    try {
      setLoading(true);
      const [whiskyRes, ratingsRes] = await Promise.all([
        whiskyAPI.getById(id),
        ratingAPI.getWhiskyRatings(id, { limit: 10 }),
      ]);

      const whiskyData = whiskyRes.data.whisky;
      const ratingsData = ratingsRes.data;

      setWhisky(whiskyData);
      setRatings(ratingsData.ratings || []);
      setRatingStats(ratingsData.statistics || {});

      // Find user's rating if authenticated
      if (user) {
        const userRating = ratingsData.ratings?.find(r => r.user_id === user.id);
        setUserRating(userRating);
      }
    } catch (error) {
      console.error('Error loading whisky:', error);
      toast.error('Failed to load whisky details');
      navigate('/whiskies');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWhisky = async () => {
    if (!window.confirm(`Are you sure you want to delete "${whisky.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await whiskyAPI.delete(id);
      toast.success('Whisky deleted successfully');
      navigate('/whiskies');
    } catch (error) {
      console.error('Error deleting whisky:', error);
      const message = error.response?.data?.message || 'Failed to delete whisky';
      toast.error(message);
    }
  };

  const handleRatingSubmitted = () => {
    setShowRatingForm(false);
    loadWhiskyData(); // Reload data to show updated rating
  };

  const handleShowRatingForm = () => {
    setShowRatingForm(true);
  };

  const handleCancelRating = () => {
    setShowRatingForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!whisky) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Whisky Not Found</h2>
        <p className="text-gray-600 mb-4">The whisky you're looking for doesn't exist.</p>
        <Link to="/whiskies" className="text-amber-600 hover:text-amber-700">
          ← Back to Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link to="/whiskies" className="text-amber-600 hover:text-amber-700">
          Whisky Collection
        </Link>
        <span className="mx-2">›</span>
        <span>{whisky.name}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">{whisky.name}</h1>
            {!whisky.is_available && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                Unavailable
              </span>
            )}
            {whisky.is_featured && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                Featured
              </span>
            )}
          </div>
          <p className="text-xl text-gray-600">{whisky.distillery}</p>
          <div className="text-gray-500 mt-2">
            {whisky.region && `${whisky.region}, `}
            {whisky.country}
          </div>
        </div>

        {isAdmin() && (
          <div className="flex space-x-2">
            <Link
              to={`/admin/whiskies/${whisky.id}/edit`}
              className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDeleteWhisky}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Age</div>
                <div className="font-medium">{whisky.age ? `${whisky.age} years` : 'NAS'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">ABV</div>
                <div className="font-medium">{whisky.abv}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Type</div>
                <div className="font-medium capitalize">{whisky.type.replace('_', ' ')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Size</div>
                <div className="font-medium">{whisky.bottle_size}ml</div>
              </div>
            </div>

            {whisky.cask_type && (
              <div className="mt-4">
                <div className="text-sm text-gray-500">Cask Type</div>
                <div className="font-medium">{whisky.cask_type}</div>
              </div>
            )}

            {whisky.description && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{whisky.description}</p>
              </div>
            )}
          </div>

          {/* Tasting Notes */}
          {whisky.tasting_notes && Object.values(whisky.tasting_notes).some(note => note) && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Tasting Notes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {whisky.tasting_notes.color && (
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-1">Color</h3>
                    <p className="text-gray-700">{whisky.tasting_notes.color}</p>
                  </div>
                )}
                {whisky.tasting_notes.nose && (
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-1">Nose</h3>
                    <p className="text-gray-700">{whisky.tasting_notes.nose}</p>
                  </div>
                )}
                {whisky.tasting_notes.palate && (
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-1">Palate</h3>
                    <p className="text-gray-700">{whisky.tasting_notes.palate}</p>
                  </div>
                )}
                {whisky.tasting_notes.finish && (
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-1">Finish</h3>
                    <p className="text-gray-700">{whisky.tasting_notes.finish}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rating Form */}
          {showRatingForm && (
            <RatingForm
              whisky={whisky}
              userRating={userRating}
              onRatingSubmitted={handleRatingSubmitted}
              onCancel={handleCancelRating}
            />
          )}

          {/* User Ratings */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Member Ratings</h2>
              {isAuthenticated && !showRatingForm && (
                <button
                  onClick={handleShowRatingForm}
                  className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors text-sm"
                >
                  {userRating ? 'Update Rating' : 'Rate This Whisky'}
                </button>
              )}
            </div>

            {ratings.length > 0 ? (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">
                          {rating.user?.first_name || rating.user?.username}
                          {rating.user_id === user?.id && (
                            <span className="text-xs text-amber-600 ml-2">(Your Rating)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-amber-600">
                        {rating.overall_score}/10
                      </div>
                    </div>
                    
                    {rating.review_text && (
                      <p className="text-gray-700 mb-2">{rating.review_text}</p>
                    )}
                    
                    {rating.appearance_score && (
                      <div className="text-sm text-gray-600">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No ratings yet. Be the first to rate this whisky!</p>
                {isAuthenticated && !showRatingForm && (
                  <button
                    onClick={handleShowRatingForm}
                    className="text-amber-600 hover:text-amber-700 mt-2 inline-block"
                  >
                    Add Your Rating →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rating Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Rating Summary</h3>
            
            {ratingStats.total_ratings > 0 ? (
              <>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-amber-600">
                    {ratingStats.average_rating}/10
                  </div>
                  <div className="text-sm text-gray-500">
                    Based on {ratingStats.total_ratings} rating{ratingStats.total_ratings !== 1 ? 's' : ''}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-2xl mb-2">⭐</div>
                <p>No ratings yet</p>
              </div>
            )}
          </div>

          {/* Inventory Info */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Inventory</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{whisky.quantity}</span>
              </div>
              
              {whisky.purchase_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Acquired:</span>
                  <span className="font-medium">
                    {new Date(whisky.purchase_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {whisky.purchase_price && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Purchase Price:</span>
                  <span className="font-medium">${whisky.purchase_price}</span>
                </div>
              )}
              
              {whisky.current_price && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Value:</span>
                  <span className="font-medium">${whisky.current_price}</span>
                </div>
              )}
              
              {whisky.purchase_price && whisky.current_price && (
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Value Change:</span>
                  <span className={`font-medium ${
                    whisky.current_price >= whisky.purchase_price 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {whisky.current_price >= whisky.purchase_price ? '+' : ''}
                    ${(whisky.current_price - whisky.purchase_price).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            
            <div className="space-y-2">
              {isAuthenticated && !showRatingForm && (
                <button
                  onClick={handleShowRatingForm}
                  className="block w-full bg-amber-600 text-white text-center py-2 rounded-md hover:bg-amber-700 transition-colors"
                >
                  {userRating ? 'Update Rating' : 'Rate This Whisky'}
                </button>
              )}
              
              <Link
                to="/whiskies"
                className="block w-full border border-gray-300 text-gray-700 text-center py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back to Collection
              </Link>
              
              {isAdmin() && (
                <>
                  <Link
                    to={`/admin/whiskies/${whisky.id}/edit`}
                    className="block w-full bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit Whisky
                  </Link>
                  <button
                    onClick={handleDeleteWhisky}
                    className="block w-full bg-red-600 text-white text-center py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete Whisky
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiskyDetailPage;