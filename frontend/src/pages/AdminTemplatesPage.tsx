import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { templatesAPI } from '../services/api';
import { Template } from '../types';

const AdminTemplatesPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    isPremium: false,
    isActive: true,
    thumbnail: '',
    defaultColors: {
      primary: '#1976d2',
      secondary: '#f5f5f5',
      text: '#333333',
      background: '#ffffff',
    },
    defaultFonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    features: [] as string[],
  });

  const { data: templatesResponse, isLoading } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: () => templatesAPI.getTemplates(),
  });

  const templates = (templatesResponse?.data as Template[]) || [];

  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => templatesAPI.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      enqueueSnackbar('Template created successfully!', { variant: 'success' });
      handleCloseDialog();
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.error || 'Failed to create template', { variant: 'error' });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => templatesAPI.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      enqueueSnackbar('Template updated successfully!', { variant: 'success' });
      handleCloseDialog();
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.error || 'Failed to update template', { variant: 'error' });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => templatesAPI.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      enqueueSnackbar('Template deleted successfully!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.error || 'Failed to delete template', { variant: 'error' });
    },
  });

  const handleOpenDialog = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        isPremium: template.isPremium,
        isActive: template.isActive,
        thumbnail: template.thumbnail,
        defaultColors: template.defaultColors || {
          primary: '#1976d2',
          secondary: '#f5f5f5',
          text: '#333333',
          background: '#ffffff',
        },
        defaultFonts: template.defaultFonts || {
          heading: 'Inter',
          body: 'Inter',
        },
        features: template.features || [],
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        category: 'other',
        isPremium: false,
        isActive: true,
        thumbnail: '',
        defaultColors: {
          primary: '#1976d2',
          secondary: '#f5f5f5',
          text: '#333333',
          background: '#ffffff',
        },
        defaultFonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        features: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTemplate(null);
  };

  const handleSubmit = () => {
    const templateData = {
      ...formData,
      structure: {
        layout: 'centered',
        sections: [
          { id: 'header', type: 'header', order: 1, config: {} },
          { id: 'contact', type: 'contact', order: 2, config: {} },
          { id: 'social', type: 'social', order: 3, config: {} },
          { id: 'about', type: 'about', order: 4, config: {} },
        ],
      },
    };

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate._id!, data: templateData });
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };

  const handleDelete = (template: Template) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteTemplateMutation.mutate(template._id!);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      corporate: 'primary',
      creative: 'secondary',
      healthcare: 'success',
      education: 'info',
      technology: 'warning',
      hospitality: 'error',
      retail: 'default',
      other: 'default',
    };
    return colors[category] || 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Template Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage card templates for users to choose from
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Template
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Premium</TableCell>
              <TableCell>Usage Count</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={template.category}
                    color={getCategoryColor(template.category) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={template.isActive ? 'Active' : 'Inactive'}
                    color={template.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {template.isPremium && (
                    <Chip
                      icon={<StarIcon sx={{ fontSize: 16 }} />}
                      label="Premium"
                      color="warning"
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell>{template.usageCount || 0}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(template)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(template)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Template Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Create Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <MenuItem value="corporate">Corporate</MenuItem>
                  <MenuItem value="creative">Creative</MenuItem>
                  <MenuItem value="healthcare">Healthcare</MenuItem>
                  <MenuItem value="education">Education</MenuItem>
                  <MenuItem value="technology">Technology</MenuItem>
                  <MenuItem value="hospitality">Hospitality</MenuItem>
                  <MenuItem value="retail">Retail</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Thumbnail URL"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPremium}
                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                  />
                }
                label="Premium Template"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>

            {/* Color Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>Default Colors</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Primary Color"
                type="color"
                value={formData.defaultColors.primary}
                onChange={(e) => setFormData({
                  ...formData,
                  defaultColors: { ...formData.defaultColors, primary: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Secondary Color"
                type="color"
                value={formData.defaultColors.secondary}
                onChange={(e) => setFormData({
                  ...formData,
                  defaultColors: { ...formData.defaultColors, secondary: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Text Color"
                type="color"
                value={formData.defaultColors.text}
                onChange={(e) => setFormData({
                  ...formData,
                  defaultColors: { ...formData.defaultColors, text: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Background Color"
                type="color"
                value={formData.defaultColors.background}
                onChange={(e) => setFormData({
                  ...formData,
                  defaultColors: { ...formData.defaultColors, background: e.target.value }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
          >
            {editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminTemplatesPage;