import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useInventory } from '../context/InventoryContext';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Autocomplete } from '@mui/material';
import TechnicianStatsBox from '../components/TechnicianStatsBox';
export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ technicianId: '', itemIds: [] });
  const [assignments, setAssignments] = useState([]);
  const { availableWarehouseItems, items, refresh: refreshInventory } = useInventory();

  const fetchTechnicians = () => api.get('/technicians').then(r => setTechnicians(r.data));
  const fetchAssignments = () => api.get('/technician-assignments').then(r => setAssignments(r.data));
  useEffect(() => { fetchTechnicians(); fetchAssignments(); }, []);
  const handleAssignOpen = () => {
    setAssignForm({ technicianId: '', itemIds: [] });
    setAssignOpen(true);
  };
  const handleAssignClose = () => setAssignOpen(false);
  const handleAssignChange = e => {
    const { name, value, options } = e.target;
    if (name === 'itemIds') {
      const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
      setAssignForm(f => ({ ...f, itemIds: selected }));
    } else {
      setAssignForm(f => ({ ...f, [name]: value }));
    }
  };
  const handleAssignSubmit = async () => {
    try {
      await api.post('/technician-assignments', assignForm);
      setSuccess('Items assigned');
      fetchAssignments();
      if (typeof refreshInventory === 'function') refreshInventory();
      setAssignOpen(false);
    } catch (err) {
      setError('Error assigning items');
    }
  };

  const handleOpen = (tech) => {
    if (tech) {
      setForm({ name: tech.name });
      setEditId(tech._id);
    } else {
      setForm({ name: '' });
      setEditId(null);
    }
    setError('');
    setSuccess('');
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`/technicians/${editId}`, form);
        setSuccess('Technician updated');
      } else {
        await api.post('/technicians', form);
        setSuccess('Technician added');
      }
      fetchTechnicians();
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Technicians</Typography>
      <TechnicianStatsBox />
      <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Technician</Button>
      <Button variant="outlined" color="secondary" sx={{ ml: 2 }} onClick={handleAssignOpen}>Assign Items</Button>
      {/* Assign Items Dialog */}
      <Dialog open={assignOpen} onClose={handleAssignClose}>
        <DialogTitle>Assign Items to Technician</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={technicians}
            getOptionLabel={option => option.name || ''}
            value={technicians.find(t => t._id === assignForm.technicianId) || null}
            onChange={(_, value) => setAssignForm(f => ({ ...f, technicianId: value ? value._id : '' }))}
            renderInput={params => <TextField {...params} label="Select Technician" placeholder="Select Technician" fullWidth sx={{ mt: 2 }} />}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            clearOnEscape
          />
          <Autocomplete
            multiple
            options={availableWarehouseItems}
            getOptionLabel={option => option.name || ''}
            value={availableWarehouseItems.filter(i => assignForm.itemIds.includes(i._id))}
            onChange={(_, value) => setAssignForm(f => ({ ...f, itemIds: value.map(v => v._id) }))}
            renderOption={(props, option) => {
              // Check if item is assigned to another technician
              const assigned = assignments.find(a => a.itemIds.includes(option._id));
              const isAssignedToOther = assigned && (!assignForm.technicianId || assigned.technicianId !== assignForm.technicianId);
              return (
                <li {...props} style={isAssignedToOther ? { color: '#aaa' } : {}}>
                  {option.name} (Warehouse: {option.quantity ?? 0}) {isAssignedToOther ? '(Assigned)' : ''}
                </li>
              );
            }}
            getOptionDisabled={option => {
              const assigned = assignments.find(a => a.itemIds.includes(option._id));
              return assigned && (!assignForm.technicianId || assigned.technicianId !== assignForm.technicianId);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <span key={option._id} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#e0e0e0',
                  borderRadius: 16,
                  padding: '2px 10px',
                  margin: 2
                }}>
                  {option.name} (Warehouse: {option.quantity ?? 0})
                  <span {...getTagProps({ index })} style={{ marginLeft: 4, cursor: 'pointer' }}>×</span>
                </span>
              ))
            }
            renderInput={params => <TextField {...params} label="Items" placeholder="Search and select items" fullWidth sx={{ mt: 2 }} />}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            filterSelectedOptions
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssignClose}>Cancel</Button>
          <Button onClick={handleAssignSubmit} variant="contained">Assign</Button>
        </DialogActions>
      </Dialog>
      {/* Assigned Items Table */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Technician Item Assignments</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Technician</TableCell>
                <TableCell>Assigned Items</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {technicians.map(tech => {
                const techAssignments = assignments.find(a => a.technicianId === tech._id);
                return (
                  <TableRow key={tech._id}>
                    <TableCell>{tech.name}</TableCell>
                    <TableCell>
                      {techAssignments && techAssignments.itemIds.length > 0 ? (
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                          {techAssignments.itemIds.map(itemId => {
                            // Show live warehouse quantity for each assigned item
                            const item = items.find(i => i._id === itemId);
                            // Find live warehouse quantity
                            const liveWarehouseItem = availableWarehouseItems.find(w => w._id === itemId);
                            const liveQty = liveWarehouseItem ? liveWarehouseItem.quantity : 0;
                            if (!item) return null;
                            return (
                              <li key={itemId} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ flex: 1 }}>{item.name} (Live Warehouse: {liveQty})</span>
                                <Button size="small" color="error" onClick={async () => {
                                  // Remove item from this technician's assignment
                                  const newItemIds = techAssignments.itemIds.filter(id => id !== itemId);
                                  await api.post('/technician-assignments', { technicianId: tech._id, itemIds: newItemIds });
                                  fetchAssignments();
                                  if (typeof refreshInventory === 'function') refreshInventory();
                                }}>Delete</Button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {technicians.map(tech => (
              <TableRow key={tech._id}>
                <TableCell>{tech.name}</TableCell>
                <TableCell>
                  <Button onClick={() => handleOpen(tech)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Edit Technician' : 'Add Technician'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth required sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
