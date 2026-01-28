import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Task as TaskIcon,
  Group as GroupIcon,
  AttachFile as FileIcon,
  History as HistoryIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../api/projects';
import { tasksAPI } from '../../api/tasks';
import { formatDate, getStatusColor } from '../../utils/helpers';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchProjectData();
  }, [id]);

  const fetchProject = async () => {
    try {
      const data = await projectsAPI.getById(id);
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectData = async () => {
    try {
      // Получаем задачи проекта
      const tasksData = await projectsAPI.getProjectTasks(id);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      
      // Получаем участников проекта
      const membersData = await projectsAPI.getProjectMembers(id);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await projectsAPI.changeProjectStatus(id, newStatus);
      fetchProject(); // Обновляем данные проекта
      setSnackbar({
        open: true,
        message: `Статус проекта изменен на "${getStatusLabel(newStatus)}"`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error changing project status:', error);
      setSnackbar({
        open: true,
        message: `Ошибка при изменении статуса: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    }
  };

  const handleArchive = async () => {
    setActionLoading(true);
    
    try {
      const result = await projectsAPI.archive(id);
      setSnackbar({
        open: true,
        message: result.status || 'Проект успешно архивирован',
        severity: 'success'
      });
      
      // Обновляем данные проекта после архивирования
      setProject(prev => ({
        ...prev,
        is_archived: true,
        is_active: false,
        archived_at: result.archived_at,
        archived_by: result.archived_by
      }));
      
      // Меняем статус на странице (не перенаправляем сразу)
      setTimeout(() => {
        setSnackbar({
          open: true,
          message: 'Проект перемещен в архив. Вы будете перенаправлены через 3 секунды.',
          severity: 'info'
        });
        setTimeout(() => {
          navigate('/projects');
        }, 3000);
      }, 1000);
      
    } catch (error) {
      console.error('Error archiving project:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Ошибка при архивировании';
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
      setArchiveDialogOpen(false);
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    
    try {
      const result = await projectsAPI.restore(id);
      setSnackbar({
        open: true,
        message: result.status || 'Проект успешно восстановлен',
        severity: 'success'
      });
      
      // Обновляем данные проекта после восстановления
      setProject(prev => ({
        ...prev,
        is_archived: false,
        is_active: true,
        restored_at: result.restored_at,
        restored_by: result.restored_by
      }));
      
    } catch (error) {
      console.error('Error restoring project:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Ошибка при восстановлении';
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
      setRestoreDialogOpen(false);
    }
  };

  const handleOpenArchiveDialog = () => {
    // Проверяем активные задачи
    const activeTasks = tasks.filter(task => 
      task.is_active && 
      ['created', 'in_work', 'on_review'].includes(task.status)
    );
    
    if (activeTasks.length > 0) {
      setSnackbar({
        open: true,
        message: `Невозможно архивировать проект: ${activeTasks.length} активная(ых) задача(и)`,
        severity: 'warning'
      });
      return;
    }
    
    // Проверяем статус проекта
    if (project.status === 'in_work') {
      setSnackbar({
        open: true,
        message: 'Невозможно архивировать проект, который находится в работе',
        severity: 'warning'
      });
      return;
    }
    
    setArchiveDialogOpen(true);
  };

  const handleOpenRestoreDialog = () => {
    setRestoreDialogOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      planned: 'Планируется',
      in_work: 'В работе',
      on_approval: 'На согласовании',
      completed: 'Завершен',
      paused: 'Приостановлен',
    };
    return statusLabels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const priorityLabels = {
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий',
      critical: 'Критический',
    };
    return priorityLabels[priority] || priority;
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Проект не найден
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/projects')}
          sx={{ mt: 2 }}
        >
          Вернуться к списку проектов
        </Button>
      </Box>
    );
  }

  const statusColors = {
    planned: 'default',
    in_work: 'primary',
    on_approval: 'warning',
    completed: 'success',
    paused: 'error',
  };

  const taskStatusLabels = {
    created: 'Создана',
    in_work: 'В работе',
    on_review: 'На проверке',
    completed: 'Выполнена',
    cancelled: 'Отменена',
  };

  const taskStatusColors = {
    created: 'default',
    in_work: 'primary',
    on_review: 'warning',
    completed: 'success',
    cancelled: 'error',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {project.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={getStatusLabel(project.status)}
              color={statusColors[project.status]}
              size="small"
            />
            <Chip
              label={getPriorityLabel(project.priority)}
              variant="outlined"
              size="small"
            />
            {project.is_archived ? (
              <Chip label="Архивный" color="secondary" size="small" />
            ) : project.is_active ? (
              <Chip label="Активный" color="success" size="small" />
            ) : (
              <Chip label="Неактивный" color="default" size="small" />
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!project.is_archived && project.is_active && (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/projects/${id}/edit`)}
              >
                Редактировать
              </Button>
              <Button
                variant="outlined"
                startIcon={<ArchiveIcon />}
                color="secondary"
                onClick={handleOpenArchiveDialog}
                disabled={actionLoading}
              >
                Архивировать
              </Button>
            </>
          )}
          {project.is_archived && (
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              color="primary"
              onClick={handleOpenRestoreDialog}
              disabled={actionLoading}
            >
              Восстановить
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              <DescriptionIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Описание
            </Typography>
            <Typography paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {project.description || 'Описание отсутствует'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Детали проекта
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Клиент
                </Typography>
                <Typography variant="body1">
                  {project.client?.name || project.client_name || 'Не указан'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Менеджер
                </Typography>
                <Typography variant="body1">
                  {project.manager?.full_name || project.manager_name || project.manager?.username || 'Не назначен'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  <ScheduleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Начало
                </Typography>
                <Typography variant="body1">
                  {formatDate(project.start_date)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  <ScheduleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  План завершения
                </Typography>
                <Typography variant="body1">
                  {formatDate(project.planned_end_date)}
                </Typography>
              </Grid>
              {project.actual_end_date && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    <ScheduleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Факт. завершения
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(project.actual_end_date)}
                  </Typography>
                </Grid>
              )}
              {project.budget && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    <MoneyIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Бюджет
                  </Typography>
                  <Typography variant="body1">
                    {parseFloat(project.budget).toLocaleString('ru-RU')} ₽
                  </Typography>
                </Grid>
              )}
              {project.archived_at && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    <ArchiveIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Дата архивации
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(project.archived_at)}
                    {project.archived_by && ` (${project.archived_by})`}
                  </Typography>
                </Grid>
              )}
              {project.restored_at && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    <RestoreIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Дата восстановления
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(project.restored_at)}
                    {project.restored_by && ` (${project.restored_by})`}
                  </Typography>
                </Grid>
              )}
            </Grid>

            {/* Кнопки для изменения статуса */}
            {!project.is_archived && project.is_active && (
              <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {project.status === 'planned' && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleStatusChange('in_work')}
                  >
                    Начать работу
                  </Button>
                )}
                {project.status === 'in_work' && (
                  <>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleStatusChange('on_approval')}
                    >
                      На согласование
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="warning"
                      onClick={() => handleStatusChange('paused')}
                    >
                      Приостановить
                    </Button>
                  </>
                )}
                {project.status === 'on_approval' && (
                  <>
                    <Button
                      variant="contained"
                      size="small"
                      color="success"
                      onClick={() => handleStatusChange('completed')}
                    >
                      Завершить
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleStatusChange('in_work')}
                    >
                      Вернуть в работу
                    </Button>
                  </>
                )}
                {project.status === 'paused' && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleStatusChange('in_work')}
                  >
                    Возобновить
                  </Button>
                )}
                {project.status === 'completed' && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleStatusChange('in_work')}
                  >
                    Возобновить работу
                  </Button>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<TaskIcon />} label="Задачи" />
          <Tab icon={<GroupIcon />} label="Участники" />
          <Tab icon={<FileIcon />} label="Файлы" />
          <Tab icon={<HistoryIcon />} label="История" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Задачи проекта ({tasks.length})
                </Typography>
                {!project.is_archived && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/tasks/new?project=${id}`)}
                    disabled={!project.is_active}
                  >
                    Добавить задачу
                  </Button>
                )}
              </Box>
              
              {tasks.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  Нет задач в этом проекте
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Название</TableCell>
                        <TableCell>Исполнитель</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>Приоритет</TableCell>
                        <TableCell>Срок</TableCell>
                        <TableCell>Прогресс</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow 
                          key={task.id} 
                          hover
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Typography variant="body2">
                              {task.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {task.assigned_to_name || 'Не назначен'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={taskStatusLabels[task.status] || task.status}
                              color={taskStatusColors[task.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getPriorityLabel(task.priority) || task.priority}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {formatDate(task.deadline)}
                            {task.is_overdue && (
                              <Chip
                                label="Просрочено"
                                color="error"
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={task.progress || 0}
                                sx={{ flexGrow: 1 }}
                              />
                              <Typography variant="body2">
                                {task.progress || 0}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Участники проекта ({members.length})
                </Typography>
                {!project.is_archived && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/projects/${id}/add-member`)}
                    disabled={!project.is_active}
                  >
                    Добавить участника
                  </Button>
                )}
              </Box>
              
              {members.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  Нет участников в этом проекте
                </Typography>
              ) : (
                <List>
                  {members.map((member) => (
                    <ListItem
                      key={member.id}
                      secondaryAction={
                        <Chip 
                          label={member.role_display || member.role} 
                          size="small" 
                        />
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {member.employee_details?.first_name?.[0] || 
                           member.employee_details?.username?.[0] || 
                           'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.employee_details?.full_name || 
                                 `${member.employee_details?.first_name} ${member.employee_details?.last_name}`}
                        secondary={`Добавлен: ${formatDate(member.joined_at)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Файлы проекта
              </Typography>
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Функциональность файлов в разработке
              </Typography>
            </Box>
          )}

          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                История изменений
              </Typography>
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Функциональность истории в разработке
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Диалог архивации проекта */}
      <Dialog
        open={archiveDialogOpen}
        onClose={() => !actionLoading && setArchiveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArchiveIcon />
            Архивирование проекта
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите архивировать проект <strong>"{project?.title}"</strong>?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            После архивации:
            <ul>
              <li>Проект будет перемещен в архив</li>
              <li>Нельзя будет добавлять новые задачи</li>
              <li>Существующие задачи нельзя будет изменять</li>
              <li>Проект будет скрыт из основного списка</li>
            </ul>
          </DialogContentText>
          <DialogContentText sx={{ color: 'warning.main', fontWeight: 'medium' }}>
            Внимание: Эта операция обратима. Вы сможете восстановить проект из архива в любое время.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setArchiveDialogOpen(false)}
            disabled={actionLoading}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleArchive}
            variant="contained"
            color="secondary"
            startIcon={actionLoading ? null : <ArchiveIcon />}
            disabled={actionLoading}
          >
            {actionLoading ? 'Архивирование...' : 'Архивировать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог восстановления проекта */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => !actionLoading && setRestoreDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RestoreIcon />
            Восстановление проекта
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите восстановить проект <strong>"{project?.title}"</strong> из архива?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            После восстановления:
            <ul>
              <li>Проект будет возвращен в основной список</li>
              <li>Можно будет добавлять новые задачи</li>
              <li>Можно будет редактировать существующие задачи</li>
              <li>Проект снова станет активным</li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRestoreDialogOpen(false)}
            disabled={actionLoading}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleRestore}
            variant="contained"
            color="primary"
            startIcon={actionLoading ? null : <RestoreIcon />}
            disabled={actionLoading}
          >
            {actionLoading ? 'Восстановление...' : 'Восстановить'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default ProjectDetail;
