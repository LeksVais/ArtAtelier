import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ProjectList from './pages/Projects/ProjectList';
import ProjectDetail from './pages/Projects/ProjectDetail';
import ProjectForm from './pages/Projects/ProjectForm';
import TaskList from './pages/Tasks/TaskList';
import TaskBoard from './pages/Tasks/TaskBoard';
import TaskDetail from './pages/Tasks/TaskDetail';
import TaskForm from './pages/Tasks/TaskForm';
import ClientList from './pages/Clients/ClientList';
import ClientForm from './pages/Clients/ClientForm';
import EmployeeList from './pages/Employees/EmployeeList';
import FileList from './pages/Files/FileList';
import ReportList from './pages/Reports/ReportList';
import ReportGenerator from './pages/Reports/ReportGenerator';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmployeeForm from './components/employees/EmployeeForm';
import EmployeeList from './components/employees/EmployeeList';
import './styles/globals.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff4081',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 минут
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="loading-spinner"></div>
        <p>Проверка авторизации...</p>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => {
    // Симуляция загрузки приложения
    const timer = setTimeout(() => {
      setAppLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!appLoaded) {
    return null; // Preloader будет показан через index.html
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects">
          <Route index element={<ProjectList />} />
          <Route path="new" element={<ProjectForm />} />
          <Route path=":id" element={<ProjectDetail />} />
          <Route path=":id/edit" element={<ProjectForm />} />
        </Route>
        <Route path="tasks">
          <Route index element={<TaskBoard />} />
          <Route path="list" element={<TaskList />} />
          <Route path="new" element={<TaskForm />} />
          <Route path=":id" element={<TaskDetail />} />
          <Route path=":id/edit" element={<TaskForm />} />
        </Route>
        <Route path="clients">
          <Route index element={<ClientList />} />
          <Route path="new" element={<ClientForm />} />
          <Route path=":id" element={<ClientForm />} />
        </Route>
        <Route path="employees" element={<EmployeeList />} />
        <Route path="/employees/new" element={<EmployeeForm />} />
        <Route path="/employees" element={<EmployeeList />} />
        <Route path="files" element={<FileList />} />
        <Route path="reports">
          <Route index element={<ReportList />} />
          <Route path="generate" element={<ReportGenerator />} />
        </Route>
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          autoHideDuration={3000}
        >
          <AuthProvider>
            <Router>
              <AppContent />
            </Router>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;