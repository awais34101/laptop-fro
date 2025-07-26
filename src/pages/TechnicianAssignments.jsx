import React, { useEffect, useState } from 'react';
import { fetchWarehouseItems } from '../services/warehouseApi';
import { fetchTechnicianAssignments, assignItemsToTechnician, fetchTechnicians } from '../services/technicianAssignmentApi';
import { Box, Typography, Button, MenuItem, Select, FormControl, InputLabel, List, ListItem, ListItemText, Paper, Grid, Alert, Checkbox } from '@mui/material';

export default function TechnicianAssignments() {
  const [warehouseItems, setWarehouseItems] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [warehouseData, techData, assignmentData] = await Promise.all([
        fetchWarehouseItems(),
        fetchTechnicians(),
        fetchTechnicianAssignments()
      ]);
      
      setWarehouseItems(Array.isArray(warehouseData) ? warehouseData : []);
      setTechnicians(Array.isArray(techData) ? techData : []);
      setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
    } catch (err) {
      setError('Failed to fetch data');
    }
  };

  // Get assigned item IDs to prevent duplicate assignment
  const assignedItemIds = Array.isArray(assignments)
    ? assignments.flatMap(a => Array.isArray(a.itemIds) ? a.itemIds.map(id => (typeof id === 'object' && id._id ? id._id : id.toString())) : [])
    : [];

  // Show ALL warehouse items (both assigned and unassigned)
  const allWarehouseItems = Array.isArray(warehouseItems)
    ? warehouseItems.filter(w => w.item && w.item._id)
    : [];

  const handleAssign = async () => {
    if (!selectedTech || selectedItems.length === 0) {
      setError('Select technician and at least one item.');
      return;
    }
    try {
      await assignItemsToTechnician(selectedTech, selectedItems);
      setSuccess('Items assigned successfully!');
      setError('');
      setSelectedItems([]);
      fetchData(); // Refresh all data
    } catch {
      setError('Assignment failed.');
      setSuccess('');
    }
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

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>Technician Assignments</Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Technician</InputLabel>
            <Select value={selectedTech} label="Technician" onChange={e => setSelectedTech(e.target.value)}>
              {Array.isArray(technicians) && technicians.map(t => (
                <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="h6" mb={1}>All Warehouse Items</Typography>
          <Paper variant="outlined" style={{ maxHeight: 400, overflow: 'auto' }}>
            <List dense>
              {allWarehouseItems.map(warehouseItem => {
                const isAssigned = assignedItemIds.includes(warehouseItem.item._id);
                const isSelected = selectedItems.includes(warehouseItem.item._id);
                
                return (
                  <ListItem 
                    key={warehouseItem.item._id} 
                    button 
                    selected={isSelected}
                    disabled={isAssigned}
                    onClick={() => handleItemToggle(warehouseItem.item._id)}
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
              {allWarehouseItems.length === 0 && (
                <ListItem>
                  <ListItemText primary="No warehouse items found" />
                </ListItem>
              )}
            </List>
          </Paper>
          
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 2 }} 
            onClick={handleAssign}
            disabled={!selectedTech || selectedItems.length === 0}
          >
            Assign Selected Items ({selectedItems.length})
          </Button>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Typography variant="h6" mb={1}>Current Assignments</Typography>
          <Paper variant="outlined" style={{ maxHeight: 400, overflow: 'auto' }}>
            <List>
              {Array.isArray(assignments) && assignments.map(a => {
                let techName = '';
                if (a.technicianId && typeof a.technicianId === 'object') {
                  techName = a.technicianId.name || a.technicianId._id || a.technicianId;
                } else {
                  const tech = technicians.find(t => t._id === a.technicianId);
                  techName = tech ? tech.name : a.technicianId;
                }
                
                return (
                  <ListItem key={a._id}>
                    <ListItemText
                      primary={techName}
                      secondary={Array.isArray(a.itemIds) && a.itemIds.length > 0
                        ? `Items: ${a.itemIds.map(i => {
                            if (typeof i === 'object' && i.name) {
                              let details = i.name;
                              if (i.unit) details += ` (${i.unit})`;
                              if (i.category) details += ` - ${i.category}`;
                              return details;
                            }
                            return i._id ? i._id : i;
                          }).join(', ')}`
                        : 'No items assigned'}
                    />
                  </ListItem>
                );
              })}
              {assignments.length === 0 && (
                <ListItem>
                  <ListItemText primary="No assignments yet" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
