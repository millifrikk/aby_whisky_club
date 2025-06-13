import { useSettings } from '../contexts/SettingsContext';

export const useUserManagement = () => {
  const { settings, loading } = useSettings();
  
  console.log('👤 User management settings hook:', { 
    loading, 
    hasSettings: !!settings,
    allowRegistration: settings.allow_registration,
    registrationApproval: settings.registration_approval_required,
    allSettings: Object.keys(settings || {})
  });

  return {
    // Registration Controls
    allowRegistration: settings.allow_registration === 'true' || settings.allow_registration === true,
    registrationApprovalRequired: settings.registration_approval_required === 'true' || settings.registration_approval_required === true,
    requireEmailVerification: settings.require_email_verification === 'true' || settings.require_email_verification === true,
    
    // Profile & Privacy Controls
    allowPublicProfiles: settings.allow_public_profiles === 'true' || settings.allow_public_profiles === true,
    enableUserAvatars: settings.enable_user_avatars === 'true' || settings.enable_user_avatars === true,
    memberDirectoryVisible: settings.member_directory_visible === 'true' || settings.member_directory_visible === true,
    allowGuestBrowsing: settings.allow_guest_browsing === 'true' || settings.allow_guest_browsing === true,
    
    // Security Controls
    minPasswordLength: parseInt(settings.min_password_length) || 8,
    passwordComplexityRequired: settings.password_complexity_required === 'true' || settings.password_complexity_required === true,
    requireRealNames: settings.require_real_names === 'true' || settings.require_real_names === true,
    
    loading
  };
};

export default useUserManagement;