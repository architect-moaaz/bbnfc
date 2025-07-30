import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Preview as PreviewIcon,
  Star as StarIcon,
  BusinessCenter as BusinessIcon,
  Palette as CreativeIcon,
  LocalHospital as HealthcareIcon,
  School as EducationIcon,
  Computer as TechIcon,
  Restaurant as RestaurantIcon,
  Store as RetailIcon,
  Category as OtherIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { templatesAPI } from '../services/api';
import { Template } from '../types';
import TemplatePreview from '../components/TemplatePreview';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const categoryIcons: { [key: string]: React.ReactElement } = {
  corporate: <BusinessIcon />,
  creative: <CreativeIcon />,
  healthcare: <HealthcareIcon />,
  education: <EducationIcon />,
  technology: <TechIcon />,
  hospitality: <RestaurantIcon />,
  retail: <RetailIcon />,
  other: <OtherIcon />,
};

const categories = [
  { value: 'all', label: 'All Templates' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'creative', label: 'Creative' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'technology', label: 'Technology' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'retail', label: 'Retail' },
  { value: 'other', label: 'Other' },
];

const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const { data: templatesResponse, isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesAPI.getTemplates(),
  });

  const templates = (templatesResponse?.data as Template[]) || [];

  const handleCategoryChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedCategory(newValue);
  };

  const handleUseTemplate = (template: Template) => {
    navigate('/profiles/create', { state: { selectedTemplate: template } });
  };

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 0 || template.category === categories[selectedCategory].value;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      corporate: '#1976d2',
      creative: '#e91e63',
      healthcare: '#2e7d32',
      education: '#3f51b5',
      technology: '#0066ff',
      hospitality: '#ff5722',
      retail: '#ff9800',
      other: '#757575',
    };
    return colors[category] || '#757575';
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load templates. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Choose Your Template
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Select from our professionally designed templates to create your perfect digital business card
        </Typography>

        {/* Search */}
        <Box sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Category Tabs */}
        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
            },
          }}
        >
          {categories.map((category, index) => (
            <Tab key={category.value} label={category.label} />
          ))}
        </Tabs>
      </Box>

      {/* Templates Grid */}
      <TabPanel value={selectedCategory} index={selectedCategory}>
        {isLoading ? (
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent>
                    <Skeleton variant="text" height={32} />
                    <Skeleton variant="text" height={20} />
                    <Skeleton variant="text" height={20} width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : filteredTemplates.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No templates found matching your criteria
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 200,
                      background: `linear-gradient(135deg, ${template.defaultColors?.primary || '#1976d2'}, ${template.defaultColors?.secondary || '#f5f5f5'})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      position: 'relative',
                    }}
                  >
                    {template.name}
                    {template.isPremium && (
                      <Chip
                        icon={<StarIcon sx={{ fontSize: 16 }} />}
                        label="Premium"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(255, 193, 7, 0.9)',
                          color: 'black',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </CardMedia>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" component="h3" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {template.name}
                      </Typography>
                      <Chip
                        icon={categoryIcons[template.category]}
                        label={template.category}
                        size="small"
                        sx={{
                          bgcolor: getCategoryColor(template.category),
                          color: 'white',
                          '& .MuiChip-icon': {
                            color: 'white',
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {template.features?.slice(0, 3).map((feature) => (
                        <Chip
                          key={feature}
                          label={feature.replace('-', ' ')}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                      {template.features && template.features.length > 3 && (
                        <Chip
                          label={`+${template.features.length - 3} more`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      startIcon={<PreviewIcon />}
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ ml: 'auto' }}
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewTemplate}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {previewTemplate?.name} Preview
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {previewTemplate && (
              <TemplatePreview 
                template={previewTemplate} 
                width={350} 
                height={500} 
              />
            )}
          </Box>
          <Typography variant="body1" paragraph>
            {previewTemplate?.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {previewTemplate?.features?.map((feature) => (
              <Chip
                key={feature}
                label={feature.replace('-', ' ')}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (previewTemplate) {
                handleUseTemplate(previewTemplate);
              }
            }}
          >
            Use This Template
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TemplatesPage;