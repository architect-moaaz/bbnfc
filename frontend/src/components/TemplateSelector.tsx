import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Chip,
  Radio,
  useTheme,
  alpha,
} from '@mui/material';
import { Template } from '../types';
import StarIcon from '@mui/icons-material/Star';

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplateId: string | null;
  onSelect: (templateId: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelect,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Choose a Template
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select a professional template to style your digital business card
      </Typography>

      {templates.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No templates available. You can still create a profile with the default style.
        </Typography>
      ) : (
      <Grid container spacing={2}>
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template._id || selectedTemplateId === template.id;

          return (
            <Grid item xs={12} sm={6} md={4} key={template._id || template.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: 2,
                  borderColor: isSelected ? theme.palette.primary.main : 'transparent',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                    borderColor: isSelected
                      ? theme.palette.primary.main
                      : alpha(theme.palette.primary.main, 0.3),
                  },
                }}
                onClick={() => onSelect(template._id || template.id)}
              >
                {/* Selection Radio */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    boxShadow: theme.shadows[2],
                  }}
                >
                  <Radio
                    checked={isSelected}
                    color="primary"
                    size="small"
                  />
                </Box>

                {/* Premium Badge */}
                {template.isPremium && (
                  <Chip
                    icon={<StarIcon sx={{ fontSize: 16 }} />}
                    label="Premium"
                    size="small"
                    color="warning"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 1,
                      fontWeight: 600,
                    }}
                  />
                )}

                {/* Template Thumbnail */}
                <CardMedia
                  component="img"
                  height="140"
                  image={template.thumbnail}
                  alt={template.name}
                  sx={{
                    objectFit: 'cover',
                  }}
                />

                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {template.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, minHeight: 40 }}
                  >
                    {template.description}
                  </Typography>

                  {/* Category Badge */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip
                      label={template.category}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                    <Chip
                      label={template.structure.layout}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>

                  {/* Color Preview */}
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                    {template.defaultColors && (
                      <>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            backgroundColor: template.defaultColors.primary,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                          title={`Primary: ${template.defaultColors.primary}`}
                        />
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            backgroundColor: template.defaultColors.secondary,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                          title={`Secondary: ${template.defaultColors.secondary}`}
                        />
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      )}
    </Box>
  );
};

export default TemplateSelector;
