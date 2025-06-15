import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import SecuritySettings from '../components/security/SecuritySettings';
import toast from 'react-hot-toast';

const ProfileSettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    whisky_preferences: {
      favorite_regions: [],
      preferred_types: [],
      flavor_preferences: '',
      age_preferences: '',
      price_range: ''
    }
  });

  useEffect(() => {
    // Initialize form with user data
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
        whisky_preferences: {
          favorite_regions: user.whisky_preferences?.favorite_regions || [],
          preferred_types: user.whisky_preferences?.preferred_types || [],
          flavor_preferences: user.whisky_preferences?.flavor_preferences || '',
          age_preferences: user.whisky_preferences?.age_preferences || '',
          price_range: user.whisky_preferences?.price_range || ''
        }
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfile(profileForm);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };


  const toggleRegionPreference = (region) => {
    setProfileForm(prev => ({
      ...prev,
      whisky_preferences: {
        ...prev.whisky_preferences,
        favorite_regions: prev.whisky_preferences.favorite_regions.includes(region)
          ? prev.whisky_preferences.favorite_regions.filter(r => r !== region)
          : [...prev.whisky_preferences.favorite_regions, region]
      }
    }));
  };

  const toggleTypePreference = (type) => {
    setProfileForm(prev => ({
      ...prev,
      whisky_preferences: {
        ...prev.whisky_preferences,
        preferred_types: prev.whisky_preferences.preferred_types.includes(type)
          ? prev.whisky_preferences.preferred_types.filter(t => t !== type)
          : [...prev.whisky_preferences.preferred_types, type]
      }
    }));
  };

  const regions = ['Speyside', 'Islay', 'Highlands', 'Lowlands', 'Campbeltown', 'Japan', 'Kentucky', 'Ireland'];
  const whiskyTypes = ['Single Malt', 'Blended Whisky', 'Bourbon', 'Rye', 'Irish', 'Japanese'];

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: '👤' },
    { id: 'preferences', name: 'Whisky Preferences', icon: '🥃' },
    { id: 'password', name: 'Change Password', icon: '🔒' },
    { id: 'security', name: 'Security', icon: '🛡️' },
    { id: 'account', name: 'Account Settings', icon: '⚙️' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            to="/profile"
            className="text-amber-600 hover:text-amber-700 mr-4"
          >
            ← Back to Profile
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  rows={4}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Tell us about yourself and your whisky journey..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {profileForm.bio.length}/500 characters
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-600 text-white py-2 px-6 rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Whisky Preferences Tab */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleProfileSubmit} className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Favorite Regions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {regions.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegionPreference(region)}
                      className={`p-3 text-sm rounded-md border transition-colors ${
                        profileForm.whisky_preferences.favorite_regions.includes(region)
                          ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preferred Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {whiskyTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleTypePreference(type)}
                      className={`p-3 text-sm rounded-md border transition-colors ${
                        profileForm.whisky_preferences.preferred_types.includes(type)
                          ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age Preferences
                  </label>
                  <select
                    value={profileForm.whisky_preferences.age_preferences}
                    onChange={(e) => setProfileForm(prev => ({
                      ...prev,
                      whisky_preferences: {
                        ...prev.whisky_preferences,
                        age_preferences: e.target.value
                      }
                    }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">No preference</option>
                    <option value="young">Young (0-12 years)</option>
                    <option value="medium">Medium (12-18 years)</option>
                    <option value="aged">Aged (18-25 years)</option>
                    <option value="very-aged">Very Aged (25+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range Preference
                  </label>
                  <select
                    value={profileForm.whisky_preferences.price_range}
                    onChange={(e) => setProfileForm(prev => ({
                      ...prev,
                      whisky_preferences: {
                        ...prev.whisky_preferences,
                        price_range: e.target.value
                      }
                    }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">No preference</option>
                    <option value="budget">Budget ($0-50)</option>
                    <option value="mid-range">Mid-range ($50-150)</option>
                    <option value="premium">Premium ($150-500)</option>
                    <option value="luxury">Luxury ($500+)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flavor Preferences
                </label>
                <textarea
                  rows={3}
                  value={profileForm.whisky_preferences.flavor_preferences}
                  onChange={(e) => setProfileForm(prev => ({
                    ...prev,
                    whisky_preferences: {
                      ...prev.whisky_preferences,
                      flavor_preferences: e.target.value
                    }
                  }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Describe your flavor preferences (e.g., fruity, smoky, sweet, spicy...)"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-600 text-white py-2 px-6 rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Change Password</h3>
                <p className="text-sm text-gray-600">
                  Choose a strong password to keep your account secure.
                </p>
              </div>
              <ChangePasswordForm />
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <SecuritySettings 
              user={user} 
              onUserUpdate={updateProfile}
            />
          )}

          {/* Account Settings Tab */}
          {activeTab === 'account' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Member since</dt>
                      <dd className="text-sm text-gray-900">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Account status</dt>
                      <dd className="text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user?.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Role</dt>
                      <dd className="text-sm text-gray-900 capitalize">{user?.role}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last login</dt>
                      <dd className="text-sm text-gray-900">
                        {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Unknown'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy & Data</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Public Profile</h4>
                      <p className="text-sm text-gray-500">Allow other members to view your profile</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Show Ratings Publicly</h4>
                      <p className="text-sm text-gray-500">Let others see your whisky ratings and reviews</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
                <div className="border border-red-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-red-900 mb-2">Delete Account</h4>
                  <p className="text-sm text-red-700 mb-4">
                    Once you delete your account, there is no going back. This will permanently delete your profile, ratings, and all associated data.
                  </p>
                  <button
                    type="button"
                    className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        toast.error('Account deletion is not yet implemented');
                      }
                    }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;