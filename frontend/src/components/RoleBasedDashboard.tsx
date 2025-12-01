import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const RoleBasedDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  switch (user.role) {
    case 'super_admin':
    case 'admin':
      return <Navigate to="/admin" replace />;

    case 'org_admin':
      // If user is org admin, show organization dashboard
      return <Navigate to="/organization" replace />;

    case 'user':
    default:
      // Regular users go to standard dashboard
      return <Navigate to="/dashboard" replace />;
  }
};

export default RoleBasedDashboard;
