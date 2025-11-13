import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import { useAuth } from '../contexts/AuthContext';
import AppShell from '../components/shell/AppShell';
import EagleEyeHome from './EagleEyeHome';
import ApprovalBucket from '../pages/ApprovalBucket';
import WaitingOn from '../pages/WaitingOn';
import TaskDetailNew from '../pages/TaskDetailNew';
import TaskCreateNew from '../pages/TaskCreateNew';
import TaskEdit from '../pages/TaskEdit';
import AdminPanel from '../pages/AdminPanel';
import TestLogin from '../pages/TestLogin';
import ReceptionDashboard from '../pages/Reception/ReceptionDashboard';
import ChequeCreate from '../pages/Cheques/ChequeCreate';

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/workspace" />;
  return <>{children}</>;
};

const RoleRoute = ({
  children,
  roles,
}: {
  children: ReactNode;
  roles: string[];
}) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!user?.role || !roles.includes(user.role)) {
    return <Navigate to="/workspace" />;
  }
  return <>{children}</>;
};

const EagleEyeApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/test-login" element={<TestLogin />} />
        {/* Persistent AppShell wrapper for all EagleEye routes */}
        <Route
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route path="/workspace" element={<EagleEyeHome />} />
          <Route path="/approval-bucket" element={<ApprovalBucket />} />
          <Route path="/waiting-on" element={<WaitingOn />} />
          <Route path="/tasks/create" element={<TaskCreateNew />} />
          <Route path="/tasks/:id" element={<TaskDetailNew />} />
          <Route path="/tasks/:id/edit" element={<TaskEdit />} />
          <Route
            path="/reception/cheques"
            element={
              <RoleRoute roles={['reception', 'admin']}>
                <ReceptionDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/cheques/new"
            element={
              <RoleRoute roles={['accounts', 'director', 'admin']}>
                <ChequeCreate />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Routes>
    </Router>
  );
};

export default EagleEyeApp;


