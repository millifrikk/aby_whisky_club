import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useAnalyticsSettings from './useAnalyticsSettings';
import { analyticsAPI } from '../services/api';

export const useActivityTracking = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { usageTrackingEnabled, performanceMonitoring } = useAnalyticsSettings();
  const lastPageRef = useRef(null);
  const pageStartTimeRef = useRef(Date.now());
  const sessionIdRef = useRef(null);

  // Generate or get session ID
  useEffect(() => {
    if (!sessionIdRef.current) {
      // Try to get existing session ID from localStorage
      let sessionId = localStorage.getItem('analytics_session_id');
      
      if (!sessionId) {
        // Generate new session ID
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('analytics_session_id', sessionId);
      }
      
      sessionIdRef.current = sessionId;
    }
  }, []);

  // Track activity
  const trackActivity = useCallback(async (activityData) => {
    if (!usageTrackingEnabled || !sessionIdRef.current) return;

    try {
      await analyticsAPI.trackActivity({
        ...activityData,
        sessionId: sessionIdRef.current,
        pageUrl: window.location.href,
        pageTitle: document.title,
        referrerUrl: document.referrer || null,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.debug('Activity tracking failed:', error);
      // Silently fail - don't disrupt user experience
    }
  }, [usageTrackingEnabled]);

  // Track performance metric
  const trackPerformance = useCallback(async (metricData) => {
    if (!performanceMonitoring || !sessionIdRef.current) return;

    try {
      await analyticsAPI.recordPerformanceMetric({
        ...metricData,
        sessionId: sessionIdRef.current,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.debug('Performance tracking failed:', error);
      // Silently fail - don't disrupt user experience
    }
  }, [performanceMonitoring]);

  // Track page views automatically
  useEffect(() => {
    if (!usageTrackingEnabled) return;

    const currentPath = location.pathname;
    const currentTime = Date.now();

    // Track page view duration for previous page
    if (lastPageRef.current && pageStartTimeRef.current) {
      const duration = currentTime - pageStartTimeRef.current;
      
      trackActivity({
        activityType: 'page_view',
        entityType: 'page',
        duration,
        metadata: {
          path: lastPageRef.current,
          exitTime: new Date().toISOString()
        }
      });
    }

    // Track new page view
    trackActivity({
      activityType: 'page_view',
      entityType: 'page',
      metadata: {
        path: currentPath,
        search: location.search,
        hash: location.hash,
        enterTime: new Date().toISOString()
      }
    });

    // Update refs
    lastPageRef.current = currentPath;
    pageStartTimeRef.current = currentTime;

  }, [location.pathname, trackActivity, usageTrackingEnabled]);

  // Track user authentication events
  useEffect(() => {
    if (!usageTrackingEnabled) return;

    if (isAuthenticated && user) {
      trackActivity({
        activityType: 'login',
        entityType: 'user',
        entityId: user.id,
        metadata: {
          userRole: user.role,
          loginTime: new Date().toISOString()
        }
      });
    }
  }, [isAuthenticated, user, trackActivity, usageTrackingEnabled]);

  // Track API performance
  const trackAPIPerformance = useCallback((endpoint, duration, success = true) => {
    trackPerformance({
      metricType: 'api_response_time',
      endpoint,
      value: duration,
      unit: 'ms',
      metadata: {
        success,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackPerformance]);

  // Track page load performance
  useEffect(() => {
    if (!performanceMonitoring) return;

    const measurePageLoad = () => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        
        if (loadTime > 0) {
          trackPerformance({
            metricType: 'page_load_time',
            endpoint: location.pathname,
            value: loadTime,
            unit: 'ms',
            metadata: {
              path: location.pathname,
              loadCompleteTime: new Date().toISOString()
            }
          });
        }
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePageLoad();
    } else {
      window.addEventListener('load', measurePageLoad);
      return () => window.removeEventListener('load', measurePageLoad);
    }
  }, [location.pathname, trackPerformance, performanceMonitoring]);

  // Track errors
  const trackError = useCallback((error, context = {}) => {
    trackActivity({
      activityType: 'error',
      entityType: 'error',
      metadata: {
        errorMessage: error.message || 'Unknown error',
        errorStack: error.stack,
        context,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  // Track specific user actions
  const trackWhiskyView = useCallback((whiskyId) => {
    trackActivity({
      activityType: 'whisky_view',
      entityType: 'whisky',
      entityId: whiskyId,
      metadata: {
        viewTime: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackSearch = useCallback((query, filters = {}) => {
    trackActivity({
      activityType: 'search',
      entityType: 'search',
      metadata: {
        query,
        filters,
        searchTime: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackWishlistAction = useCallback((action, whiskyId) => {
    trackActivity({
      activityType: action === 'add' ? 'wishlist_add' : 'wishlist_remove',
      entityType: 'whisky',
      entityId: whiskyId,
      metadata: {
        action,
        actionTime: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackComparisonAction = useCallback((action, whiskyId) => {
    trackActivity({
      activityType: action === 'add' ? 'comparison_add' : 'comparison_remove',
      entityType: 'whisky',
      entityId: whiskyId,
      metadata: {
        action,
        actionTime: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackRatingAction = useCallback((action, ratingId, whiskyId) => {
    trackActivity({
      activityType: `rating_${action}`,
      entityType: 'rating',
      entityId: ratingId,
      metadata: {
        whiskyId,
        action,
        actionTime: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  return {
    // General tracking
    trackActivity,
    trackPerformance,
    trackError,
    trackAPIPerformance,
    
    // Specific action tracking
    trackWhiskyView,
    trackSearch,
    trackWishlistAction,
    trackComparisonAction,
    trackRatingAction,
    
    // Settings
    usageTrackingEnabled,
    performanceMonitoring,
    sessionId: sessionIdRef.current
  };
};

export default useActivityTracking;