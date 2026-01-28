import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../api/tasks';
import { formatDate } from '../../utils/helpers';
import SortableTaskCard from './SortableTaskCard';

const TaskBoard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState({});
  const [activeTask, setActiveTask] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const columns = {
    created: { id: 'created', title: 'Создана', color: '#9e9e9e' },
    in_work: { id: 'in_work', title: 'В работе', color: '#2196f3' },
    on_review: { id: 'on_review', title: 'На проверке', color: '#ff9800' },
    completed: { id: 'completed', title: 'Завершена', color: '#4caf50' },
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      let response;
      
      // Для обычных сотрудников показываем только их задачи
      if (user?.role === 'designer' || user?.role === 'copywriter') {
        response = await tasksAPI.getMyTasks();
      } else {
        // Для руководителя и менеджера - все задачи
        response = await tasksAPI.getAll();
      }
      
      console.log('Tasks API response:', response);
      
      let tasksData = [];
      
      if (Array.isArray(response)) {
        tasksData = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.results)) {
          tasksData = response.results;
        } else if (Array.isArray(response.data)) {
          tasksData = response.data;
        } else if (Array.isArray(response.tasks)) {
          tasksData = response.tasks;
        } else {
          tasksData = Object.values(response).filter(item => item && typeof item === 'object');
        }
      }
      
      console.log('Processed tasks data:', tasksData);
      const grouped = groupTasksByStatus(tasksData);
      setTasks(grouped);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Не удалось загрузить задачи. Ошибка сервера: ' + (error.response?.data || error.message));
      setTasks({});
    } finally {
      setLoading(false);
    }
  };

  const groupTasksByStatus = (taskList) => {
    const grouped = {};
    Object.keys(columns).forEach(status => {
      grouped[status] = taskList.filter(task => task.status === status);
    });
    return grouped;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTask(active.data.current?.task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const activeStatus = active.data.current?.status;
    const overStatus = over.data.current?.status;

    if (activeStatus === overStatus) return;

    try {
      const taskId = parseInt(activeId);
      const newStatus = overStatus;

      console.log(`Changing task ${taskId} from ${activeStatus} to ${newStatus}`);

      // Обновляем статус через API
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
        default:
          return;
      }

      // Обновляем локальное состояние
      const task = tasks[activeStatus]?.find(t => t.id === taskId);
      if (task) {
        setTasks(prev => ({
          ...prev,
          [activeStatus]: prev[activeStatus]?.filter(t => t.id !== taskId) || [],
          [newStatus]: [...(prev[newStatus] || []), { ...task, status: newStatus }]
        }));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(`Не удалось изменить статус задачи: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const priorityColors = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336',
    critical: '#d32f2f',
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Загрузка задач...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h4">Доска задач</Typography>
        {/* Кнопка создания задач только для руководителя и менеджера */}
        {(user?.role === 'director' || user?.role === 'manager') && (
          <Button
            variant="contained"
            onClick={() => navigate('/tasks/new')}
          >
            Новая задача
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {Object.values(columns).map(column => (
            <Box key={column.id} sx={{ minWidth: 300 }}>
              <Paper
                sx={{
                  bgcolor: 'background.paper',
                  border: `2px solid ${column.color}40`,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ p: 2, borderBottom: `2px solid ${column.color}` }}>
                  <Typography variant="h6">
                    {column.title} ({(tasks[column.id] || []).length})
                  </Typography>
                </Box>
                <Box sx={{ p: 2, minHeight: 400 }}>
                  <SortableContext
                    items={(tasks[column.id] || []).map(t => t.id.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    {(tasks[column.id] || []).map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onMenuClick={handleMenuOpen}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        priorityColors={priorityColors}
                      />
                    ))}
                  </SortableContext>
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>

        <DragOverlay>
          {activeTask && (
            <Card
              sx={{
                width: 300,
                cursor: 'grabbing',
                boxShadow: 3,
                transform: 'rotate(5deg)',
              }}
            >
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {activeTask.title}
                </Typography>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      <Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={handleMenuClose}
>
  <MenuItem onClick={() => {
    navigate(`/tasks/${selectedTask?.id}`);
    handleMenuClose();
  }}>
    Просмотр
  </MenuItem>
  
  {/* Редактирование и удаление только для руководителя и менеджера */}
  {(user?.role === 'director' || user?.role === 'manager') && (
    <>
      <MenuItem onClick={() => {
        navigate(`/tasks/${selectedTask?.id}/edit`);
        handleMenuClose();
      }}>
        Редактировать
      </MenuItem>
      <MenuItem onClick={async () => {
        if (selectedTask) {
          try {
            await tasksAPI.delete(selectedTask.id);
            fetchTasks();
          } catch (error) {
            console.error('Error deleting task:', error);
            alert(`Не удалось удалить задачу: ${error.response?.data?.detail || error.message}`);
          }
          handleMenuClose();
        }
      }}>
        Удалить
      </MenuItem>
    </>
  )}
  
  {/* Завершение задачи доступно: 
      1. Исполнителю (дизайнеру/копирайтеру), если задача на проверке
      2. Менеджеру/руководителю, если задача на проверке */}
  {selectedTask?.status === 'on_review' && (
    (selectedTask?.assigned_to?.id === user?.id && 
     (user?.role === 'designer' || user?.role === 'copywriter')) ||
    (user?.role === 'director' || user?.role === 'manager')
  ) && (
    <MenuItem onClick={async () => {
      if (selectedTask) {
        try {
          await tasksAPI.complete(selectedTask.id);
          fetchTasks();
        } catch (error) {
          console.error('Error completing task:', error);
          alert(`Не удалось завершить задачу: ${error.response?.data?.detail || error.message}`);
        }
        handleMenuClose();
      }
    }}>
      Завершить задачу
    </MenuItem>
  )}
  
  {/* Возврат на доработку - ТОЛЬКО для менеджера/руководителя */}
  {selectedTask?.status === 'on_review' && 
   (user?.role === 'director' || user?.role === 'manager') && (
    <MenuItem onClick={async () => {
      if (selectedTask) {
        try {
          await tasksAPI.returnForRevision(selectedTask.id);
          fetchTasks();
        } catch (error) {
          console.error('Error returning task for revision:', error);
          alert(`Не удалось вернуть задачу на доработку: ${error.response?.data?.detail || error.message}`);
        }
        handleMenuClose();
      }
    }}>
      Вернуть на доработку
    </MenuItem>
  )}
</Menu>
    </Box>
  );
};

export default TaskBoard;