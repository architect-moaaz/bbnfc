import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';

// Components - Load immediately
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardLayoutNew from './components/layout/DashboardLayoutNew';
import RoleBasedDashboard from './components/RoleBasedDashboard';

// Critical pages - Load immediately for better initial experience
import HomePage from './pages/HomePage';
import LoginPageRedesigned from './pages/LoginPageRedesigned';
import RegisterPage from './pages/RegisterPage';

// Lazy load all other pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const LoginPageTailwind = lazy(() => import('./pages/LoginPageTailwind'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilesPage = lazy(() => import('./pages/ProfilesPage'));
const CreateProfilePage = lazy(() => import('./pages/CreateProfilePage'));
const CreateProfileRedesigned = lazy(() => import('./pages/CreateProfileRedesigned'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const EditProfileRedesigned = lazy(() => import('./pages/EditProfileRedesigned'));
const PreviewProfilePage = lazy(() => import('./pages/PreviewProfilePage'));
const CardsPage = lazy(() => import('./pages/CardsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const PublicProfileRedesigned = lazy(() => import('./pages/PublicProfileRedesigned'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const AdminTemplatesPage = lazy(() => import('./pages/AdminTemplatesPage'));
const OrganizationDashboard = lazy(() => import('./pages/OrganizationDashboard'));
const OrganizationSettings = lazy(() => import('./pages/OrganizationSettings'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const AcceptInvitationPage = lazy(() => import('./pages/AcceptInvitationPage'));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    },
  },
});

const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
        <Routes>
          {/* Routes without Navbar - Public Profile pages */}
          <Route path="/p/:profileId" element={<PublicProfileRedesigned />} />

        {/* Profile Edit/Create with Dashboard Layout */}
        <Route
          path="/profiles/new"
          element={
            <ProtectedRoute>
              <DashboardLayoutNew>
                <CreateProfileRedesigned />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profiles/:id/edit"
          element={
            <ProtectedRoute>
              <DashboardLayoutNew>
                <EditProfileRedesigned />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />

        {/* Public Routes - Login/Register without Navbar */}
        <Route path="/login" element={<LoginPageTailwind />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Public Routes with Navbar */}
        <Route path="/" element={<RoleBasedDashboard />} />
        <Route path="/forgot-password" element={<><Navbar /><ForgotPasswordPage /></>} />
        <Route path="/reset-password/:token" element={<><Navbar /><ResetPasswordPage /></>} />
        <Route path="/verify-email/:token" element={<><Navbar /><VerifyEmailPage /></>} />

        {/* Accept Invitation - Public route without navbar */}
        <Route path="/accept-invite/:token" element={<AcceptInvitationPage />} />

        {/* Protected Routes with New Dashboard Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayoutNew>
                <DashboardPage />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profiles"
          element={
            <ProtectedRoute>
              <DashboardLayoutNew>
                <ProfilesPage />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <DashboardLayoutNew>
                <TemplatesPage />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profiles/:id/preview"
          element={
            <ProtectedRoute>
              <DashboardLayoutNew>
                <PreviewProfilePage />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cards"
          element={
            <ProtectedRoute>
              <DashboardLayoutNew>
                <CardsPage />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <DashboardLayoutNew>
                <AnalyticsPage />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <DashboardLayoutNew>
                <SubscriptionPage />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayoutNew>
                <SettingsPage />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes with New Dashboard Layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <DashboardLayoutNew>
                <AdminDashboardPage />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/templates"
          element={
            <ProtectedRoute requireAdmin>
              <DashboardLayoutNew>
                <AdminTemplatesPage />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />

        {/* Organization Routes with New Dashboard Layout */}
        <Route
          path="/organization"
          element={
            <ProtectedRoute requireRoles={['org_admin', 'admin', 'super_admin']}>
              <DashboardLayoutNew>
                <OrganizationDashboard />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/settings"
          element={
            <ProtectedRoute requireRoles={['org_admin', 'admin', 'super_admin']}>
              <DashboardLayoutNew>
                <OrganizationSettings />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/members"
          element={
            <ProtectedRoute requireRoles={['org_admin', 'admin', 'super_admin']}>
              <DashboardLayoutNew>
                <TeamManagement />
              </DashboardLayoutNew>
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </Router>
  );
};

const App: React.FC = () => {
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
          autoHideDuration={4000}
        >
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
