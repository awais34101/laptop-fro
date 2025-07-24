
import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel, FormGroup, Checkbox } from '@mui/material';
import api from '../services/api';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', canViewFinancials: false, permissions: {} });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem('token');

  const fetchUsers = () => {
    api.get('/users/list', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUsers(r.data))
      .catch(() => setUsers([]));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpen = (user) => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        canViewFinancials: user.canViewFinancials,
        permissions: user.permissions || {}
      });
      setEditId(user._id);
    } else {
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        canViewFinancials: false,
        permissions: {}
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

  // Permissions UI logic
  const sections = [
    { key: 'dashboard', actions: ['view'] },
    { key: 'items', actions: ['view', 'edit', 'delete'] },
    { key: 'purchases', actions: ['view', 'edit', 'delete'] },
    { key: 'warehouse', actions: ['view', 'edit', 'delete'] },
    { key: 'sales', actions: ['view', 'edit', 'delete'] },
    { key: 'customers', actions: ['view', 'edit', 'delete'] },
    { key: 'technicians', actions: ['view', 'edit', 'delete'] },
    { key: 'transfers', actions: ['view', 'edit', 'delete'] },
    { key: 'store', actions: ['view', 'edit', 'delete'] },
    { key: 'store2', actions: ['view', 'edit', 'delete'] },
    { key: 'settings', actions: ['view', 'edit'] },
    { key: 'users', actions: ['view', 'edit', 'delete'] },
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
      if (editId) {
        await api.put(`/users/${editId}/edit`, {
          role: form.role,
          canViewFinancials: form.canViewFinancials,
          isActive: true,
          permissions: form.permissions
        }, { headers: { Authorization: `Bearer ${token}` } });
        setSuccess('User updated');
        // If editing your own user, fetch latest user data and update localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser && currentUser.email === form.email) {
          // Fetch latest user data from backend
          const updatedUsers = await api.get('/users/list', { headers: { Authorization: `Bearer ${token}` } });
          const updatedUser = updatedUsers.data.find(u => u.email === form.email);
          if (updatedUser) {
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.location.reload(); // Reload to update sidebar and permissions
          }
        }
      } else {
        await api.post('/users/add-staff', {
          ...form,
          permissions: form.permissions
        }, { headers: { Authorization: `Bearer ${token}` } });
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
    await api.delete(`/users/${id}/delete`, { headers: { Authorization: `Bearer ${token}` } });
    fetchUsers();
  };


  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    await api.delete(`/users/${id}/permanent`, { headers: { Authorization: `Bearer ${token}` } });
    fetchUsers();
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Staff Management</Typography>
      <Button variant="contained" onClick={() => handleOpen()}>Add Staff</Button>
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
            <FormControlLabel control={<Switch checked={form.canViewFinancials} onChange={handleChange} name="canViewFinancials" />} label="Can View Financials" />
            <Box mt={2} mb={1}>
              <Typography variant="subtitle1">Permissions</Typography>
              {sections.map(sec => (
                <Box key={sec.key} mb={1}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{sec.key.charAt(0).toUpperCase() + sec.key.slice(1)}</Typography>
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
