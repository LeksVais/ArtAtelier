import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard,
  Folder,
  Assignment,
  Group,
  People,
  // Удалено: AttachFile - вкладка Файлов
  Assessment,
  Settings,
} from '@mui/icons-material';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const drawerWidth = 240;

const Layout = () => {
  const [open, setOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  // Определяем доступные пункты меню в зависимости от роли пользователя
  const getMenuItems = () => {
    const baseItems = [
      { text: 'Главная', icon: <Dashboard />, path: '/dashboard', roles: ['director', 'manager', 'designer', 'copywriter'] },
      { text: 'Мои задачи', icon: <Assignment />, path: '/tasks', roles: ['director', 'manager', 'designer', 'copywriter'] },
      { text: 'Профиль', icon: <Settings />, path: '/profile', roles: ['director', 'manager', 'designer', 'copywriter'] },
    ];

    const roleSpecificItems = [];
    
    // Руководитель (director) видит всё
    if (user?.role === 'director') {
      roleSpecificItems.push(
        { text: 'Проекты', icon: <Folder />, path: '/projects', roles: ['director'] },
        { text: 'Клиенты', icon: <Group />, path: '/clients', roles: ['director', 'manager'] },
        { text: 'Сотрудники', icon: <People />, path: '/employees', roles: ['director'] },
        { text: 'Отчеты', icon: <Assessment />, path: '/reports', roles: ['director'] }
      );
    }
    
    // Менеджер видит проекты, клиентов
    if (user?.role === 'manager') {
      roleSpecificItems.push(
        { text: 'Проекты', icon: <Folder />, path: '/projects', roles: ['director', 'manager'] },
        { text: 'Клиенты', icon: <Group />, path: '/clients', roles: ['director', 'manager'] },
        { text: 'Отчеты', icon: <Assessment />, path: '/reports', roles: ['director', 'manager'] }
      );
    }
    
    // Дизайнеры и копирайтеры не видят дополнительные пункты
    
    // Фильтруем пункты, доступные для текущей роли
    const allItems = [...baseItems, ...roleSpecificItems];
    return allItems.filter(item => item.roles.includes(user?.role));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = getMenuItems();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            АртСтудия - Управление проектами
          </Typography>
          <Header user={user} onLogout={handleLogout} />
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 0,
            boxSizing: 'border-box',
            transition: 'width 0.3s',
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <Sidebar menuItems={menuItems} />
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${open ? drawerWidth : 0}px)`,
          transition: 'width 0.3s',
        }}
      >
        <Toolbar />
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;