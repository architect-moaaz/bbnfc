import { createTheme, ThemeOptions } from '@mui/material/styles';

// Design tokens following the design guidelines
export const designTokens = {
  // Color Palette - Updated to match card colors
  colors: {
    primary: {
      yellow: '#FEC72D',      // Primary yellow from cards
      gold: '#b59a3b',        // Gold accent
      darkGold: '#8c752c',    // Darker gold for hover states
    },
    secondary: {
      corporate: '#53565A',   // Moved corporate gray to secondary
      accent: '#00A3B5',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    neutral: {
      charcoal: '#374151',
      mediumGrey: '#6B7280',
      lightGrey: '#E5E7EB',
      backgroundGrey: '#F9FAFB',
      white: '#FFFFFF',
    },
  },
  
  // Typography
  typography: {
    fontFamilies: {
      primary: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif',
      secondary: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif',
      monospace: '"SF Mono", "JetBrains Mono", "Courier New", monospace',
    },
    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    sizes: {
      displayLarge: { fontSize: '48px', lineHeight: '52px' },
      displayMedium: { fontSize: '36px', lineHeight: '40px' },
      h1: { fontSize: '30px', lineHeight: '36px' },
      h2: { fontSize: '24px', lineHeight: '30px' },
      h3: { fontSize: '20px', lineHeight: '26px' },
      bodyLarge: { fontSize: '18px', lineHeight: '26px' },
      bodyRegular: { fontSize: '16px', lineHeight: '24px' },
      bodySmall: { fontSize: '14px', lineHeight: '20px' },
      caption: { fontSize: '12px', lineHeight: '16px' },
    },
  },
  
  // Spacing System
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  // Breakpoints
  breakpoints: {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    largeDesktop: 1440,
  },
  
  // Shadows
  shadows: {
    card: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cardHover: '0 4px 12px rgba(0, 0, 0, 0.15)',
    focus: '0 0 0 2px #1B365F',
  },
  
  // Border Radius
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-out',
    medium: '250ms ease-out',
    slow: '400ms ease-out',
  },
};

