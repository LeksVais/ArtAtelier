import axiosInstance from './axiosConfig';

export const usersAPI = {
  // Создание пользователя
  create: async (userData) => {
    const response = await axiosInstance.post('/auth/users/', userData);
    return response.data;
  },
  
  getManagers: async () => {
    try {
      const response = await axiosInstance.get('/auth/users/');
      
      let users = [];
      if (Array.isArray(response.data)) {
        users = response.data;
      } else if (response.data && typeof response.data === 'object') {
        users = response.data.results || response.data.data || Object.values(response.data);
      }
      
      // Фильтруем менеджеров
      const managers = users.filter(user => user.role === 'manager');
      console.log('Managers found:', managers);
      
      return managers.length > 0 ? managers : users;
      
    } catch (error) {
      console.error('Error fetching managers:', error);
      return [];
    }
  },
  
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/auth/users/');
      
      let users = [];
      if (Array.isArray(response.data)) {
        users = response.data;
      } else if (response.data && typeof response.data === 'object') {
        users = response.data.results || response.data.data || Object.values(response.data);
      }
      
      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/auth/users/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },
};