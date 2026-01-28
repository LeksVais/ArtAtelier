import axiosInstance from './axiosConfig';

export const notificationsAPI = {
  getAll: async () => {
    const response = await axiosInstance.get('/notifications/');
    return response.data;
  },
  
  markAsRead: async (id) => {
    const response = await axiosInstance.post(`/notifications/${id}/mark_as_read/`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await axiosInstance.post('/notifications/mark_all_as_read/');
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await axiosInstance.get('/notifications/unread_count/');
    return response.data;
  },
  
  create: async (data) => {
    const response = await axiosInstance.post('/notifications/', data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await axiosInstance.delete(`/notifications/${id}/`);
    return response.data;
  },
};