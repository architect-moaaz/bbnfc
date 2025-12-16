import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Subscriptions as SubscriptionsIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AccountCircle as AccountCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ViewModule as TemplateIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
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
    title: 'Subscription',
    path: '/subscription',
    icon: <SubscriptionsIcon />,
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
  },
  {
    title: 'Admin',
    path: '/admin',
    icon: <AdminIcon />,
    adminOnly: true,
  },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Auto-collapse when focus leaves the sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isMobile && !collapsed && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setCollapsed(true);
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      if (!isMobile && !collapsed && sidebarRef.current) {
        // Check if the new focus target is outside the sidebar
        const relatedTarget = event.relatedTarget as Node;
        if (!relatedTarget || !sidebarRef.current.contains(relatedTarget)) {
          // Add a small delay to allow for focus transitions within the sidebar
          setTimeout(() => {
            if (!sidebarRef.current?.contains(document.activeElement)) {
              setCollapsed(true);
            }
          }, 100);
        }
      }
    };

    if (!isMobile && !collapsed) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('focusout', handleFocusOut);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [collapsed, isMobile]);

  // Expand sidebar on hover when collapsed
  const handleSidebarMouseEnter = () => {
    if (!isMobile && collapsed) {
      setCollapsed(false);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleProfileSettings = () => {
    navigate('/settings');
    handleProfileMenuClose();
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>


      {/* Navigation Items */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ px: 2, py: 1 }}>
          {navItems
            .filter(item => !item.adminOnly || user?.role === 'admin')
            .map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip title={collapsed ? item.title : ''} placement="right">
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        borderRadius: 2,
                        mx: 0.5,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        px: collapsed ? 1 : 2,
                        ...(isActive && {
                          backgroundColor: theme.palette.primary.main,
                          color: 'white',
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'white',
                          },
                        }),
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? 'auto' : 40,
                          color: isActive ? 'white' : 'inherit',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText 
                          primary={item.title}
                          primaryTypographyProps={{
                            fontWeight: isActive ? 600 : 400,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              );
            })}
        </List>
      </Box>


      {/* Logout */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <ListItem disablePadding>
          <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                mx: 0.5,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 2,
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'error.contrastText',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 40, color: 'inherit', justifyContent: 'center' }}>
                <LogoutIcon />
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Logout" />}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: '100%',
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              NFC Business Cards
            </Typography>
            {/* Profile Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ color: 'inherit' }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: collapsed ? collapsedDrawerWidth : drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        {isMobile && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              zIndex: theme.zIndex.drawer + 2,
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: `1px solid ${theme.palette.divider}`,
                zIndex: theme.zIndex.drawer + 2,
              },
              '& .MuiBackdrop-root': {
                zIndex: theme.zIndex.drawer + 1,
              },
            }}
          >
            {drawer}
          </Drawer>
        )}
        
        {/* Desktop drawer */}
        {!isMobile && (
          <Drawer
            ref={sidebarRef}
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: collapsed ? collapsedDrawerWidth : drawerWidth,
                borderRight: `1px solid ${theme.palette.divider}`,
                position: 'relative',
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              },
            }}
            onMouseEnter={handleSidebarMouseEnter}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${collapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          pt: { xs: 8, md: 0 }, // Add top padding for mobile app bar
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {children}
      </Box>

      {/* Desktop Profile Menu */}
      {!isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: theme.zIndex.drawer + 2,
          }}
        >
          <IconButton
            onClick={handleProfileMenuOpen}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': {
                boxShadow: 2,
              },
            }}
          >
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
        </Box>
      )}

      {/* Profile Menu Dropdown */}
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
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || 'user@example.com'}
          </Typography>
          {user?.role === 'admin' && (
            <Chip label="Admin" size="small" color="primary" sx={{ mt: 0.5 }} />
          )}
        </Box>
        <MenuItem onClick={handleProfileSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Profile Settings
        </MenuItem>
        <MenuItem onClick={() => { handleLogout(); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardLayout;