import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Card,
  CardContent,
  Stack,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { tasksAPI } from '../../api/tasks';
import { formatDate, formatDateTime } from '../../utils/helpers';

const TaskDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      console.log(`Fetching task with ID: ${id}`);
      const data = await tasksAPI.getById(id);
      console.log('Task data received:', data);
      setTask(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching task:', err);
      setError('Не удалось загрузить задачу. Возможно, задача не существует или у вас нет прав доступа.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      console.log(`Changing task ${id} status to ${newStatus}`);
      switch (newStatus) {
        case 'in_work':
          await tasksAPI.takeToWork(id);
          break;
        case 'on_review':
          await tasksAPI.sendToReview(id);
          break;
        case 'completed':
          await tasksAPI.complete(id);
          break;
      }
      fetchTask();
    } catch (err) {
      console.error('Error changing status:', err);
      alert(`Не удалось изменить статус задачи: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить задачу?')) {
      try {
        await tasksAPI.delete(id);
        navigate('/tasks');
      } catch (err) {
        console.error('Error deleting task:', err);
        alert(`Не удалось удалить задачу: ${err.response?.data?.detail || err.message}`);
      }
    }
  };

  const priorityColors = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336',
    critical: '#d32f2f',
  };

  const statusLabels = {
    created: { label: 'Создана', color: '#9e9e9e' },
    in_work: { label: 'В работе', color: '#2196f3' },
    on_review: { label: 'На проверке', color: '#ff9800' },
    completed: { label: 'Завершена', color: '#4caf50' },
    cancelled: { label: 'Отменена', color: '#f44336' },
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Загрузка...</Typography>
      </Box>
    );
  }

  if (error || !task) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Задача не найдена'}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/tasks')}
          sx={{ mt: 2 }}
        >
          Вернуться к задачам
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/tasks')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4">Детали задачи</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/tasks/${id}/edit`)}
          sx={{ mr: 1 }}
        >
          Редактировать
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
        >
          Удалить
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Основная информация */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {task.title}
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
              {task.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Статус
                </Typography>
                <Chip
                  label={statusLabels[task.status]?.label || task.status}
                  sx={{
                    backgroundColor: `${statusLabels[task.status]?.color}20`,
                    color: statusLabels[task.status]?.color,
                    fontWeight: 'bold',
                    mt: 1,
                  }}
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Приоритет
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <FlagIcon sx={{ color: priorityColors[task.priority], mr: 1 }} />
                  <Typography>
                    {task.priority_display || task.priority}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Срок выполнения
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography color={task.is_overdue ? 'error' : 'inherit'}>
                    {formatDate(task.deadline)}
                    {task.is_overdue && ' (просрочено)'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Проект
                </Typography>
                <Typography sx={{ mt: 1, fontWeight: 'medium' }}>
                  {task.project_title}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Прогресс выполнения */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Прогресс выполнения
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {task.progress}% выполнено
                </Typography>
                <Typography variant="body2">
                  {task.days_until_deadline >= 0 
                    ? `Осталось ${task.days_until_deadline} дней`
                    : `Просрочено на ${-task.days_until_deadline} дней`}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={task.progress} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              {task.status === 'created' && (
                <Button
                  variant="contained"
                  onClick={() => handleStatusChange('in_work')}
                >
                  Взять в работу
                </Button>
              )}
              
              {task.status === 'in_work' && (
                <Button
                  variant="contained"
                  onClick={() => handleStatusChange('on_review')}
                >
                  Отправить на проверку
                </Button>
              )}
              
              {task.status === 'on_review' && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleStatusChange('completed')}
                >
                  Завершить задачу
                </Button>
              )}
              
              {task.status === 'on_review' && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Здесь можно добавить логику возврата на доработку
                    console.log('Return for revision clicked');
                  }}
                >
                  Вернуть на доработку
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Боковая панель */}
        <Grid item xs={12} md={4}>
          {/* Исполнитель */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Исполнитель
            </Typography>
            {task.assigned_to ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {task.assigned_to_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {task.assigned_to?.email || ''}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography color="text.secondary">
                Не назначен
              </Typography>
            )}
          </Paper>

          {/* Временные затраты */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Временные затраты
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Плановое время
                </Typography>
                <Typography>
                  {task.estimated_hours ? `${task.estimated_hours} ч` : 'Не оценено'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Фактическое время
                </Typography>
                <Typography>
                  {task.actual_hours ? `${task.actual_hours} ч` : 'Не указано'}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Дополнительная информация */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Информация
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Создана
                </Typography>
                <Typography>
                  {task.created_by_name} • {formatDateTime(task.created_at)}
                </Typography>
              </Box>
              
              {task.completed_at && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Завершена
                  </Typography>
                  <Typography>
                    {formatDateTime(task.completed_at)}
                  </Typography>
                </Box>
              )}
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  ID задачи
                </Typography>
                <Typography>
                  #{task.id}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskDetail;