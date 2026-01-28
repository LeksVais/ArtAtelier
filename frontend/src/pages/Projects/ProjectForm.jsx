import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';
import { projectsAPI } from '../../api/projects';
import { clientsAPI } from '../../api/clients';
import { usersAPI } from '../../api/users';
import { validateProjectTitle, validateRequired } from '../../utils/helpers';

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    manager_id: '',
    start_date: new Date(),
    planned_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
    priority: 'medium',
    budget: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [managers, setManagers] = useState([]);
  const [formError, setFormError] = useState('');

  const priorityOptions = [
    { value: 'low', label: 'Низкий' },
    { value: 'medium', label: 'Средний' },
    { value: 'high', label: 'Высокий' },
    { value: 'critical', label: 'Критический' },
  ];

  useEffect(() => {
    fetchData();
    
    if (isEdit) {
      fetchProject();
    }
  }, [id]);

  const fetchData = async () => {
  setLoading(true);
  try {
    const [clientsData, managersData] = await Promise.all([
      clientsAPI.getAll(),
      usersAPI.getManagers(),
    ]);
    
    console.log('Clients data:', clientsData);
    console.log('Managers data:', managersData);
    
    // Обработка клиентов
    let clientsArray = [];
    if (Array.isArray(clientsData)) {
      clientsArray = clientsData;
    } else if (clientsData && typeof clientsData === 'object') {
      clientsArray = clientsData.results || clientsData.data || Object.values(clientsData);
    }
    
    // Обработка менеджеров
    let managersArray = [];
    if (Array.isArray(managersData)) {
      managersArray = managersData;
    } else if (managersData && typeof managersData === 'object') {
      managersArray = managersData.results || managersData.data || Object.values(managersData);
    }
    
    // Проверяем, есть ли поле full_name, если нет - создаем его
    managersArray = managersArray.map(manager => {
      if (!manager.full_name) {
        if (manager.first_name && manager.last_name) {
          manager.full_name = `${manager.first_name} ${manager.last_name}`;
        } else if (manager.username) {
          manager.full_name = manager.username;
        } else if (manager.email) {
          manager.full_name = manager.email.split('@')[0];
        } else {
          manager.full_name = `Пользователь ${manager.id}`;
        }
      }
      return manager;
    });
    
    console.log('Processed clients:', clientsArray);
    console.log('Processed managers:', managersArray);
    
    setClients(Array.isArray(clientsArray) ? clientsArray : []);
    setManagers(Array.isArray(managersArray) ? managersArray : []);
    
  } catch (error) {
    console.error('Error fetching form data:', error);
    setFormError('Ошибка при загрузке данных');
    
    // Устанавливаем заглушки для тестирования
    setClients([
      { id: 1, name: 'Клиент 1' },
      { id: 2, name: 'Клиент 2' },
    ]);
    
    setManagers([
      { id: 1, full_name: 'Тестовый менеджер 1', first_name: 'Тест', last_name: 'Менеджер' },
      { id: 2, full_name: 'Тестовый менеджер 2', first_name: 'Тест', last_name: 'Админ' },
    ]);
  } finally {
    setLoading(false);
  }
};

  const fetchProject = async () => {
    try {
      const project = await projectsAPI.getById(id);
      setFormData({
        title: project.title || '',
        description: project.description || '',
        client_id: project.client?.id || '',
        manager_id: project.manager?.id || '',
        start_date: project.start_date ? new Date(project.start_date) : new Date(),
        planned_end_date: project.planned_end_date ? new Date(project.planned_end_date) : new Date(),
        priority: project.priority || 'medium',
        budget: project.budget || '',
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      setFormError('Ошибка при загрузке проекта');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Валидация названия проекта (3-255 символов, разрешенные символы)
    if (!validateProjectTitle(formData.title)) {
      newErrors.title = 'Название должно содержать 3-255 символов (буквы, цифры, пробелы, - , . () )';
    }
    
    // Обязательные поля
    if (!validateRequired(formData.client_id)) {
      newErrors.client_id = 'Выберите клиента';
    }
    
    if (!validateRequired(formData.manager_id)) {
      newErrors.manager_id = 'Выберите менеджера';
    }
    
    // Проверка дат
    if (formData.planned_end_date <= formData.start_date) {
      newErrors.planned_end_date = 'Дата завершения должна быть позже даты начала';
    }
    
    if (formData.start_date < new Date()) {
      newErrors.start_date = 'Дата начала не может быть в прошлом';
    }
    
    // Валидация бюджета (если указан)
    if (formData.budget && (isNaN(formData.budget) || Number(formData.budget) < 0)) {
      newErrors.budget = 'Бюджет должен быть положительным числом';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitLoading(true);
    setFormError('');
    
    try {
      const projectData = {
        title: formData.title,
        description: formData.description,
        client: formData.client_id,
        manager: formData.manager_id,
        start_date: formData.start_date.toISOString().split('T')[0],
        planned_end_date: formData.planned_end_date.toISOString().split('T')[0],
        priority: formData.priority,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      };
      
      if (isEdit) {
        await projectsAPI.update(id, projectData);
      } else {
        await projectsAPI.create(projectData);
      }
      
      navigate('/projects');
    } catch (error) {
      console.error('Error saving project:', error);
      
      let errorMessage = 'Ошибка при сохранении проекта';
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          errorMessage = Object.values(error.response.data).flat().join(', ');
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      
      setFormError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
      <Box>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Редактирование проекта' : 'Создание проекта'}
        </Typography>
        
        {formError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {formError}
          </Alert>
        )}
        
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Название проекта */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Название проекта *"
                value={formData.title}
                onChange={handleChange('title')}
                error={Boolean(errors.title)}
                helperText={errors.title}
                placeholder="Введите название проекта (3-255 символов)"
              />
            </Grid>
            
            {/* Описание проекта */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Описание проекта"
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={4}
                placeholder="Подробное описание проекта"
              />
            </Grid>
            
            {/* Клиент */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={Boolean(errors.client_id)}>
                <InputLabel>Клиент *</InputLabel>
                <Select
                  value={formData.client_id}
                  onChange={handleChange('client_id')}
                  label="Клиент *"
                >
                  <MenuItem value="">
                    <em>Выберите клиента</em>
                  </MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name || `${client.first_name} ${client.last_name}`}
                    </MenuItem>
                  ))}
                </Select>
                {errors.client_id && <FormHelperText>{errors.client_id}</FormHelperText>}
              </FormControl>
            </Grid>
            
            {/* Менеджер проекта */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={Boolean(errors.manager_id)}>
                <InputLabel>Менеджер проекта *</InputLabel>
                <Select
                  value={formData.manager_id}
                  onChange={handleChange('manager_id')}
                  label="Менеджер проекта *"
                >
                  <MenuItem value="">
                    <em>Выберите менеджера</em>
                  </MenuItem>
                  {managers.map((manager) => (
                    <MenuItem key={manager.id} value={manager.id}>
                      {manager.full_name || `${manager.first_name} ${manager.last_name}`}
                    </MenuItem>
                  ))}
                </Select>
                {errors.manager_id && <FormHelperText>{errors.manager_id}</FormHelperText>}
              </FormControl>
            </Grid>
            
            {/* Дата начала */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Дата начала *"
                value={formData.start_date}
                onChange={handleDateChange('start_date')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: Boolean(errors.start_date),
                    helperText: errors.start_date,
                  },
                }}
                minDate={new Date()}
              />
            </Grid>
            
            {/* Плановая дата завершения */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Плановая дата завершения *"
                value={formData.planned_end_date}
                onChange={handleDateChange('planned_end_date')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: Boolean(errors.planned_end_date),
                    helperText: errors.planned_end_date,
                  },
                }}
                minDate={formData.start_date}
              />
            </Grid>
            
            {/* Приоритет */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Приоритет</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={handleChange('priority')}
                  label="Приоритет"
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Бюджет */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Бюджет"
                value={formData.budget}
                onChange={handleChange('budget')}
                error={Boolean(errors.budget)}
                helperText={errors.budget}
                type="number"
                InputProps={{
                  inputProps: { min: 0, step: 0.01 }
                }}
                placeholder="0.00"
              />
            </Grid>
            
            {/* Кнопки */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/projects')}
                  disabled={submitLoading}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    isEdit ? 'Сохранить изменения' : 'Создать проект'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
  );
};

export default ProjectForm;