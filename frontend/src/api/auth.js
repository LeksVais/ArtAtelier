import axiosInstance from './axiosConfig';

export const authAPI = {
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/token/', credentials);
    if (response.data.access) {
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register/', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  changePassword: async (passwords) => {
    const response = await axiosInstance.post('/auth/change-password/', passwords);
    return response.data;
  },

  getProfile: async () => {
    const response = await axiosInstance.get('/auth/me/');
    return response.data;
  },

  updateProfile: async (data) => {
    // Используем PUT метод (Django REST обычно поддерживает PUT для обновления)
    const response = await axiosInstance.put('/auth/me/', data);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },
};

export const getToken = () => localStorage.getItem('token');
export const clearToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};