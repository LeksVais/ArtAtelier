import axiosInstance from './axiosConfig';

// Экспортируем все API из отдельных файлов
export { authAPI } from './auth';
export { clientsAPI } from './clients';
export { projectsAPI } from './projects';
export { tasksAPI } from './tasks';
export { employeesAPI } from './employees';
export { filesAPI } from './files';
export { notificationsAPI } from './notifications';
export { reportsAPI } from './reports';
export { dashboardAPI } from './dashboard';
export { usersAPI } from './users';
// Экспорт по умолчанию
export { axiosInstance };