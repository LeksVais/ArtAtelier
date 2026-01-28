import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment,
  Folder,
  Assessment,
  People,
  AddCircleOutline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../api/tasks';
import { projectsAPI } from '../../api/projects';
import TaskList from '../Tasks/TaskList';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    myTasksCount: 0,
    inProgressTasks: 0,
    activeProjects: 0,
    reviewTasks: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Получаем задачи пользователя
      const myTasks = await tasksAPI.getMyTasks();
      const tasksArray = Array.isArray(myTasks) ? myTasks : myTasks?.results || myTasks?.data || [];
      setTasks(tasksArray);

      // 2. Получаем все задачи для статистики
      const allTasks = await tasksAPI.getAll();
      const allTasksArray = Array.isArray(allTasks) ? allTasks : allTasks?.results || allTasks?.data || [];

      // 3. Получаем проекты
      const projects = await projectsAPI.getAll();
      const projectsArray = Array.isArray(projects) ? projects : projects?.results || projects?.data || [];

      // 4. Рассчитываем статистику
      const newStats = {
        myTasksCount: tasksArray.length,
        inProgressTasks: allTasksArray.filter(task => 
          task.status === 'in_progress' || 
          task.status === 'В работе' ||
          task.status === 'IN_PROGRESS'
        ).length,
        activeProjects: projectsArray.filter(project => 
          project.status === 'active' || 
          project.status === 'В работе' ||
          project.status === 'ACTIVE'
        ).length,
        reviewTasks: allTasksArray.filter(task => 
          task.status === 'review' || 
          task.status === 'На проверке' ||
          task.status === 'REVIEW'
        ).length,
      };

      setStats(newStats);
      console.log('Dashboard data loaded:', { tasks: tasksArray.length, stats: newStats });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Не удалось загрузить данные. Проверьте подключение к API.');
      
      // Fallback данные для демонстрации
      setStats({
        myTasksCount: 3,
        inProgressTasks: 2,
        activeProjects: 1,
        reviewTasks: 1,
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Быстрые действия в зависимости от роли
  const getQuickActions = () => {
    const actions = [];
    
    if (user?.role === 'director' || user?.role === 'manager') {
      actions.push(
        { label: 'Создать проект', icon: <AddCircleOutline />, path: '/projects/new' },
        { label: 'Создать задачу', icon: <Assignment />, path: '/tasks/new' }
      );
    }
    
    if (user?.role === 'director') {
      actions.push(
        { label: 'Добавить сотрудника', icon: <People />, path: '/employees/new' }
      );
    }
    
    // Для всех ролей
    actions.push(
      { label: 'Все задачи', icon: <Assignment />, path: '/tasks' },
      { label: 'Все проекты', icon: <Folder />, path: '/projects' }
    );
    
    return actions;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const quickActions = getQuickActions();

  return (
    <Box>
      {/* Заголовок */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <DashboardIcon sx={{ mr: 2 }} />
          Главная панель
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Добро пожаловать, {user?.first_name || 'Пользователь'}!
          {user?.role === 'director' && ' Вы видите полную статистику системы.'}
          {user?.role === 'manager' && ' Управляйте проектами и задачами.'}
          {(user?.role === 'designer' || user?.role === 'copywriter') && ' Здесь отображаются ваши текущие задачи.'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
          <Button 
            size="small" 
            onClick={fetchDashboardData}
            sx={{ ml: 2 }}
          >
            Повторить
          </Button>
        </Alert>
      )}

      {/* Быстрые действия */}
      <Paper sx={{ p: 3, mb: 4, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Быстрые действия
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} lg={2.4} key={index}>
              <Button
                fullWidth
                variant="contained"
                startIcon={action.icon}
                onClick={() => navigate(action.path)}
                sx={{
                  py: 1.5,
                  backgroundColor: '#1976d2',
                  '&:hover': { backgroundColor: '#1565c0' }
                }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Основной контент */}
      <Grid container spacing={3}>
        {/* Левая колонка - Задачи */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  Мои задачи ({tasks.length})
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/tasks')}
                >
                  Все задачи
                </Button>
              </Box>
              
              {tasks.length > 0 ? (
                <TaskList limit={5} showActions={true} />
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    У вас нет активных задач
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/tasks')}
                    sx={{ mt: 1 }}
                  >
                    Найти задачи
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Правая колонка - Статистика */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Статистика
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assignment sx={{ mr: 1, color: '#2196f3' }} />
                    <Typography>Мои задачи</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold">{stats.myTasksCount}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Folder sx={{ mr: 1, color: '#4caf50' }} />
                    <Typography>В работе</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold">{stats.inProgressTasks}</Typography>
                </Box>

                {(user?.role === 'director' || user?.role === 'manager') && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Folder sx={{ mr: 1, color: '#ff9800' }} />
                        <Typography>Активные проекты</Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold">{stats.activeProjects}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Assessment sx={{ mr: 1, color: '#9c27b0' }} />
                        <Typography>На проверке</Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold">{stats.reviewTasks}</Typography>
                    </Box>
                  </>
                )}
              </Box>

              <Button
                fullWidth
                variant="outlined"
                onClick={fetchDashboardData}
                sx={{ mt: 2 }}
              >
                Обновить статистику
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
