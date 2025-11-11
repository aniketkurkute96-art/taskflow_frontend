import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ApprovalBucket from './pages/ApprovalBucket';
import WaitingOn from './pages/WaitingOn';
import TaskCreate from './pages/TaskCreate';
import TaskDetail from './pages/TaskDetail';
import TaskCreateNew from './pages/TaskCreateNew';
import TaskDetailNew from './pages/TaskDetailNew';
import TaskEdit from './pages/TaskEdit';
import AdminTemplates from './pages/AdminTemplates';
import AdminPanel from './pages/AdminPanel';
import TestLogin from './pages/TestLogin';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/test-login" element={<TestLogin />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/approval-bucket"
            element={
              <PrivateRoute>
                <ApprovalBucket />
              </PrivateRoute>
            }
          />
          <Route
            path="/waiting-on"
            element={
              <PrivateRoute>
                <WaitingOn />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks/create"
            element={
              <PrivateRoute>
                <TaskCreateNew />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks/:id"
            element={
              <PrivateRoute>
                <TaskDetailNew />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks/:id/edit"
            element={
              <PrivateRoute>
                <TaskEdit />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/templates"
            element={
              <AdminRoute>
                <AdminTemplates />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/panel"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
