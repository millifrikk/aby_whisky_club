import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useUserManagement from '../../hooks/useUserManagement';

const GuestBrowsingGuard = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { allowGuestBrowsing, loading } = useUserManagement();

  // If user is authenticated, always allow access
  if (isAuthenticated) {
    return children;
  }

  // While settings are loading, show a loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If guest browsing is allowed, show content
  if (allowGuestBrowsing) {
    return children;
  }

  // Guest browsing is disabled, show login required message
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
          Login Required
        </h2>
        
        <p className="text-gray-600 mb-6">
          You must be logged in to view this content. Create an account or sign in to access our whisky collection.
        </p>
        
        <div className="space-y-3">
          <Link
            to="/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Sign In
          </Link>
          
          <Link
            to="/register"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuestBrowsingGuard;