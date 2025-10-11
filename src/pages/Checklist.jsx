import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Tabs,
  Tab,
  Divider,
  Alert,
  Paper,
  Checkbox,
  LinearProgress,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckBox as CheckBoxIcon,
  Category as CategoryIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import api from '../services/api';

function Checklist() {
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

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [templateForm, setTemplateForm] = useState({ 
    name: '', 
    description: '', 
    category: '', 
    items: [] 
  });
  const [itemForm, setItemForm] = useState({ text: '', required: true });
  const [editingId, setEditingId] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(null);

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
      setError('Failed to load categories');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/checklists/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to load checklist templates');
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
        setSuccess('Checklist template updated successfully');
      } else {
        await api.post('/checklists/templates', templateForm);
        setSuccess('Checklist template created successfully');
      }
      
      setTemplateDialog(false);
      setTemplateForm({ name: '', description: '', category: '', items: [] });
      setEditingId(null);
      fetchTemplates();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this checklist template?')) return;
    
    try {
      await api.delete(`/checklists/templates/${id}`);
      setSuccess('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete template');
    }
  };

  // Item handlers
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
      items: template.items.map(item => ({ ...item, id: item._id || Date.now() }))
    });
    setEditingId(template._id);
    setTemplateDialog(true);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Checklist Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Categories" icon={<CategoryIcon />} iconPosition="start" />
        <Tab label="Checklist Templates" icon={<CheckBoxIcon />} iconPosition="start" />
      </Tabs>

      {/* Categories Tab */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Checklist Categories</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setCategoryForm({ name: '', description: '' });
                setEditingId(null);
                setCategoryDialog(true);
              }}
            >
              Add Category
            </Button>
          </Box>

          <Grid container spacing={2}>
            {categories.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>{category.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.description || 'No description'}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => openEditCategory(category)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteCategory(category._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {categories.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No categories yet. Create your first category!</Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Templates Tab */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Checklist Templates</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setTemplateForm({ name: '', description: '', category: '', items: [] });
                setEditingId(null);
                setTemplateDialog(true);
              }}
            >
              Create Template
            </Button>
          </Box>

          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} key={template._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">{template.name}</Typography>
                        {template.category && (
                          <Chip 
                            label={template.category.name} 
                            size="small" 
                            sx={{ mt: 1 }} 
                            color="primary"
                          />
                        )}
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => openEditTemplate(template)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteTemplate(template._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description || 'No description'}
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Items ({template.items?.length || 0}):
                    </Typography>
                    <List dense>
                      {template.items?.slice(0, 3).map((item, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemText 
                            primary={item.text}
                            secondary={item.required ? 'Required' : 'Optional'}
                          />
                        </ListItem>
                      ))}
                      {template.items?.length > 3 && (
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                          +{template.items.length - 3} more items
                        </Typography>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {templates.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No templates yet. Create your first checklist template!</Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCategory} variant="contained" disabled={loading || !categoryForm.name}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Template Name"
            value={templateForm.name}
            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={templateForm.description}
            onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Category"
            value={templateForm.category}
            onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
            SelectProps={{ native: true }}
            sx={{ mb: 3 }}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Checklist Items</Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setItemDialog(true)}
            >
              Add Item
            </Button>
          </Box>

          <List>
            {templateForm.items.map((item, index) => (
              <ListItem
                key={item.id}
                sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1, 
                  mb: 1,
                  bgcolor: 'background.paper'
                }}
              >
                <ListItemText
                  primary={item.text}
                  secondary={item.required ? 'Required' : 'Optional'}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small" onClick={() => handleRemoveItem(item.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {templateForm.items.length === 0 && (
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
              <Typography variant="body2" color="text.secondary">
                No items added yet. Click "Add Item" to create checklist items.
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveTemplate} 
            variant="contained" 
            disabled={loading || !templateForm.name || templateForm.items.length === 0}
          >
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialog} onClose={() => setItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Checklist Item</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Item Text"
            value={itemForm.text}
            onChange={(e) => setItemForm({ ...itemForm, text: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
            required
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            select
            label="Required"
            value={itemForm.required}
            onChange={(e) => setItemForm({ ...itemForm, required: e.target.value === 'true' })}
            SelectProps={{ native: true }}
          >
            <option value="true">Required</option>
            <option value="false">Optional</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialog(false)}>Cancel</Button>
          <Button onClick={handleAddItem} variant="contained" disabled={!itemForm.text}>
            Add Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Checklist;
