import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import { useAuth } from '../contexts/AuthContext';
import AppShell from '../components/shell/AppShell';
import EagleEyeHome from './EagleEyeHome';
import TestLogin from '../pages/TestLogin';

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const EagleEyeApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/test-login" element={<TestLogin />} />
        <Route
          path="/workspace"
          element={
            <PrivateRoute>
              <AppShell>
                <EagleEyeHome />
              </AppShell>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Routes>
    </Router>
  );
};

export default EagleEyeApp;


