import { useSettings } from '../contexts/SettingsContext';

export const useContentSettings = () => {
  const { settings, loading } = useSettings();
  
  console.log('🔧 Content settings hook:', { 
    loading, 
    hasSettings: !!settings,
    bottleSize: settings.default_whisky_bottle_size,
    allSettings: Object.keys(settings || {})
  });

  return {
    maxWhiskiesPerPage: parseInt(settings.max_whiskies_per_page) || 20,
    featuredWhiskiesCount: parseInt(settings.featured_whiskies_count) || 6,
    maxRatingScale: parseInt(settings.max_rating_scale) || 10,
    defaultWhiskyBottleSize: parseInt(settings.default_whisky_bottle_size) || 700,
    allowGuestRatings: settings.allow_guest_ratings === 'true' || settings.allow_guest_ratings === true,
    enableWhiskyReviews: settings.enable_whisky_reviews === 'true' || settings.enable_whisky_reviews === true,
    requireAdminApprovalWhiskies: settings.require_admin_approval_whiskies === 'true' || settings.require_admin_approval_whiskies === true,
    tastingNotesRequired: settings.tasting_notes_required === 'true' || settings.tasting_notes_required === true,
    enableWhiskyComparison: settings.enable_whisky_comparison === 'true' || settings.enable_whisky_comparison === true,
    enableWhiskyWishlist: settings.enable_whisky_wishlist === 'true' || settings.enable_whisky_wishlist === true,
    loading
  };
};

export default useContentSettings;