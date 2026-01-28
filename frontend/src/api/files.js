import axiosInstance from './axiosConfig';

export const filesAPI = {
  getAll: async () => {
    const response = await axiosInstance.get('/files/');
    return response.data;
  },
  
  upload: async (formData) => {
    const response = await axiosInstance.post('/files/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  download: async (id) => {
    const response = await axiosInstance.get(`/files/${id}/download/`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `file-${id}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};