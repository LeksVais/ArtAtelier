
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
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';
import { employeesAPI } from '../../api/employees';

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    role: 'designer',
    phone: '',
    position: '',
    work_phone: '',
    work_email: '',
    employment_status: 'active',
    hire_date: new Date(),
    salary_rate: '',
    notes: '',
    password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const roleOptions = [
    { value: 'director', label: 'Руководитель' },
    { value: 'manager', label: 'Менеджер проекта' },
    { value: 'designer', label: 'Дизайнер' },
    { value: 'copywriter', label: 'Копирайтер' },
  ];

  const employmentStatusOptions = [
    { value: 'active', label: 'Активен' },
    { value: 'fired', label: 'Уволен' },
    { value: 'vacation', label: 'В отпуске' },
  ];

  useEffect(() => {
    if (isEdit) {
      fetchEmployee();
    }
  }, [id]);

  const fetchEmployee = async () => {
    setLoading(true);
    try {
      const employee = await employeesAPI.getById(id);
      console.log('Fetched employee:', employee);
      
      // Правильное извлечение данных
      const userData = employee.user_details || employee.user || {};
      
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        middle_name: userData.middle_name || '',
        role: userData.role || 'designer',
        phone: userData.phone || '',
        position: employee.position || '',
        work_phone: employee.work_phone || '',
        work_email: employee.work_email || userData.email || '',
        employment_status: employee.employment_status || 'active',
        hire_date: employee.hire_date ? new Date(employee.hire_date) : new Date(),
        salary_rate: employee.salary_rate || '',
        notes: employee.notes || '',
        password: '', // Пароль не отображаем при редактировании
        confirm_password: '',
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      setFormError('Ошибка при загрузке данных сотрудника');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!isEdit) {
      // При создании проверяем пароли
      if (!formData.username.trim()) {
        newErrors.username = 'Введите имя пользователя';
      }
      if (!formData.password.trim()) {
        newErrors.password = 'Введите пароль';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Пароль должен быть не менее 8 символов';
      }
      if (!formData.confirm_password.trim()) {
        newErrors.confirm_password = 'Подтвердите пароль';
      } else if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Пароли не совпадают';
      }
    }
    
    // Общие проверки
    if (!formData.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Введите имя';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Введите фамилию';
    }
    
    if (!formData.position.trim()) {
      newErrors.position = 'Введите должность';
    }
    
    if (!formData.work_email.trim()) {
      newErrors.work_email = 'Введите рабочий email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.work_email)) {
      newErrors.work_email = 'Введите корректный рабочий email';
    }
    
    if (!formData.employment_status) {
      newErrors.employment_status = 'Выберите статус занятости';
    }
    
    if (!formData.hire_date) {
      newErrors.hire_date = 'Выберите дату приема';
    }
    
    // Показываем первую ошибку
    const firstErrorKey = Object.keys(newErrors)[0];
    if (firstErrorKey) {
      setFormError(newErrors[firstErrorKey]);
      return false;
    }
    
    return true;
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setFormError('');
    setSuccessMessage('');
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      hire_date: date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitLoading(true);
    setFormError('');
    setSuccessMessage('');
    
    try {
      console.log('Submitting form data:', formData);
      
      if (isEdit) {
        // При обновлении отправляем только изменяемые поля
        const updateData = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name,
          role: formData.role,
          phone: formData.phone || '',
          position: formData.position,
          work_phone: formData.work_phone || '',
          work_email: formData.work_email,
          employment_status: formData.employment_status,
          hire_date: formData.hire_date.toISOString().split('T')[0],
          salary_rate: formData.salary_rate ? parseFloat(formData.salary_rate) : null,
          notes: formData.notes || '',
        };
        
        console.log('Updating with data:', updateData);
        await employeesAPI.update(id, updateData);
        setSuccessMessage('Данные сотрудника успешно обновлены');
        
        // Через 2 секунды возвращаемся к списку
        setTimeout(() => {
          navigate('/employees');
        }, 2000);
      } else {
        // При создании отправляем ВСЕ поля из сериализатора
        const createData = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirm_password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name || '',
          role: formData.role,
          phone: formData.phone || '',
          position: formData.position,
          work_phone: formData.work_phone || '',
          work_email: formData.work_email,
          employment_status: formData.employment_status,
          hire_date: formData.hire_date.toISOString().split('T')[0],
          salary_rate: formData.salary_rate ? parseFloat(formData.salary_rate) : null,
          notes: formData.notes || '',
        };
        
        console.log('Creating employee with data:', createData);
        await employeesAPI.create(createData);
        setSuccessMessage('Сотрудник успешно создан');
        
        // Через 2 секунды возвращаемся к списку
        setTimeout(() => {
          navigate('/employees');
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      
      let errorMessage = 'Ошибка при сохранении сотрудника';
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const errorMessages = [];
          for (const [key, value] of Object.entries(error.response.data)) {
            if (Array.isArray(value)) {
              errorMessages.push(`${key}: ${value.join(', ')}`);
            } else if (typeof value === 'string') {
              errorMessages.push(value);
            }
          }
          errorMessage = errorMessages.join(', ') || errorMessage;
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
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Box>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Редактирование сотрудника' : 'Создание сотрудника'}
        </Typography>
        
        {formError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {formError}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}
        
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Поле username ТОЛЬКО при создании */}
            {!isEdit && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Имя пользователя *"
                    value={formData.username}
                    onChange={handleChange('username')}
                    placeholder="Уникальное имя для входа"
                    required
                    error={Boolean(formError && formError.includes('username'))}
                  />
                </Grid>
                
                {/* Поля пароля ТОЛЬКО при создании */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Пароль *"
                    value={formData.password}
                    onChange={handleChange('password')}
                    type={showPassword ? 'text' : 'password'}
                    required
                    error={Boolean(formError && formError.includes('password'))}
                    helperText="Минимум 8 символов"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Подтвердите пароль *"
                    value={formData.confirm_password}
                    onChange={handleChange('confirm_password')}
                    type={showPassword ? 'text' : 'password'}
                    required
                    error={Boolean(formError && formError.includes('confirm_password'))}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowPassword(!showPassword)}
                    size="small"
                  >
                    {showPassword ? 'Скрыть пароли' : 'Показать пароли'}
                  </Button>
                </Grid>
              </>
            )}
            
            {/* При редактировании показываем username как информацию */}
            {isEdit && (
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Имя пользователя
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={formData.username} size="small" />
                    <Typography variant="caption" color="text.secondary">
                      (нельзя изменить)
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Имя *"
                value={formData.first_name}
                onChange={handleChange('first_name')}
                required
                error={Boolean(formError && formError.includes('first_name'))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Фамилия *"
                value={formData.last_name}
                onChange={handleChange('last_name')}
                required
                error={Boolean(formError && formError.includes('last_name'))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Отчество"
                value={formData.middle_name}
                onChange={handleChange('middle_name')}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email *"
                value={formData.email}
                onChange={handleChange('email')}
                type="email"
                required
                error={Boolean(formError && formError.includes('email'))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Телефон"
                value={formData.phone}
                onChange={handleChange('phone')}
                placeholder="+7 (999) 999-99-99"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Роль *</InputLabel>
                <Select
                  value={formData.role}
                  onChange={handleChange('role')}
                  label="Роль *"
                >
                  {roleOptions.map((option) => (
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
                label="Должность *"
                value={formData.position}
                onChange={handleChange('position')}
                required
                error={Boolean(formError && formError.includes('position'))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Рабочий телефон"
                value={formData.work_phone}
                onChange={handleChange('work_phone')}
                placeholder="+7 (999) 999-99-99"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Рабочий email *"
                value={formData.work_email}
                onChange={handleChange('work_email')}
                type="email"
                required
                error={Boolean(formError && formError.includes('work_email'))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Статус занятости *</InputLabel>
                <Select
                  value={formData.employment_status}
                  onChange={handleChange('employment_status')}
                  label="Статус занятости *"
                >
                  {employmentStatusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Дата приема *"
                value={formData.hire_date}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ставка оплаты"
                value={formData.salary_rate}
                onChange={handleChange('salary_rate')}
                type="number"
                InputProps={{
                  inputProps: { min: 0, step: 0.01 }
                }}
                placeholder="0.00"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Заметки"
                value={formData.notes}
                onChange={handleChange('notes')}
                multiline
                rows={3}
                placeholder="Дополнительная информация о сотруднике"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/employees')}
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
                    isEdit ? 'Сохранить изменения' : 'Создать сотрудника'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default EmployeeForm;
