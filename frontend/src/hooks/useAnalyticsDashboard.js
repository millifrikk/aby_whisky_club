import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import useAnalyticsSettings from './useAnalyticsSettings';

export const useAnalyticsDashboard = (dateRange = '7d') => {
  const { usageTrackingEnabled, performanceMonitoring } = useAnalyticsSettings();
  const [data, setData] = useState({
    loading: true,
    error: null,
    overview: null,
    activities: null,
    performance: null,
    engagement: null
  });

  const formatDateRange = (range) => {
    const now = new Date();
    const periods = {
      '1d': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };
    return periods[range] || periods['7d'];
  };

  const loadData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      const promises = [];
      const results = {};

      if (usageTrackingEnabled) {
        promises.push(
          analyticsAPI.getActivityAnalytics({ 
            period: dateRange,
            startDate: formatDateRange(dateRange).toISOString(),
            endDate: new Date().toISOString()
          }).then(res => ({ type: 'activities', data: res.data })),
          
          analyticsAPI.getTopEntities({ 
            period: dateRange, 
            limit: 20 
          }).then(res => ({ type: 'topEntities', data: res.data }))
        );
      }

      if (performanceMonitoring) {
        promises.push(
          analyticsAPI.getPerformanceAnalytics({ 
            period: dateRange 
          }).then(res => ({ type: 'performance', data: res.data })),
          
          analyticsAPI.getSystemHealth().then(res => ({ 
            type: 'systemHealth', 
            data: res.data 
          })),
          
          analyticsAPI.getSlowEndpoints({ 
            limit: 10 
          }).then(res => ({ type: 'slowEndpoints', data: res.data }))
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        results[response.type] = response.data;
      });

      // Process and format the data
      const processedData = {
        loading: false,
        error: null,
        overview: {
          analyticsEnabled: usageTrackingEnabled || performanceMonitoring,
          usageTrackingEnabled,
          performanceMonitoring,
          dateRange,
          lastUpdated: new Date().toISOString()
        },
        activities: results.activities ? {
          total: results.activities.totalActivities || 0,
          uniqueUsers: results.activities.uniqueUsers || 0,
          sessions: results.activities.totalSessions || 0,
          breakdown: results.activities.activityBreakdown || [],
          recent: results.activities.recentActivities || [],
          topEntities: results.topEntities || {}
        } : null,
        performance: results.performance ? {
          avgResponseTime: results.performance.averageResponseTime || 0,
          avgPageLoad: results.performance.averagePageLoad || 0,
          errorRate: results.performance.errorRate || 0,
          systemHealth: results.systemHealth || { metrics: [] },
          slowEndpoints: results.slowEndpoints || []
        } : null,
        engagement: results.activities ? {
          sessionDuration: results.activities.averageSessionDuration || 0,
          returningUsers: results.activities.returningUsers || 0,
          pagesPerSession: results.activities.pageViewsPerSession || 0,
          bounceRate: results.activities.bounceRate || 0
        } : null
      };

      setData(processedData);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load analytics data'
      }));
    }
  };

  useEffect(() => {
    if (usageTrackingEnabled || performanceMonitoring) {
      loadData();
    } else {
      setData({
        loading: false,
        error: null,
        overview: {
          analyticsEnabled: false,
          usageTrackingEnabled: false,
          performanceMonitoring: false,
          dateRange,
          lastUpdated: new Date().toISOString()
        },
        activities: null,
        performance: null,
        engagement: null
      });
    }
  }, [dateRange, usageTrackingEnabled, performanceMonitoring]);

  const refresh = () => {
    loadData();
  };

  const exportData = async (format = 'json') => {
    try {
      const exportData = {
        overview: data.overview,
        activities: data.activities,
        performance: data.performance,
        engagement: data.engagement,
        exportedAt: new Date().toISOString()
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = [];
        
        // Add activities data
        if (data.activities?.breakdown) {
          data.activities.breakdown.forEach(item => {
            csvData.push({
              type: 'activity',
              metric: item.activity_type,
              value: item.count,
              date: new Date().toISOString()
            });
          });
        }

        // Add performance data
        if (data.performance) {
          csvData.push(
            { type: 'performance', metric: 'avg_response_time', value: data.performance.avgResponseTime, date: new Date().toISOString() },
            { type: 'performance', metric: 'avg_page_load', value: data.performance.avgPageLoad, date: new Date().toISOString() },
            { type: 'performance', metric: 'error_rate', value: data.performance.errorRate, date: new Date().toISOString() }
          );
        }

        return csvData;
      }

      return exportData;
    } catch (error) {
      throw new Error('Failed to export analytics data');
    }
  };

  return {
    ...data,
    refresh,
    exportData,
    isEnabled: usageTrackingEnabled || performanceMonitoring
  };
};

export default useAnalyticsDashboard;