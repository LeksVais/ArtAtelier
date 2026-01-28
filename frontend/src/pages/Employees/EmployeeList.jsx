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
  IconButton,
  Menu,
  MenuItem,
  Typography,
  InputAdornment,
  LinearProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employeesAPI } from '../../api/employees';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeesAPI.getAll();
      
      let employeesArray = [];
      if (Array.isArray(data)) {
        employeesArray = data;
      } else if (data && typeof data === 'object') {
        employeesArray = data.results || data.data || Object.values(data);
      }
      
      if (!Array.isArray(employeesArray)) {
        employeesArray = [];
      }
      
      // Адаптация данных: создаем user из user_details
      const adaptedEmployees = employeesArray.map(emp => {
        if (emp.user_details) {
          return {
            ...emp,
            user: emp.user_details
          };
        }
        return emp;
      });
      
      setEmployees(adaptedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Ошибка при загрузке сотрудников');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, employee) => {
    setAnchorEl(event.currentTarget);
    setSelectedEmployee(employee);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEmployee(null);
  };

  const handleEdit = () => {
    if (selectedEmployee) {
      navigate(`/employees/${selectedEmployee.id}/edit`);
    }
    handleMenuClose();
  };

  const filteredEmployees = (employees || []).filter(employee => {
    if (!employee || !employee.user) return false;
    
    const searchLower = search.toLowerCase();
    const firstName = (employee.user.first_name || '').toLowerCase();
    const lastName = (employee.user.last_name || '').toLowerCase();
    const position = (employee.position || '').toLowerCase();
    
    return firstName.includes(searchLower) || 
           lastName.includes(searchLower) || 
           position.includes(searchLower);
  });

  const roleLabels = {
    director: 'Руководитель',
    manager: 'Менеджер',
    designer: 'Дизайнер',
    copywriter: 'Копирайтер',
  };

  const statusLabels = {
    active: 'Активен',
    fired: 'Уволен',
    vacation: 'В отпуске',
  };

  const statusColors = {
    active: 'success',
    fired: 'error',
    vacation: 'warning',
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
        <Button variant="contained" onClick={fetchEmployees}>
          Повторить загрузку
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Сотрудники</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/employees/new')}
        >
          Добавить сотрудника
        </Button>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Поиск по имени, фамилии или должности"
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
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ФИО</TableCell>
              <TableCell>Должность</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {search ? 'Сотрудники не найдены' : 'Нет сотрудников'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      <Typography variant="body1">
                        {employee.user?.last_name} {employee.user?.first_name} {employee.user?.middle_name || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <Chip
                        label={roleLabels[employee.user?.role] || employee.user?.role}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[employee.employment_status] || employee.employment_status}
                        color={statusColors[employee.employment_status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{employee.work_email || employee.user?.email}</TableCell>
                    <TableCell>{employee.user?.phone || employee.work_phone || '-'}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, employee)}
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
          count={filteredEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Редактировать
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EmployeeList;