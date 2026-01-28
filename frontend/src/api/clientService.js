// src/api/clientService.js
import axiosInstance from './axiosConfig';

export const clientService = {
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/clients/', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await axiosInstance.get(`/clients/${id}/`);
    return response.data;
  },
  
  create: async (clientData) => {
    const response = await axiosInstance.post('/clients/', clientData);
    return response.data;
  },
  
  update: async (id, clientData) => {
    const response = await axiosInstance.put(`/clients/${id}/`, clientData);
    return response.data;
  },
  
  archive: async (id) => {
    const response = await axiosInstance.post(`/clients/${id}/archive/`);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await axiosInstance.delete(`/clients/${id}/`);
    return response.data;
  }
};