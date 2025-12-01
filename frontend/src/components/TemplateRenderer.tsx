import React from 'react';
import { Box, Container, useTheme } from '@mui/material';
import { Profile } from '../types';

interface TemplateRendererProps {
  profile: Profile;
  children: React.ReactNode;
}

const TemplateRenderer: React.FC<TemplateRendererProps> = ({ profile, children }) => {
  const theme = useTheme();

  // Get template colors or use defaults
  const templateColors = profile.template?.defaultColors || profile.selectedTemplate?.defaultColors || {
    primary: '#2563EB',
    secondary: '#F8F9FA',
    text: '#1A202C',
    background: '#FFFFFF'
  };

  // Get template layout
  const layout = profile.template?.structure?.layout || profile.selectedTemplate?.structure?.layout || 'centered';

  // Get template fonts
  const fonts = profile.template?.defaultFonts || profile.selectedTemplate?.defaultFonts || {
    heading: 'Inter',
    body: 'Inter'
  };

  // Template-specific styles
  const layoutStyles = {
    centered: {
      maxWidth: '800px',
      margin: '0 auto',
      textAlign: 'center' as const,
    },
    'left-aligned': {
      maxWidth: '1000px',
      margin: '0 auto',
      textAlign: 'left' as const,
    },
    split: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      gap: 4,
    },
    card: {
      maxWidth: '600px',
      margin: '0 auto',
      borderRadius: '16px',
      boxShadow: theme.shadows[4],
      overflow: 'hidden',
    },
    minimal: {
      maxWidth: '700px',
      margin: '0 auto',
      padding: { xs: 2, md: 4 },
    },
  };

  // Get layout-specific styles
  const currentLayoutStyle = layoutStyles[layout as keyof typeof layoutStyles] || layoutStyles.centered;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: templateColors.background,
        color: templateColors.text,
        fontFamily: fonts.body,

        // Global template styles
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          fontFamily: fonts.heading,
          color: templateColors.primary,
        },

        // Button styles based on template
        '& .MuiButton-root': {
          backgroundColor: templateColors.primary,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: templateColors.secondary,
            color: templateColors.text,
          },
        },

        // Icon button styles
        '& .MuiIconButton-root': {
          color: templateColors.primary,
          '&:hover': {
            backgroundColor: `${templateColors.primary}20`,
          },
        },

        // Chip styles
        '& .MuiChip-root': {
          backgroundColor: `${templateColors.primary}20`,
          color: templateColors.primary,
        },

        // Link styles
        '& a': {
          color: templateColors.primary,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },

        // Custom gradient backgrounds for specific templates
        ...(profile.template?.slug === 'creative-bold' && {
          background: `linear-gradient(135deg, ${templateColors.primary} 0%, ${templateColors.secondary} 100%)`,
          color: '#FFFFFF',
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            color: '#FFFFFF',
          },
        }),

        ...(profile.template?.slug === 'tech-gradient' && {
          background: `linear-gradient(135deg, ${templateColors.background} 0%, #1a1a2e 100%)`,
          color: '#E0E0E0',
        }),
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          ...currentLayoutStyle,
          py: { xs: 4, md: 6 },
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default TemplateRenderer;
