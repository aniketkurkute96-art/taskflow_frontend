import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Lazy load components for better performance
const Login = lazy(() => import('./pages/Auth/Login'));
const Signup = lazy(() => import('./pages/Auth/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks/Tasks'));
const TaskDetail = lazy(() => import('./pages/Tasks/TaskDetail'));
const TaskCreate = lazy(() => import('./pages/Tasks/TaskCreate'));
const Approvals = lazy(() => import('./pages/Approvals/Approvals'));
const Users = lazy(() => import('./pages/Users/Users'));
const Departments = lazy(() => import('./pages/Departments/Departments'));
const ApprovalTemplates = lazy(() => import('./pages/Admin/ApprovalTemplates'));
const Profile = lazy(() => import('./pages/Profile/Profile'));

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/signup" 
          element={!user ? <Signup /> : <Navigate to="/dashboard" replace />} 
        />

        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/create" element={<TaskCreate />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="profile" element={<Profile />} />
          
          {/* Admin only routes */}
          <Route 
            path="users" 
            element={
              <ProtectedRoute adminOnly>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="departments" 
            element={
              <ProtectedRoute adminOnly>
                <Departments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="approval-templates" 
            element={
              <ProtectedRoute adminOnly>
                <ApprovalTemplates />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;