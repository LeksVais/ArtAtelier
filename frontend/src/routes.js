import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy loading для оптимизации
const Login = lazy(() => import('./pages/Auth/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const ProjectList = lazy(() => import('./pages/Projects/ProjectList'));
const ProjectDetail = lazy(() => import('./pages/Projects/ProjectDetail'));
const ProjectForm = lazy(() => import('./pages/Projects/ProjectForm'));
const TaskList = lazy(() => import('./pages/Tasks/TaskList'));
const TaskBoard = lazy(() => import('./pages/Tasks/TaskBoard'));
const TaskDetail = lazy(() => import('./pages/Tasks/TaskDetail'));
const TaskForm = lazy(() => import('./pages/Tasks/TaskForm'));
const ClientList = lazy(() => import('./pages/Clients/ClientList'));
const ClientForm = lazy(() => import('./pages/Clients/ClientForm'));
const EmployeeList = lazy(() => import('./pages/Employees/EmployeeList'));
const FileList = lazy(() => import('./pages/Files/FileList'));
const ReportList = lazy(() => import('./pages/Reports/ReportList'));
const ReportGenerator = lazy(() => import('./pages/Reports/ReportGenerator'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const Settings = lazy(() => import('./pages/Settings/Settings'));

const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    <div className="loading-spinner"></div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route path="/projects">
          <Route index element={<ProjectList />} />
          <Route path="new" element={<ProjectForm />} />
          <Route path=":id" element={<ProjectDetail />} />
          <Route path=":id/edit" element={<ProjectForm />} />
        </Route>
        
        <Route path="/tasks">
          <Route index element={<TaskBoard />} />
          <Route path="list" element={<TaskList />} />
          <Route path="new" element={<TaskForm />} />
          <Route path=":id" element={<TaskDetail />} />
          <Route path=":id/edit" element={<TaskForm />} />
        </Route>
        
        <Route path="/clients">
          <Route index element={<ClientList />} />
          <Route path="new" element={<ClientForm />} />
          <Route path=":id" element={<ClientForm />} />
        </Route>
        
        <Route path="/employees" element={<EmployeeList />} />
        <Route path="/files" element={<FileList />} />
        
        <Route path="/reports">
          <Route index element={<ReportList />} />
          <Route path="generate" element={<ReportGenerator />} />
        </Route>
        
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;