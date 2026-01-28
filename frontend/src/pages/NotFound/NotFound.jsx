import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography variant="h1" sx={{ fontSize: '8rem', fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
          404
        </Typography>
        
        <Typography variant="h4" gutterBottom>
          Страница не найдена
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
          Запрашиваемая страница не существует или была перемещена.
          Проверьте адрес или вернитесь на главную страницу.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            Назад
          </Button>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/dashboard')}
          >
            На главную
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NotFound;