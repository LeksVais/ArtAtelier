import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  CloudUpload as UploadIcon,
  ArrowUpward as ArrowUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { filesAPI } from '../../api/files';
import { formatFileSize, formatDateTime } from '../../utils/helpers';

const FileList = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: 'Все файлы', path: '' }]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await filesAPI.getAll();
      // Гарантируем, что files всегда будет массивом
      setFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]); // Устанавливаем пустой массив при ошибке
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    document.getElementById('file-upload-input').click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);

      await filesAPI.upload(formData);
      fetchFiles();
      
      // Сброс input для возможности загрузки того же файла снова
      event.target.value = null;
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const getFileIcon = (fileType) => {
    const icons = {
      image: '/file-icons/image.png',
      document: '/file-icons/document.png',
      pdf: '/file-icons/pdf.png',
      video: '/file-icons/video.png',
      archive: '/file-icons/zip.png',
      default: '/file-icons/file.png',
    };
    return icons[fileType] || icons.default;
  };

  // Защита от undefined/null
  const filteredFiles = Array.isArray(files) 
    ? files.filter(file => {
        const matchesSearch = file?.name?.toLowerCase().includes(search.toLowerCase()) ||
                           file?.description?.toLowerCase().includes(search.toLowerCase());
        const matchesType = fileType === 'all' || file?.file_type === fileType;
        const matchesProject = projectFilter === 'all' || 
                             (file?.project?.id && file.project.id === parseInt(projectFilter));
        
        return matchesSearch && matchesType && matchesProject;
      })
    : [];

  const fileTypeOptions = [
    { value: 'all', label: 'Все типы' },
    { value: 'image', label: 'Изображения' },
    { value: 'document', label: 'Документы' },
    { value: 'video', label: 'Видео' },
    { value: 'archive', label: 'Архивы' },
    { value: 'audio', label: 'Аудио' },
    { value: 'other', label: 'Другие' },
  ];

  // Безопасное извлечение проектов
  const projects = Array.isArray(files) 
    ? [...new Set(files
        .map(f => f?.project)
        .filter(Boolean)
        .filter((project, index, self) => 
          self.findIndex(p => p?.id === project?.id) === index
        )
      )]
    : [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Загрузка файлов...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4">Файлы</Typography>
          <Breadcrumbs sx={{ mt: 1 }}>
            {breadcrumbs.map((crumb, index) => (
              <Link
                key={index}
                color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  if (index < breadcrumbs.length - 1) {
                    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
                  }
                }}
              >
                {crumb.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <input
            id="file-upload-input"
            type="file"
            hidden
            onChange={handleFileUpload}
          />
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleUploadClick}
          >
            Загрузить
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/files/new-folder')}
          >
            Новая папка
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Поиск файлов"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Тип файла</InputLabel>
              <Select
                value={fileType}
                label="Тип файла"
                onChange={(e) => setFileType(e.target.value)}
              >
                {fileTypeOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Проект</InputLabel>
              <Select
                value={projectFilter}
                label="Проект"
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <MenuItem value="all">Все проекты</MenuItem>
                {projects.map(project => (
                  <MenuItem key={project?.id} value={project?.id}>
                    {project?.title || `Проект ${project?.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearch('');
                setFileType('all');
                setProjectFilter('all');
              }}
            >
              Сбросить
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        {filteredFiles.map((file) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    component="img"
                    src={getFileIcon(file.file_type)}
                    alt={file.file_type}
                    sx={{ width: 40, height: 40, mr: 2 }}
                    onError={(e) => {
                      e.target.src = '/file-icons/file.png';
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" noWrap>
                      {file.name || 'Без названия'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                  </Box>
                  {file.is_current && (
                    <Chip label="Текущая" size="small" color="primary" />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Загружен: {formatDateTime(file.uploaded_at)}
                </Typography>

                {file.project && (
                  <Chip
                    icon={<FolderIcon />}
                    label={file.project.title}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                )}

                {file.version > 1 && (
                  <Chip
                    icon={<HistoryIcon />}
                    label={`v${file.version}`}
                    size="small"
                    sx={{ bgcolor: 'action.selected' }}
                  />
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => filesAPI.download(file.id)}
                >
                  Скачать
                </Button>
                <IconButton
                  size="small"
                  onClick={() => navigate(`/files/${file.id}/versions`)}
                >
                  <HistoryIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!loading && filteredFiles.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Файлы не найдены
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search || fileType !== 'all' || projectFilter !== 'all'
              ? 'Попробуйте изменить параметры поиска'
              : 'Загрузите первый файл'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default FileList;