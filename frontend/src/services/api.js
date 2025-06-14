import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  refreshToken: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getMemberDirectory: () => api.get('/auth/users/directory'),
};

// Whisky API
export const whiskyAPI = {
  getAll: (params) => api.get('/whiskies', { params }),
  getById: (id) => api.get(`/whiskies/${id}`),
  getFeatured: () => api.get('/whiskies/featured'),
  getStats: () => api.get('/whiskies/stats'),
  create: (data) => api.post('/whiskies', data),
  update: (id, data) => api.put(`/whiskies/${id}`, data),
  delete: (id) => api.delete(`/whiskies/${id}`),
};

// Rating API
export const ratingAPI = {
  getWhiskyRatings: (whiskyId, params) => api.get(`/ratings/whisky/${whiskyId}`, { params }),
  getUserRatings: (userId, params) => api.get(`/ratings/user/${userId}`, { params }),
  getTopWhiskies: (params) => api.get('/ratings/top-whiskies', { params }),
  getRecent: (params) => api.get('/ratings/recent', { params }),
  createOrUpdate: (data) => api.post('/ratings', data),
  create: (data) => api.post('/ratings', data), // Alias for backward compatibility
  getById: (id) => api.get(`/ratings/${id}`),
  delete: (id) => api.delete(`/ratings/${id}`),
};

// News & Events API
export const newsEventAPI = {
  getAll: (params) => api.get('/news-events', { params }),
  getById: (id) => api.get(`/news-events/${id}`),
  getUpcoming: (params) => api.get('/news-events/upcoming', { params }),
  getFeatured: (params) => api.get('/news-events/featured', { params }),
  create: (data) => api.post('/news-events', data),
  update: (id, data) => api.put(`/news-events/${id}`, data),
  delete: (id) => api.delete(`/news-events/${id}`),
  rsvp: (eventId, data) => api.post(`/news-events/${eventId}/rsvp`, data),
  getAttendees: (eventId) => api.get(`/news-events/${eventId}/attendees`),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  getRecentActivity: (params) => api.get('/admin/activity', { params }),
  getSystemMetrics: () => api.get('/admin/metrics'),
  getContentForModeration: (params) => api.get('/admin/content/moderation', { params }),
  moderateContent: (contentType, contentId, data) => api.post(`/admin/content/${contentType}/${contentId}/moderate`, data),
  
  // System Settings
  getSystemSettings: (params) => api.get('/admin/settings', { params }),
  getEnhancedSystemSettings: (params) => api.get('/admin/settings/enhanced', { params }),
  updateSystemSetting: (key, data) => api.put(`/admin/settings/${key}`, data),
  createSystemSetting: (data) => api.post('/admin/settings', data),
  deleteSystemSetting: (key) => api.delete(`/admin/settings/${key}`),
  
  // Data Export
  exportData: (params) => api.get('/admin/export', { params }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

// Public Settings API (for non-admin access to public settings)
export const settingsAPI = {
  getPublicSettings: (params) => api.get('/settings/public', { params }),
};

// Wishlist API
export const wishlistAPI = {
  getUserWishlist: (userId, params) => api.get(`/wishlist/user/${userId}`, { params }),
  addToWishlist: (data) => api.post('/wishlist', data),
  removeFromWishlist: (id) => api.delete(`/wishlist/${id}`),
  updateWishlistItem: (id, data) => api.put(`/wishlist/${id}`, data),
  checkWishlistStatus: (whiskyId) => api.get(`/wishlist/status/${whiskyId}`),
};

// Comparison API
export const comparisonAPI = {
  getUserSessions: (userId, params) => api.get(`/comparison/sessions/user/${userId}`, { params }),
  createSession: (data) => api.post('/comparison/sessions', data),
  getSession: (id) => api.get(`/comparison/sessions/${id}`),
  updateSession: (id, data) => api.put(`/comparison/sessions/${id}`, data),
  deleteSession: (id) => api.delete(`/comparison/sessions/${id}`),
  compareWhiskies: (whiskyIds) => api.get('/comparison/compare', { 
    params: { ids: Array.isArray(whiskyIds) ? whiskyIds.join(',') : whiskyIds } 
  }),
};

// Leaderboard API
export const leaderboardAPI = {
  getTopRaters: (params) => api.get('/leaderboard/raters', { params }),
  getTopWhiskies: (params) => api.get('/leaderboard/whiskies', { params }),
  getStats: () => api.get('/leaderboard/stats')
};

// Analytics API
export const analyticsAPI = {
  // Activity tracking
  trackActivity: (data) => api.post('/analytics/activity', data),
  
  // Performance tracking
  recordPerformanceMetric: (data) => api.post('/analytics/performance', data),
  
  // Admin analytics endpoints
  getActivityAnalytics: (params) => api.get('/analytics/activity/analytics', { params }),
  getPerformanceAnalytics: (params) => api.get('/analytics/performance/analytics', { params }),
  getTopEntities: (params) => api.get('/analytics/top-entities', { params }),
  getSystemHealth: () => api.get('/analytics/system-health'),
  getSlowEndpoints: (params) => api.get('/analytics/slow-endpoints', { params }),
  cleanOldData: (data) => api.post('/analytics/cleanup', data)
};

export default api;