// MUI theme configuration
const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: designTokens.colors.primary.gold,
      light: designTokens.colors.primary.yellow,
      dark: designTokens.colors.primary.darkGold,
      contrastText: designTokens.colors.neutral.white,
    },
    secondary: {
      main: designTokens.colors.secondary.corporate,
      light: '#6A6D71',
      dark: '#3F4145',
      contrastText: designTokens.colors.neutral.white,
    },
    success: {
      main: designTokens.colors.semantic.success,
      light: '#34D399',
      dark: '#059669',
    },
    warning: {
      main: designTokens.colors.semantic.warning,
      light: '#FBBF24',
      dark: '#D97706',
    },
    error: {
      main: designTokens.colors.semantic.error,
      light: '#F87171',
      dark: '#DC2626',
    },
    text: {
      primary: designTokens.colors.neutral.charcoal,
      secondary: designTokens.colors.neutral.mediumGrey,
      disabled: '#9CA3AF',
    },
    background: {
      default: designTokens.colors.neutral.backgroundGrey,
      paper: designTokens.colors.neutral.white,
    },
    divider: designTokens.colors.neutral.lightGrey,
  },
  
  typography: {
    fontFamily: designTokens.typography.fontFamilies.primary,
    h1: {
      fontFamily: designTokens.typography.fontFamilies.secondary,
      fontWeight: designTokens.typography.fontWeights.semibold,
      ...designTokens.typography.sizes.h1,
    },
    h2: {
      fontFamily: designTokens.typography.fontFamilies.secondary,
      fontWeight: designTokens.typography.fontWeights.semibold,
      ...designTokens.typography.sizes.h2,
    },
    h3: {
      fontFamily: designTokens.typography.fontFamilies.secondary,
      fontWeight: designTokens.typography.fontWeights.semibold,
      ...designTokens.typography.sizes.h3,
    },
    h4: {
      fontFamily: designTokens.typography.fontFamilies.secondary,
      fontWeight: designTokens.typography.fontWeights.medium,
      fontSize: '18px',
      lineHeight: '24px',
    },
    h5: {
      fontFamily: designTokens.typography.fontFamilies.secondary,
      fontWeight: designTokens.typography.fontWeights.medium,
      fontSize: '16px',
      lineHeight: '20px',
    },
    h6: {
      fontFamily: designTokens.typography.fontFamilies.secondary,
      fontWeight: designTokens.typography.fontWeights.medium,
      fontSize: '14px',
      lineHeight: '18px',
    },
    body1: {
      ...designTokens.typography.sizes.bodyRegular,
    },
    body2: {
      ...designTokens.typography.sizes.bodySmall,
    },
    button: {
      fontWeight: designTokens.typography.fontWeights.semibold,
      fontSize: '16px',
      lineHeight: '20px',
      textTransform: 'none',
    },
    caption: {
      ...designTokens.typography.sizes.caption,
    },
    overline: {
      fontSize: '12px',
      lineHeight: '16px',
      textTransform: 'uppercase',
      fontWeight: designTokens.typography.fontWeights.semibold,
      letterSpacing: '0.05em',
    },
  },
  
  shape: {
    borderRadius: parseInt(designTokens.borderRadius.md),
  },
  
  spacing: 8,
  
  breakpoints: {
    values: {
      xs: designTokens.breakpoints.mobile,
      sm: designTokens.breakpoints.tablet,
      md: designTokens.breakpoints.desktop,
      lg: designTokens.breakpoints.largeDesktop,
      xl: 1920,
    },
  },
  
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.md,
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: designTokens.typography.fontWeights.semibold,
          minHeight: '44px',
          transition: designTokens.transitions.fast,
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: designTokens.shadows.cardHover,
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        containedPrimary: {
          backgroundColor: designTokens.colors.primary.gold,
          color: designTokens.colors.neutral.white,
          '&:hover': {
            backgroundColor: designTokens.colors.primary.darkGold,
          },
        },
        outlinedPrimary: {
          borderWidth: '2px',
          padding: '10px 22px',
          borderColor: designTokens.colors.primary.gold,
          color: designTokens.colors.primary.gold,
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: 'rgba(181, 154, 59, 0.08)',
            borderColor: designTokens.colors.primary.darkGold,
          },
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: '18px',
          minHeight: '52px',
        },
        sizeSmall: {
          padding: '8px 16px',
          fontSize: '14px',
          minHeight: '36px',
        },
      },
    },
    
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: designTokens.borderRadius.md,
            fontSize: '16px',
            minHeight: '44px',
            '& fieldset': {
              borderColor: designTokens.colors.neutral.lightGrey,
              transition: designTokens.transitions.fast,
            },
            '&:hover fieldset': {
              borderColor: designTokens.colors.neutral.mediumGrey,
            },
            '&.Mui-focused fieldset': {
              borderColor: designTokens.colors.primary.gold,
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: designTokens.typography.fontWeights.medium,
            color: designTokens.colors.neutral.charcoal,
          },
        },
      },
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.lg,
          boxShadow: designTokens.shadows.card,
          border: `1px solid ${designTokens.colors.neutral.lightGrey}`,
          transition: designTokens.transitions.medium,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: designTokens.shadows.cardHover,
          },
        },
      },
    },
    
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: designTokens.spacing.lg,
          '&:last-child': {
            paddingBottom: designTokens.spacing.lg,
          },
        },
      },
    },
    
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${designTokens.colors.neutral.lightGrey}`,
        },
      },
    },
    
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: designTokens.spacing.md,
          paddingRight: designTokens.spacing.md,
          '@media (min-width: 768px)': {
            paddingLeft: designTokens.spacing.lg,
            paddingRight: designTokens.spacing.lg,
          },
        },
        maxWidthLg: {
          '@media (min-width: 1024px)': {
            maxWidth: '1200px',
          },
          '@media (min-width: 1440px)': {
            maxWidth: '1400px',
          },
        },
      },
    },
    
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.full,
          fontWeight: designTokens.typography.fontWeights.medium,
        },
      },
    },
    
    MuiLink: {
      styleOverrides: {
        root: {
          color: designTokens.colors.primary.gold,
          fontWeight: designTokens.typography.fontWeights.medium,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
            color: designTokens.colors.primary.darkGold,
          },
          '&:focus': {
            outline: `2px solid ${designTokens.colors.primary.gold}`,
            outlineOffset: '2px',
          },
        },
      },
    },
    
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: '44px',
          minHeight: '44px',
          '&:focus': {
            outline: `2px solid ${designTokens.colors.primary.gold}`,
            outlineOffset: '2px',
          },
        },
      },
    },
  },
};

// Create theme instance
const theme = createTheme(themeOptions);

export default theme;