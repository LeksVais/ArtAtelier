import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  LinearProgress,
  Tooltip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../api/tasks';
import { formatDate } from '../../utils/helpers';

const TaskList = ({ limit, showActions = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  });
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      let data;
      
      if (limit) {
        // Для виджета на дашборде показываем только активные задачи
        data = await tasksAPI.getMyTasks({ limit });
      } else {
        // Для полного списка задач
        if (user?.role === 'designer' || user?.role === 'copywriter') {
          // Дизайнеры и копирайтеры видят ВСЕ свои задачи (включая завершенные)
          // Используем getAll с фильтром по assigned_to
          const allTasks = await tasksAPI.getAll();
          
          // Фильтруем задачи по исполнителю
          if (Array.isArray(allTasks)) {
            data = allTasks.filter(task => 
              task.assigned_to?.id === user?.id || 
              task.created_by?.id === user?.id
            );
          } else if (allTasks && typeof allTasks === 'object') {
            // Обрабатываем разные форматы ответа
            let tasksArray = [];
            if (Array.isArray(allTasks.results)) {
              tasksArray = allTasks.results;
            } else if (Array.isArray(allTasks.data)) {
              tasksArray = allTasks.data;
            } else if (Array.isArray(allTasks.tasks)) {
              tasksArray = allTasks.tasks;
            }
            
            data = tasksArray.filter(task => 
              task.assigned_to?.id === user?.id || 
              task.created_by?.id === user?.id
            );
          }
        } else {
          // Для руководителя и менеджера - все задачи
          data = await tasksAPI.getAll();
        }
      }
      
      // Проверяем разные форматы ответа
      if (Array.isArray(data)) {
        setTasks(data);
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.results)) {
          setTasks(data.results);
        } else if (Array.isArray(data.data)) {
          setTasks(data.data);
        } else if (Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        } else {
          setTasks(Object.values(data).filter(item => item && typeof item === 'object'));
        }
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Не удалось загрузить задачи. Проверьте подключение к серверу.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...tasks];

    if (filters.status) {
      result = result.filter(task => task.status === filters.status);
    }

    if (filters.priority) {
      result = result.filter(task => task.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.project_title?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTasks(result);
  };

  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleDelete = async () => {
    if (selectedTask && window.confirm('Вы уверены, что хотите удалить задачу?')) {
      try {
        await tasksAPI.delete(selectedTask.id);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert(`Не удалось удалить задачу: ${error.response?.data?.detail || error.message}`);
      }
    }
    handleMenuClose();
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      switch (newStatus) {
        case 'in_work':
          await tasksAPI.takeToWork(taskId);
          break;
        case 'on_review':
          await tasksAPI.sendToReview(taskId);
          break;
        case 'completed':
          await tasksAPI.complete(taskId);
          break;
      }
      fetchTasks();
    } catch (error) {
      console.error('Error changing status:', error);
      alert(`Не удалось изменить статус задачи: ${error.response?.data?.detail || error.message}`);
    }
  };

  const statusColors = {
    created: { label: 'Создана', color: '#9e9e9e' },
    in_work: { label: 'В работе', color: '#2196f3' },
    on_review: { label: 'На проверке', color: '#ff9800' },
    completed: { label: 'Завершена', color: '#4caf50' },
    cancelled: { label: 'Отменена', color: '#f44336' },
  };

  const priorityColors = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336',
    critical: '#d32f2f',
  };

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'created', label: 'Создана' },
    { value: 'in_work', label: 'В работе' },
    { value: 'on_review', label: 'На проверке' },
    { value: 'completed', label: 'Завершена' },
  ];

  const priorityOptions = [
    { value: '', label: 'Все приоритеты' },
    { value: 'low', label: 'Низкий' },
    { value: 'medium', label: 'Средний' },
    { value: 'high', label: 'Высокий' },
    { value: 'critical', label: 'Критический' },
  ];

  const displayTasks = limit ? filteredTasks.slice(0, limit) : filteredTasks;

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Загрузка задач...</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Задачи {limit && `(${displayTasks.length} из ${filteredTasks.length})`}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchTasks}
            >
              Обновить
            </Button>
            {!limit && showActions && (user?.role === 'director' || user?.role === 'manager') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/tasks/new')}
              >
                Новая задача
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!limit && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Поиск задач..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Статус</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Статус"
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Приоритет</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  label="Приоритет"
                >
                  {priorityOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilters({ status: '', priority: '', search: '' })}
                disabled={!filters.status && !filters.priority && !filters.search}
              >
                Сбросить
              </Button>
            </Grid>
          </Grid>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Проект</TableCell>
                <TableCell>Исполнитель</TableCell>
                <TableCell>Срок</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Приоритет</TableCell>
                <TableCell>Прогресс</TableCell>
                {!limit && <TableCell align="right">Действия</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      Задачи не найдены
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayTasks.map((task) => (
                  <TableRow 
                    key={task.id}
                    hover
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {task.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {task.project_title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {task.assigned_to_name || 'Не назначен'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ScheduleIcon 
                          sx={{ 
                            mr: 1, 
                            fontSize: 16,
                            color: task.is_overdue ? 'error.main' : 'text.secondary'
                          }} 
                        />
                        <Typography 
                          variant="body2" 
                          color={task.is_overdue ? 'error' : 'inherit'}
                        >
                          {formatDate(task.deadline)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusColors[task.status]?.label || task.status}
                        size="small"
                        sx={{
                          backgroundColor: `${statusColors[task.status]?.color}20`,
                          color: statusColors[task.status]?.color,
                          fontWeight: 'medium',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FlagIcon 
                          sx={{ 
                            mr: 1, 
                            fontSize: 16,
                            color: priorityColors[task.priority]
                          }} 
                        />
                        <Typography variant="body2">
                          {task.priority_display}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={task.progress} 
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 30 }}>
                          {task.progress}%
                        </Typography>
                      </Box>
                    </TableCell>
                    {!limit && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, task);
                          }}
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {limit && showActions && filteredTasks.length > limit && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/tasks')}
            >
              Показать все задачи ({filteredTasks.length})
            </Button>
          </Box>
        )}

        {!limit && filteredTasks.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Показано {displayTasks.length} из {filteredTasks.length} задач
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tasks.filter(t => t.is_overdue && t.status !== 'completed').length} просроченных задач
            </Typography>
          </Box>
        )}
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => {
          navigate(`/tasks/${selectedTask?.id}`);
          handleMenuClose();
        }}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          Просмотр
        </MenuItem>
        
        {/* Редактирование только для руководителя и менеджера */}
        {(user?.role === 'director' || user?.role === 'manager') && (
          <MenuItem onClick={() => {
            navigate(`/tasks/${selectedTask?.id}/edit`);
            handleMenuClose();
          }}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Редактировать
          </MenuItem>
        )}
        
        {/* Удаление только для руководителя и менеджера */}
        {(user?.role === 'director' || user?.role === 'manager') && (
          <MenuItem onClick={handleDelete}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Удалить
          </MenuItem>
        )}
        
        {/* Статусные действия */}
        {selectedTask?.status === 'created' && 
         (selectedTask?.assigned_to?.id === user?.id || !selectedTask?.assigned_to) && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedTask.id, 'in_work');
            handleMenuClose();
          }}>
            Взять в работу
          </MenuItem>
        )}
        
        {selectedTask?.status === 'in_work' && 
         selectedTask?.assigned_to?.id === user?.id && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedTask.id, 'on_review');
            handleMenuClose();
          }}>
            Отправить на проверку
          </MenuItem>
        )}
        
        {/* Завершение задачи доступно: 
            1. Исполнителю (дизайнеру/копирайтеру), если задача на проверке
            2. Менеджеру/руководителю, если задача на проверке */}
        {selectedTask?.status === 'on_review' && (
          selectedTask?.assigned_to?.id === user?.id ||
          (user?.role === 'director' || user?.role === 'manager')
        ) && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedTask.id, 'completed');
            handleMenuClose();
          }}>
            Завершить задачу
          </MenuItem>
        )}
        
        {/* Возврат на доработку - ТОЛЬКО для менеджера/руководителя */}
        {selectedTask?.status === 'on_review' && 
         (user?.role === 'director' || user?.role === 'manager') && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedTask.id, 'in_work');
            handleMenuClose();
          }}>
            Вернуть на доработку
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default TaskList;