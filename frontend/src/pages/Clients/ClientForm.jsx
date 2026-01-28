import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Snackbar,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Language as LanguageIcon,
  LocationOn as LocationOnIcon,
  Notes as NotesIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { clientsAPI } from '../../api/clients';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Валидационная схема
const validationSchema = Yup.object({
  name: Yup.string()
    .required('Обязательное поле')
    .min(2, 'Минимум 2 символа')
    .max(255, 'Максимум 255 символов'),
  contact_person: Yup.string()
    .required('Обязательное поле')
    .min(2, 'Минимум 2 символа')
    .max(150, 'Максимум 150 символов')
    .matches(/^[а-яёА-ЯЁ\s\.\-]+$/, 'Только русские буквы, пробелы, точки и дефисы'),
  phone: Yup.string()
    .required('Обязательное поле')
    .matches(
      /^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/,
      'Введите корректный номер телефона'
    ),
  email: Yup.string()
    .required('Обязательное поле')
    .email('Введите корректный email'),
  website: Yup.string()
    .url('Введите корректный URL')
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  address: Yup.string()
    .max(500, 'Максимум 500 символов')
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  notes: Yup.string()
    .max(1000, 'Максимум 1000 символов')
    .nullable()
    .transform((value) => (value === '' ? null : value)),
});

const ClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState(null);

  // Инициализация формы
  const formik = useFormik({
    initialValues: {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      notes: '',
      is_active: true,
      is_archived: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        setFormError(null);

        // Подготовка данных для отправки
        const clientData = {
          name: values.name.trim(),
          contact_person: values.contact_person.trim(),
          phone: values.phone.trim(),
          email: values.email.trim().toLowerCase(),
          website: values.website?.trim() || null,
          address: values.address?.trim() || null,
          notes: values.notes?.trim() || null,
          is_active: values.is_active,
          is_archived: values.is_archived,
        };

        console.log('Отправка данных клиента на /auth/clients/ :', clientData);

        if (isEdit) {
          // Редактирование существующего клиента
          await clientsAPI.update(id, clientData);
          setSuccess('Клиент успешно обновлен!');
          formik.resetForm({ values: clientData });
        } else {
          // Создание нового клиента
          await clientsAPI.create(clientData);
          setSuccess('Клиент успешно создан!');
          
          // Перенаправляем на список клиентов через 1.5 секунды
          setTimeout(() => {
            navigate('/clients');
          }, 1500);
        }
      } catch (err) {
        console.error('Ошибка сохранения клиента:', err);
        
        // Более детальная обработка ошибок
        let errorMessage = 'Произошла ошибка при сохранении';
        
        if (err.response?.status === 400) {
          errorMessage = 'Проверьте правильность введенных данных';
          // Устанавливаем ошибки валидации в Formik
          if (err.response.data) {
            const fieldErrors = {};
            Object.entries(err.response.data).forEach(([field, errors]) => {
              if (field !== 'non_field_errors') {
                fieldErrors[field] = Array.isArray(errors) ? errors.join(', ') : errors;
              }
            });
            formik.setErrors(fieldErrors);
            
            // Общие ошибки без поля
            if (err.response.data.non_field_errors) {
              errorMessage = err.response.data.non_field_errors.join(', ');
            }
          }
        } else if (err.response?.status === 401) {
          errorMessage = 'Требуется авторизация. Войдите снова.';
          setTimeout(() => navigate('/login'), 2000);
        } else if (err.response?.status === 403) {
          errorMessage = 'У вас нет прав для выполнения этого действия';
        } else if (err.response?.status === 404) {
          errorMessage = 'Эндпоинт /auth/clients/ не найден. Проверьте настройки API.';
        } else if (err.response?.status === 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже.';
        } else if (err.message === 'Network Error') {
          errorMessage = 'Нет соединения с сервером. Проверьте подключение.';
        }
        
        // Устанавливаем общую ошибку формы
        if (err.response?.data) {
          if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message;
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
  });

  // Загрузка данных клиента для редактирования
  useEffect(() => {
    const fetchClient = async () => {
      if (!isEdit) return;
      
      try {
        setFetching(true);
        const client = await clientsAPI.getById(id);
        
        formik.setValues({
          name: client.name || '',
          contact_person: client.contact_person || '',
          phone: client.phone || '',
          email: client.email || '',
          website: client.website || '',
          address: client.address || '',
          notes: client.notes || '',
          is_active: client.is_active !== undefined ? client.is_active : true,
          is_archived: client.is_archived || false,
        });
      } catch (err) {
        console.error('Ошибка загрузки клиента:', err);
        let errorMessage = 'Не удалось загрузить данные клиента';
        
        if (err.response?.status === 404) {
          errorMessage = 'Клиент не найден по пути /auth/clients/';
          setTimeout(() => navigate('/clients'), 2000);
        } else if (err.response?.status === 401) {
          errorMessage = 'Требуется авторизация';
          setTimeout(() => navigate('/login'), 2000);
        }
        
        setFormError(errorMessage);
      } finally {
        setFetching(false);
      }
    };

    fetchClient();
  }, [id, isEdit, navigate]);

  const handleCancel = () => {
    if (formik.dirty) {
      if (window.confirm('У вас есть несохраненные изменения. Выйти без сохранения?')) {
        navigate('/clients');
      }
    } else {
      navigate('/clients');
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Форматирование номера телефона
    if (value.length > 0) {
      if (value[0] === '8') {
        value = '+7' + value.slice(1);
      } else if (value[0] === '7') {
        value = '+' + value;
      } else if (value.length >= 1) {
        value = '+7' + value;
      }
      
      // Добавление скобок и дефисов
      if (value.length > 2) {
        value = value.slice(0, 2) + ' (' + value.slice(2);
      }
      if (value.length > 7) {
        value = value.slice(0, 7) + ') ' + value.slice(7);
      }
      if (value.length > 12) {
        value = value.slice(0, 12) + '-' + value.slice(12);
      }
      if (value.length > 15) {
        value = value.slice(0, 15) + '-' + value.slice(15);
      }
    }
    
    formik.setFieldValue('phone', value);
  };

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (formError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/clients')}>
          Вернуться к списку клиентов
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Заголовок и кнопки */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleCancel}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {isEdit ? 'Редактирование клиента' : 'Добавление клиента'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={formik.handleSubmit}
            disabled={loading || (!formik.dirty && isEdit)}
          >
            {loading ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </Button>
        </Box>
      </Box>

      {/* Форма */}
      <Paper sx={{ p: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Основная информация */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon />
                Основная информация
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* Название компании */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Название компании / ФИО"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Контактное лицо */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="contact_person"
                name="contact_person"
                label="Контактное лицо"
                value={formik.values.contact_person}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.contact_person && Boolean(formik.errors.contact_person)}
                helperText={formik.touched.contact_person && formik.errors.contact_person}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Контактная информация */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <PhoneIcon />
                Контактная информация
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* Телефон */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="phone"
                name="phone"
                label="Телефон"
                value={formik.values.phone}
                onChange={handlePhoneChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone || 'Формат: +7 (XXX) XXX-XX-XX'}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Дополнительная информация */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <NotesIcon />
                Дополнительная информация
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* Веб-сайт */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="website"
                name="website"
                label="Веб-сайт"
                value={formik.values.website}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.website && Boolean(formik.errors.website)}
                helperText={formik.touched.website && formik.errors.website}
                placeholder="https://example.com"
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LanguageIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Адрес */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="address"
                name="address"
                label="Адрес"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Заметки */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="notes"
                name="notes"
                label="Заметки"
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.notes && Boolean(formik.errors.notes)}
                helperText={formik.touched.notes && formik.errors.notes}
                multiline
                rows={4}
                placeholder="Дополнительная информация о клиенте..."
                disabled={loading}
              />
            </Grid>

            {/* Статус (только для редактирования) */}
            {isEdit && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Статус
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formik.values.is_active}
                          onChange={(e) => formik.setFieldValue('is_active', e.target.checked)}
                          name="is_active"
                          disabled={loading}
                        />
                      }
                      label="Активный клиент"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formik.values.is_archived}
                          onChange={(e) => formik.setFieldValue('is_archived', e.target.checked)}
                          name="is_archived"
                          color="default"
                          disabled={loading}
                        />
                      }
                      label="В архиве"
                    />
                  </Grid>
                </Grid>
              </Grid>
            )}

            {/* Кнопки формы */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading || (!formik.dirty && isEdit)}
                >
                  {loading ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать клиента'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Уведомления об ошибках */}
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}

      {/* Уведомление об успехе */}
      {success && (
        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSuccess(false)} sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default ClientForm;