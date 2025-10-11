import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, List, ListItem, ListItemText,
  ListItemSecondaryAction, Chip, Tabs, Tab, Divider, Alert, Paper, Checkbox,
  LinearProgress, FormControlLabel, Select, MenuItem, FormControl, InputLabel, Badge,
  CardHeader, Avatar, Stack, Tooltip, Fade, Slide, Snackbar
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CheckBox as CheckBoxIcon,
  Category as CategoryIcon, PlayArrow as PlayArrowIcon, CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon, Save as SaveIcon, Close as CloseIcon,
  Info as InfoIcon, Today as TodayIcon, Schedule as ScheduleIcon,
  Store as StoreIcon, Assessment as AssessmentIcon, Settings as SettingsIcon
} from '@mui/icons-material';
import api from '../services/api';

function ChecklistEnhanced() {
  const [activeTab, setActiveTab] = useState(0);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [pendingChecklists, setPendingChecklists] = useState([]);
  const [activeCompletion, setActiveCompletion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [itemDialog, setItemDialog] = useState(false);
  const [completionDialog, setCompletionDialog] = useState(false);

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [templateForm, setTemplateForm] = useState({ 
    name: '', description: '', category: '', items: [], frequency: 'once', stores: [], activeDays: []
  });
  const [itemForm, setItemForm] = useState({ text: '', required: true });
  const [completionForm, setCompletionForm] = useState({ 
    templateId: null, store: '', items: [], notes: '' 
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchTemplates();
    if (activeTab === 0) {
      fetchPendingChecklists();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/checklists/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/checklists/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchPendingChecklists = async () => {
    try {
      const response = await api.get('/checklists/pending');
      setPendingChecklists(response.data);
    } catch (error) {
      console.error('Error fetching pending checklists:', error);
    }
  };

  // Category handlers
  const handleSaveCategory = async () => {
    try {
      setLoading(true);
      
      if (editingId) {
        await api.put(`/checklists/categories/${editingId}`, categoryForm);
        setSuccess('Category updated successfully');
      } else {
        await api.post('/checklists/categories', categoryForm);
        setSuccess('Category created successfully');
      }
      
      setCategoryDialog(false);
      setCategoryForm({ name: '', description: '' });
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await api.delete(`/checklists/categories/${id}`);
      setSuccess('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete category');
    }
  };

  // Template handlers
  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      
      if (editingId) {
        await api.put(`/checklists/templates/${editingId}`, templateForm);
        setSuccess('Template updated successfully');
      } else {
        await api.post('/checklists/templates', templateForm);
        setSuccess('Template created successfully');
      }
      
      setTemplateDialog(false);
      setTemplateForm({ name: '', description: '', category: '', items: [], frequency: 'once', stores: [], activeDays: [] });
      setEditingId(null);
      fetchTemplates();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await api.delete(`/checklists/templates/${id}`);
      setSuccess('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete template');
    }
  };

  // Completion handlers
  const handleStartChecklist = (template) => {
    setCompletionForm({
      templateId: template._id,
      store: '',
      notes: '',
      items: template.items.map(item => ({ ...item, completed: false, notes: '' }))
    });
    setCompletionDialog(true);
  };

  const handleToggleItem = (index) => {
    const newItems = [...completionForm.items];
    newItems[index].completed = !newItems[index].completed;
    setCompletionForm({ ...completionForm, items: newItems });
  };

  const handleItemNotes = (index, notes) => {
    const newItems = [...completionForm.items];
    newItems[index].notes = notes;
    setCompletionForm({ ...completionForm, items: newItems });
  };

  const handleSaveCompletion = async () => {
    try {
      setLoading(true);
      
      const completedCount = completionForm.items.filter(item => item.completed).length;
      const status = completedCount === completionForm.items.length ? 'completed' : 
                     completedCount > 0 ? 'in-progress' : 'not-started';
      
      await api.post('/checklists/completions', {
        ...completionForm,
        status
      });
      
      setSuccess('Checklist saved successfully!');
      setCompletionDialog(false);
      setCompletionForm({ templateId: null, store: '', items: [], notes: '' });
      fetchPendingChecklists();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save checklist');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!itemForm.text.trim()) return;
    setTemplateForm({
      ...templateForm,
      items: [...templateForm.items, { ...itemForm, id: Date.now() }]
    });
    setItemForm({ text: '', required: true });
    setItemDialog(false);
  };

  const handleRemoveItem = (itemId) => {
    setTemplateForm({
      ...templateForm,
      items: templateForm.items.filter(item => item.id !== itemId)
    });
  };

  const openEditCategory = (category) => {
    setCategoryForm({ name: category.name, description: category.description || '' });
    setEditingId(category._id);
    setCategoryDialog(true);
  };

  const openEditTemplate = (template) => {
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      category: template.category?._id || '',
      items: template.items.map(item => ({ ...item, id: item._id || Date.now() })),
      frequency: template.frequency || 'once',
      stores: template.stores || [],
      activeDays: template.activeDays || []
    });
    setEditingId(template._id);
    setTemplateDialog(true);
  };

  const getCompletionPercentage = () => {
    if (!completionForm.items || completionForm.items.length === 0) return 0;
    const completed = completionForm.items.filter(item => item.completed).length;
    return Math.round((completed / completionForm.items.length) * 100);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header Section */}
      <Box sx={{ 
        mb: 4, 
        pb: 3, 
        borderBottom: '2px solid',
        borderColor: 'primary.main',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 2,
        p: 3,
        color: 'white',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 56, height: 56 }}>
            <AssignmentIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Checklist Management
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Manage daily tasks, templates and categories efficiently
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Alerts */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError('')} variant="filled" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={4000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')} variant="filled" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Enhanced Tabs */}
      <Paper elevation={2} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)} 
          variant="fullWidth"
          sx={{ 
            bgcolor: 'background.paper',
            '& .MuiTab-root': { 
              py: 2.5, 
              fontWeight: 600,
              fontSize: '1rem'
            }
          }}
        >
          <Tab 
            label={
              <Badge 
                badgeContent={pendingChecklists.length} 
                color="error"
                max={99}
                sx={{ '& .MuiBadge-badge': { top: -8, right: -12 } }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <TodayIcon />
                  <span>Daily Checklists</span>
                </Stack>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <CategoryIcon />
                <span>Categories</span>
                <Chip label={categories.length} size="small" />
              </Stack>
            } 
          />
          <Tab 
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckBoxIcon />
                <span>Templates</span>
                <Chip label={templates.length} size="small" />
              </Stack>
            } 
          />
        </Tabs>
      </Paper>

      {/* Daily Checklists Tab */}
      {activeTab === 0 && (
        <Fade in timeout={500}>
          <Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3,
              p: 2,
              bgcolor: 'primary.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'primary.200'
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  📋 Today's Pending Checklists
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {pendingChecklists.length} checklist{pendingChecklists.length !== 1 ? 's' : ''} waiting to be completed
                </Typography>
              </Box>
              <Chip 
                label={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                icon={<TodayIcon />}
                color="primary"
                variant="outlined"
              />
            </Box>

            <Grid container spacing={3}>
              {pendingChecklists.map((template) => (
                <Grid item xs={12} md={6} lg={4} key={template._id}>
                  <Card 
                    elevation={3}
                    sx={{ 
                      height: '100%',
                      border: '2px solid',
                      borderColor: 'warning.main',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(255,152,0,0.2)',
                        borderColor: 'warning.dark'
                      }
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: 'warning.main', fontWeight: 700 }}>
                          {template.name.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      action={
                        <Chip 
                          label={template.frequency} 
                          size="small" 
                          color="warning" 
                          icon={<ScheduleIcon />}
                          sx={{ fontWeight: 600 }}
                        />
                      }
                      title={
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {template.name}
                        </Typography>
                      }
                      subheader={
                        template.category && (
                          <Chip 
                            label={template.category.name} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        )
                      }
                    />
                    <CardContent>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 2, minHeight: 40 }}
                      >
                        {template.description || 'No description available'}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Chip 
                          icon={<CheckBoxIcon />}
                          label={`${template.items?.length || 0} Items`}
                          size="small"
                          variant="outlined"
                        />
                        {template.assignedStore && (
                          <Chip 
                            icon={<StoreIcon />}
                            label={template.assignedStore}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        )}
                      </Stack>

                      <Button
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={<PlayArrowIcon />}
                        fullWidth
                        onClick={() => handleStartChecklist(template)}
                        sx={{ 
                          py: 1.5, 
                          fontWeight: 600,
                          fontSize: '1rem',
                          boxShadow: '0 4px 12px rgba(76,175,80,0.3)',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(76,175,80,0.4)'
                          }
                        }}
                      >
                        Start Checklist
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {pendingChecklists.length === 0 && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 6, 
                  textAlign: 'center', 
                  bgcolor: 'success.50',
                  border: '2px dashed',
                  borderColor: 'success.main',
                  borderRadius: 3
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.dark', mb: 1 }}>
                  All Done! 🎉
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  All daily checklists have been completed. Great job!
                </Typography>
              </Paper>
            )}
          </Box>
        </Fade>
      )}

      {/* Categories Tab - Professional Design */}
      {activeTab === 1 && (
        <Fade in timeout={500}>
          <Box>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3,
                mb: 4,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                border: '2px solid #9c27b0'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon sx={{ fontSize: 32 }} />
                    Checklist Categories
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, color: 'secondary.dark', fontWeight: 500 }}>
                    📁 Organize your checklists into meaningful groups for better management
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setCategoryForm({ name: '', description: '' });
                    setEditingId(null);
                    setCategoryDialog(true);
                  }}
                  sx={{ 
                    bgcolor: 'secondary.main',
                    boxShadow: '0 6px 16px rgba(156,39,176,0.4)',
                    fontWeight: 700,
                    px: 4,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'secondary.dark',
                      boxShadow: '0 8px 24px rgba(156,39,176,0.5)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Add Category
                </Button>
              </Box>
            </Paper>

            <Grid container spacing={3}>
              {categories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category._id}>
                  <Card 
                    elevation={4}
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'visible',
                      border: '2px solid transparent',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 32px rgba(156,39,176,0.2)',
                        borderColor: 'secondary.main'
                      }
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar 
                          sx={{ 
                            bgcolor: 'secondary.main', 
                            width: 56, 
                            height: 56,
                            boxShadow: '0 4px 12px rgba(156,39,176,0.3)'
                          }}
                        >
                          <CategoryIcon sx={{ fontSize: 28 }} />
                        </Avatar>
                      }
                      action={
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit Category">
                            <IconButton 
                              size="medium" 
                              onClick={() => openEditCategory(category)}
                              sx={{ 
                                bgcolor: 'secondary.50',
                                '&:hover': { 
                                  bgcolor: 'secondary.100',
                                  color: 'secondary.main',
                                  transform: 'scale(1.15)'
                                },
                                transition: 'all 0.2s'
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Category">
                            <IconButton 
                              size="medium" 
                              onClick={() => handleDeleteCategory(category._id)}
                              sx={{ 
                                bgcolor: 'error.50',
                                '&:hover': { 
                                  bgcolor: 'error.100',
                                  color: 'error.main',
                                  transform: 'scale(1.15)'
                                },
                                transition: 'all 0.2s'
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                      title={
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                          {category.name}
                        </Typography>
                      }
                      subheader={
                        <Chip 
                          label="Active" 
                          size="small" 
                          color="success" 
                          sx={{ mt: 0.5, fontWeight: 600 }}
                        />
                      }
                    />
                    <CardContent>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          minHeight: 70,
                          fontSize: '0.95rem',
                          lineHeight: 1.6,
                          mb: 2
                        }}
                      >
                        {category.description || '📝 No description provided for this category'}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TodayIcon sx={{ fontSize: 14 }} />
                          {new Date(category.createdAt).toLocaleDateString()}
                        </Typography>
                        <Chip 
                          label={category.createdBy?.username || 'System'}
                          size="small"
                          avatar={<Avatar sx={{ width: 20, height: 20 }}>{(category.createdBy?.username || 'S')[0].toUpperCase()}</Avatar>}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {categories.length === 0 && (
              <Paper 
                elevation={6}
                sx={{ 
                  p: 8, 
                  textAlign: 'center',
                  border: '3px dashed',
                  borderColor: 'secondary.light',
                  borderRadius: 4,
                  bgcolor: 'secondary.50'
                }}
              >
                <Avatar sx={{ width: 100, height: 100, bgcolor: 'secondary.main', margin: '0 auto', mb: 3 }}>
                  <CategoryIcon sx={{ fontSize: 60 }} />
                </Avatar>
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 800, color: 'secondary.main' }}>
                  No Categories Yet
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
                  🎯 Create your first category to start organizing your checklists effectively
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setCategoryForm({ name: '', description: '' });
                    setEditingId(null);
                    setCategoryDialog(true);
                  }}
                  sx={{
                    bgcolor: 'secondary.main',
                    fontWeight: 700,
                    px: 5,
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderRadius: 3,
                    boxShadow: '0 6px 20px rgba(156,39,176,0.4)',
                    '&:hover': {
                      bgcolor: 'secondary.dark',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  Create Your First Category
                </Button>
              </Paper>
            )}
          </Box>
        </Fade>
      )}

      {/* Templates Tab */}
      {activeTab === 2 && (
        <Fade in timeout={500}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ✅ Checklist Templates
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create reusable checklist templates for recurring tasks
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => {
                  setTemplateForm({ name: '', description: '', category: '', items: [], frequency: 'once', stores: [], activeDays: [] });
                  setEditingId(null);
                  setTemplateDialog(true);
                }}
                sx={{ 
                  boxShadow: '0 4px 12px rgba(25,118,210,0.3)',
                  fontWeight: 600
                }}
              >
                Create Template
              </Button>
            </Box>

            <Grid container spacing={3}>
              {templates.map((template) => (
                <Grid item xs={12} md={6} lg={4} key={template._id}>
                  <Card 
                    elevation={3}
                    sx={{ 
                      height: '100%',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                          <CheckBoxIcon />
                        </Avatar>
                      }
                      action={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Tooltip title="Edit Template">
                            <IconButton 
                              size="medium" 
                              onClick={() => openEditTemplate(template)}
                              sx={{ 
                                bgcolor: 'primary.50',
                                '&:hover': { 
                                  bgcolor: 'primary.100',
                                  color: 'primary.main',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s'
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Template">
                            <IconButton 
                              size="medium" 
                              onClick={() => handleDeleteTemplate(template._id)}
                              sx={{ 
                                bgcolor: 'error.50',
                                '&:hover': { 
                                  bgcolor: 'error.100',
                                  color: 'error.main',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s'
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                      title={
                        <Typography variant="h6" sx={{ fontWeight: 600, pr: 1 }}>
                          {template.name}
                        </Typography>
                      }
                      subheader={
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                          {template.category && (
                            <Chip 
                              label={template.category.name} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          )}
                          <Chip 
                            label={template.frequency} 
                            size="small" 
                            color={
                              template.frequency === 'daily' ? 'error' :
                              template.frequency === 'weekly' ? 'warning' :
                              template.frequency === 'monthly' ? 'info' : 'default'
                            }
                            icon={<ScheduleIcon />}
                            sx={{ fontWeight: 600 }}
                          />
                          {template.activeDays && template.activeDays.length > 0 && (
                            <Chip 
                              label={`${template.activeDays.length} day(s)`} 
                              size="small" 
                              color="success"
                              variant="outlined"
                              icon={<TodayIcon />}
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Stack>
                      }
                    />

                    <CardContent>
                      {template.activeDays && template.activeDays.length > 0 && (
                        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'success.50', borderRadius: 1 }}>
                          <Typography variant="caption" fontWeight={600} color="success.dark" sx={{ display: 'block', mb: 0.5 }}>
                            📅 Active on:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {template.activeDays.map(day => (
                              <Chip 
                                key={day}
                                label={day.substring(0, 3)}
                                size="small"
                                sx={{ 
                                  height: 20, 
                                  fontSize: '0.65rem',
                                  bgcolor: 'success.main',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 2, minHeight: 40 }}
                      >
                        {template.description || 'No description provided'}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
                        📝 Checklist Items ({template.items?.length || 0})
                      </Typography>

                      <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 1 }}>
                        {template.items?.slice(0, 3).map((item, idx) => (
                          <ListItem key={idx} sx={{ py: 0.5, px: 1 }}>
                            <CheckBoxIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <ListItemText 
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {item.text}
                                </Typography>
                              }
                              secondary={
                                item.required && (
                                  <Chip 
                                    label="Required" 
                                    size="small" 
                                    color="error" 
                                    sx={{ height: 18, fontSize: '0.7rem', mt: 0.5 }}
                                  />
                                )
                              }
                            />
                          </ListItem>
                        ))}
                        {template.items?.length > 3 && (
                          <ListItem sx={{ py: 0.5, px: 1 }}>
                            <ListItemText>
                              <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                                + {template.items.length - 3} more items...
                              </Typography>
                            </ListItemText>
                          </ListItem>
                        )}
                      </List>

                      {template.stores && template.stores.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Assigned Stores:
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {template.stores.map((store, idx) => (
                              <Chip 
                                key={idx}
                                label={store}
                                size="small"
                                icon={<StoreIcon />}
                                variant="outlined"
                                color="secondary"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {templates.length === 0 && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 6, 
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 3
                }}
              >
                <CheckBoxIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  No Templates Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first checklist template to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setTemplateForm({ name: '', description: '', category: '', items: [], frequency: 'once', stores: [] });
                    setEditingId(null);
                    setTemplateDialog(true);
                  }}
                >
                  Create Template
                </Button>
              </Paper>
            )}
          </Box>
        </Fade>
      )}

      {/* Checklist Completion Dialog - Enhanced */}
      <Dialog 
        open={completionDialog} 
        onClose={() => setCompletionDialog(false)} 
        maxWidth="md" 
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
        PaperProps={{
          sx: { borderRadius: 2, maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          pb: 2
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                ✅ Complete Checklist
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Mark items as completed
              </Typography>
            </Box>
            <IconButton onClick={() => setCompletionDialog(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Progress: {getCompletionPercentage()}%
              </Typography>
              <Typography variant="caption">
                {completionForm.items?.filter(i => i.completed).length || 0} / {completionForm.items?.length || 0} completed
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getCompletionPercentage()} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white'
                }
              }} 
            />
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Store *</InputLabel>
            <Select
              value={completionForm.store}
              label="Select Store *"
              onChange={(e) => setCompletionForm({ ...completionForm, store: e.target.value })}
              startAdornment={<StoreIcon sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              <MenuItem value="store1">🏪 Store 1</MenuItem>
              <MenuItem value="store2">🏪 Store 2</MenuItem>
              <MenuItem value="warehouse">📦 Warehouse</MenuItem>
              <MenuItem value="other">📍 Other</MenuItem>
            </Select>
          </FormControl>

          <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
              📋 Checklist Items
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Check off each item as you complete it
            </Typography>
          </Paper>

          <Stack spacing={2}>
            {completionForm.items?.map((item, index) => (
              <Paper 
                key={index} 
                elevation={item.completed ? 0 : 2}
                sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: item.completed ? 'success.main' : 'grey.200',
                  bgcolor: item.completed ? 'success.50' : 'white',
                  transition: 'all 0.3s ease'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={item.completed}
                      onChange={() => handleToggleItem(index)}
                      color="success"
                      size="large"
                    />
                  }
                  label={
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography 
                          sx={{ 
                            fontWeight: 600,
                            textDecoration: item.completed ? 'line-through' : 'none',
                            color: item.completed ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {item.text}
                        </Typography>
                        {item.required && (
                          <Chip 
                            label="Required" 
                            size="small" 
                            color="error" 
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Stack>
                      {item.completed && (
                        <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 600 }}>
                          ✓ Completed
                        </Typography>
                      )}
                    </Stack>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add notes for this item (optional)"
                  value={item.notes || ''}
                  onChange={(e) => handleItemNotes(index, e.target.value)}
                  sx={{ mt: 1.5 }}
                  multiline
                  rows={2}
                  variant="outlined"
                />
              </Paper>
            ))}
          </Stack>

          <TextField
            fullWidth
            label="Overall Notes"
            placeholder="Add any additional comments or observations..."
            value={completionForm.notes}
            onChange={(e) => setCompletionForm({ ...completionForm, notes: e.target.value })}
            multiline
            rows={3}
            sx={{ mt: 3 }}
            variant="outlined"
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button 
            onClick={() => setCompletionDialog(false)} 
            size="large"
            sx={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCompletion} 
            variant="contained" 
            size="large"
            startIcon={<SaveIcon />}
            disabled={loading || !completionForm.store}
            sx={{ 
              fontWeight: 600,
              px: 4,
              boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
            }}
          >
            {loading ? 'Saving...' : 'Save Checklist'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog - Professional Design */}
      <Dialog 
        open={categoryDialog} 
        onClose={() => setCategoryDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
            color: 'white',
            py: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
            <CategoryIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {editingId ? '✏️ Edit Category' : '🎯 Create New Category'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Organize your checklists into meaningful categories
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4, bgcolor: '#fafafa' }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, color: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon /> Category Details
            </Typography>
            
            <TextField
              fullWidth
              label="Category Name"
              placeholder="e.g., Daily Operations, Safety Checks, Maintenance..."
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              sx={{ mb: 3 }}
              required
              InputProps={{
                sx: { 
                  fontSize: '1.1rem', 
                  fontWeight: 600,
                  '& input': {
                    color: 'secondary.main'
                  }
                }
              }}
              InputLabelProps={{
                sx: { fontWeight: 600 }
              }}
            />
            
            <TextField
              fullWidth
              label="Description (Optional)"
              placeholder="Describe what types of checklists belong in this category..."
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              multiline
              rows={4}
              InputProps={{
                sx: { fontSize: '1rem' }
              }}
            />

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2" fontWeight={600}>
                💡 Tip: Categories help organize and filter checklists for easier management
              </Typography>
            </Alert>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: '#fafafa', borderTop: '2px solid #e0e0e0' }}>
          <Button 
            onClick={() => setCategoryDialog(false)}
            variant="outlined"
            size="large"
            startIcon={<CloseIcon />}
            sx={{ 
              borderRadius: 2,
              px: 4,
              fontWeight: 600,
              color: 'secondary.main',
              borderColor: 'secondary.main'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCategory} 
            variant="contained" 
            size="large"
            startIcon={<SaveIcon />}
            disabled={loading || !categoryForm.name}
            sx={{ 
              borderRadius: 2,
              px: 4,
              fontWeight: 700,
              bgcolor: 'secondary.main',
              boxShadow: '0 4px 12px rgba(156,39,176,0.4)',
              '&:hover': {
                bgcolor: 'secondary.dark',
                boxShadow: '0 6px 20px rgba(156,39,176,0.5)'
              }
            }}
          >
            {loading ? 'Saving...' : (editingId ? 'Update Category' : 'Create Category')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Dialog - Professional Design */}
      <Dialog 
        open={templateDialog} 
        onClose={() => setTemplateDialog(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
            py: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
            <AssignmentIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {editingId ? '✏️ Edit Checklist Template' : '✨ Create New Checklist Template'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Build a structured checklist for your team to follow
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4, bgcolor: '#f8f9fa' }}>
          {/* Basic Information Section */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon /> Basic Information
            </Typography>
            <TextField
              fullWidth
              label="Template Name"
              placeholder="e.g., Daily Opening Checklist"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              sx={{ mb: 2.5 }}
              required
              InputProps={{
                sx: { fontSize: '1.1rem', fontWeight: 500 }
              }}
            />
            <TextField
              fullWidth
              label="Description"
              placeholder="Describe the purpose of this checklist..."
              value={templateForm.description}
              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              multiline
              rows={3}
              InputProps={{
                sx: { fontSize: '1rem' }
              }}
            />
          </Paper>

          {/* Configuration Section */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon /> Configuration
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={templateForm.category}
                    label="Category"
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    startAdornment={<CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    <MenuItem value="">
                      <em>No Category</em>
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={templateForm.frequency}
                    label="Frequency"
                    onChange={(e) => setTemplateForm({ ...templateForm, frequency: e.target.value })}
                    startAdornment={<ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    <MenuItem value="once">🎯 Once</MenuItem>
                    <MenuItem value="daily">📅 Daily</MenuItem>
                    <MenuItem value="weekly">📆 Weekly</MenuItem>
                    <MenuItem value="monthly">🗓️ Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Days Selection - Show only for daily, weekly, or monthly */}
          {['daily', 'weekly', 'monthly'].includes(templateForm.frequency) && (
            <Slide direction="down" in={true} mountOnEnter unmountOnExit>
              <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', border: '2px solid #1976d2' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TodayIcon /> Active Days Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select which days of the week this checklist should appear for completion
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isSelected = templateForm.activeDays.includes(day);
                    return (
                      <Chip
                        key={day}
                        label={day}
                        onClick={() => {
                          setTemplateForm({
                            ...templateForm,
                            activeDays: isSelected
                              ? templateForm.activeDays.filter(d => d !== day)
                              : [...templateForm.activeDays, day]
                          });
                        }}
                        color={isSelected ? 'primary' : 'default'}
                        variant={isSelected ? 'filled' : 'outlined'}
                        icon={isSelected ? <CheckCircleIcon /> : undefined}
                        sx={{ 
                          cursor: 'pointer',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.95rem',
                          py: 2.5,
                          px: 1,
                          transition: 'all 0.3s ease',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: isSelected ? '0 4px 12px rgba(25,118,210,0.3)' : 'none',
                          '&:hover': {
                            transform: 'scale(1.08)',
                            boxShadow: '0 6px 16px rgba(25,118,210,0.4)'
                          }
                        }}
                      />
                    );
                  })}
                </Box>
                <Alert severity={templateForm.activeDays.length === 0 ? 'warning' : 'success'} sx={{ mt: 2 }}>
                  {templateForm.activeDays.length === 0 
                    ? '⚠️ Please select at least one day for this checklist to appear' 
                    : `✅ Checklist will appear on ${templateForm.activeDays.length} selected day(s): ${templateForm.activeDays.join(', ')}`}
                </Alert>
              </Paper>
            </Slide>
          )}

          {/* Checklist Items Section */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckBoxIcon /> Checklist Items ({templateForm.items.length})
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => setItemDialog(true)}
                sx={{ 
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 3,
                  boxShadow: '0 4px 12px rgba(25,118,210,0.3)'
                }}
              >
                Add Item
              </Button>
            </Box>

            {templateForm.items.length > 0 ? (
              <List sx={{ bgcolor: '#f8f9fa', borderRadius: 2, p: 1 }}>
                {templateForm.items.map((item, index) => (
                  <ListItem
                    key={item.id}
                    sx={{ 
                      bgcolor: 'white',
                      borderRadius: 2,
                      mb: 1.5,
                      border: '2px solid',
                      borderColor: item.required ? 'error.light' : 'success.light',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateX(8px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Avatar sx={{ bgcolor: item.required ? 'error.main' : 'success.main', mr: 2 }}>
                      {index + 1}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography fontWeight={600} sx={{ fontSize: '1rem' }}>
                          {item.text}
                        </Typography>
                      }
                      secondary={
                        <Chip 
                          label={item.required ? 'Required' : 'Optional'} 
                          size="small" 
                          color={item.required ? 'error' : 'success'}
                          sx={{ mt: 0.5, fontWeight: 600 }}
                        />
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleRemoveItem(item.id)}
                        sx={{ 
                          bgcolor: 'error.light',
                          color: 'error.dark',
                          '&:hover': { 
                            bgcolor: 'error.main',
                            color: 'white',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa', borderRadius: 2, border: '2px dashed #ddd' }}>
                <CheckBoxIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" fontWeight={600} gutterBottom>
                  No Items Added Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Click "Add Item" button above to create checklist items
                </Typography>
              </Paper>
            )}
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: '2px solid #e0e0e0' }}>
          <Button 
            onClick={() => setTemplateDialog(false)}
            variant="outlined"
            size="large"
            startIcon={<CloseIcon />}
            sx={{ 
              borderRadius: 2,
              px: 4,
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveTemplate} 
            variant="contained" 
            size="large"
            startIcon={<SaveIcon />}
            disabled={loading || !templateForm.name || templateForm.items.length === 0}
            sx={{ 
              borderRadius: 2,
              px: 4,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(25,118,210,0.4)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(25,118,210,0.5)'
              }
            }}
          >
            {loading ? 'Saving...' : (editingId ? 'Update Template' : 'Create Template')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Item Dialog - Professional Design */}
      <Dialog 
        open={itemDialog} 
        onClose={() => setItemDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
            color: 'white',
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)' }}>
            <AddIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              ➕ Add Checklist Item
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Create a new item for this checklist
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <TextField
            fullWidth
            label="Item Description"
            placeholder="e.g., Check all equipment is working properly"
            value={itemForm.text}
            onChange={(e) => setItemForm({ ...itemForm, text: e.target.value })}
            sx={{ mb: 3 }}
            required
            multiline
            rows={3}
            InputProps={{
              sx: { fontSize: '1rem' }
            }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Item Priority</InputLabel>
            <Select
              value={itemForm.required}
              label="Item Priority"
              onChange={(e) => setItemForm({ ...itemForm, required: e.target.value === 'true' })}
            >
              <MenuItem value="true">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Required" color="error" size="small" />
                  <Typography>Must be completed</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="false">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Optional" color="success" size="small" />
                  <Typography>Can be skipped</Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8f9fa', borderTop: '2px solid #e0e0e0' }}>
          <Button 
            onClick={() => setItemDialog(false)}
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddItem} 
            variant="contained" 
            disabled={!itemForm.text}
            startIcon={<AddIcon />}
            sx={{ 
              borderRadius: 2,
              fontWeight: 700,
              px: 3,
              boxShadow: '0 4px 12px rgba(25,118,210,0.3)'
            }}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ChecklistEnhanced;
