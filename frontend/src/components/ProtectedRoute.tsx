import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { Box, Typography, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireRoles?: string[]; // Array of allowed roles
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireRoles
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!user) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  const hasAccess = () => {
    // If requireRoles is specified, check if user has one of those roles
    if (requireRoles && requireRoles.length > 0) {
      return requireRoles.includes(user.role);
    }

    // Legacy requireAdmin check
    if (requireAdmin) {
      return user.role === 'admin' || user.role === 'super_admin';
    }

    return true;
  };

  if (!hasAccess()) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          px: 3,
        }}
      >
        <LockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          You don't have permission to access this page.
          {requireAdmin && 'Administrator privileges are required.'}
          {requireRoles && `Required roles: ${requireRoles.join(', ')}`}
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.history.back()}
          aria-label="Go back to previous page"
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;