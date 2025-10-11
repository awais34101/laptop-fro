import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { fetchWarehouseItems } from '../services/warehouseApi';
import { fetchTechnicianAssignments, assignItemsToTechnician, unassignItemsFromTechnician, updateItemComment } from '../services/technicianAssignmentApi';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Grid, List, ListItem, ListItemText, Checkbox, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import TechnicianStatsBox from '../components/TechnicianStatsBox';
import { hasPerm } from '../utils/permissions';

export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);
  const [warehouseItems, setWarehouseItems] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [open, setOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', specialization: '' });
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewSelectedTechnician, setViewSelectedTechnician] = useState(''); // For viewing assignments
  const [searchTerm, setSearchTerm] = useState(''); // For searching items
  const [commentStates, setCommentStates] = useState({}); // Local comment states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);

  const fetchTechnicians = () => {
    api.get('/technicians')
      .then(r => {
        console.log('Technicians fetched:', r.data);
        setTechnicians(r.data);
      })
      .catch(err => {
        console.error('Error fetching technicians:', err);
        setError(err.response?.data?.error || 'Failed to fetch technicians');
      });
  };

  const fetchData = async () => {
    try {
      console.log('Starting fetchData...');
      
      const [warehouseData, techData, assignmentData] = await Promise.all([
        fetchWarehouseItems(),
        api.get('/technicians').then(r => r.data), // Use direct API call
        fetchTechnicianAssignments()
      ]);
      
      console.log('Warehouse data:', warehouseData?.length || 0, 'items');
      console.log('Technician data:', techData?.length || 0, 'technicians');
      console.log('Assignment data:', assignmentData?.length || 0, 'assignments');
      
      setWarehouseItems(warehouseData || []);
      setTechnicians(techData || []);
      setAssignments(assignmentData || []);
      
      // Debug: Log the assignment data to see what we're getting
      console.log('Assignment data:', assignmentData);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const handleOpen = (technician) => {
    if (technician) {
      setForm({
        name: technician.name,
        email: technician.email,
        phone: technician.phone,
        specialization: technician.specialization,
      });
      setEditId(technician._id);
    } else {
      setForm({ name: '', email: '', phone: '', specialization: '' });
      setEditId(null);
    }
    setError('');
    setSuccess('');
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`/technicians/${editId}`, form);
        setSuccess('Technician updated successfully');
      } else {
        await api.post('/technicians', form);
        setSuccess('Technician added successfully');
      }
      fetchTechnicians();
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save technician');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this technician?')) return;
    try {
      await api.delete(`/technicians/${id}`);
      setSuccess('Technician deleted successfully');
      fetchTechnicians();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete technician');
    }
  };

  // Get assigned item IDs to prevent duplicates
  const assignedItemIds = assignments
    .filter(a => a && Array.isArray(a.itemIds))
    .flatMap(a => a.itemIds.filter(item => item && (typeof item === 'object' ? item._id : item)).map(item => typeof item === 'object' ? item._id : item));

  // Show ALL warehouse items (both assigned and unassigned) for assignment dialog
  const allWarehouseItems = (warehouseItems || []).filter(w => w && w.item && w.item._id).map(w => {
    const isAssigned = assignedItemIds.includes(w.item._id);
    return {
      ...w,
      isAssigned,
    };
  });

  // Filter items based on search term
  const filteredWarehouseItems = allWarehouseItems.filter(item =>
    item.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignmentOpen = () => {
    setSelectedTechnician('');
    setSelectedItems([]);
    setAssignmentOpen(true);
  };

  const handleAssignmentClose = () => {
    setAssignmentOpen(false);
    setSelectedTechnician('');
    setSelectedItems([]);
    setSearchTerm(''); // Clear search term
  };

  const handleItemToggle = (itemId) => {
    // Don't allow selecting already assigned items
    if (assignedItemIds.includes(itemId)) {
      return;
    }
    
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleAssignItems = async () => {
    if (!selectedTechnician || selectedItems.length === 0) {
      setError('Please select a technician and at least one item');
      return;
    }
    
    try {
      await assignItemsToTechnician(selectedTechnician, selectedItems);
      setSuccess('Items assigned successfully!');
      setError('');
      handleAssignmentClose();
      fetchData(); // Refresh all data
    } catch (err) {
      setError('Failed to assign items');
    }
  };

  const handleUnassignItem = async (technicianId, itemId) => {
    if (!window.confirm('Are you sure you want to unassign this item?')) return;
    
    try {
      await unassignItemsFromTechnician(technicianId, [itemId]);
      setSuccess('Item unassigned successfully!');
      setError('');
      fetchData(); // Refresh all data
    } catch (err) {
      setError('Failed to unassign item');
    }
  };

  const handleCommentUpdate = async (technicianId, itemId, comment) => {
    try {
      await updateItemComment(technicianId, itemId, comment);
      // Don't show success message for comment updates to avoid spam
      fetchData(); // Refresh all data
    } catch (err) {
      setError('Failed to update comment');
    }
  };

  // Debounced comment update - only save after user stops typing
  const debounceTimeout = React.useRef(null);
  
  const handleCommentChange = (technicianId, itemId, comment) => {
    // Update local state immediately for responsive UI
    setCommentStates(prev => ({
      ...prev,
      [`${technicianId}-${itemId}`]: comment
    }));

    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout to save comment after 1 second of no typing
    debounceTimeout.current = setTimeout(() => {
      handleCommentUpdate(technicianId, itemId, comment);
    }, 1000);
  };

  return (
    <Box p={{ xs: 1, md: 3 }} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>
        👨‍🔧 Technician Management
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        {hasPerm('technicians','edit') && (
          <>
            <Button 
              variant="contained" 
              onClick={() => handleOpen()}
              sx={{ fontWeight: 700, px: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(25,118,210,0.3)' }}
            >
              ➕ Add Technician
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleAssignmentOpen}
              sx={{ fontWeight: 700, px: 3, borderRadius: 2 }}
            >
              🔧 Assign Items
            </Button>
          </>
        )}
      </Box>

      {/* 1. TECHNICIAN MANAGEMENT TABLE - FULL WIDTH AT TOP */}
      <Box sx={{ mb: 3 }}>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
          <Table sx={{ '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9fafd' }, '& tbody tr:hover': { backgroundColor: '#e3eafc' } }}>
            <TableHead>
              <TableRow sx={{ background: 'linear-gradient(145deg, #1976d2, #1565c0)' }}>
                <TableCell sx={{ fontWeight: 900, color: 'white', fontSize: '1rem' }}>👤 Name</TableCell>
                <TableCell sx={{ fontWeight: 900, color: 'white' }}>📧 Email</TableCell>
                <TableCell sx={{ fontWeight: 900, color: 'white' }}>📞 Phone</TableCell>
                <TableCell sx={{ fontWeight: 900, color: 'white' }}>🔧 Specialization</TableCell>
                {(hasPerm('technicians','edit') || hasPerm('technicians','delete')) && (
                  <TableCell sx={{ fontWeight: 900, color: 'white' }}>⚙️ Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {(technicians || []).filter(t => t && t._id).map(t => (
                <TableRow key={t._id} sx={{ transition: 'all 0.2s' }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t.name}</TableCell>
                  <TableCell>{t.email}</TableCell>
                  <TableCell>{t.phone}</TableCell>
                  <TableCell>
                    <Box sx={{ 
                      display: 'inline-block',
                      px: 2, 
                      py: 0.5, 
                      borderRadius: 2, 
                      background: 'linear-gradient(145deg, #e3f2fd, #bbdefb)',
                      color: '#1565c0',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      {t.specialization}
                    </Box>
                  </TableCell>
                  {(hasPerm('technicians','edit') || hasPerm('technicians','delete')) && (
                    <TableCell>
                      {hasPerm('technicians','edit') && (
                        <Button 
                          size="small" 
                          onClick={() => handleOpen(t)}
                          sx={{ mr: 1, fontWeight: 600 }}
                        >
                          Edit
                        </Button>
                      )}
                      {hasPerm('technicians','delete') && (
                        <Button 
                          size="small" 
                          color="error" 
                          onClick={() => handleDelete(t._id)}
                          sx={{ fontWeight: 600 }}
                        >
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* 2. VIEW ASSIGNMENTS SECTION - FULL WIDTH IN MIDDLE */}
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ 
          p: 3, 
          borderRadius: 3,
          boxShadow: '0 4px 24px rgba(25,118,210,0.08)',
          background: 'linear-gradient(145deg, #ffffff, #f8fafc)'
        }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', mb: 3 }}>
            📋 View Technician Assignments
          </Typography>
          
          {/* Technician Selector */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ fontWeight: 600 }}>Select Technician</InputLabel>
            <Select
              value={viewSelectedTechnician}
              label="Select Technician"
              onChange={(e) => setViewSelectedTechnician(e.target.value)}
              sx={{ 
                borderRadius: 2,
                background: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' }
              }}
            >
              <MenuItem value="">
                <em>Select a technician</em>
              </MenuItem>
              {technicians.length > 0 ? (technicians.filter(tech => tech && tech._id).map(tech => (
                <MenuItem key={tech._id} value={tech._id}>
                  👨‍🔧 {tech.name} - {tech.specialization}
                </MenuItem>
              ))) : (
                <MenuItem disabled>
                  <em>No technicians available</em>
                </MenuItem>
              )}
            </Select>
          </FormControl>
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
              Debug: {technicians.length} technicians loaded
            </Typography>
          )}

          {/* Scrollable content area */}
          <Box sx={{ overflow: 'auto', maxHeight: '450px' }}>
            {/* Show only assigned items for the selected technician */}
            {viewSelectedTechnician ? (
              (() => {
                const selectedAssignment = (assignments || []).find(a => a && (a.technicianId?._id || a.technicianId) === viewSelectedTechnician);
                const assignedIds = selectedAssignment && Array.isArray(selectedAssignment.itemIds)
                  ? selectedAssignment.itemIds.filter(item => item && (typeof item === 'object' ? item._id : item)).map(item => typeof item === 'object' ? item._id : item)
                  : [];

                const technicianItems = (warehouseItems || []).filter(w => w && w.item && assignedIds.includes(w.item._id));

                return (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Assigned Items ({technicianItems.length}):
                    </Typography>
                    <List dense>
                      {technicianItems.length > 0 ? (
                        technicianItems.filter(w => w && w.item && w.item._id).map((w) => {
                          // Find the comment for this item
                          const savedComment = selectedAssignment?.itemComments?.find(
                            c => c && (c.itemId?._id || c.itemId) === w.item._id
                          )?.comment || '';
                          
                          // Use local state if available, otherwise use saved comment
                          const commentKey = `${viewSelectedTechnician}-${w.item._id}`;
                          const displayComment = commentStates[commentKey] !== undefined 
                            ? commentStates[commentKey] 
                            : savedComment;

                          return (
                            <Box key={w.item._id} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                              <ListItem sx={{ pl: 0, background: '#e3f2fd', mb: 1 }}>
                                <ListItemText
                                  primary={w.item.name}
                                  secondary={`Category: ${w.item.category} | Unit: ${w.item.unit} | Qty: ${w.quantity}`}
                                />
                                {hasPerm('technicians','edit') && (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleUnassignItem(viewSelectedTechnician, w.item._id)}
                                    sx={{ ml: 1 }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </ListItem>
                              <TextField
                                size="small"
                                fullWidth
                                label="Comments"
                                placeholder="Add comments about this item..."
                                value={displayComment}
                                onChange={(e) => {
                                  handleCommentChange(viewSelectedTechnician, w.item._id, e.target.value);
                                }}
                                multiline
                                rows={2}
                                disabled={!hasPerm('technicians','edit')}
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          );
                        })
                      ) : (
                        <ListItem>
                          <ListItemText primary="No items assigned to this technician." />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                );
              })()
            ) : (
              <Alert severity="info">
                Select a technician to view their assigned items
              </Alert>
            )}
          </Box>
        </Paper>
      </Box>

      {/* 3. STATISTICS SECTION - FULL WIDTH AT BOTTOM */}
      <TechnicianStatsBox />

      {/* Add/Edit Technician Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Technician' : 'Add Technician'}</DialogTitle>
        <DialogContent>
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" required />
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth margin="normal" required />
          <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} fullWidth margin="normal" required />
          <TextField label="Specialization" name="specialization" value={form.specialization} onChange={handleChange} fullWidth margin="normal" required />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {hasPerm('technicians','edit') && (
            <Button onClick={handleSubmit} variant="contained">Save</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignmentOpen} onClose={handleAssignmentClose} maxWidth="md" fullWidth>
        <DialogTitle>Assign Items to Technician</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Technician</InputLabel>
                <Select
                  value={selectedTechnician}
                  label="Select Technician"
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                >
                  {(technicians || []).filter(tech => tech && tech._id).map(tech => (
                    <MenuItem key={tech._id} value={tech._id}>
                      {tech.name} - {tech.specialization}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search Items"
                placeholder="Search by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                All Warehouse Items ({filteredWarehouseItems.length} items)
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', p: 1 }}>
                <List dense>
                  {(filteredWarehouseItems || []).filter(warehouseItem => warehouseItem && warehouseItem.item && warehouseItem.item._id).map(warehouseItem => {
                    const isAssigned = assignedItemIds.includes(warehouseItem.item._id);
                    const isSelected = selectedItems.includes(warehouseItem.item._id);
                    
                    return (
                      <ListItem 
                        key={warehouseItem.item._id} 
                        button 
                        onClick={() => handleItemToggle(warehouseItem.item._id)}
                        disabled={isAssigned}
                        sx={{
                          backgroundColor: isAssigned ? '#f5f5f5' : 'inherit',
                          color: isAssigned ? '#999' : 'inherit'
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={isAssigned}
                          tabIndex={-1}
                          disableRipple
                        />
                        <ListItemText
                          primary={`${warehouseItem.item.name} ${isAssigned ? '(Already Assigned)' : ''}`}
                          secondary={`Category: ${warehouseItem.item.category} | Unit: ${warehouseItem.item.unit} | Qty: ${warehouseItem.quantity}`}
                        />
                      </ListItem>
                    );
                  })}
                  {filteredWarehouseItems.length === 0 && (
                    <ListItem>
                      <ListItemText primary={searchTerm ? "No items found matching your search" : "No warehouse items found"} />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssignmentClose}>Cancel</Button>
          {hasPerm('technicians','edit') && (
            <Button 
              onClick={handleAssignItems} 
              variant="contained"
              disabled={!selectedTechnician || selectedItems.length === 0}
            >
              Assign Selected Items ({selectedItems.length})
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
