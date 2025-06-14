import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSecuritySettings } from '../../hooks/useSecuritySettings';

const SessionWarning = () => {
  const { user, logout } = useAuth();
  const { sessionInfo, isSessionExpiring, getTimeUntilExpiry } = useSecuritySettings();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (user && isSessionExpiring()) {
      setShowWarning(true);
      setTimeLeft(getTimeUntilExpiry());
    } else {
      setShowWarning(false);
    }
  }, [user, sessionInfo, isSessionExpiring, getTimeUntilExpiry]);

  // Update countdown every minute
  useEffect(() => {
    if (showWarning && timeLeft !== null) {
      const interval = setInterval(() => {
        const newTimeLeft = getTimeUntilExpiry();
        setTimeLeft(newTimeLeft);
        
        // Auto logout if session expired
        if (newTimeLeft <= 0) {
          handleLogout();
        }
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [showWarning, timeLeft, getTimeUntilExpiry]);

  const handleExtendSession = async () => {
    try {
      // Refresh token to extend session
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setShowWarning(false);
      } else {
        console.error('Failed to refresh session');
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  const handleLogout = () => {
    logout();
    setShowWarning(false);
  };

  const formatTimeLeft = (hours) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
    }
    
    return `${wholeHours}h ${minutes}m`;
  };

  if (!showWarning || !user) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Expiring Soon
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Your session will expire in {timeLeft !== null ? formatTimeLeft(timeLeft) : 'less than an hour'}.
              </p>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <button
                onClick={handleExtendSession}
                className="inline-flex items-center px-3 py-2 border border-transparent text-xs leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
              >
                Extend Session
              </button>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-xs leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Logout Now
              </button>
            </div>
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => setShowWarning(false)}
              className="bg-yellow-50 rounded-md inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionWarning;