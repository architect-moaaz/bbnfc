import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import CreditCardIcon from '@mui/icons-material/CreditCard';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CreditCardIcon sx={{ fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{
                fontFamily: theme.typography.h1.fontFamily,
                fontWeight: 600,
                fontSize: { xs: '18px', md: '20px' },
              }}
            >
              NFC Business Cards
            </Typography>
          </Box>

        {/* Desktop Menu */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          {user ? (
            <>
              <Button color="inherit" component={Link} to="/dashboard">
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/profiles">
                Profiles
              </Button>
              <Button color="inherit" component={Link} to="/cards">
                Cards
              </Button>
              <Button color="inherit" component={Link} to="/analytics">
                Analytics
              </Button>
              {user.role === 'admin' && (
                <Button color="inherit" component={Link} to="/admin">
                  Admin
                </Button>
              )}
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/register"
                variant="outlined"
                sx={{ ml: 1 }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>

        {/* Mobile Menu */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            aria-label="show more"
            aria-controls="mobile-menu"
            aria-haspopup="true"
            onClick={handleMobileMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="mobile-menu"
            anchorEl={mobileMenuAnchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(mobileMenuAnchorEl)}
            onClose={handleClose}
          >
            {user ? (
              [
                <MenuItem key="dashboard" component={Link} to="/dashboard" onClick={handleClose}>
                  Dashboard
                </MenuItem>,
                <MenuItem key="profiles" component={Link} to="/profiles" onClick={handleClose}>
                  Profiles
                </MenuItem>,
                <MenuItem key="cards" component={Link} to="/cards" onClick={handleClose}>
                  Cards
                </MenuItem>,
                <MenuItem key="analytics" component={Link} to="/analytics" onClick={handleClose}>
                  Analytics
                </MenuItem>,
                <MenuItem key="settings" component={Link} to="/settings" onClick={handleClose}>
                  Settings
                </MenuItem>,
                <MenuItem key="subscription" component={Link} to="/subscription" onClick={handleClose}>
                  Subscription
                </MenuItem>,
                user.role === 'admin' && (
                  <MenuItem key="admin" component={Link} to="/admin" onClick={handleClose}>
                    Admin
                  </MenuItem>
                ),
                <MenuItem key="logout" onClick={handleLogout}>
                  Logout
                </MenuItem>,
              ].filter(Boolean)
            ) : (
              [
                <MenuItem key="login" component={Link} to="/login" onClick={handleClose}>
                  Login
                </MenuItem>,
                <MenuItem key="register" component={Link} to="/register" onClick={handleClose}>
                  Sign Up
                </MenuItem>,
              ]
            )}
          </Menu>
        </Box>
      </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;