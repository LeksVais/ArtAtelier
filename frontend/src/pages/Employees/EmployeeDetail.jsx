import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tab,
  Tabs,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AccountBalanceWallet as SalaryIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';

const EmployeeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.get(`/auth/employees/${id}/`);
      setEmployee(response.data);
    } catch (error) {
      console.error('Error fetching employee:', error);
      setError('Не удалось загрузить данные сотрудника');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      vacation: 'warning',
      fired: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Активен',
      vacation: 'В отпуске',
      fired: 'Уволен',
    };
    return labels[status] || status;
  };

  const getRoleLabel = (role) => {
    const labels = {
      director: 'Руководитель',
      manager: 'Менеджер проекта',
      designer: 'Дизайнер',
      copywriter: 'Копирайтер',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/employees')}
          sx={{ mb: 3 }}
        >
          Назад к списку
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/employees')}
          sx={{ mb: 3 }}
        >
          Назад к списку
        </Button>
        <Alert severity="info">Сотрудник не найден</Alert>
      </Box>
    );
  }

  const userData = employee.user_details || employee.user || employee;

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/employees')}
        >
          Назад
        </Button>
        <Typography variant="h4">
          Карточка сотрудника
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Левая колонка - информация о сотруднике */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={userData.avatar || '/default-avatar.png'}
                  sx={{ width: 120, height: 120, mb: 2 }}
                />
                <Typography variant="h5" gutterBottom>
                  {userData.last_name} {userData.first_name} {userData.middle_name || ''}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {employee.position}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={getStatusLabel(employee.employment_status)}
                    color={getStatusColor(employee.employment_status)}
                    size="small"
                  />
                  <Chip
                    label={getRoleLabel(userData.role)}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email" 
                    secondary={employee.work_email || userData.email || 'Не указан'} 
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Телефон" 
                    secondary={employee.work_phone || userData.phone || 'Не указан'} 
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Дата приема" 
                    secondary={formatDate(employee.hire_date)} 
                  />
                </ListItem>

                {employee.salary_rate && (
                  <ListItem>
                    <ListItemIcon>
                      <SalaryIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Ставка" 
                      secondary={`${employee.salary_rate} ₽`} 
                    />
                  </ListItem>
                )}

                <ListItem>
                  <ListItemIcon>
                    <BadgeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Логин" 
                    secondary={userData.username} 
                  />
                </ListItem>
              </List>

              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(`/employees/${id}/edit`)}
                >
                  Редактировать
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Правая колонка - табы с дополнительной информацией */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Общая информация" />
              <Tab label="Проекты" />
              <Tab label="Задачи" />
              <Tab label="Заметки" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Дополнительная информация
                  </Typography>
                  {employee.notes ? (
                    <Typography variant="body1" paragraph>
                      {employee.notes}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Дополнительная информация отсутствует
                    </Typography>
                  )}

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Системная информация
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        ID сотрудника:
                      </Typography>
                      <Typography variant="body1">
                        {employee.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        ID пользователя:
                      </Typography>
                      <Typography variant="body1">
                        {userData.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Дата создания:
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(employee.created_at)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Статус в системе:
                      </Typography>
                      <Typography variant="body1">
                        {employee.is_active ? 'Активен' : 'Неактивен'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Проекты сотрудника
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Интеграция с проектами будет реализована позже
                  </Typography>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Задачи сотрудника
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Интеграция с задачами будет реализована позже
                  </Typography>
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Заметки и комментарии
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Функционал заметок будет реализован позже
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeDetail;