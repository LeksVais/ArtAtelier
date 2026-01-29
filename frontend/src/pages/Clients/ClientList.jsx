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
  Avatar,
  Typography,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { clientsAPI } from '../../api/clients';

const ClientList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [archiveLoading, setArchiveLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState({});
  const [deleteDialog, setDeleteDialog] = useState({ open: false, clientId: null, clientName: '' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Загрузка клиентов с /auth/clients/...');
      
      // Получаем данные через API
      const response = await clientsAPI.getAll();
      
      // Обрабатываем различные форматы ответа
      let clientsData;
      if (Array.isArray(response)) {
        clientsData = response;
      } else if (response && typeof response === 'object') {
        // Если это объект с пагинацией
        if (response.results) {
          clientsData = response.results;
        } else if (response.data) {
          clientsData = response.data;
        } else {
          // Преобразуем в массив
          clientsData = Object.values(response);
        }
      } else {
        clientsData = [];
      }
      
      console.log('Получены клиенты:', clientsData);
      
      // Обрабатываем данные клиентов
      const processedClients = Array.isArray(clientsData) ? clientsData.map(client => ({
        id: client.id,
        name: client.name || 'Без названия',
        contact_person: client.contact_person || 'Не указано',
        phone: client.phone || '',
        email: client.email || '',
        website: client.website || '',
        address: client.address || '',
        notes: client.notes || '',
        is_active: client.is_active !== undefined ? client.is_active : true,
        is_archived: client.is_archived || false,
        project_count: client.project_count || 0,
        active_project_count: client.active_project_count || 0,
        created_at: client.created_at,
      })) : [];
      
      setClients(processedClients);
    } catch (err) {
      console.error('Error fetching clients from /auth/clients/:', err);
      
      // Информативное сообщение об ошибке
      let errorMessage = 'Не удалось загрузить список клиентов';
      
      if (err.response?.status === 404) {
        errorMessage = 'Эндпоинт /auth/clients/ не найден. Проверьте настройки API.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Требуется авторизация. Пожалуйста, войдите снова.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        errorMessage = 'У вас нет прав для просмотра клиентов';
      } else if (err.response?.status === 500) {
        errorMessage = 'Ошибка сервера. Пожалуйста, попробуйте позже.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Нет соединения с сервером. Проверьте, запущен ли Django сервер.';
      } else if (err.message.includes('404')) {
        errorMessage = 'Ошибка 404: Путь /auth/clients/ не существует на сервере';
      }
      
      setError(errorMessage);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (type, value) => {
    switch (type) {
      case 'phone':
        window.location.href = `tel:${value}`;
        break;
      case 'email':
        window.location.href = `mailto:${value}`;
        break;
      default:
        break;
    }
  };

  const handleArchiveClient = async (clientId, currentStatus, clientName) => {
    try {
      setArchiveLoading(prev => ({ ...prev, [clientId]: true }));
      
      if (currentStatus) {
        // Если клиент уже в архиве, восстанавливаем
        await clientsAPI.update(clientId, { is_archived: false });
        console.log(`Клиент "${clientName}" восстановлен из архива`);
      } else {
        // Архивируем клиента
        await clientsAPI.archive(clientId);
        console.log(`Клиент "${clientName}" перемещен в архив`);
      }
      
      // Обновляем список клиентов
      await fetchClients();
    } catch (err) {
      console.error('Ошибка архивации клиента:', err);
      let errorMessage = 'Не удалось изменить статус клиента';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 400) {
        errorMessage = 'Невозможно архивировать клиента с активными проектами';
      } else if (err.response?.status === 404) {
        errorMessage = 'Эндпоинт архивации не найден';
      }
      
      setError(errorMessage);
    } finally {
      setArchiveLoading(prev => ({ ...prev, [clientId]: false }));
    }
  };

  const handleDeleteClient = async (clientId, clientName) => {
    try {
      setDeleteLoading(prev => ({ ...prev, [clientId]: true }));
      
      await clientsAPI.delete(clientId);
      console.log(`Клиент "${clientName}" удален`);
      
      // Обновляем список клиентов
      await fetchClients();
      setDeleteDialog({ open: false, clientId: null, clientName: '' });
    } catch (err) {
      console.error('Ошибка удаления клиента:', err);
      let errorMessage = 'Не удалось удалить клиента';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 404) {
        errorMessage = 'Эндпоинт удаления не найден';
      }
      
      setError(errorMessage);
    } finally {
      setDeleteLoading(prev => ({ ...prev, [clientId]: false }));
    }
  };

  const handleEditClient = (clientId) => {
    navigate(`/clients/${clientId}`);
  };

  // Фильтрация клиентов по поисковому запросу
  const filteredClients = clients.filter(client =>
    (client.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (client.contact_person?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (client.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (client.phone?.toLowerCase() || '').includes(search.toLowerCase())
  );

  // Пагинация
  const paginatedClients = filteredClients.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Клиенты</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/clients/new')}
        >
          Добавить клиента
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }} 
          onClose={() => setError(null)}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={fetchClients}
            >
              Повторить
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Поиск по компании, контактному лицу, email или телефону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          variant="outlined"
          size="small"
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Компания</TableCell>
              <TableCell>Контактное лицо</TableCell>
              <TableCell>Контакты</TableCell>
              <TableCell>Проекты</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="center">Управление</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    {search ? 'Клиенты не найдены' : 'Нет клиентов'}
                  </Typography>
                  {!search && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/clients/new')}
                      sx={{ mt: 2 }}
                    >
                      Добавить первого клиента
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedClients.map((client) => (
                <TableRow 
                  key={client.id} 
                  hover
                  sx={{
                    opacity: client.is_archived ? 0.7 : 1,
                    '&:hover': {
                      backgroundColor: client.is_archived ? 'action.hover' : 'inherit',
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: client.is_archived ? 'grey.500' : 'primary.main' }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {client.name}
                          {client.is_archived && (
                            <Chip
                              label="Архив"
                              size="small"
                              color="default"
                              sx={{ ml: 1, fontSize: '0.7rem' }}
                            />
                          )}
                        </Typography>
                        {client.website && (
                          <Typography 
                            variant="body2" 
                            color="primary"
                            sx={{ 
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            component="a"
                            href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {client.website}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {client.contact_person}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {client.phone && (
                        <Button
                          size="small"
                          startIcon={<PhoneIcon />}
                          onClick={() => handleContactClick('phone', client.phone)}
                          sx={{ 
                            justifyContent: 'flex-start',
                            textTransform: 'none'
                          }}
                          variant="text"
                          color="inherit"
                        >
                          {client.phone}
                        </Button>
                      )}
                      {client.email && (
                        <Button
                          size="small"
                          startIcon={<EmailIcon />}
                          onClick={() => handleContactClick('email', client.email)}
                          sx={{ 
                            justifyContent: 'flex-start',
                            textTransform: 'none'
                          }}
                          variant="text"
                          color="inherit"
                        >
                          {client.email}
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip
                        label={`Всего: ${client.project_count}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                      {client.active_project_count > 0 && (
                        <Chip
                          label={`Активные: ${client.active_project_count}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={client.is_archived ? 'В архиве' : 'Активен'}
                      color={client.is_archived ? 'default' : 'success'}
                      size="small"
                      variant={client.is_archived ? "outlined" : "filled"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Редактировать">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClient(client.id)}
                          color="primary"
                          disabled={client.is_archived}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={client.is_archived ? "Восстановить" : "В архив"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleArchiveClient(client.id, client.is_archived, client.name)}
                            disabled={archiveLoading[client.id]}
                            color={client.is_archived ? "success" : "default"}
                          >
                            {archiveLoading[client.id] ? (
                              <CircularProgress size={20} />
                            ) : client.is_archived ? (
                              <RestoreIcon fontSize="small" />
                            ) : (
                              <ArchiveIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      
                      <Tooltip title="Удалить">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog({ open: true, clientId: client.id, clientName: client.name })}
                            disabled={deleteLoading[client.id]}
                            color="error"
                          >
                            {deleteLoading[client.id] ? (
                              <CircularProgress size={20} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredClients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} из ${count !== -1 ? count : `больше чем ${to}`}`
          }
        />
      </TableContainer>

      {/* Диалог удаления */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, clientId: null, clientName: '' })}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Удаление клиента
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Вы уверены, что хотите удалить клиента "{deleteDialog.clientName}"? 
            Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, clientId: null, clientName: '' })} 
                  disabled={deleteLoading[deleteDialog.clientId]}>
            Отмена
          </Button>
          <Button 
            onClick={() => handleDeleteClient(deleteDialog.clientId, deleteDialog.clientName)} 
            color="error" 
            autoFocus
            disabled={deleteLoading[deleteDialog.clientId]}
            startIcon={deleteLoading[deleteDialog.clientId] ? <CircularProgress size={20} /> : null}
          >
            {deleteLoading[deleteDialog.clientId] ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Информация о количестве клиентов */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Всего клиентов: {clients.length} ({clients.filter(c => c.is_archived).length} в архиве)
        </Typography>
        <Button
          variant="text"
          size="small"
          onClick={fetchClients}
          startIcon={<SearchIcon />}
        >
          Обновить
        </Button>
      </Box>
    </Box>
  );
};

export default ClientList;