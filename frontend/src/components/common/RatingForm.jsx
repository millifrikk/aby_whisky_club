import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ratingAPI } from '../../services/api';
import useContentSettings from '../../hooks/useContentSettings';
import toast from 'react-hot-toast';

const RatingForm = ({ whisky, userRating, onRatingSubmitted, onCancel }) => {
  const { user } = useAuth();
  const { maxRatingScale, tastingNotesRequired } = useContentSettings();
  const [formData, setFormData] = useState({
    whisky_id: whisky.id,
    overall_score: userRating?.overall_score || '',
    appearance_score: userRating?.appearance_score || '',
    nose_score: userRating?.nose_score || '',
    palate_score: userRating?.palate_score || '',
    finish_score: userRating?.finish_score || '',
    review_text: userRating?.review_text || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScoreChange = (field, value) => {
    const numValue = value === '' ? '' : Math.min(maxRatingScale, Math.max(0, parseFloat(value)));
    setFormData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.overall_score) {
      toast.error('Overall score is required');
      return;
    }

    if (formData.overall_score < 0 || formData.overall_score > maxRatingScale) {
      toast.error(`Overall score must be between 0 and ${maxRatingScale}`);
      return;
    }

    if (tastingNotesRequired && (!formData.review_text || formData.review_text.trim().length === 0)) {
      toast.error('Tasting notes are required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submitData = {
        ...formData,
        overall_score: parseFloat(formData.overall_score),
        appearance_score: formData.appearance_score ? parseFloat(formData.appearance_score) : null,
        nose_score: formData.nose_score ? parseFloat(formData.nose_score) : null,
        palate_score: formData.palate_score ? parseFloat(formData.palate_score) : null,
        finish_score: formData.finish_score ? parseFloat(formData.finish_score) : null,
      };

      await ratingAPI.create(submitData);
      
      toast.success(userRating ? 'Rating updated successfully' : 'Rating submitted successfully');
      onRatingSubmitted();
      
    } catch (error) {
      console.error('Error submitting rating:', error);
      const message = error.response?.data?.message || 'Failed to submit rating';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ScoreInput = ({ label, field, description }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {field === 'overall_score' && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      <div className="relative">
        <input
          type="number"
          min="0"
          max={maxRatingScale}
          step="0.1"
          value={formData[field]}
          onChange={(e) => handleScoreChange(field, e.target.value)}
          className="block w-full px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder={`0-${maxRatingScale}`}
          required={field === 'overall_score'}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-gray-500 text-sm">/{maxRatingScale}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">
          {userRating ? 'Update Your Rating' : 'Rate This Whisky'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Score */}
        <div className="border-b border-gray-200 pb-4">
          <ScoreInput
            label="Overall Score"
            field="overall_score"
            description="Your overall impression of this whisky (required)"
          />
        </div>

        {/* Detailed Scores */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Detailed Scoring (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScoreInput
              label="Appearance"
              field="appearance_score"
              description="Color, clarity, viscosity"
            />
            <ScoreInput
              label="Nose"
              field="nose_score"
              description="Aroma, complexity, balance"
            />
            <ScoreInput
              label="Palate"
              field="palate_score"
              description="Flavor, mouthfeel, complexity"
            />
            <ScoreInput
              label="Finish"
              field="finish_score"
              description="Length, aftertaste, warmth"
            />
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tasting Notes {tastingNotesRequired && <span className="text-red-500 ml-1">*</span>}
            {!tastingNotesRequired && <span className="text-gray-500">(Optional)</span>}
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {tastingNotesRequired 
              ? 'Please describe your tasting experience (required)' 
              : 'Share your thoughts about this whisky'
            }
          </p>
          <textarea
            value={formData.review_text}
            onChange={(e) => setFormData(prev => ({ ...prev, review_text: e.target.value }))}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            placeholder="Describe the flavors, aromas, and your overall experience..."
            required={tastingNotesRequired}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              userRating ? 'Update Rating' : 'Submit Rating'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Rating Guidelines */}
      <div className="mt-6 p-4 bg-amber-50 rounded-md">
        <h5 className="text-sm font-medium text-amber-800 mb-2">Rating Guidelines</h5>
        <div className="text-xs text-amber-700 space-y-1">
          <div><strong>{Math.round(maxRatingScale * 0.9)}-{maxRatingScale}:</strong> Exceptional, world-class whisky</div>
          <div><strong>{Math.round(maxRatingScale * 0.7)}-{Math.round(maxRatingScale * 0.8)}:</strong> Very good, would recommend</div>
          <div><strong>{Math.round(maxRatingScale * 0.5)}-{Math.round(maxRatingScale * 0.6)}:</strong> Average, decent whisky</div>
          <div><strong>{Math.round(maxRatingScale * 0.3)}-{Math.round(maxRatingScale * 0.4)}:</strong> Below average, has issues</div>
          <div><strong>{Math.round(maxRatingScale * 0.1)}-{Math.round(maxRatingScale * 0.2)}:</strong> Poor, not recommended</div>
        </div>
      </div>
    </div>
  );
};

export default RatingForm;