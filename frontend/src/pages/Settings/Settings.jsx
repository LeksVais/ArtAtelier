import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Alert,
} from '@mui/material';
import { Save as SaveIcon, RestartAlt as ResetIcon } from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'ru',
    timezone: 'Europe/Moscow',
    itemsPerPage: 20,
    autoSave: true,
    notifications: true,
    emailNotifications: true,
    pushNotifications: false,
    compactMode: false,
  });

  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Здесь будет логика сохранения настроек
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      theme: 'light',
      language: 'ru',
      timezone: 'Europe/Moscow',
      itemsPerPage: 20,
      autoSave: true,
      notifications: true,
      emailNotifications: true,
      pushNotifications: false,
      compactMode: false,
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Настройки системы
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Настройки успешно сохранены
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Внешний вид
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Тема</InputLabel>
                <Select
                  value={settings.theme}
                  label="Тема"
                  onChange={handleChange('theme')}
                >
                  <MenuItem value="light">Светлая</MenuItem>
                  <MenuItem value="dark">Темная</MenuItem>
                  <MenuItem value="auto">Системная</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Язык</InputLabel>
                <Select
                  value={settings.language}
                  label="Язык"
                  onChange={handleChange('language')}
                >
                  <MenuItem value="ru">Русский</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.compactMode}
                    onChange={handleChange('compactMode')}
                  />
                }
                label="Компактный режим"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Поведение
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Элементов на странице"
                type="number"
                value={settings.itemsPerPage}
                onChange={handleChange('itemsPerPage')}
                InputProps={{ inputProps: { min: 5, max: 100 } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Часовой пояс</InputLabel>
                <Select
                  value={settings.timezone}
                  label="Часовой пояс"
                  onChange={handleChange('timezone')}
                >
                  <MenuItem value="Europe/Moscow">Москва (GMT+3)</MenuItem>
                  <MenuItem value="Europe/London">Лондон (GMT+1)</MenuItem>
                  <MenuItem value="America/New_York">Нью-Йорк (GMT-5)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoSave}
                    onChange={handleChange('autoSave')}
                  />
                }
                label="Автосохранение"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Уведомления
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications}
                    onChange={handleChange('notifications')}
                  />
                }
                label="Включить уведомления"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={handleChange('emailNotifications')}
                    disabled={!settings.notifications}
                  />
                }
                label="Email уведомления"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={handleChange('pushNotifications')}
                    disabled={!settings.notifications}
                  />
                }
                label="Push уведомления"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<ResetIcon />}
                  onClick={handleReset}
                >
                  Сбросить
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                >
                  Сохранить настройки
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default Settings;