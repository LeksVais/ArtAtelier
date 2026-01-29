import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  Tabs,
  Tab,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/auth';

const profileSchema = yup.object({
  first_name: yup.string().required('Обязательное поле'),
  last_name: yup.string().required('Обязательное поле'),
  email: yup.string().email('Неверный email').required('Обязательное поле'),
  phone: yup.string(),
});

const passwordSchema = yup.object({
  current_password: yup.string().required('Обязательное поле'),
  new_password: yup.string().min(8, 'Минимум 8 символов').required('Обязательное поле'),
  confirm_password: yup.string()
    .oneOf([yup.ref('new_password'), null], 'Пароли не совпадают')
    .required('Обязательное поле'),
});

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: user || {},
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      resetProfile(user);
    }
  }, [user, resetProfile]);

  const handleProfileSubmit = async (data) => {
    try {
      const updatedUser = await authAPI.updateProfile(data);
      updateUser(updatedUser);
      setEditing(false);
      setSuccessMessage('Профиль успешно обновлен');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSuccessMessage('Ошибка при обновлении профиля');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handlePasswordSubmit = async (data) => {
    try {
      await authAPI.changePassword(data);
      resetPassword();
      setSuccessMessage('Пароль успешно изменен');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setSuccessMessage('Ошибка при изменении пароля');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const updatedUser = await authAPI.updateProfile(formData);
      updateUser(updatedUser);
      setSuccessMessage('Аватар обновлен');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating avatar:', error);
      setSuccessMessage('Ошибка при обновлении аватара');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Профиль пользователя
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<PersonIcon />} label="Личные данные" />
          <Tab icon={<SecurityIcon />} label="Безопасность" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Личные данные</Typography>
            {!editing ? (
              <Button
                startIcon={<EditIcon />}
                onClick={() => setEditing(true)}
                variant="outlined"
              >
                Редактировать
              </Button>
            ) : (
              <Box>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={handleSubmitProfile(handleProfileSubmit)}
                  sx={{ mr: 1 }}
                  variant="contained"
                >
                  Сохранить
                </Button>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    setEditing(false);
                    resetProfile(user);
                  }}
                  variant="outlined"
                >
                  Отмена
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  src={user?.avatar_url}
                  sx={{ width: 120, height: 120, mb: 2 }}
                />
                {editing && (
                  <>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="avatar-upload"
                      type="file"
                      onChange={handleAvatarChange}
                    />
                    <label htmlFor="avatar-upload">
                      <Button variant="outlined" component="span">
                        Изменить фото
                      </Button>
                    </label>
                  </>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Фамилия"
                    {...registerProfile('last_name')}
                    error={!!profileErrors.last_name}
                    helperText={profileErrors.last_name?.message}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Имя"
                    {...registerProfile('first_name')}
                    error={!!profileErrors.first_name}
                    helperText={profileErrors.first_name?.message}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Отчество"
                    {...registerProfile('middle_name')}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    {...registerProfile('email')}
                    error={!!profileErrors.email}
                    helperText={profileErrors.email?.message}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Телефон"
                    {...registerProfile('phone')}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Должность"
                    value={user?.role || ''}
                    disabled
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Настройки интерфейса
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Часовой пояс"
                select
                value={user?.timezone || 'Europe/Moscow'}
                disabled
              >
                <option value="Europe/Moscow">Москва (GMT+3)</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Язык"
                select
                value={user?.language || 'ru'}
                disabled
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Безопасность
          </Typography>

          <form onSubmit={handleSubmitPassword(handlePasswordSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Смена пароля
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Текущий пароль"
                  type={showPassword.current ? 'text' : 'password'}
                  {...registerPassword('current_password')}
                  error={!!passwordErrors.current_password}
                  helperText={passwordErrors.current_password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword({
                            ...showPassword,
                            current: !showPassword.current,
                          })}
                        >
                          {showPassword.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Новый пароль"
                  type={showPassword.new ? 'text' : 'password'}
                  {...registerPassword('new_password')}
                  error={!!passwordErrors.new_password}
                  helperText={passwordErrors.new_password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword({
                            ...showPassword,
                            new: !showPassword.new,
                          })}
                        >
                          {showPassword.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Подтверждение пароля"
                  type={showPassword.confirm ? 'text' : 'password'}
                  {...registerPassword('confirm_password')}
                  error={!!passwordErrors.confirm_password}
                  helperText={passwordErrors.confirm_password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword({
                            ...showPassword,
                            confirm: !showPassword.confirm,
                          })}
                        >
                          {showPassword.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained">
                  Сменить пароль
                </Button>
              </Grid>
            </Grid>
          </form>

          <Divider sx={{ my: 3 }} />

          <Box>
            <Typography variant="h6" gutterBottom>
              Рекомендации по безопасности
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • Используйте надежный пароль, содержащий буквы, цифры и специальные символы
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • Никогда не передавайте свой пароль третьим лицам
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • Регулярно меняйте пароль для повышения безопасности
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • Выходите из системы при использовании общественных компьютеров
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Profile;