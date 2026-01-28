import axiosInstance from './axiosConfig';

export const dashboardAPI = {
  getStats: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/stats/');
      return response.data;
    } catch (error) {
      console.warn('Dashboard stats endpoint not found, trying alternative endpoints');
      
      try {
        // Попробуем получить данные из других эндпоинтов
        const [tasksResponse, projectsResponse, employeesResponse] = await Promise.all([
          axiosInstance.get('/projects/project-tasks/my_tasks/'),
          axiosInstance.get('/projects/'),
          user?.role === 'director' ? axiosInstance.get('/auth/employees/') : Promise.resolve({data: []})
        ]);

        const myTasks = tasksResponse.data;
        const projects = projectsResponse.data;
        const employees = employeesResponse.data;

        // Рассчитываем статистику вручную
        return {
          my_tasks_count: Array.isArray(myTasks) ? myTasks.length : 0,
          tasks_in_progress: Array.isArray(myTasks) ? myTasks.filter(task => 
            task.status === 'in_progress' || task.status === 'В работе'
          ).length : 0,
          active_projects: Array.isArray(projects) ? projects.filter(project => 
            project.status === 'active' || project.status === 'В работе'
          ).length : 0,
          on_approval: Array.isArray(myTasks) ? myTasks.filter(task => 
            task.status === 'review' || task.status === 'На проверке'
          ).length : 0,
          total_employees: Array.isArray(employees) ? employees.length : 0,
          total_clients: 0, // Нужен эндпоинт для клиентов
          total_projects: Array.isArray(projects) ? projects.length : 0,
          completed_tasks: Array.isArray(myTasks) ? myTasks.filter(task => 
            task.status === 'completed' || task.status === 'Завершено'
          ).length : 0,
        };
      } catch (fallbackError) {
        console.warn('All dashboard endpoints failed, using fallback');
        return {
          my_tasks_count: 0,
          tasks_in_progress: 0,
          active_projects: 0,
          on_approval: 0,
          total_employees: 0,
          total_clients: 0,
          total_projects: 0,
          completed_tasks: 0,
        };
      }
    }
  },
};