import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import useUserManagement from '../hooks/useUserManagement';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const MembersPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { allowPublicProfiles, memberDirectoryVisible, enableUserAvatars } = useUserManagement();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    // Get saved view preference from localStorage, default to 'card'
    return localStorage.getItem('members-view-mode') || 'card';
  });

  useEffect(() => {
    if (memberDirectoryVisible && isAuthenticated) {
      loadMembers();
    } else {
      setLoading(false);
    }
  }, [memberDirectoryVisible, isAuthenticated]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getMemberDirectory();
      setMembers(response.data.users || []);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load member directory');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (user) => {
    if (!user) return 'Member';
    
    if (allowPublicProfiles) {
      if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
      }
      return user.first_name || user.username || 'Member';
    }
    
    return 'Member';
  };

  const getInitials = (user) => {
    if (!user) return 'M';
    
    if (allowPublicProfiles && user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    } else if (allowPublicProfiles && user.first_name) {
      return user.first_name[0].toUpperCase();
    } else if (allowPublicProfiles && user.username) {
      return user.username[0].toUpperCase();
    }
    
    return 'M';
  };

  const filteredMembers = members.filter(member => {
    if (!searchTerm) return true;
    const displayName = getDisplayName(member).toLowerCase();
    return displayName.includes(searchTerm.toLowerCase());
  });

  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
    localStorage.setItem('members-view-mode', newViewMode);
  };

  const handleRowClick = (memberId, event) => {
    // Don't navigate if clicking on action buttons
    if (event.target.closest('button') || event.target.closest('a')) {
      return;
    }
    if (allowPublicProfiles) {
      window.location.href = `/profile/${memberId}`;
    }
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Login Required
          </h2>
          <p className="text-gray-600 mb-6">
            You must be logged in to view the member directory.
          </p>
          <Link
            to="/login"
            className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Check if member directory is disabled
  if (!memberDirectoryVisible) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Directory Disabled
          </h2>
          <p className="text-gray-600">
            The member directory is currently disabled by the administrator.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Member Directory</h1>
          <p className="mt-2 text-gray-600">
            Connect with fellow whisky enthusiasts in our club
          </p>
        </div>

        {/* Search Bar and View Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-md">
            <label htmlFor="search" className="sr-only">
              Search members
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                placeholder="Search members..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('card')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Card View"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Cards
            </button>
            <button
              onClick={() => handleViewModeChange('table')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Table View"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9m-9-8h9m-9 4h9" />
              </svg>
              Table
            </button>
          </div>
        </div>

        {/* Members Layout - Cards or Table */}
        {viewMode === 'card' ? (
          /* Card Grid */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {enableUserAvatars && member.profile_image ? (
                        <img
                          className="h-12 w-12 rounded-full object-cover"
                          src={member.profile_image}
                          alt={getDisplayName(member)}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold">
                          {getInitials(member)}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {getDisplayName(member)}
                      </h3>
                      {allowPublicProfiles && member.bio ? (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {member.bio}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">
                          Club Member
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Member Stats */}
                  {allowPublicProfiles && (
                    <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-semibold text-amber-600">
                          {member.rating_count || 0}
                        </p>
                        <p className="text-xs text-gray-500">Ratings</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-amber-600">
                          {member.avg_rating ? member.avg_rating.toFixed(1) : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Avg Rating</p>
                      </div>
                    </div>
                  )}

                  {/* View Profile Button */}
                  {allowPublicProfiles && (
                    <div className="mt-4">
                      <Link
                        to={`/profile/${member.id}`}
                        className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                      >
                        View Profile
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table Layout */
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member Since
                    </th>
                    {allowPublicProfiles && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Activity
                      </th>
                    )}
                    {allowPublicProfiles && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Avg Rating
                      </th>
                    )}
                    {allowPublicProfiles && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                        Bio
                      </th>
                    )}
                    {allowPublicProfiles && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member, index) => (
                    <tr 
                      key={member.id} 
                      onClick={(e) => handleRowClick(member.id, e)}
                      className={`hover:bg-gray-50 transition-colors ${allowPublicProfiles ? 'cursor-pointer' : ''} ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                      title={allowPublicProfiles ? "Click to view profile" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-4">
                            {enableUserAvatars && member.profile_image ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={member.profile_image}
                                alt={getDisplayName(member)}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-sm">
                                {getInitials(member)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getDisplayName(member)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatJoinDate(member.created_at)}
                      </td>
                      {allowPublicProfiles && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                          <div className="flex items-center">
                            <span className="text-amber-600 font-medium">
                              {member.rating_count || 0}
                            </span>
                            <span className="ml-1 text-gray-500">
                              rating{(member.rating_count || 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                      )}
                      {allowPublicProfiles && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                          {member.avg_rating ? (
                            <div className="flex items-center">
                              <span className="text-amber-500 mr-1">★</span>
                              <span className="font-medium">{member.avg_rating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                      )}
                      {allowPublicProfiles && (
                        <td className="px-6 py-4 text-sm text-gray-500 hidden xl:table-cell max-w-xs">
                          <div className="truncate">
                            {member.bio || 'No bio available'}
                          </div>
                        </td>
                      )}
                      {allowPublicProfiles && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/profile/${member.id}`}
                            className="text-amber-600 hover:text-amber-700 font-medium"
                          >
                            View Profile
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredMembers.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.196M17 20H7m10 0v-2c0-5.523-4.477-10-10-10s-10 4.477-10 10v2m10 0H7m0 0v-2a3 3 0 015.196-2.196M7 20v-2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'No members are currently visible in the directory.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersPage;