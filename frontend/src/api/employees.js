import axiosInstance from './axiosConfig';

export const employeesAPI = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/auth/employees/');
      console.log('Employees API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/auth/employees/${id}/`);
      console.log('Employee details response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  },
  
  create: async (data) => {
    try {
      console.log('Creating employee with data:', data);
      
      // ВАЖНО: Для создания нужно отправить ВСЕ поля из EmployeeCreateSerializer
      const employeeData = {
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: data.middle_name || '',
        role: data.role,
        phone: data.phone || '',
        position: data.position,
        work_email: data.work_email,
        employment_status: data.employment_status,
        hire_date: data.hire_date,
        salary_rate: data.salary_rate || null,
        password: data.password || 'DefaultPassword123',
        confirm_password: data.password || 'DefaultPassword123',
      };
      
      console.log('Sending to API:', employeeData);
      const response = await axiosInstance.post('/auth/employees/', employeeData);
      console.log('Create employee response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating employee:', error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      console.log('Updating employee', id, 'with data:', data);
      
      // ВАЖНО: Для обновления НЕ отправляем username, email, password
      // Эти поля удаляются в сериализаторе EmployeeCreateSerializer.update()
      const updateData = { ...data };
      
      // Удаляем поля, которые нельзя обновлять
      delete updateData.username;
      delete updateData.password;
      delete updateData.confirm_password;
      
      // Если email не изменился, тоже можно удалить
      if (!updateData.email) {
        delete updateData.email;
      }
      
      console.log('Sending update data:', updateData);
      const response = await axiosInstance.put(`/auth/employees/${id}/`, updateData);
      console.log('Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating employee:', error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/auth/employees/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },
};