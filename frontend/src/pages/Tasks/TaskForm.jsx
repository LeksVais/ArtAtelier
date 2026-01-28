import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

// ИСПРАВЛЕННЫЕ ИМПОРТЫ - используем именованные экспорты
import { tasksAPI } from '../../api/tasks';
import { projectsAPI } from '../../api/projects';
import { usersAPI } from '../../api/users';

const TaskForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    assigned_to: '',
    deadline: '',
    priority: 'medium',
    estimated_hours: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchFormData();
    fetchProjects();
    fetchUsers();
  }, [id]);

  const fetchFormData = async () => {
    if (!isEdit) return;

    try {
      setLoading(true);
      const task = await tasksAPI.getById(id);
      console.log('Fetched task data:', task);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        project: task.project?.id || task.project || '',
        assigned_to: task.assigned_to?.id || task.assigned_to || '',
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
        priority: task.priority || 'medium',
        estimated_hours: task.estimated_hours || '',
      });
    } catch (err) {
      setError('Не удалось загрузить данные задачи');
      console.error('Error fetching task:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...');
      const response = await projectsAPI.getAll();
      console.log('Projects API response:', response);
      
      let projectsData = [];
      
      if (Array.isArray(response)) {
        projectsData = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.results)) {
          projectsData = response.results;
        } else if (Array.isArray(response.data)) {
          projectsData = response.data;
        } else if (Array.isArray(response.projects)) {
          projectsData = response.projects;
        } else if (response.items && Array.isArray(response.items)) {
          projectsData = response.items;
        } else {
          projectsData = Object.values(response).filter(item => item && typeof item === 'object');
        }
      }
      
      console.log('Processed projects data:', projectsData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await usersAPI.getAll();
      console.log('Users API response:', response);
      
      let usersData = [];
      
      if (Array.isArray(response)) {
        usersData = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.results)) {
          usersData = response.results;
        } else if (Array.isArray(response.data)) {
          usersData = response.data;
        } else if (Array.isArray(response.users)) {
          usersData = response.users;
        } else {
          usersData = Object.values(response).filter(item => item && typeof item === 'object');
        }
      }
      
      console.log('Processed users data:', usersData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Название должно быть не менее 3 символов';
    }

    if (!formData.project) {
      newErrors.project = 'Проект обязателен';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Срок выполнения обязателен';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        newErrors.deadline = 'Срок выполнения не может быть в прошлом';
      }
    }

    if (formData.estimated_hours) {
      const hours = parseFloat(formData.estimated_hours);
      if (isNaN(hours) || hours <= 0) {
        newErrors.estimated_hours = 'Введите корректное количество часов';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const dataToSend = {
        title: formData.title,
        description: formData.description || '',
        project: parseInt(formData.project),
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        deadline: formData.deadline,
        priority: formData.priority,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      };

      console.log('Отправляемые данные задачи:', dataToSend);
      console.log('URL эндпоинта: /projects/project-tasks/');
      
      if (isEdit) {
        console.log(`Обновление задачи с ID: ${id}`);
        await tasksAPI.update(id, dataToSend);
        setSuccess('Задача успешно обновлена');
      } else {
        console.log('Создание новой задачи');
        await tasksAPI.create(dataToSend);
        setSuccess('Задача успешно создана');
      }

      setTimeout(() => {
        navigate('/tasks');
      }, 2000);

    } catch (err) {
      console.error('Ошибка при сохранении задачи:', err);
      console.error('Детали ошибки:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.detail || err.message || 'Произошла ошибка при сохранении задачи');
    } finally {
      setSaving(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Низкий' },
    { value: 'medium', label: 'Средний' },
    { value: 'high', label: 'Высокий' },
    { value: 'critical', label: 'Критический' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Редактирование задачи' : 'Создание задачи'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Название задачи *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Описание"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.project}>
                <InputLabel>Проект *</InputLabel>
                <Select
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  label="Проект *"
                  disabled={saving || projects.length === 0}
                >
                  <MenuItem value="">
                    <em>Выберите проект</em>
                  </MenuItem>
                  {Array.isArray(projects) && projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.title || project.name || `Проект #${project.id}`}
                    </MenuItem>
                  ))}
                </Select>
                {errors.project && <FormHelperText>{errors.project}</FormHelperText>}
                {projects.length === 0 && !saving && (
                  <FormHelperText>Проекты не найдены</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Исполнитель</InputLabel>
                <Select
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  label="Исполнитель"
                  disabled={saving || users.length === 0}
                >
                  <MenuItem value="">
                    <em>Не назначен</em>
                  </MenuItem>
                  {Array.isArray(users) && users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username || `Пользователь #${user.id}`}
                    </MenuItem>
                  ))}
                </Select>
                {users.length === 0 && !saving && (
                  <FormHelperText>Пользователи не найдены</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Срок выполнения *"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
                error={!!errors.deadline}
                helperText={errors.deadline}
                disabled={saving}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Приоритет</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Приоритет"
                  disabled={saving}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Плановое время (часы)"
                name="estimated_hours"
                type="number"
                value={formData.estimated_hours}
                onChange={handleChange}
                error={!!errors.estimated_hours}
                helperText={errors.estimated_hours}
                disabled={saving}
                inputProps={{ step: "0.1", min: "0" }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/tasks')}
                  disabled={saving}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  startIcon={saving && <CircularProgress size={20} />}
                >
                  {saving ? 'Сохранение...' : isEdit ? 'Обновить' : 'Создать'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default TaskForm;