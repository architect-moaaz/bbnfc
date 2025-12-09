import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Person as PersonIcon,
  Palette as PaletteIcon,
  QrCode2 as QrCodeIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  HelpOutline as HelpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Dashboard as DashboardIcon,
  ViewModule as TemplateIcon,
  CreditCard as CreditCardIcon,
  AdminPanelSettings as AdminIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardLayoutNewProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  orgOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    title: 'Profiles',
    path: '/profiles',
    icon: <PersonIcon />,
  },
  {
    title: 'Templates',
    path: '/templates',
    icon: <TemplateIcon />,
  },
  {
    title: 'Cards',
    path: '/cards',
    icon: <CreditCardIcon />,
  },
  {
    title: 'Analytics',
    path: '/analytics',
    icon: <AnalyticsIcon />,
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
  },
  {
    title: 'Organization',
    path: '/organization',
    icon: <BusinessIcon />,
    orgOnly: true,
  },
  {
    title: 'Team',
    path: '/organization/members',
    icon: <PeopleIcon />,
    orgOnly: true,
  },
  {
    title: 'Admin',
    path: '/admin',
    icon: <AdminIcon />,
    adminOnly: true,
  },
];

const DashboardLayoutNew: React.FC<DashboardLayoutNewProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [navigate, isMobile]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleProfileMenuClose();
  };

  // Memoize filtered nav items to prevent unnecessary re-renders
  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => {
      // Filter admin-only items
      if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'super_admin') {
        return false;
      }
      // Filter org-only items
      if (item.orgOnly && user?.role !== 'org_admin' && user?.role !== 'admin' && user?.role !== 'super_admin') {
        return false;
      }
      return true;
    });
  }, [user?.role]);

  const sidebarContent = (
    <Box sx={{ width: 240, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Navigation */}
      <List sx={{ px: 2, py: 3, flex: 1 }}>
        {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: '8px',
                    py: 1.5,
                    px: 2,
                    ...(isActive && {
                      backgroundColor: '#F0F4FF',
                      color: '#2563EB',
                      '& .MuiListItemIcon-root': {
                        color: '#2563EB',
                      },
                    }),
                    '&:hover': {
                      backgroundColor: isActive ? '#E0EBFF' : '#F8FAFC',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? '#2563EB' : '#64748B',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.9375rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#2563EB' : '#1E293B',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
      </List>

      {/* Go Pro Section */}
      <Box
        sx={{
          m: 2,
          p: 2.5,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
          color: '#FFFFFF',
        }}
      >
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, mb: 0.5 }}>
          Go Pro
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', mb: 2, opacity: 0.9, lineHeight: 1.4 }}>
          Unlock custom domains and removing branding.
        </Typography>
        <Box
          component="button"
          onClick={() => navigate('/subscription')}
          sx={{
            width: '100%',
                backgroundColor: '#FFFFFF',
            color: '#2563EB',
            border: 'none',
            borderRadius: '8px',
            py: 1,
            px: 2,
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#F0F4FF',
            },
          }}
        >
          Upgrade Now
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
          {/* Left side - Logo and Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isMobile && (
              <IconButton
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ color: '#1E293B' }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#2563EB',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontSize: '1rem',
                }}
              >
                B
              </Box>
              <Typography
                sx={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#1E293B',
                }}
              >
                BBTap
              </Typography>
              <Box
                sx={{
                  backgroundColor: '#F0F4FF',
                  color: '#2563EB',
                  px: 1,
                  py: 0.25,
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Editor
              </Box>
            </Box>
          </Box>

          {/* Right side - Help and Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="button"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backgroundColor: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                padding: 0,
                '&:hover': {
                  color: '#2563EB',
                },
              }}
            >
              Help
            </Box>

            {/* User Profile Button */}
            <Box
              onClick={handleProfileMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                px: 1.5,
                py: 0.75,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#F8FAFC',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.875rem',
                  bgcolor: '#2563EB',
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#1E293B',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {user?.name?.split(' ')[0] || 'User'}
              </Typography>
              <ArrowDownIcon sx={{ fontSize: 18, color: '#64748B' }} />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 240,
              borderRight: '1px solid #E2E8F0',
              mt: '64px',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
              borderRight: '1px solid #E2E8F0',
              mt: '64px',
              backgroundColor: '#FFFFFF',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '64px',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        sx={{
          mt: 1,
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', minWidth: 200 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E293B' }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#64748B' }}>
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>
        <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardLayoutNew;
