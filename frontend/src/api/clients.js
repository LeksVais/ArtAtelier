import axiosInstance from './axiosConfig';

export const clientsAPI = {
  getAll: async () => {
    const response = await axiosInstance.get('/auth/clients/');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await axiosInstance.get(`/auth/clients/${id}/`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await axiosInstance.post('/auth/clients/', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await axiosInstance.put(`/auth/clients/${id}/`, data);
    return response.data;
  },
  
  archive: async (id) => {
    const response = await axiosInstance.post(`/auth/clients/${id}/archive/`);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await axiosInstance.delete(`/auth/clients/${id}/`);
    return response.data;
  },
};