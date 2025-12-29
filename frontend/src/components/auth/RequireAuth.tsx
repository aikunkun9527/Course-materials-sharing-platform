import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface RequireAuthProps {
  children: React.ReactNode;
  role?: 'student' | 'admin';
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, role }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
