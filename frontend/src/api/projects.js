import axiosInstance from './axiosConfig';

export const projectsAPI = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/projects/');
      // Обрабатываем разные форматы ответа
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        return response.data.results || response.data.data || Object.values(response.data);
      }
      return [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      
      // Возвращаем пустой массив вместо ошибки
      if (error.response?.status === 500) {
        console.error('Server error details:', error.response.data);
        return [];
      }
      
      throw error;
    }
  },

  // Новый метод для получения архивных проектов
  getArchived: async () => {
    try {
      const response = await axiosInstance.get('/projects/archived/');  // Исправленный путь
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        return response.data.results || response.data.data || Object.values(response.data);
      }
      return [];
    } catch (error) {
      console.error('Error fetching archived projects:', error);
      return [];
    }
  },

  // Метод для восстановления проекта из архива
  restore: async (id) => {
    try {
      const response = await axiosInstance.post(`/projects/${id}/restore/`);  // Исправленный путь
      return response.data;
    } catch (error) {
      console.error(`Error restoring project ${id}:`, error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/projects/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      
      if (error.response?.status === 404) {
        throw new Error('Проект не найден');
      } else if (error.response?.status === 500) {
        console.error('Server error details:', error.response.data);
        throw new Error('Ошибка сервера при загрузке проекта');
      }
      
      throw error;
    }
  },
  
  create: async (data) => {
    try {
      const response = await axiosInstance.post('/projects/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/projects/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/projects/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  },
  
  archive: async (id) => {
    try {
      const response = await axiosInstance.post(`/projects/${id}/archive/`);
      return response.data;
    } catch (error) {
      console.error(`Error archiving project ${id}:`, error);
      
      // Выводим детали ошибки для отладки
      if (error.response) {
        console.error('Archive error response:', error.response.data);
        console.error('Archive error status:', error.response.status);
      }
      
      throw error;
    }
  },
  
  // Дополнительные методы для работы с задачами проекта
  getProjectTasks: async (projectId) => {
    try {
      const response = await axiosInstance.get(`/projects/${projectId}/tasks/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tasks for project ${projectId}:`, error);
      return [];
    }
  },
  
  getProjectMembers: async (projectId) => {
    try {
      const response = await axiosInstance.get(`/projects/${projectId}/members/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching members for project ${projectId}:`, error);
      return [];
    }
  },
  
  addProjectMember: async (projectId, employeeId, role) => {
    try {
      const response = await axiosInstance.post(`/projects/${projectId}/add_member/`, {
        employee_id: employeeId,
        role: role
      });
      return response.data;
    } catch (error) {
      console.error(`Error adding member to project ${projectId}:`, error);
      throw error;
    }
  },
  
  changeProjectStatus: async (projectId, status) => {
    try {
      const response = await axiosInstance.post(`/projects/${projectId}/change_status/`, {
        status: status
      });
      return response.data;
    } catch (error) {
      console.error(`Error changing status for project ${projectId}:`, error);
      throw error;
    }
  }
};