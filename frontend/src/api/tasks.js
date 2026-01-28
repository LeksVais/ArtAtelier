import axiosInstance from './axiosConfig';

export const tasksAPI = {
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/projects/project-tasks/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(`/projects/project-tasks/${id}/`);
    return response.data;
  },

  getMyTasks: async (params = {}) => {
    const response = await axiosInstance.get('/projects/project-tasks/my_tasks/', { params });
    return response.data;
  },

  getOverdueTasks: async () => {
    const response = await axiosInstance.get('/projects/project-tasks/overdue/');
    return response.data;
  },

  create: async (taskData) => {
    try {
      console.log('Creating task with data:', taskData);
      console.log('URL:', '/projects/project-tasks/');
      const response = await axiosInstance.post('/projects/project-tasks/', taskData);
      console.log('Task creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  },

  update: async (id, taskData) => {
    try {
      console.log('Updating task', id, 'with data:', taskData);
      console.log('URL:', `/projects/project-tasks/${id}/`);
      const response = await axiosInstance.patch(`/projects/project-tasks/${id}/`, taskData);
      console.log('Task update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/projects/project-tasks/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

 takeToWork: async (id) => {
    try {
      const response = await axiosInstance.post(`/projects/project-tasks/${id}/take_to_work/`);
      return response.data;
    } catch (error) {
      console.error('Error taking task to work:', error);
      throw error;
    }
  },

  sendToReview: async (id) => {
    try {
      const response = await axiosInstance.post(`/projects/project-tasks/${id}/send_to_review/`);
      return response.data;
    } catch (error) {
      console.error('Error sending task to review:', error);
      throw error;
    }
  },

  complete: async (id) => {
    try {
      const response = await axiosInstance.post(`/projects/project-tasks/${id}/complete/`);
      return response.data;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  },

  returnForRevision: async (id) => {
    try {
      const response = await axiosInstance.post(`/projects/project-tasks/${id}/return_for_revision/`);
      return response.data;
    } catch (error) {
      console.error('Error returning task for revision:', error);
      throw error;
    }
  },

  updateProgress: async (id, progress) => {
    try {
      const response = await axiosInstance.post(`/projects/project-tasks/${id}/update_progress/`, { progress });
      return response.data;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  },

  changeAssignee: async (id, assigneeId) => {
    try {
      const response = await axiosInstance.post(`/projects/project-tasks/${id}/change_assignee/`, { assignee_id: assigneeId });
      return response.data;
    } catch (error) {
      console.error('Error changing assignee:', error);
      throw error;
    }
  }
};

export default tasksAPI;