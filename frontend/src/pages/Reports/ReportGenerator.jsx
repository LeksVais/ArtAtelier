import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Code as HtmlIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { reportsAPI, projectsAPI } from '../../api';

const ReportGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  // Состояния для формы отчета
  const [formData, setFormData] = useState({
    name: '',
    report_type: 'projects',
    template: null,
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    projects: [],
    status_filter: '',
    include_financial: false,
    include_deadlines: true,
    include_workload: true,
    include_risks: false,
    include_task_details: true,
    include_files: false,
    export_format: 'pdf',
  });

  // Шаги генератора
  const steps = [
    'Выбор типа отчета',
    'Настройка параметров',
    'Выбор формата',
    'Генерация'
  ];

  useEffect(() => {
    fetchInitialData();
    // Проверяем query параметры
    const params = new URLSearchParams(location.search);
    const templateId = params.get('template');
    if (templateId) {
      // Загрузка шаблона по ID
      loadTemplate(templateId);
    }
  }, [location]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [projectsData, templatesData] = await Promise.all([
        projectsAPI.getAll(),
        reportsAPI.getTemplates(),
      ]);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (templateId) => {
    const template = templates.find(t => t.id == templateId);
    if (template) {
      setSelectedTemplate(template);
      setFormData(prev => ({
        ...prev,
        report_type: template.template_type,
        template: template.id,
        name: `Отчет по шаблону: ${template.name}`,
      }));
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (field) => (date) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [field]: format(date, 'yyyy-MM-dd'),
      }));
    }
  };

  const handleCheckboxChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const handleProjectToggle = (projectId) => {
    setFormData(prev => {
      const currentProjects = prev.projects;
      const isSelected = currentProjects.includes(projectId);
      
      if (isSelected) {
        return {
          ...prev,
          projects: currentProjects.filter(id => id !== projectId),
        };
      } else {
        return {
          ...prev,
          projects: [...currentProjects, projectId],
        };
      }
    });
  };

  const handleSelectAllProjects = () => {
    if (formData.projects.length === projects.length) {
      setFormData(prev => ({ ...prev, projects: [] }));
    } else {
      setFormData(prev => ({
        ...prev,
        projects: projects.map(p => p.id),
      }));
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      // Валидация
      if (!formData.name.trim()) {
        throw new Error('Укажите название отчета');
      }

      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        throw new Error('Дата начала не может быть позже даты окончания');
      }

      const response = await reportsAPI.generate(formData);
      
      setSuccess('Отчет успешно создан! Он будет доступен в списке отчетов.');
      setGenerating(false);
      
      // Переход к списку отчетов через 2 секунды
      setTimeout(() => {
        navigate('/reports');
      }, 2000);

    } catch (error) {
      console.error('Error generating report:', error);
      setError(error.message || 'Не удалось сгенерировать отчет');
      setGenerating(false);
    }
  };

  const getReportTypeLabel = (type) => {
    const labels = {
      projects: 'По проектам',
      tasks: 'По задачам',
      employees: 'По сотрудникам',
      clients: 'По клиентам',
      financial: 'Финансовый',
      deadlines: 'По срокам',
      weekly: 'Еженедельный',
    };
    return labels[type] || type;
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf': return <PdfIcon />;
      case 'excel': return <ExcelIcon />;
      case 'csv': return <ExcelIcon />;
      case 'html': return <HtmlIcon />;
      default: return <DescriptionIcon />;
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Выберите тип отчета
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Тип отчета</InputLabel>
                <Select
                  value={formData.report_type}
                  label="Тип отчета"
                  onChange={handleInputChange('report_type')}
                >
                  <MenuItem value="projects">По проектам</MenuItem>
                  <MenuItem value="tasks">По задачам</MenuItem>
                  <MenuItem value="employees">По сотрудникам</MenuItem>
                  <MenuItem value="clients">По клиентам</MenuItem>
                  <MenuItem value="financial">Финансовый</MenuItem>
                  <MenuItem value="deadlines">По срокам</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Шаблоны отчетов
              </Typography>
              {templates.length > 0 ? (
                <Grid container spacing={2}>
                  {templates.map(template => (
                    <Grid item xs={12} sm={6} md={4} key={template.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedTemplate?.id === template.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          transition: 'border 0.3s',
                        }}
                        onClick={() => loadTemplate(template.id)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle1">
                              {template.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {getReportTypeLabel(template.template_type)}
                          </Typography>
                          {template.frequency && (
                            <Chip
                              label={template.frequency}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  Шаблоны отчетов не найдены
                </Alert>
              )}
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Настройка параметров
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Название отчета"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="Например: Отчет по проектам за январь 2024"
              />
            </Grid>

            <Grid item xs={12} md={6}>
                <DatePicker
                  label="Дата начала"
                  value={new Date(formData.start_date)}
                  onChange={handleDateChange('start_date')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <DatePicker
                  label="Дата окончания"
                  value={new Date(formData.end_date)}
                  onChange={handleDateChange('end_date')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  Выбор проектов
                </Typography>
                <Button
                  size="small"
                  onClick={handleSelectAllProjects}
                >
                  {formData.projects.length === projects.length ? 'Снять все' : 'Выбрать все'}
                </Button>
              </Box>
              
              {projects.length > 0 ? (
                <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                  <Grid container spacing={1}>
                    {projects.map(project => (
                      <Grid item xs={12} sm={6} key={project.id}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.projects.includes(project.id)}
                              onChange={() => handleProjectToggle(project.id)}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FolderIcon sx={{ mr: 1, fontSize: 16 }} />
                              <Typography variant="body2">
                                {project.title}
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              ) : (
                <Alert severity="info">Проекты не найдены</Alert>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Включить в отчет:
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.include_deadlines}
                      onChange={handleCheckboxChange('include_deadlines')}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon sx={{ mr: 1, fontSize: 18 }} />
                      Сроки выполнения
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.include_workload}
                      onChange={handleCheckboxChange('include_workload')}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimelineIcon sx={{ mr: 1, fontSize: 18 }} />
                      Загрузка сотрудников
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.include_financial}
                      onChange={handleCheckboxChange('include_financial')}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MoneyIcon sx={{ mr: 1, fontSize: 18 }} />
                      Финансовые данные
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.include_risks}
                      onChange={handleCheckboxChange('include_risks')}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon sx={{ mr: 1, fontSize: 18 }} />
                      Риски и проблемы
                    </Box>
                  }
                />
              </FormGroup>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Выберите формат экспорта
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={3}>
                {['pdf', 'excel', 'csv', 'html'].map(format => (
                  <Grid item xs={12} sm={6} md={3} key={format}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: formData.export_format === format ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 3,
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, export_format: format }))}
                    >
                      {getFormatIcon(format)}
                      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                        {format.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center">
                        {format === 'pdf' && 'Для печати и просмотра'}
                        {format === 'excel' && 'Для анализа данных'}
                        {format === 'csv' && 'Для импорта в другие системы'}
                        {format === 'html' && 'Для просмотра в браузере'}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Предварительный просмотр настроек
              </Typography>
              
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Тип отчета:
                    </Typography>
                    <Typography variant="body1">
                      {getReportTypeLabel(formData.report_type)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Период:
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(formData.start_date), 'dd.MM.yyyy')} - {format(new Date(formData.end_date), 'dd.MM.yyyy')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Проектов выбрано:
                    </Typography>
                    <Typography variant="body1">
                      {formData.projects.length} из {projects.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Формат:
                    </Typography>
                    <Typography variant="body1">
                      {formData.export_format.toUpperCase()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Готово к генерации
              </Typography>
            </Grid>

            <Grid item xs={12}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              <Paper sx={{ p: 3, textAlign: 'center' }}>
                {generating ? (
                  <>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography variant="body1" gutterBottom>
                      Генерация отчета...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Это может занять несколько минут
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body1" gutterBottom>
                      Нажмите кнопку "Сгенерировать отчет" для создания отчета с выбранными параметрами
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleSubmit}
                      disabled={generating}
                      sx={{ mt: 2 }}
                    >
                      Сгенерировать отчет
                    </Button>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Генератор отчетов
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Создавайте детальные отчеты по проектам, задачам и сотрудникам
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3 }}>
        {renderStepContent(activeStep)}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0 || generating}
        >
          Назад
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/reports')}
          >
            Отмена
          </Button>
          
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={generating}
            >
              Далее
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={generating}
              startIcon={generating ? <CircularProgress size={20} /> : null}
            >
              {generating ? 'Генерация...' : 'Сгенерировать отчет'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ReportGenerator;