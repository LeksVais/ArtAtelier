import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Assignment as TaskIcon,
  Folder as ProjectIcon,
  Person as PersonIcon,
  Schedule as DeadlineIcon,
} from '@mui/icons-material';
import { notificationsAPI } from '../api/notifications';

const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsAPI.getAll();
      // Исправление: проверяем, что response - это массив
      const notificationsArray = Array.isArray(response) ? response : 
        (response.results || response.data || []);
      
      setNotifications(notificationsArray);
      
      // Подсчет непрочитанных уведомлений
      const unread = notificationsArray.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Устанавливаем пустой массив в случае ошибки
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read && notification.id) {
      await notificationsAPI.markAsRead(notification.id);
      fetchNotifications();
    }
    
    // Navigate to related content
    // Исправление: используем правильные поля из вашей модели
    switch (notification.notification_type) {
      case 'task_assigned':
        window.location.href = `/tasks/${notification.data?.task_id}`;
        break;
      case 'project_updated':
      case 'project_status':
        window.location.href = `/projects/${notification.data?.project_id}`;
        break;
      case 'task_deadline':
      case 'deadline_approaching':
        window.location.href = '/tasks';
        break;
      default:
        break;
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned': return <TaskIcon />;
      case 'task_deadline': return <DeadlineIcon />;
      case 'project_status': return <ProjectIcon />;
      case 'file_uploaded': return <PersonIcon />; // Замените на соответствующую иконку
      case 'comment_added': return <PersonIcon />;
      case 'report_ready': return <InfoIcon />;
      case 'system': return <InfoIcon />;
      case 'error': return <ErrorIcon />;
      case 'success': return <CheckIcon />;
      case 'warning': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'task_deadline':
      case 'error': return 'error';
      case 'success': return 'success';
      case 'warning': return 'warning';
      default: return 'primary';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMinutes = Math.floor((now - date) / 60000);
    
    if (diffMinutes < 1) return 'только что';
    if (diffMinutes < 60) return `${diffMinutes} мин назад`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} ч назад`;
    return `${Math.floor(diffMinutes / 1440)} дн назад`;
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={() => setOpen(true)}
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: 400 } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Уведомления {unreadCount > 0 && `(${unreadCount})`}
          </Typography>
          <Box>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead} sx={{ mr: 1 }}>
                Прочитать все
              </Button>
            )}
            <IconButton size="small" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Divider />

        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {loading ? (
            <ListItem>
              <ListItemText primary="Загрузка..." />
            </ListItem>
          ) : notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="Нет уведомлений"
                secondary="Здесь будут появляться новые уведомления"
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <ListItemIcon sx={{ color: getNotificationColor(notification.notification_type || notification.type) }}>
                    {getNotificationIcon(notification.notification_type || notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: notification.is_read ? 'normal' : 'bold' }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(notification.created_at)}
                        </Typography>
                      </>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                  {!notification.is_read && (
                    <ListItemSecondaryAction>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                        }}
                      />
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                <Divider />
              </React.Fragment>
            ))
          )}
        </List>
      </Drawer>
    </>
  );
};

export default NotificationCenter;