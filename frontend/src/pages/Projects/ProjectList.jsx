import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  InputAdornment,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Visibility as ViewIcon,
  RestoreFromTrash as RestoreIcon,
  Delete as DeleteIcon,
  ArchiveOutlined as ArchiveOutlinedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../api/projects';
import { formatDate, getStatusColor } from '../../utils/helpers';

const ProjectList = () => {
  const navigate = useNavigate();
  const [activeProjects, setActiveProjects] = useState([]);
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tabValue, setTabValue] = useState(0); // 0 - активные, 1 - архивные
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    fetchProjects();
  }, [tabValue]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tabValue === 0) {
        // Загружаем активные проекты
        const response = await projectsAPI.getAll();
        let projectsArray = [];
        
        if (Array.isArray(response)) {
          projectsArray = response;
        } else if (response && typeof response === 'object') {
          projectsArray = response.results || response.data || Object.values(response);
        }
        
        // Фильтруем только активные проекты
        const active = projectsArray.filter(project => project.is_active !== false);
        setActiveProjects(Array.isArray(active) ? active : []);
      } else {
        // Загружаем архивные проекты
        const archived = await projectsAPI.getArchived();
        setArchivedProjects(Array.isArray(archived) ? archived : []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Ошибка при загрузке проектов');
      setActiveProjects([]);
      setArchivedProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleEdit = () => {
    if (selectedProject) {
      navigate(`/projects/${selectedProject.id}/edit`);
    }
    handleMenuClose();
  };

  const handleView = () => {
    if (selectedProject) {
      navigate(`/projects/${selectedProject.id}`);
    }
    handleMenuClose();
  };

  const handleArchive = async () => {
    if (selectedProject) {
      try {
        await projectsAPI.archive(selectedProject.id);
        fetchProjects();
        setSnackbar({
          open: true,
          message: 'Проект успешно архивирован',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error archiving project:', error);
        setSnackbar({
          open: true,
          message: `Ошибка при архивировании: ${error.response?.data?.error || error.message}`,
          severity: 'error',
        });
      }
    }
    handleMenuClose();
  };

  const handleRestore = async () => {
    if (selectedProject) {
      try {
        await projectsAPI.restore(selectedProject.id);
        fetchProjects();
        setRestoreDialogOpen(false);
        setSnackbar({
          open: true,
          message: 'Проект успешно восстановлен',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error restoring project:', error);
        setSnackbar({
          open: true,
          message: `Ошибка при восстановлении: ${error.response?.data?.error || error.message}`,
          severity: 'error',
        });
      }
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedProject) {
      try {
        await projectsAPI.delete(selectedProject.id);
        fetchProjects();
        setDeleteDialogOpen(false);
        setSnackbar({
          open: true,
          message: 'Проект успешно удален',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error deleting project:', error);
        setSnackbar({
          open: true,
          message: `Ошибка при удалении: ${error.response?.data?.error || error.message}`,
          severity: 'error',
        });
      }
    }
    handleMenuClose();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
    setSearch('');
  };

  const getFilteredProjects = () => {
    const projects = tabValue === 0 ? activeProjects : archivedProjects;
    
    return projects.filter(project => {
      if (!project) return false;
      
      const searchLower = search.toLowerCase();
      const title = (project.title || '').toLowerCase();
      const clientName = (project.client?.name || project.client_name || '').toLowerCase();
      const managerName = (project.manager?.full_name || project.manager_name || '').toLowerCase();
      
      return title.includes(searchLower) || 
             clientName.includes(searchLower) || 
             managerName.includes(searchLower);
    });
  };

  const statusLabels = {
    planned: 'Планируется',
    in_work: 'В работе',
    on_approval: 'На согласовании',
    completed: 'Завершен',
    paused: 'Приостановлен',
  };

  const priorityLabels = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    critical: 'Критический',
  };

  const filteredProjects = getFilteredProjects();

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchProjects}>
          Повторить загрузку
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          {tabValue === 0 ? 'Проекты' : 'Архив проектов'}
        </Typography>
        {tabValue === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/new')}
          >
            Новый проект
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            label={
              <Badge
                badgeContent={activeProjects.length}
                color="primary"
                sx={{ mr: 1 }}
              >
                Активные
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={archivedProjects.length}
                color="secondary"
                sx={{ mr: 1 }}
              >
                Архивные
              </Badge>
            }
          />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder={tabValue === 0 ? "Поиск по названию, клиенту или менеджеру" : "Поиск в архиве"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button startIcon={<FilterIcon />} variant="outlined">
              Фильтры
            </Button>
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Клиент</TableCell>
              <TableCell>Менеджер</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Приоритет</TableCell>
              <TableCell>Дедлайн</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {search
                      ? 'Проекты не найдены'
                      : tabValue === 0
                      ? 'Нет активных проектов'
                      : 'Нет архивных проектов'}
                  </Typography>
                  {tabValue === 0 && filteredProjects.length === 0 && !search && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/projects/new')}
                      sx={{ mt: 2 }}
                    >
                      Создать первый проект
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <Typography variant="body1">{project.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {project.description?.substring(0, 50)}...
                      </Typography>
                    </TableCell>
                    <TableCell>{project.client?.name || project.client_name}</TableCell>
                    <TableCell>{project.manager?.full_name || project.manager_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[project.status] || 'Неизвестно'}
                        color={getStatusColor(project.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={priorityLabels[project.priority] || 'Не указано'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(project.planned_end_date)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, project)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredProjects.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Меню действий для проектов */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {tabValue === 0 ? (
          // Меню для активных проектов
          <>
            <MenuItem onClick={handleView}>
              <ViewIcon fontSize="small" sx={{ mr: 1 }} />
              Просмотр
            </MenuItem>
            <MenuItem onClick={handleEdit}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Редактировать
            </MenuItem>
            <MenuItem onClick={handleArchive}>
              <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
              Архивировать
            </MenuItem>
          </>
        ) : (
          // Меню для архивных проектов
          <>
            <MenuItem onClick={handleView}>
              <ViewIcon fontSize="small" sx={{ mr: 1 }} />
              Просмотр
            </MenuItem>
            <MenuItem onClick={() => setRestoreDialogOpen(true)}>
              <RestoreIcon fontSize="small" sx={{ mr: 1 }} />
              Восстановить
            </MenuItem>
            <MenuItem onClick={() => setDeleteDialogOpen(true)}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Удалить
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Диалог восстановления */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
      >
        <DialogTitle>Восстановление проекта</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите восстановить проект "{selectedProject?.title}"?
            Проект будет перемещен обратно в список активных проектов.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleRestore} 
            variant="contained" 
            color="primary"
            startIcon={<RestoreIcon />}
          >
            Восстановить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Удаление проекта</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите полностью удалить проект "{selectedProject?.title}"?
            Это действие невозможно отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProjectList;