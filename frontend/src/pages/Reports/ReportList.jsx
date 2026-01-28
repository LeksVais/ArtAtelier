import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  MoreVert as MoreIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  RestoreFromTrash as RestoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../../api';
import { formatDateTime, formatDate } from '../../utils/helpers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';

const ReportList = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Форма генерации отчета
  const [reportForm, setReportForm] = useState({
    name: '',
    report_type: 'projects',
    start_date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    end_date: new Date(),
    projects: [],
  });

  useEffect(() => {
    fetchReports();
    fetchTemplates();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsAPI.getAll();
      setReports(response.results || response.data || response);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Не удалось загрузить отчеты');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await reportsAPI.getTemplates();
      setTemplates(response.results || response.data || response);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    }
  };

  const handleMenuOpen = (event, report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReport(null);
  };

  const handleDownload = async (reportId) => {
    try {
      await reportsAPI.download(reportId);
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Не удалось скачать отчет');
    }
    handleMenuClose();
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const handleDelete = async () => {
    if (selectedReport) {
      try {
        await reportsAPI.delete(selectedReport.id);
        fetchReports();
      } catch (error) {
        console.error('Error deleting report:', error);
        setError('Не удалось удалить отчет');
      }
    }
    handleMenuClose();
  };

  const handleArchive = async () => {
    if (selectedReport) {
      try {
        await reportsAPI.archive(selectedReport.id);
        fetchReports();
      } catch (error) {
        console.error('Error archiving report:', error);
        setError('Не удалось архивировать отчет');
      }
    }
    handleMenuClose();
  };

  const handleRestore = async (reportId) => {
    try {
      await reportsAPI.restore(reportId);
      fetchReports();
    } catch (error) {
      console.error('Error restoring report:', error);
      setError('Не удалось восстановить отчет');
    }
  };

  const handleGenerate = async () => {
  try {
    setGenerating(true);
    setError(null);
    
    // Форматируем даты в yyyy-MM-dd
    const formatDateToISO = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formattedData = {
      name: reportForm.name || `Отчет по ${getReportTypeLabel(reportForm.report_type)}`,
      report_type: reportForm.report_type,
      start_date: formatDateToISO(reportForm.start_date),
      end_date: formatDateToISO(reportForm.end_date),
    };

    console.log('Sending data:', formattedData); 
    
    const response = await reportsAPI.generate(formattedData);
    
    if (response) {
      setGenerateDialogOpen(false);
      fetchReports();
      setReportForm({
        name: '',
        report_type: 'projects',
        start_date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        end_date: new Date(),
        projects: [],
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    console.error('Error details:', error.response?.data); 
    setError(error.response?.data?.error || error.response?.data || 'Не удалось сгенерировать отчет');
  } finally {
    setGenerating(false);
  }
};

  const getReportTypeLabel = (type) => {
    const labels = {
      projects: 'По проектам',
      tasks: 'По задачам',
      employees: 'По загрузке сотрудников',
      tasks_period: 'Отчет по выполнению задач за период',
      summary: 'Сводный отчет по деятельности агентства',
    };
    return labels[type] || type;
  };

  const getStatusColor = (report) => {
    if (!report.is_success) return 'error';
    if (report.is_archived) return 'default';
    return 'success';
  };

  const getStatusText = (report) => {
    if (!report.is_success) return 'Ошибка';
    if (report.is_archived) return 'Архив';
    return 'Успешно';
  };

  const myReports = reports.filter(r => !r.is_archived);
  const archivedReports = reports.filter(r => r.is_archived);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Загрузка отчетов...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Отчеты</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchReports}
          >
            Обновить
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setGenerateDialogOpen(true)}
          >
            Создать отчет
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`Мои отчеты (${myReports.length})`} />
          <Tab label={`Шаблоны (${templates.length})`} />
          <Tab label={`Архив (${archivedReports.length})`} />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <>
          {myReports.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Нет отчетов
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Создайте первый отчет
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setGenerateDialogOpen(true)}
              >
                Создать отчет
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {myReports.map((report) => (
                <Grid item xs={12} md={6} lg={4} key={report.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ maxWidth: '80%' }}>
                          <Typography variant="h6" gutterBottom>
                            {report.name || 'Без названия'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getReportTypeLabel(report.report_type)}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, report)}
                        >
                          <MoreIcon />
                        </IconButton>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Chip
                          icon={<PdfIcon />}
                          label="PDF"
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          label={getStatusText(report)} 
                          color={getStatusColor(report)} 
                          size="small" 
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        Период: {formatDate(report.start_date)} - {formatDate(report.end_date)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        Размер: {report.file_size_formatted || 'Нет файла'}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        Создан: {formatDateTime(report.generated_at)}<br />
                        Пользователь: {report.generated_by_name || 'Неизвестно'}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between' }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleView(report)}
                      >
                        Подробнее
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(report.id)}
                        disabled={!report.file}
                        variant="outlined"
                      >
                        Скачать
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {tabValue === 1 && (
        <>
          {templates.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Шаблоны отчетов не найдены
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {templates.map((template) => (
                <Grid item xs={12} sm={6} md={4} key={template.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DescriptionIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="h6">
                            {template.name}
                          </Typography>
                          <Typography variant="body2" color="primary">
                            {getReportTypeLabel(template.template_type)}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {template.description || 'Стандартный шаблон отчета'}
                      </Typography>
                      {template.frequency && (
                        <Chip
                          label={template.frequency_display || template.frequency}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                      )}
                    </CardContent>
                    <CardActions>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => {
                          setReportForm({
                            ...reportForm,
                            report_type: template.template_type,
                            name: template.name
                          });
                          setGenerateDialogOpen(true);
                        }}
                      >
                        Использовать шаблон
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {tabValue === 2 && (
        <>
          {archivedReports.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Архив отчетов пуст
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {archivedReports.map((report) => (
                <Grid item xs={12} md={6} key={report.id}>
                  <Card sx={{ opacity: 0.8 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">{report.name || 'Без названия'}</Typography>
                        <Chip label="Архив" size="small" color="default" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Тип: {getReportTypeLabel(report.report_type)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Период: {formatDate(report.start_date)} - {formatDate(report.end_date)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Архивирован: {formatDateTime(report.generated_at)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<RestoreIcon />}
                        onClick={() => handleRestore(report.id)}
                      >
                        Восстановить
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(report.id)}
                        disabled={!report.file}
                      >
                        Скачать
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Диалог генерации отчета */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создание отчета</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Название отчета"
              value={reportForm.name}
              onChange={(e) => setReportForm({...reportForm, name: e.target.value})}
              placeholder="Введите название отчета"
            />
            
            <FormControl fullWidth>
              <InputLabel>Тип отчета</InputLabel>
              <Select
                value={reportForm.report_type}
                label="Тип отчета"
                onChange={(e) => setReportForm({...reportForm, report_type: e.target.value})}
              >
                <SelectMenuItem value="projects">По проектам</SelectMenuItem>
                <SelectMenuItem value="tasks">По задачам</SelectMenuItem>
                <SelectMenuItem value="employees">По загрузке сотрудников</SelectMenuItem>
                <SelectMenuItem value="tasks_period">Отчет по выполнению задач за период</SelectMenuItem>
                <SelectMenuItem value="summary">Сводный отчет по деятельности агентства</SelectMenuItem>
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
              <DatePicker
                label="Дата начала"
                value={reportForm.start_date}
                onChange={(date) => setReportForm({...reportForm, start_date: date})}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              
              <DatePicker
                label="Дата окончания"
                value={reportForm.end_date}
                onChange={(date) => setReportForm({...reportForm, end_date: date})}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>

            <Typography variant="caption" color="text.secondary">
              Отчет будет сгенерирован в формате PDF
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleGenerate} 
            variant="contained"
            disabled={generating}
            startIcon={generating ? <CircularProgress size={20} /> : null}
          >
            {generating ? 'Генерация...' : 'Создать отчет'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог просмотра отчета */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedReport && (
          <>
            <DialogTitle>
              {selectedReport.name}
              <Chip 
                label={getStatusText(selectedReport)} 
                color={getStatusColor(selectedReport)} 
                size="small" 
                sx={{ ml: 2 }}
              />
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <Typography><strong>Тип отчета:</strong> {getReportTypeLabel(selectedReport.report_type)}</Typography>
                <Typography><strong>Период:</strong> {formatDate(selectedReport.start_date)} - {formatDate(selectedReport.end_date)}</Typography>
                <Typography><strong>Создан:</strong> {formatDateTime(selectedReport.generated_at)}</Typography>
                <Typography><strong>Пользователь:</strong> {selectedReport.generated_by_name || 'Неизвестно'}</Typography>
                <Typography><strong>Размер файла:</strong> {selectedReport.file_size_formatted || 'Нет файла'}</Typography>
                <Typography><strong>Время генерации:</strong> {selectedReport.generation_time ? `${selectedReport.generation_time} сек` : 'Неизвестно'}</Typography>
                
                {selectedReport.error_message && (
                  <Alert severity="error">
                    <strong>Ошибка:</strong> {selectedReport.error_message}
                  </Alert>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Закрыть</Button>
              <Button 
                onClick={() => handleDownload(selectedReport.id)}
                disabled={!selectedReport.file}
                variant="contained"
                startIcon={<DownloadIcon />}
              >
                Скачать PDF
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Меню действий с отчетом */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleView(selectedReport);
          handleMenuClose();
        }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          Подробнее
        </MenuItem>
        <MenuItem onClick={() => handleDownload(selectedReport?.id)}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Скачать
        </MenuItem>
        <MenuItem onClick={handleArchive}>
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          Архивировать
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Удалить
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ReportList;