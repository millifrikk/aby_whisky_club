import api from './api';

export const adminAPI = {
  // Dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // User management
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUser: async (userId, updateData) => {
    const response = await api.put(`/admin/users/${userId}`, updateData);
    return response.data;
  },

  // Activity and metrics
  getRecentActivity: async (params = {}) => {
    const response = await api.get('/admin/activity', { params });
    return response.data;
  },

  getSystemMetrics: async () => {
    const response = await api.get('/admin/metrics');
    return response.data;
  },

  // Distillery management
  searchDistilleries: async (params = {}) => {
    const response = await api.get('/distilleries/search', { params });
    return response.data;
  },

  createDistillery: async (distilleryData) => {
    const response = await api.post('/distilleries', distilleryData);
    return response.data;
  },

  // Whisky approval management
  getPendingWhiskies: async (params = {}) => {
    const response = await api.get('/admin/whiskies/pending', { params });
    return response.data;
  },

  approveWhisky: async (whiskyId, data = {}) => {
    const response = await api.post(`/admin/whiskies/${whiskyId}/approve`, data);
    return response.data;
  },

  rejectWhisky: async (whiskyId, data = {}) => {
    const response = await api.post(`/admin/whiskies/${whiskyId}/reject`, data);
    return response.data;
  }
};