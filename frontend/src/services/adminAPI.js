import { api } from './api';

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
  }
};