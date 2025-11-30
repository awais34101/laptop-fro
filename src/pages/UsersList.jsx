
import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel, FormGroup, Checkbox } from '@mui/material';
import api from '../services/api';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', canViewFinancials: false, permissions: {}, technicianId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [technicians, setTechnicians] = useState([]);

  const fetchUsers = () => {
    api.get('/users/list')
      .then(r => {
        // Handle both old format (direct array) and new format (object with users array)
        const userData = r.data;
        if (Array.isArray(userData)) {
          setUsers(userData);
        } else if (userData.users && Array.isArray(userData.users)) {
          setUsers(userData.users);
        } else {
          console.error('Unexpected users data format:', userData);
          setUsers([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
        setUsers([]);
      });
  };

  useEffect(() => {
    fetchUsers();
    api.get('/technicians')
      .then(r => setTechnicians(r.data))
      .catch(() => setTechnicians([]));
  }, []);

  const handleOpen = (user) => {
    if (user) {
      let techId = '';
      if (user.technicianId) {
        if (typeof user.technicianId === 'object' && user.technicianId._id) {
          techId = user.technicianId._id;
        } else {
          techId = user.technicianId;
        }
      }
      setForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        canViewFinancials: user.canViewFinancials,
        permissions: user.permissions || {},
        technicianId: techId
      });
      setEditId(user._id);
    } else {
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        canViewFinancials: false,
        permissions: {},
        technicianId: ''
      });
      setEditId(null);
    }
    setError('');
    setSuccess('');
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // Permissions UI logic (labelled + ordered to match sidebar)
  // Some modules (e.g., Returns, Purchase Sheets, Closing) use shared permission keys.
  // We expose them as separate rows (aliases) but map to the correct perm key via `permKey`.
  const sections = [
    { key: 'dashboard', label: 'Dashboard', actions: ['view'] },
    { key: 'items', label: 'Items', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'inventoryBoxes', label: 'Inventory Boxes', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'checklists', label: 'Checklists', actions: ['view', 'add', 'edit', 'delete', 'complete'] },
    // Purchasing group - separate sections
    { key: 'purchases', label: 'Purchases', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'purchaseSheets', label: 'Purchase Sheets', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'transferSheets', label: 'Transfer Sheets', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'returnsStore', label: 'Returns Store', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'returnsStore2', label: 'Returns Store2', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'warehouse', label: 'Warehouse', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'transfers', label: 'Transfers', actions: ['view', 'add', 'edit', 'delete'] },
    // Stores and sales - separate sections
    { key: 'store', label: 'Store', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'store2', label: 'Store2', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'sales', label: 'Sales', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'salesStore2', label: 'Sales Store2', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'closingStore1', label: 'Closing (Store 1)', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'closingStore2', label: 'Closing (Store 2)', actions: ['view', 'add', 'edit', 'delete'] },
    // Parts - separate sections
    { key: 'partsInventory', label: 'Parts Inventory', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'parts', label: 'Parts Requests', actions: ['view', 'add', 'edit', 'delete'] },
    // Other sections
    { key: 'documents', label: 'Documents', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'expenses', label: 'Expenses', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'customers', label: 'Customers', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'technicians', label: 'Technicians', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'time', label: 'Time', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'assignments', label: 'Assignments', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'alerts', label: 'Alerts', actions: ['view', 'add', 'edit', 'delete'] },
    { key: 'settings', label: 'Settings', actions: ['view', 'edit'] },
    { key: 'users', label: 'Users (Admin UI)', actions: ['view', 'add', 'edit', 'delete'] },
  ];

  const handlePermissionChange = (section, action) => e => {
    const checked = e.target.checked;
    setForm(f => ({
      ...f,
      permissions: {
        ...f.permissions,
        [section]: {
          ...f.permissions[section],
          [action]: checked
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const userPayload = {
        role: form.role,
        canViewFinancials: form.canViewFinancials,
        isActive: true,
        permissions: form.permissions,
        technicianId: form.role === 'technician' ? form.technicianId : null
      };
      if (editId) {
        await api.put(`/users/${editId}/edit`, userPayload);
        setSuccess('User updated');
        // If editing your own user, fetch latest user data and update localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser && currentUser.email === form.email) {
          // Fetch latest user data from backend
          const updatedUsers = await api.get('/users/list');
          const updatedUser = updatedUsers.data.find(u => u.email === form.email);
          if (updatedUser) {
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.location.reload(); // Reload to update sidebar and permissions
          }
        }
      } else {
        await api.post('/users/add-staff', { ...form, ...userPayload });
        setSuccess('User added');
      }
      fetchUsers();
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    await api.delete(`/users/${id}/delete`);
    fetchUsers();
  };


  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    await api.delete(`/users/${id}/permanent`);
    fetchUsers();
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Staff Management</Typography>
      {JSON.parse(localStorage.getItem('user') || '{}').permissions?.users?.add && (
        <Button variant="contained" onClick={() => handleOpen()}>Add Staff</Button>
      )}
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Financials</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u._id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.canViewFinancials ? 'Yes' : 'No'}</TableCell>
                <TableCell>{u.isActive ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  {JSON.parse(localStorage.getItem('user') || '{}').permissions?.users?.edit && (
                    <Button size="small" onClick={() => handleOpen(u)}>Edit</Button>
                  )}
                  <Button size="small" color="error" onClick={() => handleDeactivate(u._id)} disabled={!u.isActive}>Deactivate</Button>
                  <Button size="small" color="error" onClick={() => handlePermanentDelete(u._id)} style={{ marginLeft: 8 }}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Edit User' : 'Add Staff'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" required disabled={!!editId} />
            <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth margin="normal" required disabled={!!editId} />
            {!editId && <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} fullWidth margin="normal" required />}
            <TextField select label="Role" name="role" value={form.role} onChange={handleChange} fullWidth margin="normal">
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
              <MenuItem value="technician">Technician</MenuItem>
            </TextField>
            {form.role === 'technician' && (
              <TextField
                select
                label="Link to Technician"
                name="technicianId"
                value={form.technicianId}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
              >
                <MenuItem value="">-- Select Technician --</MenuItem>
                {technicians.map(t => (
                  <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
                ))}
              </TextField>
            )}
            <FormControlLabel control={<Switch checked={form.canViewFinancials} onChange={handleChange} name="canViewFinancials" />} label="Can View Financials" />
            
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <strong>Important:</strong> Staff users must have at least one "view" permission selected to log in successfully. 
              If Dashboard is not selected, they will be redirected to the first page they have access to.
            </Alert>
            
            <Box mt={2} mb={1}>
              <Typography variant="subtitle1">Permissions</Typography>
              {sections.map(sec => (
                <Box key={sec.key} mb={1}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{sec.label || (sec.key.charAt(0).toUpperCase() + sec.key.slice(1))}</Typography>
                  <FormGroup row>
                    {sec.actions.map(action => (
                      <FormControlLabel
                        key={action}
                        control={
                          <Checkbox
                            checked={!!form.permissions[sec.key]?.[action]}
                            onChange={handlePermissionChange(sec.key, action)}
                          />
                        }
                        label={action.charAt(0).toUpperCase() + action.slice(1)}
                      />
                    ))}
                  </FormGroup>
                </Box>
              ))}
            </Box>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained">{editId ? 'Update' : 'Add'}</Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
