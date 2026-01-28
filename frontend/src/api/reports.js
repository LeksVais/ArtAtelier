import axiosInstance from './axiosConfig';

export const reportsAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/reports/generated/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  getTemplates: async () => {
    try {
      const response = await axiosInstance.get('/reports/templates/');
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  generate: async (data) => {
    try {
      console.log('Generating report with data:', data);
      const response = await axiosInstance.post('/reports/generate/', data);
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  download: async (id) => {
    try {
      const response = await axiosInstance.get(`/reports/generated/${id}/download/`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Получаем имя файла из заголовков
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `report-${id}.pdf`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  },

  archive: async (id) => {
    try {
      const response = await axiosInstance.post(`/reports/generated/${id}/archive/`);
      return response.data;
    } catch (error) {
      console.error('Error archiving report:', error);
      throw error;
    }
  },

  restore: async (id) => {
    try {
      const response = await axiosInstance.post(`/reports/generated/${id}/restore/`);
      return response.data;
    } catch (error) {
      console.error('Error restoring report:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/reports/generated/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/reports/generated/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  },
};