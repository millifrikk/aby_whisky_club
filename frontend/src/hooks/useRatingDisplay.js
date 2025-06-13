import useContentSettings from './useContentSettings';

export const useRatingDisplay = () => {
  const { maxRatingScale } = useContentSettings();

  const formatRating = (rating, showScale = true) => {
    if (!rating || rating === 0) return 'No rating';
    
    const formattedRating = parseFloat(rating).toFixed(1);
    return showScale ? `${formattedRating}/${maxRatingScale}` : formattedRating;
  };

  const formatRatingSimple = (rating) => {
    if (!rating || rating === 0) return 'No rating';
    return `${parseFloat(rating).toFixed(1)}/${maxRatingScale}`;
  };

  const getRatingPercentage = (rating) => {
    if (!rating || rating === 0) return 0;
    return (rating / maxRatingScale) * 100;
  };

  return {
    maxRatingScale,
    formatRating,
    formatRatingSimple,
    getRatingPercentage
  };
};

export default useRatingDisplay;